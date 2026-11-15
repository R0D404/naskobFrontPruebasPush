import { ManejoPrioridades, PrioridadPrincipal } from '../models/declaracion';

export interface ResultadoValidacionManejo {
  valido: boolean;
  error?: string;
  esTemporalEstricto: boolean;
  advertenciaTemporal?: string;
}

export const MENSAJE_TEMPORAL_ESTRICTO =
  '0 veces = siembra 100% de temporal (sin pozo ni río). Los cultivos con alto requerimiento hídrico se descartarán para evitar pérdidas.';

/**
 * Determina si el esquema de manejo corresponde a temporal estricto (0 riegos semanales)
 */
export function esTemporalEstricto(riegoVecesSemana: number): boolean {
  return riegoVecesSemana === 0;
}

/**
 * Valida la consistencia de las opciones de manejo y prioridades seleccionadas por el productor.
 * Si riego_veces_semana === 0, marca que la parcela es de temporal estricto (regla RC5).
 */
export function validarManejo(manejo: ManejoPrioridades): ResultadoValidacionManejo {
  // Validación de rango de riego semanal (0 a 7)
  if (
    typeof manejo.riego_veces_semana !== 'number' ||
    isNaN(manejo.riego_veces_semana) ||
    manejo.riego_veces_semana < 0 ||
    manejo.riego_veces_semana > 7 ||
    !Number.isInteger(manejo.riego_veces_semana)
  ) {
    return {
      valido: false,
      error: 'El número de riegos por semana debe ser un número entero entre 0 y 7.',
      esTemporalEstricto: false,
    };
  }

  // Validación de prioridad permitida
  const prioridadesValidas: PrioridadPrincipal[] = ['agua', 'riesgo', 'suelo', 'igual'];
  if (!prioridadesValidas.includes(manejo.prioridad_principal)) {
    return {
      valido: false,
      error: 'La prioridad principal seleccionada no es válida.',
      esTemporalEstricto: esTemporalEstricto(manejo.riego_veces_semana),
    };
  }

  // Inconsistencia lógica: no se puede priorizar riesgo climático si no se evalúa el riesgo
  if (!manejo.considerar_riesgo && manejo.prioridad_principal === 'riesgo') {
    return {
      valido: false,
      error: 'No es posible seleccionar la prioridad de riesgo si se ha desactivado la evaluación de riesgo climático.',
      esTemporalEstricto: esTemporalEstricto(manejo.riego_veces_semana),
    };
  }

  const esTemporal = esTemporalEstricto(manejo.riego_veces_semana);

  return {
    valido: true,
    esTemporalEstricto: esTemporal,
    advertenciaTemporal: esTemporal ? MENSAJE_TEMPORAL_ESTRICTO : undefined,
  };
}

/**
 * Ajusta coherentemente la prioridad principal si el usuario desactiva la evaluación de riesgo.
 */
export function ajustarManejoAlCambiarRiesgo(
  manejo: ManejoPrioridades,
  nuevoConsiderarRiesgo: boolean
): ManejoPrioridades {
  if (!nuevoConsiderarRiesgo && manejo.prioridad_principal === 'riesgo') {
    return {
      ...manejo,
      considerar_riesgo: false,
      prioridad_principal: 'igual',
    };
  }

  return {
    ...manejo,
    considerar_riesgo: nuevoConsiderarRiesgo,
  };
}
