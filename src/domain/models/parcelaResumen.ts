export type EstadoParcela = 'registrada' | 'con_declaracion' | string;

export interface ParcelaResumen {
  id_parcela: string;
  area_ha: number;
  estado: EstadoParcela;
}
