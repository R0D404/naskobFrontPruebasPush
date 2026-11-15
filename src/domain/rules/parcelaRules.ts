import * as turf from '@turf/turf';
import { Coordenada, GeoJSONPolygon, ValidacionRangoParcela } from '../models/parcela';

export const AREA_MIN_OPTIMA_HA = 1.0;
export const AREA_MAX_OPTIMA_HA = 10.0;

/**
 * Ordena un conjunto de vértices [lng, lat] para conformar un polígono simple sin auto-intersecciones (kinks).
 * 
 * Si el conjunto original de puntos ya es un polígono cerrado simple sin cruces, se respeta el orden.
 * Si se detectan auto-intersecciones (o puntos marcados en orden no perimetral/cruzado tipo estrella),
 * se ordenan polarmente respecto a su centroide geométrico para trazar un perímetro limpio y relleno.
 * Como respaldo adicional ante geometrías cóncavas complejas con cruces, utiliza convex hull.
 */
export function ordenarVerticesPoligono(puntos: [number, number][]): [number, number][] {
  if (!puntos || puntos.length < 3) return puntos;

  // 1. Eliminar duplicados o puntos prácticamente idénticos (< 1e-7 deg ~ 1 cm)
  const unicos: [number, number][] = [];
  puntos.forEach((p) => {
    if (!unicos.some((u) => Math.abs(u[0] - p[0]) < 1e-7 && Math.abs(u[1] - p[1]) < 1e-7)) {
      unicos.push(p);
    }
  });

  if (unicos.length < 3) return unicos;

  // 2. Verificar si el orden original ya conforma un polígono simple sin auto-intersecciones
  try {
    const rawRing: [number, number][] = [...unicos, unicos[0]];
    const rawPoly = turf.polygon([rawRing]);
    if (turf.kinks(rawPoly).features.length === 0) {
      return unicos;
    }
  } catch {
    // Si falla la validación directa, continuamos con la ordenación angular
  }

  // 3. Ordenamiento angular (sweep polar) alrededor del centroide geométrico
  const n = unicos.length;
  const cx = unicos.reduce((acc, p) => acc + p[0], 0) / n;
  const cy = unicos.reduce((acc, p) => acc + p[1], 0) / n;

  const ordenados = [...unicos].sort((a, b) => {
    const angA = Math.atan2(a[1] - cy, a[0] - cx);
    const angB = Math.atan2(b[1] - cy, b[0] - cx);
    return angA - angB;
  });

  // 4. Validar si el polígono ordenado angularmente no tiene kinks
  try {
    const sortedRing: [number, number][] = [...ordenados, ordenados[0]];
    const sortedPoly = turf.polygon([sortedRing]);
    if (turf.kinks(sortedPoly).features.length === 0) {
      return ordenados;
    }
  } catch {
    // Si falla, pasar al fallback
  }

  // 5. Fallback de contingencia: Convex Hull (garantía matemática de 0 auto-intersecciones)
  try {
    const fc = turf.featureCollection(unicos.map((p) => turf.point(p)));
    const hull = turf.convex(fc);
    if (hull?.geometry?.coordinates?.[0]) {
      return hull.geometry.coordinates[0].slice(0, -1) as [number, number][];
    }
  } catch {
    // Si falla convex, retornar ordenados
  }

  return ordenados;
}

/**
 * Convierte un arreglo de Coordenadas {lat, lng} a GeoJSON Polygon ([lng, lat])
 * Asegura que el polígono esté ordenado perimetralmente y cerrado (primer y último punto idénticos).
 */
export function coordenadasAGeoJSON(puntos: Coordenada[]): GeoJSONPolygon {
  if (puntos.length < 3) {
    throw new Error('Se requieren al menos 3 puntos para conformar un polígono.');
  }

  const coordsWGS84: [number, number][] = puntos.map((p) => [p.lng, p.lat]);
  const coordsOrdenadas = ordenarVerticesPoligono(coordsWGS84);
  const coordsCerradas: [number, number][] = [...coordsOrdenadas, coordsOrdenadas[0]];

  return {
    type: 'Polygon',
    coordinates: [coordsCerradas],
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
    const rawCoords: [number, number][] = puntos.map((p) => [p.lng, p.lat]);
    const rawRing: [number, number][] = [...rawCoords, rawCoords[0]];
    const poly = turf.polygon([rawRing]);
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
