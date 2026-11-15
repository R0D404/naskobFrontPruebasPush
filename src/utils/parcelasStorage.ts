import { Parcela } from '@/domain/models/parcela';
import { DeclaracionCompleta } from '@/domain/models/declaracion';

const CLAVE_STORAGE_PARCELAS = 'naskob_parcelas_guardadas_v1';

export interface ParcelaGuardada {
  id_parcela: string;
  nombre?: string;
  area_ha: number;
  estado: string;
  fecha_guardado: string;
  parcela: Parcela;
  declaracion?: DeclaracionCompleta;
  recomendacion_principal?: string;
  sincronizado?: boolean;
  id_remoto?: string;
}

/**
 * Obtiene todas las parcelas guardadas localmente en este dispositivo (localStorage).
 */
export function obtenerParcelasLocales(): ParcelaGuardada[] {
  try {
    const raw = localStorage.getItem(CLAVE_STORAGE_PARCELAS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[parcelasStorage] Error al leer parcelas locales:', err);
    return [];
  }
}

/**
 * Evalúa si dos referencias de parcela corresponden a la misma entidad física
 */
function sonMismaParcela(
  p: ParcelaGuardada,
  idParcela: string,
  idRemoto?: string,
  idAnterior?: string,
  nombre?: string,
  areaHa?: number
): boolean {
  // Coincidencia directa por id_parcela
  if (p.id_parcela === idParcela) return true;

  // Coincidencia por id_remoto
  if (idRemoto && (p.id_remoto === idRemoto || p.id_parcela === idRemoto)) return true;
  if (p.id_remoto && (p.id_remoto === idParcela || (idAnterior && p.id_remoto === idAnterior))) return true;

  // Coincidencia por id anterior local (ej. parc_173...)
  if (idAnterior && (p.id_parcela === idAnterior || p.id_remoto === idAnterior)) return true;

  // Coincidencia por atributos clave: mismo nombre y área casi idéntica (±0.02 ha)
  if (
    nombre &&
    p.nombre &&
    areaHa !== undefined &&
    p.area_ha !== undefined &&
    p.nombre.trim().toLowerCase() === nombre.trim().toLowerCase() &&
    Math.abs(p.area_ha - areaHa) < 0.02
  ) {
    return true;
  }

  return false;
}

/**
 * Guarda o actualiza una parcela en almacenamiento local evitando duplicaciones.
 * Si la parcela ya existía (por id local, id remoto o nombre + área), actualiza
 * y consolida el registro existente en lugar de agregar uno nuevo.
 */
export function guardarParcelaLocal(
  parcela: Parcela,
  declaracion?: DeclaracionCompleta,
  recomendacion_principal?: string,
  sincronizado?: boolean,
  id_remoto?: string,
  id_anterior?: string
): ParcelaGuardada {
  const actuales = obtenerParcelasLocales();
  const fecha = new Date().toISOString();

  // Buscar si ya existe algún registro correspondiente a esta parcela
  const existente = actuales.find((p) =>
    sonMismaParcela(
      p,
      parcela.id_parcela,
      id_remoto,
      id_anterior,
      parcela.nombre,
      parcela.area_ha
    )
  );

  const idFinalRemoto =
    id_remoto ||
    existente?.id_remoto ||
    (!parcela.id_parcela.startsWith('parc_') && parcela.id_parcela !== 'parcela_activa'
      ? parcela.id_parcela
      : undefined);

  const estaSincronizado =
    sincronizado !== undefined
      ? sincronizado
      : (existente?.sincronizado ?? Boolean(idFinalRemoto));

  const decFinal = declaracion || existente?.declaracion;
  const recFinal =
    recomendacion_principal || existente?.recomendacion_principal || 'Frijol';

  const estadoFinal =
    decFinal
      ? 'con_declaracion'
      : (existente?.estado || 'registrada');

  // Si tenemos id remoto confirmado, usarlo como id_parcela canónico
  const idFinalParcela = idFinalRemoto || parcela.id_parcela;

  const nuevaParcela: ParcelaGuardada = {
    id_parcela: idFinalParcela,
    nombre: parcela.nombre || existente?.nombre || `Parcela ${parcela.area_ha.toFixed(2)} ha`,
    area_ha: parcela.area_ha,
    estado: estadoFinal,
    fecha_guardado: existente?.fecha_guardado || fecha,
    parcela: {
      ...parcela,
      id_parcela: idFinalParcela,
    },
    declaracion: decFinal,
    recomendacion_principal: recFinal,
    sincronizado: estaSincronizado,
    id_remoto: idFinalRemoto,
  };

  // Filtrar y remover TODAS las variantes duplicadas o previas de esta parcela
  const filtradas = actuales.filter(
    (p) =>
      !sonMismaParcela(
        p,
        parcela.id_parcela,
        id_remoto,
        id_anterior,
        parcela.nombre,
        parcela.area_ha
      )
  );

  const actualizadas = [nuevaParcela, ...filtradas];

  try {
    localStorage.setItem(CLAVE_STORAGE_PARCELAS, JSON.stringify(actualizadas));
  } catch (err) {
    console.warn('[parcelasStorage] Error al guardar parcela en localStorage:', err);
  }

  return nuevaParcela;
}

/**
 * Marca una parcela como sincronizada con la base de datos remota
 * y actualiza su identificador canónico sin duplicar.
 */
export function marcarParcelaComoSincronizada(id_parcela: string, id_remoto: string): void {
  const actuales = obtenerParcelasLocales();
  let encontrada = false;

  const actualizadas = actuales.map((p) => {
    if (
      p.id_parcela === id_parcela ||
      p.id_remoto === id_remoto ||
      p.id_parcela === id_remoto
    ) {
      encontrada = true;
      return {
        ...p,
        id_parcela: id_remoto,
        id_remoto,
        sincronizado: true,
        parcela: {
          ...p.parcela,
          id_parcela: id_remoto,
        },
      };
    }
    return p;
  });

  // Si no estaba en la lista, no hacemos nada
  if (!encontrada) return;

  // Asegurar que no queden duplicados con el mismo id_parcela o id_remoto
  const vistos = new Set<string>();
  const unicas: ParcelaGuardada[] = [];

  for (const item of actualizadas) {
    const clave = item.id_remoto || item.id_parcela;
    if (!vistos.has(clave)) {
      vistos.add(clave);
      unicas.push(item);
    }
  }

  try {
    localStorage.setItem(CLAVE_STORAGE_PARCELAS, JSON.stringify(unicas));
  } catch (err) {
    console.warn('[parcelasStorage] Error al actualizar estado de sincronización:', err);
  }
}

/**
 * Elimina una parcela guardada localmente por su id o id_remoto.
 */
export function eliminarParcelaLocal(id_parcela: string): void {
  try {
    const actuales = obtenerParcelasLocales();
    // Obtener la parcela objetivo para conocer también su nombre y área
    const objetivo = actuales.find(
      (p) => p.id_parcela === id_parcela || p.id_remoto === id_parcela
    );

    const filtradas = actuales.filter((p) => {
      if (p.id_parcela === id_parcela || p.id_remoto === id_parcela) return false;
      if (
        objetivo &&
        objetivo.nombre &&
        p.nombre &&
        p.nombre.trim().toLowerCase() === objetivo.nombre.trim().toLowerCase() &&
        Math.abs(p.area_ha - objetivo.area_ha) < 0.02
      ) {
        return false;
      }
      return true;
    });

    localStorage.setItem(CLAVE_STORAGE_PARCELAS, JSON.stringify(filtradas));
  } catch (err) {
    console.warn('[parcelasStorage] Error al eliminar parcela local:', err);
  }
}

/**
 * Limpia y consolida duplicados preexistentes en localStorage.
 * Si existen registros huérfanos con el mismo nombre y área o el mismo id remoto,
 * los fusiona conservando la información más completa (evaluación y UUID remoto).
 */
export function limpiarYConsolidarParcelasLocales(): ParcelaGuardada[] {
  const actuales = obtenerParcelasLocales();
  if (actuales.length <= 1) return actuales;

  const mapa = new Map<string, ParcelaGuardada>();

  for (const item of actuales) {
    // Generar clave de consolidación
    const clave = item.id_remoto && !item.id_remoto.startsWith('parc_')
      ? item.id_remoto
      : `${(item.nombre || 'parcela').trim().toLowerCase()}_${item.area_ha.toFixed(2)}`;

    const existente = mapa.get(clave);
    if (!existente) {
      mapa.set(clave, item);
    } else {
      // Fusionar: preferir el que tenga declaración, el que esté sincronizado o el que tenga id remoto real
      const tieneDeclaracion = item.declaracion || existente.declaracion;
      const idRemotoReal =
        (item.id_remoto && !item.id_remoto.startsWith('parc_') ? item.id_remoto : undefined) ||
        (existente.id_remoto && !existente.id_remoto.startsWith('parc_') ? existente.id_remoto : undefined) ||
        (!item.id_parcela.startsWith('parc_') ? item.id_parcela : existente.id_parcela);

      const consolidada: ParcelaGuardada = {
        ...existente,
        id_parcela: idRemotoReal || existente.id_parcela,
        id_remoto: idRemotoReal,
        estado: tieneDeclaracion ? 'con_declaracion' : (existente.estado === 'con_declaracion' || item.estado === 'con_declaracion' ? 'con_declaracion' : 'registrada'),
        declaracion: tieneDeclaracion,
        recomendacion_principal:
          item.recomendacion_principal !== 'Frijol'
            ? item.recomendacion_principal
            : existente.recomendacion_principal,
        sincronizado: Boolean(item.sincronizado || existente.sincronizado || idRemotoReal),
        parcela: {
          ...existente.parcela,
          id_parcela: idRemotoReal || existente.parcela.id_parcela,
        },
      };

      mapa.set(clave, consolidada);
    }
  }

  const consolidadas = Array.from(mapa.values());
  try {
    localStorage.setItem(CLAVE_STORAGE_PARCELAS, JSON.stringify(consolidadas));
  } catch (err) {
    console.warn('[parcelasStorage] Error guardando parcelas consolidadas:', err);
  }

  return consolidadas;
}
