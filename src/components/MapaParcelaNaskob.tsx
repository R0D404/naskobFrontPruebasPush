import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import { Protocol, PMTiles, FetchSource } from 'pmtiles';
import * as turf from '@turf/turf';
import {
  Navigation,
  Footprints,
  MapPin,
  Trash2,
  RotateCcw,
  Layers,
  Satellite,
  CheckCircle2,
  AlertTriangle,
  Crosshair,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import {
  ModoVistaMapa,
  ModoCaptura,
  ResultadoParcelaConfirmada,
} from '../types/parcela';
import {
  filtrarDatosNasaPorUbicacion,
  distanciaHaversineMetros,
} from '../data/perfilesNasaFrailesca';
import {
  MapKey,
  BlobSource,
  getStoredMapBlob,
} from '../utils/mapStorage';
import { GestorMapaOffline } from './GestorMapaOffline';

/**
 * Fuente PMTiles remota para cuando hay conexión a internet disponible.
 */
class NamedFetchSource {
  private fetchSource: FetchSource;
  constructor(private key: string, url: string) {
    this.fetchSource = new FetchSource(url);
  }
  getKey() {
    return this.key;
  }
  async getBytes(offset: number, length: number, signal?: AbortSignal, etag?: string) {
    return await this.fetchSource.getBytes(offset, length, signal, etag);
  }
}

// Instancia persistente del protocolo PMTiles
const pmtilesProtocol = new Protocol();
try {
  maplibregl.addProtocol('pmtiles', pmtilesProtocol.tile);
} catch {
  // Ya registrado
}

// Centro por defecto en La Frailesca, Chiapas (Villaflores / Villa Corzo) [lng, lat]
const CENTRO_CHIAPAS_WGS84: [number, number] = [-93.1130, 16.7569]; // Tuxtla Gutiérrez / Centro Chiapas

// Bounding Box de los archivos PMTiles descargados en public/maps/
// frailesca.pmtiles: [-93.8, 15.9, -92.9, 16.6] (maxzoom: 15)
// chiapas.pmtiles:   [-94.14, 14.53, -90.38, 17.98] (maxzoom: 14)
const BBOX_FRAILESCA: [number, number, number, number] = [-93.8, 15.85, -92.65, 16.6];
const BBOX_CHIAPAS: [number, number, number, number] = [-94.2, 14.5, -90.35, 18.0];

interface Props {
  onParcelaConfirmada: (resultado: ResultadoParcelaConfirmada) => void;
}

export const MapaParcelaNaskob: React.FC<Props> = ({ onParcelaConfirmada }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Referencia mutable para evitar clausuras obsoletas (stale closures) dentro de map.on('click')
  const caminandoActivoRef = useRef<boolean>(false);
  const verticesRef = useRef<[number, number][]>([]);

  // Vista activa: 'vectorial' (100% Offline usando frailesca.pmtiles + chiapas.pmtiles) o 'satelital'
  const [modoVista, setModoVista] = useState<ModoVistaMapa>('vectorial');
  const [modoCaptura, setModoCaptura] = useState<ModoCaptura>('poligono');
  const [caminandoActivo, setCaminandoActivo] = useState<boolean>(false);

  // Vértices del polígono SIEMPRE en orden estricto [lng, lat] (EPSG:4326)
  const [vertices, setVertices] = useState<[number, number][]>([]);

  // Estado del GPS del usuario
  const [ubicacionUsuario, setUbicacionUsuario] = useState<{
    lng: number;
    lat: number;
    precision: number;
  } | null>(null);
  const [historialPrecisiones, setHistorialPrecisiones] = useState<number[]>([]);
  const [estadoGpsTexto, setEstadoGpsTexto] = useState<string>(
    'Presiona "Mi ubicación GPS" o toca el mapa para marcar las esquinas de tu terreno.'
  );
  const [alertaGps, setAlertaGps] = useState<string | null>(null);
  const [cargandoGps, setCargandoGps] = useState<boolean>(false);

  // Parámetros de filtrado de precisión GPS para corregir el margen de error de 100 metros
  const [umbralPrecisionMaxMetros, setUmbralPrecisionMaxMetros] = useState<number>(30);

  // Buffer de últimas lecturas GPS para suavizar picos (media móvil ponderada por precisión)
  const bufferLecturasGpsRef = useRef<{ lng: number; lat: number; acc: number }[]>([]);

  // Sincronizar refs con el estado actual
  useEffect(() => {
    caminandoActivoRef.current = caminandoActivo;
  }, [caminandoActivo]);

  useEffect(() => {
    verticesRef.current = vertices;
  }, [vertices]);

  // Referencia para preservar el centro y zoom del usuario entre recargas
  const ultimoCentroRef = useRef<[number, number]>(CENTRO_CHIAPAS_WGS84);
  const ultimoZoomRef = useRef<number>(14);

  // Estado de error si no hay mapa descargado y se intenta usar offline
  const [errorMapaOffline, setErrorMapaOffline] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // 1. INICIALIZACIÓN ASÍNCRONA ROBUSTA (OFFLINE FIRST CON BLOBS LOCALES)
  // ---------------------------------------------------------------------------
  const iniciarMapa = useCallback(async () => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) {
      try {
        ultimoCentroRef.current = [mapRef.current.getCenter().lng, mapRef.current.getCenter().lat];
        ultimoZoomRef.current = mapRef.current.getZoom();
      } catch {}
      mapRef.current.remove();
      mapRef.current = null;
    }

    setErrorMapaOffline(null);

    // 1. Cargar blob local de Chiapas Completo desde IndexedDB / CacheStorage
    const chiapasBlob = await getStoredMapBlob('chiapas');
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    console.log('[MapaParcelaNaskob] Verificando mapa estatal Chiapas:', {
      chiapas: chiapasBlob ? `${(chiapasBlob.size / (1024 * 1024)).toFixed(1)} MB` : 'no disponible',
      isOnline,
    });

    // 2. Si no hay mapa guardado localmente y no hay internet:
    if (!chiapasBlob && !isOnline) {
      setErrorMapaOffline(
        'El mapa offline de Chiapas aún no se ha guardado en este teléfono. Conéctate a internet por unos segundos para descargarlo automáticamente (54 MB).'
      );
      return;
    }

    // 3. Registrar chiapas completo en el protocolo PMTiles (BlobSource local si existe, o FetchSource si hay red)
    let tieneChiapas = false;
    if (chiapasBlob) {
      pmtilesProtocol.add(new PMTiles(new BlobSource('chiapas', chiapasBlob)));
      tieneChiapas = true;
    } else if (isOnline && typeof window !== 'undefined') {
      pmtilesProtocol.add(
        new PMTiles(new NamedFetchSource('chiapas', `${window.location.origin}/maps/chiapas.pmtiles`))
      );
      tieneChiapas = true;
    }

    // 5. Construir fuentes dinámicas
    const sources: Record<string, any> = {
      'satelital-esri': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 18,
      },
      'parcela-geojson': {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
      'gps-usuario-geojson': {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    };

    if (tieneChiapas) {
      sources['chiapas-pmtiles'] = {
        type: 'vector',
        url: 'pmtiles://chiapas',
        minzoom: 0,
        maxzoom: 15,
      };
    }

    // 6. Construir capas dinámicas (Chiapas cubre todo el estado; Frailesca añade sobrecapa de alta resolución)
    const layers: any[] = [
      {
        id: 'fondo-base',
        type: 'background',
        paint: { 'background-color': '#eae6df' },
      },
    ];

    // Capas estatales de Chiapas (Tuxtla, San Cristóbal, Palenque, Tapachula, etc.)
    if (tieneChiapas) {
      layers.push(
        {
          id: 'vec-chiapas-earth',
          type: 'fill',
          source: 'chiapas-pmtiles',
          'source-layer': 'earth',
          paint: { 'fill-color': '#f3efe6' },
        },
        {
          id: 'vec-chiapas-landuse',
          type: 'fill',
          source: 'chiapas-pmtiles',
          'source-layer': 'landuse',
          paint: { 'fill-color': '#dce8d6', 'fill-opacity': 0.65 },
        },
        {
          id: 'vec-chiapas-water',
          type: 'fill',
          source: 'chiapas-pmtiles',
          'source-layer': 'water',
          paint: { 'fill-color': '#90c2e7' },
        },
        {
          id: 'vec-chiapas-boundaries',
          type: 'line',
          source: 'chiapas-pmtiles',
          'source-layer': 'boundaries',
          paint: { 'line-color': '#8c7a6b', 'line-width': 1.2, 'line-dasharray': [3, 2] },
        },
        {
          id: 'vec-chiapas-roads-casing',
          type: 'line',
          source: 'chiapas-pmtiles',
          'source-layer': 'roads',
          paint: {
            'line-color': '#b0a695',
            'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.0, 12, 2.5, 15, 4.5, 20, 10],
          },
        },
        {
          id: 'vec-chiapas-roads',
          type: 'line',
          source: 'chiapas-pmtiles',
          'source-layer': 'roads',
          paint: {
            'line-color': '#ffffff',
            'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.8, 14, 2.5, 19, 6],
          },
        },
        {
          id: 'vec-chiapas-buildings',
          type: 'fill',
          source: 'chiapas-pmtiles',
          'source-layer': 'buildings',
          paint: {
            'fill-color': '#d8cfc2',
            'fill-outline-color': '#b8ad9e',
            'fill-opacity': 0.85,
          },
        }
      );
    }



    // Capa Satelital Raster Online
    layers.push(
      {
        id: 'capa-satelital-raster',
        type: 'raster',
        source: 'satelital-esri',
        layout: { visibility: modoVista === 'satelital' ? 'visible' : 'none' },
      },
      // Híbrido caminos sobre el satelital
      {
        id: 'vec-hibrido-roads',
        type: 'line',
        source: 'chiapas-pmtiles',
        'source-layer': 'roads',
        paint: {
          'line-color': '#f0b323',
          'line-opacity': 0.45,
          'line-width': 1.8,
        },
      },
      // Capas GPS
      {
        id: 'gps-circulo-precision-relleno',
        type: 'fill',
        source: 'gps-usuario-geojson',
        filter: ['==', ['get', 'tipo'], 'circulo_precision'],
        paint: { 'fill-color': '#1d3557', 'fill-opacity': 0.15 },
      },
      {
        id: 'gps-circulo-precision-borde',
        type: 'line',
        source: 'gps-usuario-geojson',
        filter: ['==', ['get', 'tipo'], 'circulo_precision'],
        paint: { 'line-color': '#1d3557', 'line-width': 1.5, 'line-dasharray': [2, 2] },
      },
      {
        id: 'gps-punto-usuario',
        type: 'circle',
        source: 'gps-usuario-geojson',
        filter: ['==', ['get', 'tipo'], 'punto_gps'],
        paint: {
          'circle-radius': 8,
          'circle-color': '#0072B2',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3,
        },
      },
      // Capas Parcela
      {
        id: 'parcela-poligono-relleno',
        type: 'fill',
        source: 'parcela-geojson',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: { 'fill-color': '#006b4f', 'fill-opacity': 0.35 },
      },
      {
        id: 'parcela-linea-borde',
        type: 'line',
        source: 'parcela-geojson',
        filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'LineString']]],
        paint: { 'line-color': '#f0b323', 'line-width': 3.5 },
      },
      {
        id: 'parcela-centroide-nasa',
        type: 'circle',
        source: 'parcela-geojson',
        filter: ['==', ['get', 'tipo'], 'centroide_nasa'],
        paint: {
          'circle-radius': 6,
          'circle-color': '#a94f2c',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      },
      {
        id: 'parcela-vertices-puntos',
        type: 'circle',
        source: 'parcela-geojson',
        filter: ['==', ['get', 'tipo'], 'vertice'],
        paint: {
          'circle-radius': ['case', ['==', ['get', 'esPrimero'], true], 9, 7],
          'circle-color': ['case', ['==', ['get', 'esPrimero'], true], '#f0b323', '#ffffff'],
          'circle-stroke-color': '#14302b',
          'circle-stroke-width': 3,
        },
      }
    );

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: ultimoCentroRef.current,
      zoom: ultimoZoomRef.current,
      minZoom: 6,
      maxZoom: 21,
      attributionControl: false,
      style: {
        version: 8,
        sources,
        layers,
      },
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, visualizePitch: false }),
      'top-right'
    );
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 110, unit: 'metric' }),
      'bottom-left'
    );

    map.on('error', (e: any) => {
      console.warn('[MapLibre]', e.error || e.message || e);
    });

    map.on('load', () => {
      console.log('[MapLibre cargado con éxito en modo]', isOnline ? 'online' : '100% offline');
    });

    map.on('click', (e: maplibregl.MapMouseEvent) => {
      if (caminandoActivoRef.current) return;
      const lng = Number(e.lngLat.lng.toFixed(6));
      const lat = Number(e.lngLat.lat.toFixed(6));
      setVertices((prev) => [...prev, [lng, lat]]);
    });

    mapRef.current = map;
  }, [modoVista]);

  // Almacenamiento y registro de mapas offline en memoria local
  const handleMapLoaded = useCallback((key: MapKey, blob: Blob) => {
    const source = new BlobSource(key, blob);
    pmtilesProtocol.add(new PMTiles(source));
    console.log(`[MapaParcelaNaskob] Mapa ${key} listo desde Blob local (${(blob.size / (1024 * 1024)).toFixed(1)} MB).`);
    setErrorMapaOffline(null);

    // Si el mapa aún no se había montado (ej. estaba esperando la descarga inicial), montarlo ahora
    if (!mapRef.current) {
      iniciarMapa();
    } else {
      mapRef.current.triggerRepaint();
    }
  }, [iniciarMapa]);

  useEffect(() => {
    iniciarMapa();

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [iniciarMapa]);

  // ---------------------------------------------------------------------------
  // 2. CONMUTADOR INSTANTÁNEO ENTRE MAPA VECTORIAL OFFLINE Y SATELITAL
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const aplicarVisibilidad = () => {
      if (!map.getLayer('capa-satelital-raster')) return;
      map.setLayoutProperty(
        'capa-satelital-raster',
        'visibility',
        modoVista === 'satelital' ? 'visible' : 'none'
      );
    };

    if (map.isStyleLoaded()) {
      aplicarVisibilidad();
    } else {
      map.once('load', aplicarVisibilidad);
    }
  }, [modoVista]);

  // ---------------------------------------------------------------------------
  // 3. ACTUALIZACIÓN DE LA CAPA NATIVA DEL POLÍGONO Y VÉRTICES EN EL MAPA
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sincronizarGeometria = () => {
      const source = map.getSource('parcela-geojson') as maplibregl.GeoJSONSource | undefined;
      if (!source) return;

      const features: GeoJSON.Feature[] = [];

      // 1. Si hay 2 puntos, dibujar línea conectora
      if (vertices.length === 2) {
        features.push(turf.lineString(vertices, { tipo: 'linea' }));
      }

      // 2. Si hay 3 o más puntos, formar el polígono cerrado y su centroide para la NASA
      if (vertices.length >= 3) {
        const anilloCerrado: [number, number][] = [...vertices, vertices[0]];
        const poligono = turf.polygon([anilloCerrado], { tipo: 'poligono' });
        features.push(poligono);

        const centroide = turf.centroid(poligono);
        centroide.properties = { tipo: 'centroide_nasa' };
        features.push(centroide);
      }

      // 3. Agregar cada vértice individual anclado a sus coordenadas [lng, lat]
      vertices.forEach((coord, index) => {
        features.push(
          turf.point(coord, {
            tipo: 'vertice',
            orden: index + 1,
            esPrimero: index === 0,
          })
        );
      });

      source.setData({
        type: 'FeatureCollection',
        features,
      });
    };

    if (map.isStyleLoaded()) {
      sincronizarGeometria();
    } else {
      map.once('load', sincronizarGeometria);
    }
  }, [vertices]);

  // ---------------------------------------------------------------------------
  // 4. ACTUALIZACIÓN DEL MARCADOR Y CÍRCULO DE PRECISIÓN GPS EN EL MAPA
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ubicacionUsuario) return;

    const actualizarCapaGps = () => {
      const source = map.getSource('gps-usuario-geojson') as maplibregl.GeoJSONSource | undefined;
      if (!source) return;

      const puntoCentral: [number, number] = [ubicacionUsuario.lng, ubicacionUsuario.lat];
      const radioKm = Math.max(ubicacionUsuario.precision, 3) / 1000;

      const circuloPrecision = turf.circle(puntoCentral, radioKm, {
        steps: 48,
        units: 'kilometers',
        properties: { tipo: 'circulo_precision' },
      });

      const puntoGps = turf.point(puntoCentral, {
        tipo: 'punto_gps',
        precision: ubicacionUsuario.precision,
      });

      source.setData({
        type: 'FeatureCollection',
        features: [circuloPrecision, puntoGps],
      });
    };

    if (map.isStyleLoaded()) {
      actualizarCapaGps();
    } else {
      map.once('load', actualizarCapaGps);
    }
  }, [ubicacionUsuario]);

  // ---------------------------------------------------------------------------
  // 5. SUAVIZADO PONDERADO DE LECTURAS GPS (CORRIGE EL ERROR DE 100 METROS)
  // ---------------------------------------------------------------------------
  const procesarLecturaGps = useCallback(
    (pos: GeolocationPosition): { lng: number; lat: number; precision: number } => {
      const rawLng = pos.coords.longitude;
      const rawLat = pos.coords.latitude;
      const rawAcc = Math.max(Math.round(pos.coords.accuracy), 2);

      // Mantener ventana corta de las últimas 3 lecturas cercanas para suavizar saltos bruscos
      const buffer = bufferLecturasGpsRef.current;
      if (buffer.length > 0) {
        const ultima = buffer[buffer.length - 1];
        const saltoMetros = distanciaHaversineMetros(
          [ultima.lng, ultima.lat],
          [rawLng, rawLat]
        );
        // Si el usuario se movió más de 35m o reinició ubicación, limpiar buffer anterior
        if (saltoMetros > 35) {
          bufferLecturasGpsRef.current = [];
        }
      }

      bufferLecturasGpsRef.current.push({ lng: rawLng, lat: rawLat, acc: rawAcc });
      if (bufferLecturasGpsRef.current.length > 3) {
        bufferLecturasGpsRef.current.shift();
      }

      // Promedio ponderado por el inverso de la varianza (1 / acc^2): da mucho más peso a las lecturas precisas
      let sumaPesos = 0;
      let lngPonderada = 0;
      let latPonderada = 0;

      for (const item of bufferLecturasGpsRef.current) {
        const peso = 1 / (item.acc * item.acc);
        sumaPesos += peso;
        lngPonderada += item.lng * peso;
        latPonderada += item.lat * peso;
      }

      return {
        lng: Number((lngPonderada / sumaPesos).toFixed(6)),
        lat: Number((latPonderada / sumaPesos).toFixed(6)),
        precision: rawAcc,
      };
    },
    []
  );

  // ---------------------------------------------------------------------------
  // 6. IR A LA UBICACIÓN GPS DEL USUARIO (CORREGIDO PARA VECTORIAL Y SATELITAL)
  // ---------------------------------------------------------------------------
  const irAMiUbicacionGps = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setAlertaGps('Tu navegador o dispositivo no soporta geolocalización GPS.');
      return;
    }

    setCargandoGps(true);
    setAlertaGps(null);
    setEstadoGpsTexto('Buscando satélites GPS de alta precisión...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCargandoGps(false);
        const lectura = procesarLecturaGps(pos);
        setUbicacionUsuario(lectura);

        const dentroDeChiapas =
          lectura.lng >= BBOX_CHIAPAS[0] &&
          lectura.lng <= BBOX_CHIAPAS[2] &&
          lectura.lat >= BBOX_CHIAPAS[1] &&
          lectura.lat <= BBOX_CHIAPAS[3];

        if (!dentroDeChiapas && modoVista === 'vectorial') {
          setAlertaGps(
            `Tu GPS indica que estás fuera de Chiapas (Lat ${lectura.lat}, Lng ${lectura.lng}). Como los archivos offline chiapas.pmtiles solo cubren Chiapas, se activó la vista Satelital para mostrar tu terreno actual.`
          );
          setModoVista('satelital');
        } else if (lectura.precision > 50) {
          setAlertaGps(
            `Tu dispositivo reporta un margen de error amplio (±${lectura.precision} m, común en laptops con Wi-Fi o interiores). Al salir a campo abierto con GPS activo bajará a ±3–10 m.`
          );
        }

        setEstadoGpsTexto(
          `Ubicación GPS encontrada: Lat ${lectura.lat}, Lng ${lectura.lng} (Precisión ±${lectura.precision} m)`
        );

        // Volar directamente a [lng, lat] en EPSG:4326 con zoom 17.5 de parcela
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [lectura.lng, lectura.lat],
            zoom: 17.5,
            essential: true,
          });
        }
      },
      (err) => {
        setCargandoGps(false);
        let mensajeExtra = '';
        if (err.code === 3) {
          mensajeExtra = ' Tiempo de espera agotado. Si estás sin internet en celular, sal a cielo abierto para que el sensor satelital enganche señal.';
        } else if (err.code === 2) {
          mensajeExtra = ' Ubicación no disponible. En computadoras sin internet no hay chip GPS y se requiere conexión Wi-Fi, o puedes usar "Cargar Parcela Demo".';
        }
        setAlertaGps(
          `No se pudo obtener tu ubicación GPS (${err.message}).${mensajeExtra} Verifica también permisos de ubicación.`
        );
      },
      {
        enableHighAccuracy: true, // Solicita el chip GPS físico en móviles
        timeout: 45000, // 45 segundos para dar tiempo al enganche satelital offline
        maximumAge: 15000, // Acepta lecturas recientes de hasta 15 segundos
      }
    );
  }, [modoVista, procesarLecturaGps]);

  // ---------------------------------------------------------------------------
  // 7. MODO "CAMINAR CON GPS" (SEGUIMIENTO EN VIVO Y MARCADO POR BOTÓN)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!caminandoActivo) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      setAlertaGps('Tu dispositivo no cuenta con soporte GPS para el recorrido caminando.');
      setCaminandoActivo(false);
      return;
    }

    setModoCaptura('caminando');
    setEstadoGpsTexto(
      'Modo Caminata Activo: Camina hacia una esquina de tu parcela y pulsa "Marcar punto".'
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lectura = procesarLecturaGps(pos);
        setUbicacionUsuario(lectura);

        if (mapRef.current) {
          mapRef.current.easeTo({
            center: [lectura.lng, lectura.lat],
            duration: 600,
          });
        }

        // Filtro de calidad GPS: advertencia visual si la precisión es baja
        if (lectura.precision > umbralPrecisionMaxMetros) {
          setAlertaGps(
            `Lectura GPS con baja precisión (±${lectura.precision} m > límite de ${umbralPrecisionMaxMetros} m). Espera unos segundos a cielo abierto.`
          );
          return;
        }

        setAlertaGps(null);
        setHistorialPrecisiones((prev) => [...prev, lectura.precision]);
        setEstadoGpsTexto(
          `GPS listo (Precisión ±${lectura.precision} m). Párate en la esquina y presiona "Marcar punto".`
        );
      },
      (err) => {
        setAlertaGps(`Señal GPS interrumpida durante la caminata: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 1000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [caminandoActivo, procesarLecturaGps, umbralPrecisionMaxMetros]);

  // Capturar la ubicación GPS precisa actual y agregarla como vértice del polígono al pulsar el botón
  const marcarPuntoGpsActual = () => {
    if (!('geolocation' in navigator)) {
      setAlertaGps('Tu dispositivo no cuenta con soporte GPS.');
      return;
    }

    setCargandoGps(true);
    setEstadoGpsTexto('Obteniendo coordenadas precisas de la esquina actual...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCargandoGps(false);
        const lectura = procesarLecturaGps(pos);
        setUbicacionUsuario(lectura);
        const nuevoPunto: [number, number] = [lectura.lng, lectura.lat];

        setVertices((prev) => {
          const actualizados = [...prev, nuevoPunto];
          setEstadoGpsTexto(
            `¡Vértice #${actualizados.length} registrado con éxito (±${lectura.precision} m)! Camina a la siguiente esquina.`
          );
          return actualizados;
        });

        setHistorialPrecisiones((prev) => [...prev, lectura.precision]);
        setAlertaGps(null);

        // Feedback háptico (vibración en dispositivos móviles)
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate([60, 40, 60]);
        }

        if (mapRef.current) {
          mapRef.current.easeTo({
            center: nuevoPunto,
            duration: 500,
          });
        }
      },
      (err) => {
        setCargandoGps(false);
        // Si falló el fix instantáneo pero hay una lectura reciente en memoria
        if (ubicacionUsuario) {
          const nuevoPunto: [number, number] = [ubicacionUsuario.lng, ubicacionUsuario.lat];
          setVertices((prev) => {
            const actualizados = [...prev, nuevoPunto];
            setEstadoGpsTexto(
              `¡Vértice #${actualizados.length} guardado con tu última posición conocida (±${ubicacionUsuario.precision} m)!`
            );
            return actualizados;
          });
          setHistorialPrecisiones((prev) => [...prev, ubicacionUsuario.precision]);
          if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate([60, 40, 60]);
          }
        } else {
          setAlertaGps(`No se pudo obtener la posición precisa: ${err.message}`);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 1500,
      }
    );
  };

  // ---------------------------------------------------------------------------
  // 8. CÁLCULO GEODÉSICO DE ÁREA, PERÍMETRO, CENTROIDE Y FILTRADO DE DATOS NASA
  // ---------------------------------------------------------------------------
  const analisisGeoespacial = useMemo(() => {
    if (vertices.length < 3) return null;

    const anilloCerrado: [number, number][] = [...vertices, vertices[0]];
    const poligono = turf.polygon([anilloCerrado]);
    const lineaPerimetro = turf.lineString(anilloCerrado);

    // Área geodésica sobre el elipsoide WGS84 (m² y hectáreas)
    const areaMetrosCuadrados = Math.round(turf.area(poligono));
    const areaHectareas = Number((areaMetrosCuadrados / 10000).toFixed(2));

    // Perímetro en metros
    const perimetroMetros = Math.round(
      turf.length(lineaPerimetro, { units: 'kilometers' }) * 1000
    );

    // Centroide exacto para filtrar los datos satelitales de la NASA (IMERG, POWER, NDVI)
    const centroideFeature = turf.centroid(poligono);
    const [lngCentro, latCentro] = centroideFeature.geometry.coordinates;
    const latitud = Number(latCentro.toFixed(6));
    const longitud = Number(lngCentro.toFixed(6));

    // Bounding Box [minLng, minLat, maxLng, maxLat]
    const bbox = turf.bbox(poligono) as [number, number, number, number];

    // Verificar si se ubica dentro de la región piloto preparada (La Frailesca)
    const dentroDeFrailesca =
      longitud >= BBOX_FRAILESCA[0] &&
      longitud <= BBOX_FRAILESCA[2] &&
      latitud >= BBOX_FRAILESCA[1] &&
      latitud <= BBOX_FRAILESCA[3];

    // Filtrar celda de datos de la NASA para esa ubicación exacta
    const perfilNasa = filtrarDatosNasaPorUbicacion(longitud, latitud);

    return {
      anilloCerrado,
      areaMetrosCuadrados,
      areaHectareas,
      perimetroMetros,
      enRangoOptimo: areaHectareas >= 1.0 && areaHectareas <= 10.0,
      estadoRegion: (dentroDeFrailesca ? 'preparada' : 'no_preparada') as
        | 'preparada'
        | 'no_preparada',
      ubicacionFiltroNasa: {
        latitud,
        longitud,
        bbox,
        celdaNasaId: perfilNasa.celdaId,
        municipioReferencia: perfilNasa.municipio,
      },
      perfilNasa,
    };
  }, [vertices]);

  const handleConfirmar = () => {
    if (!analisisGeoespacial) return;

    const precisionPromedio =
      historialPrecisiones.length > 0
        ? Math.round(
            historialPrecisiones.reduce((acc, v) => acc + v, 0) /
              historialPrecisiones.length
          )
        : ubicacionUsuario?.precision ?? null;

    const resultado: ResultadoParcelaConfirmada = {
      modoCaptura,
      modoMapaUsado: modoVista,
      verticesWGS84: vertices,
      geometriaGeoJSON: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [analisisGeoespacial.anilloCerrado],
        },
        properties: {
          area_ha: analisisGeoespacial.areaHectareas,
          perimetro_m: analisisGeoespacial.perimetroMetros,
          modo_captura: modoCaptura,
          generado_utc: new Date().toISOString(),
        },
      },
      areaHectareas: analisisGeoespacial.areaHectareas,
      areaMetrosCuadrados: analisisGeoespacial.areaMetrosCuadrados,
      perimetroMetros: analisisGeoespacial.perimetroMetros,
      enRangoOptimo: analisisGeoespacial.enRangoOptimo,
      estadoRegion: analisisGeoespacial.estadoRegion,
      ubicacionFiltroNasa: analisisGeoespacial.ubicacionFiltroNasa,
      perfilNasaAsociado: analisisGeoespacial.perfilNasa,
      precisionGpsPromedioMetros: precisionPromedio,
    };

    onParcelaConfirmada(resultado);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Gestor y Monitor de Almacenamiento de Mapas Offline */}
      <GestorMapaOffline onMapLoaded={handleMapLoaded} />

      {/* Barra superior de selección de Mapa (Vectorial Offline vs Satelital) y GPS */}
      <div className="bg-white border border-cream-line rounded-naskob p-3 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModoVista('vectorial')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              modoVista === 'vectorial'
                ? 'bg-ink text-white shadow-sm'
                : 'bg-cream text-ink hover:bg-cream-line/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Mapa Vectorial (Offline PMTiles)</span>
          </button>

          <button
            type="button"
            onClick={() => setModoVista('satelital')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              modoVista === 'satelital'
                ? 'bg-navy text-white shadow-sm'
                : 'bg-cream text-ink hover:bg-cream-line/60'
            }`}
          >
            <Satellite className="w-4 h-4" />
            <span>Mapa Satelital (Híbrido)</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={irAMiUbicacionGps}
            disabled={cargandoGps}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-navy text-white hover:bg-navy-light transition disabled:opacity-60"
          >
            <Navigation className="w-4 h-4" />
            <span>{cargandoGps ? 'Localizando GPS...' : 'Mi ubicación GPS'}</span>
          </button>
        </div>
      </div>

      {/* Selector de Método de Delimitación: 1. Marcar punto en el mapa vs 2. Caminar con GPS */}
      <div className="bg-white border border-cream-line rounded-naskob p-3 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-xs font-extrabold text-ink block">
            Método de delimitación del terreno:
          </span>
          <p className="text-[11px] text-ink-muted">
            Elige si prefieres marcar los puntos en la pantalla o recorrer el perímetro caminando.
          </p>
        </div>

        <div className="grid grid-cols-2 p-1 bg-cream/80 rounded-xl border border-cream-line text-xs font-bold w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setCaminandoActivo(false);
              setModoCaptura('poligono');
              setEstadoGpsTexto('Modo toque: Haz clic o toca en el mapa para marcar cada punto de tu parcela.');
            }}
            className={`py-2 px-3.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              !caminandoActivo
                ? 'bg-ink text-white shadow-sm'
                : 'text-ink-muted hover:text-ink hover:bg-cream/50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-maize" />
            <span>1. Marcar punto</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCaminandoActivo(true);
              setModoCaptura('caminando');
              setEstadoGpsTexto('Modo caminata GPS: Camina hacia una esquina y presiona "Marcar punto".');
            }}
            className={`py-2 px-3.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              caminandoActivo
                ? 'bg-ink text-white shadow-sm'
                : 'text-ink-muted hover:text-ink hover:bg-cream/50'
            }`}
          >
            <Footprints className="w-3.5 h-3.5 text-maize" />
            <span>2. Caminar con GPS</span>
          </button>
        </div>
      </div>

      {/* Estado en vivo del GPS y filtro anti-error de 100 metros */}
      <div className="bg-white border border-cream-line rounded-naskob p-3 text-xs flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-ink">
            <Crosshair className="w-4 h-4 text-ink-light shrink-0" />
            <span>{estadoGpsTexto}</span>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="umbral-gps" className="text-ink-muted font-medium">
              Filtro máx. error GPS al caminar:
            </label>
            <select
              id="umbral-gps"
              value={umbralPrecisionMaxMetros}
              onChange={(e) => setUmbralPrecisionMaxMetros(Number(e.target.value))}
              className="border border-cream-line rounded px-2 py-1 bg-cream text-ink font-semibold"
            >
              <option value={15}>±15 m (Campo abierto estricto)</option>
              <option value={30}>±30 m (Recomendado celular)</option>
              <option value={120}>±120 m (Modo prueba en PC / Wi-Fi)</option>
            </select>
          </div>
        </div>

        {alertaGps && (
          <div className="p-2.5 rounded-lg bg-warn-bg border border-warn/30 text-warn flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{alertaGps}</span>
          </div>
        )}
      </div>

      {/* Contenedor del Mapa WebGL (Altura explícita y ResizeObserver evitan cualquier desfase al hacer zoom) */}
      <div className="relative w-full h-[460px] rounded-naskob overflow-hidden border-2 border-cream-line shadow-sm bg-[#eae6df]">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Mensaje de guía si no hay mapa descargado y el usuario está offline */}
        {errorMapaOffline && (
          <div className="absolute inset-0 bg-[#f3efe6]/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20">
            <WifiOff className="w-10 h-10 text-amber-700 mb-2" />
            <h3 className="font-extrabold text-ink text-sm mb-1">
              Mapa Offline No Encontrado
            </h3>
            <p className="text-ink-muted text-xs max-w-md mb-3 leading-relaxed">
              {errorMapaOffline}
            </p>
            <button
              type="button"
              onClick={() => iniciarMapa()}
              className="px-3.5 py-1.5 rounded-lg bg-ink text-white font-bold text-xs hover:bg-ink-light transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reintentar Carga
            </button>
          </div>
        )}

        {/* Etiqueta flotante superior izquierda indicando el estado del modo y número de puntos */}
        <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg border border-cream-line shadow-sm text-xs flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              caminandoActivo ? 'bg-terra animate-pulse' : 'bg-ok'
            }`}
          />
          <span className="font-bold text-ink">
            {caminandoActivo
              ? 'Modo Caminar: Pulsa "Marcar punto"'
              : 'Modo Marcar punto en el mapa'}
          </span>
          <span className="text-ink-muted">({vertices.length} vértices)</span>
        </div>
      </div>

      {/* Barra de Herramientas de Trazado de Polígono y Caminata GPS */}
      <div className="bg-white border border-cream-line rounded-naskob p-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {caminandoActivo ? (
          /* ======================================================== */
          /* MODO 2: CAMINANDO -> BOTÓN DESTACADO "MARCAR PUNTO"      */
          /* ======================================================== */
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={marcarPuntoGpsActual}
              disabled={cargandoGps}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold bg-maize hover:bg-maize-light text-ink active:scale-[0.98] transition-all shadow-md border-2 border-maize-dark/30 group"
            >
              <MapPin className="w-4 h-4 text-ink shrink-0 group-hover:scale-110 transition-transform" />
              <span>{cargandoGps ? 'Capturando coordenadas...' : '📍 Marcar punto (Ubicación actual)'}</span>
              {ubicacionUsuario && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ink/10 text-ink">
                  ±{ubicacionUsuario.precision} m
                </span>
              )}
            </button>
          </div>
        ) : (
          /* ======================================================== */
          /* MODO 1: MARCAR PUNTO EN EL MAPA                          */
          /* ======================================================== */
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted font-medium hidden sm:inline">
              Toca el mapa para agregar esquinas ({vertices.length} marcadas).
            </span>
            <button
              type="button"
              onClick={marcarPuntoGpsActual}
              disabled={cargandoGps}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-navy-bg text-navy hover:bg-navy/15 transition"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>+ Marcar mi ubicación como punto</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            disabled={vertices.length === 0}
            onClick={() => setVertices((prev) => prev.slice(0, -1))}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-cream text-ink hover:bg-cream-line disabled:opacity-40 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Deshacer punto</span>
          </button>

          <button
            type="button"
            disabled={vertices.length === 0}
            onClick={() => {
              setVertices([]);
              setHistorialPrecisiones([]);
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-terra-bg text-terra hover:bg-terra/20 disabled:opacity-40 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar polígono</span>
          </button>
        </div>
      </div>

      {/* Panel de Cálculo de Área, Determinación de Ubicación y Datos NASA Filtrados */}
      {analisisGeoespacial ? (
        <div className="bg-white border-2 border-ink/20 rounded-naskob p-4 shadow-sm flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-line pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block">
                Superficie Calculada del Polígono (RF01)
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-ink">
                  {analisisGeoespacial.areaHectareas} ha
                </span>
                <span className="text-xs text-ink-muted">
                  ({analisisGeoespacial.areaMetrosCuadrados.toLocaleString()} m² · Perímetro:{' '}
                  {analisisGeoespacial.perimetroMetros} m)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {analisisGeoespacial.enRangoOptimo ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-ok-bg text-ok">
                  <CheckCircle2 className="w-4 h-4" />
                  Rango óptimo (1 a 10 ha)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-warn-bg text-warn">
                  <AlertTriangle className="w-4 h-4" />
                  Fuera del rango 1–10 ha (Se permite continuar con aviso RF01)
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-navy-bg text-navy">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Estado de Chiapas (Cobertura Estatal Offline)</span>
              </span>
            </div>
          </div>

          {/* Datos de Ubicación y Filtrado Automático de la NASA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-cream rounded-lg p-3 border border-cream-line">
              <p className="font-bold text-ink uppercase tracking-wider mb-1.5">
                Ubicación Determinada (Filtro NASA)
              </p>
              <ul className="space-y-1 text-ink-muted">
                <li>
                  <strong className="text-ink">Centroide Latitud:</strong>{' '}
                  {analisisGeoespacial.ubicacionFiltroNasa.latitud}° N
                </li>
                <li>
                  <strong className="text-ink">Centroide Longitud:</strong>{' '}
                  {analisisGeoespacial.ubicacionFiltroNasa.longitud}° W
                </li>
                <li>
                  <strong className="text-ink">Celda NASA Asignada:</strong>{' '}
                  {analisisGeoespacial.perfilNasa.celdaId} (
                  {analisisGeoespacial.perfilNasa.municipio})
                </li>
                <li>
                  <strong className="text-ink">Resolución de Celda:</strong>{' '}
                  {analisisGeoespacial.perfilNasa.resolucionKm} km (Contexto de la zona · RNF06)
                </li>
              </ul>
            </div>

            <div className="bg-cream rounded-lg p-3 border border-cream-line">
              <p className="font-bold text-ink uppercase tracking-wider mb-1.5">
                Datos NASA Filtrados para esta Ubicación
              </p>
              <ul className="space-y-1 text-ink-muted">
                <li>
                  <strong className="text-ink">Lluvia anual (IMERG/POWER):</strong>{' '}
                  {analisisGeoespacial.perfilNasa.lluviaAnualMedianaMm} mm (p10:{' '}
                  {analisisGeoespacial.perfilNasa.lluviaP10Mm} – p90:{' '}
                  {analisisGeoespacial.perfilNasa.lluviaP90Mm} mm)
                </li>
                <li>
                  <strong className="text-ink">Inicio de lluvias (RN-LLU-01):</strong>{' '}
                  {analisisGeoespacial.perfilNasa.inicioLluviasMediana} (
                  {analisisGeoespacial.perfilNasa.inicioLluviasVentana})
                </li>
                <li>
                  <strong className="text-ink">Secuencia seca máx.:</strong>{' '}
                  {analisisGeoespacial.perfilNasa.secuenciaSecaMaxDiasP10} a{' '}
                  {analisisGeoespacial.perfilNasa.secuenciaSecaMaxDiasP90} días
                </li>
                <li>
                  <strong className="text-ink">NDVI histórico / Erosión RRE:</strong>{' '}
                  NDVI {analisisGeoespacial.perfilNasa.ndviPromedioHistorico} · RRE{' '}
                  <span className="uppercase font-bold text-ink">
                    {analisisGeoespacial.perfilNasa.rreErosion}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <ShieldCheck className="w-4 h-4 text-ok shrink-0" />
              <span>
                Privacidad RNF01: Las coordenadas exactas del polígono se usan para filtrar la celda climática y se cifran sin exponerse públicamente.
              </span>
            </div>

            <button
              type="button"
              onClick={handleConfirmar}
              className="px-5 py-2.5 rounded-lg text-xs font-extrabold bg-ink text-white hover:bg-ink-light transition shrink-0 shadow-sm"
            >
              Confirmar Parcela y Filtrar Datos NASA
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-cream border border-cream-line rounded-naskob p-3 text-xs text-ink-muted text-center">
          Marca al menos <strong>3 puntos</strong> en el mapa (tocando las esquinas de tu parcela o usando el modo caminata GPS) para formar el polígono, calcular las hectáreas y filtrar los datos de la NASA.
        </div>
      )}
    </div>
  );
};
