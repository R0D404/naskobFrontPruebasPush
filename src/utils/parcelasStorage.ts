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
 * Guarda o actualiza una parcela con su declaración y evaluación localmente.
 */
export function guardarParcelaLocal(
  parcela: Parcela,
  declaracion?: DeclaracionCompleta,
  recomendacion_principal?: string
): ParcelaGuardada {
  const actuales = obtenerParcelasLocales();
  const fecha = new Date().toISOString();

  const nuevaParcela: ParcelaGuardada = {
    id_parcela: parcela.id_parcela,
    nombre: parcela.nombre || `Parcela ${parcela.area_ha.toFixed(2)} ha`,
    area_ha: parcela.area_ha,
    estado: 'con_declaracion',
    fecha_guardado: fecha,
    parcela,
    declaracion,
    recomendacion_principal: recomendacion_principal || 'Frijol',
  };

  // Reemplazar si ya existía con el mismo id, o agregar al inicio
  const filtradas = actuales.filter((p) => p.id_parcela !== parcela.id_parcela);
  const actualizadas = [nuevaParcela, ...filtradas];

  try {
    localStorage.setItem(CLAVE_STORAGE_PARCELAS, JSON.stringify(actualizadas));
  } catch (err) {
    console.warn('[parcelasStorage] Error al guardar parcela en localStorage:', err);
  }

  return nuevaParcela;
}

/**
 * Elimina una parcela guardada localmente por su id.
 */
export function eliminarParcelaLocal(id_parcela: string): void {
  try {
    const actuales = obtenerParcelasLocales();
    const filtradas = actuales.filter((p) => p.id_parcela !== id_parcela);
    localStorage.setItem(CLAVE_STORAGE_PARCELAS, JSON.stringify(filtradas));
  } catch (err) {
    console.warn('[parcelasStorage] Error al eliminar parcela local:', err);
  }
}
