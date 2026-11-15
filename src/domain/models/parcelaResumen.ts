export type EstadoParcela = 'registrada' | 'con_declaracion' | string;

export interface ParcelaResumen {
  id_parcela: string;
  area_ha: number;
  estado: EstadoParcela;
  nombre?: string;
  fecha_guardado?: string;
  recomendacion_principal?: string;
  origen?: 'local' | 'nube';
}
