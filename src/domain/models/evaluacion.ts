export interface Tarjeta5Partes {
  por_que_se_sugirio: string;
  evidencia_agroclimatica: string | string[];
  carencias_informacion: string | string[];
  beneficios_posibles: string | string[]; // Provisto por motor / IA
  riesgos_revision_local: string | string[]; // Provisto por motor / IA
}

export interface TrazabilidadCifra {
  fuentesNasa: string;
  serieHistorica: string;
  resolucion: string;
  fVal: string;
  filtroRc5: string;
  versionAlgoritmo: string;
  idEjecucion: string;
}

export interface EscenarioResultado {
  codigo_escenario: 'A' | 'B' | 'C' | 'D' | 'E';
  orden_visual: number;
  nombre: string;
  es_linea_base: boolean;
  descartado?: boolean;
  motivo_descarte?: string;
  secuencia_cultivos: string[];
  confianza: 'alta' | 'media' | 'baja' | 'insuficiente';
  puntaje_valor?: number;
  puntaje_p10?: number;
  puntaje_p90?: number;
  robustez?: 'consistente' | 'sensible' | 'baja_consistencia';
  criterios_detalle: Record<string, number>;
  delta_vs_a?: Record<string, number>;
  tarjeta_5_partes: Tarjeta5Partes;
  // Metadatos de apoyo para renderizado dinámico en UI
  subtitulo?: string;
  badge?: string;
  tipo_badge?: 'recomendado' | 'linea_base' | 'alternativa';
  resumen?: string;
  etiqueta_suelo?: string;
  etiqueta_agua?: string;
  duracion_ciclo_dias?: string;
  trazabilidad?: TrazabilidadCifra;
}

export interface EscenarioDescartado {
  codigo_escenario: string;
  nombre: string;
  motivo: string;
}

export interface Evaluacion {
  id_evaluacion: string;
  id_parcela: string;
  id_declaracion: string;
  generado_utc: string;
  vigencia_hasta: string;
  pesos_usados: Record<string, number>;
  escenarios: EscenarioResultado[];
  escenarios_descartados: EscenarioDescartado[];
}
