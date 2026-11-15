export const CULTIVOS_CATALOGO = [
  'Maíz',
  'Frijol',
  'Cacahuate',
  'Calabaza',
  'Sandía',
  'Chile habanero',
  'No sé',
  'No hubo siembra',
] as const;

export type CultivoCatalogo = (typeof CULTIVOS_CATALOGO)[number];

export const MENSAJE_SUPUESTO_NO_SE =
  'Supuesto metodológico: Se asume maíz para no dejar vacío el cálculo de extracción de nutrientes.';

/**
 * Determina si un cultivo seleccionado requiere la advertencia metodológica (RN-ESC-02)
 */
export function esCultivoDesconocido(cultivo: string): boolean {
  return cultivo === 'No sé';
}

/**
 * Resuelve el cultivo efectivo para el cálculo agronómico
 */
export function resolverCultivoEfectivo(cultivo: string): string {
  if (cultivo === 'No sé') {
    return 'Maíz';
  }
  return cultivo;
}
