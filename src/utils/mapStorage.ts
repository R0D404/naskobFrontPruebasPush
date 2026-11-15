import { Source } from 'pmtiles';

export const MAP_CONFIGS = {
  frailesca: {
    key: 'frailesca',
    protocolUrl: 'pmtiles://frailesca',
    downloadUrl: '/maps/frailesca.pmtiles',
    name: 'La Frailesca (Recomendado)',
    description: 'Villaflores, Villa Corzo, La Concordia y alrededores (Zoom 0-15)',
    sizeBytes: 4763166,
    sizeLabel: '4.7 MB',
    required: true,
  },
  chiapas: {
    key: 'chiapas',
    protocolUrl: 'pmtiles://chiapas',
    downloadUrl: '/maps/chiapas.pmtiles',
    name: 'Estado de Chiapas Completo',
    description: 'Todo el estado de Chiapas a escala general (Zoom 0-14)',
    sizeBytes: 56352292,
    sizeLabel: '54 MB',
    required: false,
  },
} as const;

export type MapKey = keyof typeof MAP_CONFIGS;

/**
 * Fuente PMTiles que lee directamente de un Blob en memoria/disco local.
 * Elimina cualquier petición HTTP Range y garantiza funcionamiento 100% offline.
 */
export class BlobSource implements Source {
  constructor(
    private key: string,
    private blob: Blob
  ) {}

  getKey(): string {
    return this.key;
  }

  async getBytes(offset: number, length: number): Promise<{ data: ArrayBuffer }> {
    const slice = this.blob.slice(offset, offset + length);
    const data = await slice.arrayBuffer();
    return { data };
  }
}

const IDB_NAME = 'naskob_offline_maps_db';
const IDB_STORE = 'pmtiles_blobs';
const IDB_VERSION = 1;
const CACHE_NAME = 'naskob-offline-maps-cache-v1';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB no está disponible en este entorno'));
    }
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Obtiene el Blob de un mapa desde IndexedDB o CacheStorage
 */
export async function getStoredMapBlob(key: MapKey): Promise<Blob | null> {
  // 1. Intentar IndexedDB
  try {
    const db = await openIDB();
    const result = await new Promise<any>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    if (result) {
      if (result instanceof Blob && result.size > 0) {
        return result;
      }
      if (result instanceof ArrayBuffer && result.byteLength > 0) {
        return new Blob([result], { type: 'application/octet-stream' });
      }
    }
  } catch (err) {
    console.warn('[mapStorage] Error leyendo de IndexedDB:', err);
  }

  // 2. Fallback a CacheStorage
  try {
    if (typeof caches !== 'undefined') {
      const cache = await caches.open(CACHE_NAME);
      const res = await cache.match(MAP_CONFIGS[key].downloadUrl);
      if (res && res.ok) {
        return await res.blob();
      }
    }
  } catch (err) {
    console.warn('[mapStorage] Error leyendo de CacheStorage:', err);
  }

  return null;
}

/**
 * Guarda el mapa en IndexedDB (como ArrayBuffer para compatibilidad universal) y en CacheStorage
 */
export async function saveMapBlob(key: MapKey, blob: Blob): Promise<void> {
  // 1. Guardar en IndexedDB como ArrayBuffer
  try {
    const buffer = await blob.arrayBuffer();
    const db = await openIDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(buffer, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[mapStorage] No se pudo guardar en IndexedDB:', err);
  }

  // 2. Guardar en CacheStorage de forma complementaria
  try {
    if (typeof caches !== 'undefined') {
      const cache = await caches.open(CACHE_NAME);
      const res = new Response(blob, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(blob.size),
        },
      });
      await cache.put(MAP_CONFIGS[key].downloadUrl, res);
    }
  } catch (err) {
    console.warn('[mapStorage] No se pudo guardar en CacheStorage:', err);
  }
}

/**
 * Verifica si un mapa ya está descargado y disponible en el almacenamiento local
 */
export async function isMapStored(key: MapKey): Promise<boolean> {
  const blob = await getStoredMapBlob(key);
  return blob !== null && blob.size > 0;
}

/**
 * Elimina un mapa del almacenamiento local
 */
export async function deleteStoredMap(key: MapKey): Promise<void> {
  try {
    const db = await openIDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[mapStorage] Error eliminando de IndexedDB:', err);
  }

  try {
    if (typeof caches !== 'undefined') {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(MAP_CONFIGS[key].downloadUrl);
    }
  } catch (err) {
    console.warn('[mapStorage] Error eliminando de CacheStorage:', err);
  }
}

/**
 * Descarga el archivo PMTiles con reporte de progreso en tiempo real
 */
export async function downloadMapWithProgress(
  key: MapKey,
  onProgress?: (progress: { loaded: number; total: number; percent: number }) => void
): Promise<Blob> {
  const config = MAP_CONFIGS[key];
  const response = await fetch(config.downloadUrl);
  if (!response.ok) {
    throw new Error(`Error al descargar ${config.name} (${response.status}: ${response.statusText})`);
  }

  const contentLengthHeader = response.headers.get('content-length');
  const total = contentLengthHeader ? parseInt(contentLengthHeader, 10) : config.sizeBytes;

  if (!response.body) {
    const blob = await response.blob();
    await saveMapBlob(key, blob);
    onProgress?.({ loaded: blob.size, total: blob.size, percent: 100 });
    return blob;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.length;
      if (total > 0 && onProgress) {
        const percent = Math.min(100, Math.round((loaded / total) * 100));
        onProgress({ loaded, total, percent });
      }
    }
  }

  const blob = new Blob(chunks, { type: 'application/octet-stream' });
  await saveMapBlob(key, blob);
  onProgress?.({ loaded: blob.size, total: blob.size, percent: 100 });
  return blob;
}
