export type MetodoDelimitacion = 'caminando' | 'dibujo';

export interface Coordenada {
  lat: number;
  lng: number;
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // GeoJSON usa [lng, lat]
}

export interface Parcela {
  id_parcela: string;
  nombre?: string;
  poligono: GeoJSONPolygon;
  area_ha: number;
  metodo_delimitacion: MetodoDelimitacion;
  region: 'frailesca' | string;
  estado_region: 'preparada' | string;
  fecha_creacion: string;
}

export interface ParcelaInput {
  nombre?: string;
  poligono: GeoJSONPolygon;
  area_ha: number;
  metodo_delimitacion: MetodoDelimitacion;
}

export interface ValidacionRangoParcela {
  esOptimo: boolean;
  mensaje: string;
  tipo: 'ok' | 'warn';
}
