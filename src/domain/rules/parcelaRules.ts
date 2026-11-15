import * as turf from '@turf/turf';
import { Coordenada, GeoJSONPolygon, ValidacionRangoParcela } from '../models/parcela';

export const AREA_MIN_OPTIMA_HA = 1.0;
export const AREA_MAX_OPTIMA_HA = 10.0;

/**
 * Convierte un arreglo de Coordenadas {lat, lng} a GeoJSON Polygon ([lng, lat])
 * Asegura que el polígono esté cerrado (primer y último punto idénticos).
 */
export function coordenadasAGeoJSON(puntos: Coordenada[]): GeoJSONPolygon {
  if (puntos.length < 3) {
    throw new Error('Se requieren al menos 3 puntos para conformar un polígono.');
  }

  const coords = puntos.map((p) => [p.lng, p.lat]);
  // Cerrar el polígono si no está cerrado
  const primer = coords[0];
  const ultimo = coords[coords.length - 1];
  if (primer[0] !== ultimo[0] || primer[1] !== ultimo[1]) {
    coords.push([...primer]);
  }

  return {
    type: 'Polygon',
    coordinates: [coords],
  };
}

/**
 * Calcula el área en hectáreas a partir de puntos o GeoJSON usando Turf.js
 * Retorna el valor redondeado a 1 decimal.
 */
export function calcularAreaHa(puntos: Coordenada[]): number {
  if (puntos.length < 3) return 0;

  try {
    const geojson = coordenadasAGeoJSON(puntos);
    const poly = turf.polygon(geojson.coordinates);
    const areaM2 = turf.area(poly);
    const ha = areaM2 / 10000;
    return Math.round(ha * 10) / 10;
  } catch (error) {
    console.error('Error al calcular el área con Turf:', error);
    return 0;
  }
}

/**
 * Verifica si las líneas del polígono se cruzan entre sí (auto-intersección / kinks).
 * Retorna true si hay cruces detectados.
 */
export function verificarAutoInterseccion(puntos: Coordenada[]): boolean {
  if (puntos.length < 4) return false;

  try {
    const geojson = coordenadasAGeoJSON(puntos);
    const poly = turf.polygon(geojson.coordinates);
    const cruzamientos = turf.kinks(poly);
    return cruzamientos.features.length > 0;
  } catch {
    return false;
  }
}

/**
 * Valida si el área en hectáreas se encuentra en el rango óptimo (1 a 10 ha).
 */
export function validarRangoArea(areaHa: number): ValidacionRangoParcela {
  if (areaHa >= AREA_MIN_OPTIMA_HA && areaHa <= AREA_MAX_OPTIMA_HA) {
    return {
      esOptimo: true,
      mensaje: '✓ Parcela en rango óptimo (1 a 10 ha)',
      tipo: 'ok',
    };
  }

  if (areaHa < AREA_MIN_OPTIMA_HA) {
    return {
      esOptimo: false,
      mensaje: `Parcela fuera del rango recomendado (${areaHa.toFixed(1)} ha). El tamaño mínimo para rotación resiliente es 1.0 ha.`,
      tipo: 'warn',
    };
  }

  return {
    esOptimo: false,
    mensaje: `Parcela fuera del rango recomendado (${areaHa.toFixed(1)} ha). Supera el límite de 10.0 ha para pequeños productores.`,
    tipo: 'warn',
  };
}

/**
 * Redondea el área en hectáreas a 1 decimal
 */
export function formatearArea(areaHa: number): number {
  return Math.round(areaHa * 10) / 10;
}
