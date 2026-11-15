import { PerfilAgroclimaticoNasa } from '../types/parcela';

/**
 * Celdas precalculadas con datos históricos de la NASA (2001-2025: GPM IMERG, NASA POWER, MODIS/Landsat NDVI y NASADEM)
 * para filtrado automático online/offline a partir del centroide GPS/polígono del usuario.
 */
export const CELDAS_NASA_PRECALCULADAS: PerfilAgroclimaticoNasa[] = [
  {
    celdaId: 'NASA-FRA-VF-01',
    municipio: 'Villaflores (Centro / Valle)',
    centroideCelda: [-93.2683, 16.2336],
    resolucionKm: 11.0,
    fuenteLluvia: 'NASA GPM IMERG v07 + POWER (2001–2025)',
    lluviaAnualMedianaMm: 1245,
    lluviaP10Mm: 980,
    lluviaP90Mm: 1560,
    inicioLluviasMediana: '22 de mayo',
    inicioLluviasVentana: '12 de mayo – 3 de junio',
    secuenciaSecaMaxDiasP10: 11,
    secuenciaSecaMaxDiasP90: 24,
    ndviPromedioHistorico: 0.68,
    rreErosion: 'medio',
    confianzaDatos: 'alta',
    fVal: 0.96,
  },
  {
    celdaId: 'NASA-FRA-VC-02',
    municipio: 'Villa Corzo',
    centroideCelda: [-93.2667, 16.1833],
    resolucionKm: 11.0,
    fuenteLluvia: 'NASA GPM IMERG v07 + POWER (2001–2025)',
    lluviaAnualMedianaMm: 1310,
    lluviaP10Mm: 1020,
    lluviaP90Mm: 1640,
    inicioLluviasMediana: '19 de mayo',
    inicioLluviasVentana: '10 de mayo – 30 de mayo',
    secuenciaSecaMaxDiasP10: 10,
    secuenciaSecaMaxDiasP90: 22,
    ndviPromedioHistorico: 0.71,
    rreErosion: 'medio',
    confianzaDatos: 'alta',
    fVal: 0.95,
  },
  {
    celdaId: 'NASA-FRA-LC-03',
    municipio: 'La Concordia',
    centroideCelda: [-92.6833, 16.1167],
    resolucionKm: 11.0,
    fuenteLluvia: 'NASA GPM IMERG v07 + POWER (2001–2025)',
    lluviaAnualMedianaMm: 1180,
    lluviaP10Mm: 910,
    lluviaP90Mm: 1490,
    inicioLluviasMediana: '25 de mayo',
    inicioLluviasVentana: '15 de mayo – 6 de junio',
    secuenciaSecaMaxDiasP10: 13,
    secuenciaSecaMaxDiasP90: 27,
    ndviPromedioHistorico: 0.64,
    rreErosion: 'alto',
    confianzaDatos: 'alta',
    fVal: 0.93,
  },
  {
    celdaId: 'NASA-FRA-AC-04',
    municipio: 'Ángel Albino Corzo (Jaltenango)',
    centroideCelda: [-92.7236, 15.8719],
    resolucionKm: 11.0,
    fuenteLluvia: 'NASA GPM IMERG v07 + POWER (2001–2025)',
    lluviaAnualMedianaMm: 1580,
    lluviaP10Mm: 1250,
    lluviaP90Mm: 1920,
    inicioLluviasMediana: '14 de mayo',
    inicioLluviasVentana: '5 de mayo – 24 de mayo',
    secuenciaSecaMaxDiasP10: 8,
    secuenciaSecaMaxDiasP90: 18,
    ndviPromedioHistorico: 0.76,
    rreErosion: 'alto',
    confianzaDatos: 'alta',
    fVal: 0.91,
  },
  {
    celdaId: 'NASA-FRA-MP-05',
    municipio: 'Montecristo de Guerrero / El Parral',
    centroideCelda: [-93.0125, 16.3681],
    resolucionKm: 11.0,
    fuenteLluvia: 'NASA GPM IMERG v07 + POWER (2001–2025)',
    lluviaAnualMedianaMm: 1120,
    lluviaP10Mm: 860,
    lluviaP90Mm: 1410,
    inicioLluviasMediana: '27 de mayo',
    inicioLluviasVentana: '17 de mayo – 8 de junio',
    secuenciaSecaMaxDiasP10: 14,
    secuenciaSecaMaxDiasP90: 28,
    ndviPromedioHistorico: 0.62,
    rreErosion: 'medio',
    confianzaDatos: 'alta',
    fVal: 0.94,
  },
  {
    celdaId: 'NASA-CHS-TG-06',
    municipio: 'Depresión Central / Tuxtla – Cintalapa – Ocozocoautla',
    centroideCelda: [-93.1167, 16.7516],
    resolucionKm: 11.0,
    fuenteLluvia: 'NASA GPM IMERG v07 + POWER (2001–2025)',
    lluviaAnualMedianaMm: 990,
    lluviaP10Mm: 760,
    lluviaP90Mm: 1250,
    inicioLluviasMediana: '29 de mayo',
    inicioLluviasVentana: '18 de mayo – 10 de junio',
    secuenciaSecaMaxDiasP10: 15,
    secuenciaSecaMaxDiasP90: 31,
    ndviPromedioHistorico: 0.59,
    rreErosion: 'bajo',
    confianzaDatos: 'media',
    fVal: 0.92,
  },
];

/**
 * Calcula la distancia Haversine en metros entre dos coordenadas [lng, lat]
 */
export function distanciaHaversineMetros(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const R = 6371000; // Radio medio de la Tierra en metros
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Filtra y devuelve la celda de datos de la NASA más cercana al centroide de la parcela del usuario.
 */
export function filtrarDatosNasaPorUbicacion(
  lng: number,
  lat: number
): PerfilAgroclimaticoNasa {
  let mejorCelda = CELDAS_NASA_PRECALCULADAS[0];
  let menorDistancia = Infinity;

  for (const celda of CELDAS_NASA_PRECALCULADAS) {
    const dist = distanciaHaversineMetros([lng, lat], celda.centroideCelda);
    if (dist < menorDistancia) {
      menorDistancia = dist;
      mejorCelda = celda;
    }
  }
  return mejorCelda;
}
