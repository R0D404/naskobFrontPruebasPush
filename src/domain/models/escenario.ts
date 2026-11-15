export type TipoBadgePropuesta = 'recomendado' | 'linea_base' | 'alternativa';

export interface TrazabilidadCifra {
  fuentesNasa: string;
  serieHistorica: string;
  resolucion: string;
  fVal: string;
  filtroRc5: string;
  versionAlgoritmo: string;
  idEjecucion: string;
}

export type FuenteBadgeEvidencia = 'Satelital' | 'Declarado' | 'De literatura';

export interface EvidenciaItem {
  texto: string;
  fuenteBadge: FuenteBadgeEvidencia;
}

export interface Tarjeta5Partes {
  por_que_se_sugirio: string;
  evidencia: EvidenciaItem[];
  carencias_informacion: string[];
  beneficios_posibles: string[]; // Generado / enriquecido por IA
  riesgos_revision_local: string[]; // Generado / enriquecido por IA
}

export interface PropuestaCultivo {
  id: 'A' | 'B' | 'C';
  cultivo: string;
  nombre: string;
  subtitulo: string;
  badge: string;
  tipoBadge: TipoBadgePropuesta;
  agua: string;
  suelo: string;
  cosecha: string;
  porqueEncabezado: string;
  porque: string;
  beneficios: string[];
  riesgos: string[];
  trazabilidad: TrazabilidadCifra;
  tarjeta5Partes: Tarjeta5Partes;
  scoreAjuste?: number;
}

export type SubvistaComparador = 'lista' | 'detalle' | 'auditoria';
