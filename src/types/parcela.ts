export type ModoVistaMapa = 'satelital' | 'vectorial';
export type ModoCaptura = 'poligono' | 'caminando';

export interface CoordenadaWGS84 {
  lng: number;
  lat: number;
  precisionMetros?: number;
  timestamp?: number;
}

export interface UbicacionFiltroNasa {
  latitud: number;
  longitud: number;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  celdaNasaId: string;
  municipioReferencia: string;
}

export interface PerfilAgroclimaticoNasa {
  celdaId: string;
  municipio: string;
  centroideCelda: [number, number]; // [lng, lat]
  resolucionKm: number;
  fuenteLluvia: string;
  lluviaAnualMedianaMm: number;
  lluviaP10Mm: number;
  lluviaP90Mm: number;
  inicioLluviasMediana: string;
  inicioLluviasVentana: string;
  secuenciaSecaMaxDiasP10: number;
  secuenciaSecaMaxDiasP90: number;
  ndviPromedioHistorico: number;
  rreErosion: 'bajo' | 'medio' | 'alto';
  confianzaDatos: 'alta' | 'media' | 'baja';
  fVal: number;
}

export interface ResultadoParcelaConfirmada {
  modoCaptura: ModoCaptura;
  modoMapaUsado: ModoVistaMapa;
  verticesWGS84: [number, number][]; // Siempre [lng, lat] en EPSG:4326
  geometriaGeoJSON: {
    type: 'Feature';
    geometry: {
      type: 'Polygon';
      coordinates: [number, number][][];
    };
    properties: {
      area_ha: number;
      perimetro_m: number;
      modo_captura: ModoCaptura;
      generado_utc: string;
    };
  };
  areaHectareas: number;
  areaMetrosCuadrados: number;
  perimetroMetros: number;
  enRangoOptimo: boolean; // 1.00 a 10.00 ha (RF01)
  estadoRegion: 'preparada' | 'no_preparada'; // Dentro de La Frailesca
  ubicacionFiltroNasa: UbicacionFiltroNasa;
  perfilNasaAsociado: PerfilAgroclimaticoNasa;
  precisionGpsPromedioMetros: number | null;
}
