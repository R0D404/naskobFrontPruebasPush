export type PrioridadPrincipal = 'agua' | 'riesgo' | 'suelo' | 'igual';

export type TipoTierra = 'negra' | 'arcillosa' | 'arenosa';

export interface ManejoPrioridades {
  riego_veces_semana: number; // 0 a 7
  considerar_riesgo: boolean;
  agrego_productos: boolean;
  prioridad_principal: PrioridadPrincipal;
}

export interface CicloRotacion {
  ciclo: number;
  etiqueta: string;
  cultivo: string;
}

export interface DeclaracionCompleta {
  id_parcela?: string;
  rotacion_existente: Array<CicloRotacion>;
  tipo_tierra: TipoTierra;
  manejo: ManejoPrioridades;
}

export const ROTACION_PREDETERMINADA_3_CICLOS: CicloRotacion[] = [
  { ciclo: 1, etiqueta: 'Hace 3 temporadas', cultivo: 'Maíz' },
  { ciclo: 2, etiqueta: 'Hace 2 temporadas', cultivo: 'Frijol' },
  { ciclo: 3, etiqueta: 'La última temporada', cultivo: 'Maíz' },
];

export const MANEJO_PREDETERMINADO: ManejoPrioridades = {
  riego_veces_semana: 0,
  considerar_riesgo: true,
  agrego_productos: false,
  prioridad_principal: 'igual',
};
