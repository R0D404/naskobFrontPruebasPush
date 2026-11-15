import { Evaluacion, EscenarioResultado, EscenarioDescartado } from '@/domain/models/evaluacion';
import { DeclaracionCompleta } from '@/domain/models/declaracion';

const rawBase = (import.meta.env.VITE_API_BASE_URL || '/v1').trim().replace(/\/$/, '');
const BASE_URL = rawBase.endsWith('/v1') ? rawBase : `${rawBase}/v1`;
const PWA_API_KEY = (import.meta.env.VITE_PWA_API_KEY || 'aSqiDA7E0XyW8TSTVxvYaCo7OxvHbPR1qfEe9Qp4e2I').trim();

function normalizarNombreCultivo(c: string): string {
  const norm = (c || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (norm.includes('maiz')) return 'maiz';
  if (norm.includes('frijol')) return 'frijol';
  if (norm.includes('cacahuate')) return 'cacahuate';
  if (norm.includes('calabaza')) return 'calabaza';
  if (norm.includes('sandia')) return 'sandia';
  if (norm.includes('habanero')) return 'habanero';
  return norm || 'maiz';
}

function construirPayloadDeclaracion(declaracion: DeclaracionCompleta) {
  return {
    rotacion_existente: (declaracion.rotacion_existente || []).map((r) => ({
      ciclo: r.ciclo,
      cultivo: normalizarNombreCultivo(r.cultivo),
    })),
    tipo_tierra: declaracion.tipo_tierra || 'negra',
    riego_veces_semana: Number(declaracion.manejo?.riego_veces_semana ?? 0),
    agrego_productos: Boolean(declaracion.manejo?.agrego_productos),
    considerar_riesgo: Boolean(declaracion.manejo?.considerar_riesgo ?? true),
    prioridad_principal: declaracion.manejo?.prioridad_principal || 'igual',
    region: 'frailesca',
  };
}

function mapearRespuestaEvaluacion(data: any, idParcelaFallback: string): Evaluacion {
  const escenariosRaw = data.escenarios || [];

  // Determinar cuál es el escenario recomendado (sólo 1):
  // 1. Si el backend envió explícitamente tipo_badge === 'recomendado' o badge === 'Recomendado'
  // 2. Si no, aquel que tenga código 'B' (convención usual en rotaciones)
  // 3. Si no, el primer escenario alternativo (no línea base) con mejor puntaje
  let codigoRecomendado = '';
  const explicitRec = escenariosRaw.find(
    (e: any) => !e.es_linea_base && (e.tipo_badge === 'recomendado' || e.badge === 'Recomendado')
  );
  if (explicitRec) {
    codigoRecomendado = (explicitRec.codigo_escenario || explicitRec.codigo || '').toUpperCase();
  } else {
    const fallbackB = escenariosRaw.find(
      (e: any) => !e.es_linea_base && (e.codigo_escenario || e.codigo || '').toUpperCase() === 'B'
    );
    if (fallbackB) {
      codigoRecomendado = 'B';
    } else {
      const alternativos = escenariosRaw.filter((e: any) => !e.es_linea_base);
      if (alternativos.length > 0) {
        const mejor = [...alternativos].sort((a: any, b: any) => {
          const ptA = a.puntaje_mediana ?? a.puntaje_valor ?? 0;
          const ptB = b.puntaje_mediana ?? b.puntaje_valor ?? 0;
          return ptB - ptA;
        })[0];
        codigoRecomendado = (mejor.codigo_escenario || mejor.codigo || '').toUpperCase();
      }
    }
  }

  const escenariosMapeados: EscenarioResultado[] = escenariosRaw.map((esc: any) => {
    const puntajeBruto = esc.puntaje_mediana ?? esc.puntaje_valor ?? 0;
    const puntaje100 = puntajeBruto <= 1.0 ? Math.round(puntajeBruto * 100) : Math.round(puntajeBruto);

    const esLineaBase = Boolean(esc.es_linea_base);
    const codigo = (esc.codigo_escenario || esc.codigo || 'A').toUpperCase();
    const esRecomendado = !esLineaBase && codigo === codigoRecomendado;

    // Se remueve el subtítulo genérico de rotación ('Opción agroecológica...') a petición de diseño
    const subtitulo = esLineaBase
      ? 'Lo que vienes sembrando. Conoces el cultivo y el mercado.'
      : '';

    const badge = esLineaBase ? 'Línea Base' : esRecomendado ? 'Recomendado' : 'Rotación';
    const tipoBadge = esLineaBase ? 'linea_base' : esRecomendado ? 'recomendado' : 'alternativa';

    const tarjeta5 = esc.tarjeta_5_partes || {
      por_que_se_sugirio: 'Evaluación agroclimática multicriterio sobre la serie histórica NASA 2001-2025.',
      evidencia_agroclimatica: 'Serie satelital NASA IMERG y POWER de precipitaciones y temperaturas.',
      beneficios_posibles: 'Diversificación productiva y resiliencia ante sequías.',
      carencias_informacion: 'Información local sujeta a calibración de manejo.',
      riesgos_revision_local: 'Monitorear humedad residual al inicio del temporal.',
    };

    return {
      codigo_escenario: codigo as any,
      orden_visual: esLineaBase ? 1 : esRecomendado ? 2 : esc.orden_visual ?? 3,
      nombre: esc.nombre || `Opción ${codigo}: ${esc.cultivo || 'Cultivo'}`,
      es_linea_base: esLineaBase,
      secuencia_cultivos: esc.secuencia_cultivos || [],
      confianza: esc.confianza || 'alta',
      puntaje_valor: puntaje100,
      puntaje_p10: esc.puntaje_p10,
      puntaje_p90: esc.puntaje_p90,
      robustez: esc.robustez,
      criterios_detalle: esc.criterios_detalle || {},
      delta_vs_a: esc.delta_vs_a || null,
      tarjeta_5_partes: tarjeta5,
      subtitulo,
      badge,
      tipo_badge: tipoBadge,
      resumen: typeof tarjeta5.por_que_se_sugirio === 'string' ? tarjeta5.por_que_se_sugirio : '',
      etiqueta_suelo: `Suelo: ${Math.round((esc.criterios_detalle?.c_suelo ?? 0.5) * 100)}%`,
      etiqueta_agua: `Agua: ${Math.round((esc.criterios_detalle?.c_agua ?? 0.5) * 100)}%`,
      duracion_ciclo_dias: `${esc.cultivo === 'sandia' ? '80' : esc.cultivo === 'calabaza' ? '100' : '110'} días`,
    };
  });

  const descartadosMapeados: EscenarioDescartado[] = (data.escenarios_descartados || data.descartes_rc5 || []).map(
    (desc: any) => ({
      codigo_escenario: desc.codigo_escenario || desc.id || 'RC5',
      nombre: desc.nombre || 'Cultivo Excluido',
      motivo: desc.motivo || desc.texto || 'Descartado por requerimiento de riego tecnificado (Regla RC5).',
    })
  );

  // Ordenamiento de cards:
  // 1° Posición: Continuidad (Línea Base)
  // 2° Posición: Recomendada (debajo de continuidad)
  // 3°+ Posición: Resto de alternativas de rotación
  const escenariosOrdenados = [...escenariosMapeados].sort((a, b) => {
    if (a.es_linea_base && !b.es_linea_base) return -1;
    if (!a.es_linea_base && b.es_linea_base) return 1;
    if (a.es_linea_base && b.es_linea_base) return 0;

    const aEsRecomendado = a.tipo_badge === 'recomendado' || a.badge === 'Recomendado';
    const bEsRecomendado = b.tipo_badge === 'recomendado' || b.badge === 'Recomendado';

    if (aEsRecomendado && !bEsRecomendado) return -1;
    if (!aEsRecomendado && bEsRecomendado) return 1;

    return 0;
  });

  return {
    id_evaluacion: data.id_evaluacion || `eval_${Date.now()}`,
    id_parcela: data.id_parcela || idParcelaFallback,
    id_declaracion: data.id_declaracion || 'decl_1',
    generado_utc: data.generado_utc || new Date().toISOString(),
    vigencia_hasta: data.vigencia_hasta || new Date(Date.now() + 30 * 86400000).toISOString(),
    pesos_usados: data.pesos_usados || { c_agua: 0.25, c_riesgo: 0.25, c_suelo: 0.25, c_apt: 0.25 },
    escenarios: escenariosOrdenados,
    escenarios_descartados: descartadosMapeados,
  };
}

export class ApiEvaluacionAdapter {
  private getHeaders(token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': PWA_API_KEY,
    };
    if (token && !token.startsWith('demo_')) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * POST /v1/evaluaciones/simular
   * Simulación Directa: Evalúa en memoria una rotación y prioridades sin necesidad de guardar la parcela previamente en BD.
   * Utilizado en Modo Demostración / Productor Invitado.
   */
  async simularEvaluacion(declaracion: DeclaracionCompleta, token?: string): Promise<Evaluacion> {
    const url = `${BASE_URL}/evaluaciones/simular`;
    const payload = {
      declaracion_directa: construirPayloadDeclaracion(declaracion),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('NO_AUTORIZADO');
      }
      throw new Error('ERROR_AL_SIMULAR_EVALUACION');
    }

    const data = await response.json();
    return mapearRespuestaEvaluacion(data, declaracion.id_parcela || 'parcela_simulada');
  }

  /**
   * POST /v1/parcelas/{id_parcela}/evaluaciones
   * Evaluar Ciclo 4: Ejecuta el motor multicriterio sobre los 25 años NASA (IMERG/POWER), Monte Carlo y genera escenarios.
   * Utilizado para usuarios logueados con parcela previamente registrada.
   */
  async evaluarParcela(
    idParcela: string,
    declaracion: DeclaracionCompleta,
    token?: string
  ): Promise<Evaluacion> {
    const url = `${BASE_URL}/parcelas/${idParcela}/evaluaciones`;
    const payload = {
      version_declaracion: 1,
      modo_evaluacion: 'equilibrado',
      declaracion_directa: construirPayloadDeclaracion(declaracion),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok) {
      // Fallback a simular si la parcela aún no está persistida en BD
      if (response.status === 404) {
        return await this.simularEvaluacion(declaracion, token);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('NO_AUTORIZADO');
      }
      throw new Error('ERROR_AL_EVALUAR_PARCELA');
    }

    const data = await response.json();
    return mapearRespuestaEvaluacion(data, idParcela);
  }

  /**
   * GET /v1/evaluaciones/{id_evaluacion}
   * Lista de Propuestas: Devuelve los escenarios (Línea Base A, B, C) con sus puntajes y robustez.
   */
  async obtenerEvaluacion(idEvaluacion: string, token?: string): Promise<Evaluacion> {
    const url = `${BASE_URL}/evaluaciones/${idEvaluacion}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(token),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok) {
      throw new Error('ERROR_AL_OBTENER_EVALUACION');
    }

    const data = await response.json();
    return mapearRespuestaEvaluacion(data, data.id_parcela || '');
  }

  /**
   * GET /v1/evaluaciones/{id_evaluacion}/escenarios/{id_escenario}
   * Detalle del Cultivo: Tarjeta completa con la justificación del porqué, beneficios, cuidados y evidencia.
   */
  async obtenerDetalleEscenario(idEvaluacion: string, idEscenario: string, token?: string) {
    const url = `${BASE_URL}/evaluaciones/${idEvaluacion}/escenarios/${idEscenario}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(token),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok) {
      throw new Error('ERROR_AL_OBTENER_DETALLE_ESCENARIO');
    }

    return await response.json();
  }

  /**
   * GET /v1/evaluaciones/{id_evaluacion}/cifras/{id_cifra}
   * Trazabilidad de Cifra (Auditoría): Desglose del valor calculado (c_agua, c_suelo, etc.), satélite NASA usado, resolución y regla.
   */
  async obtenerCifraTrazabilidad(idEvaluacion: string, idCifra: string, token?: string) {
    const url = `${BASE_URL}/evaluaciones/${idEvaluacion}/cifras/${idCifra}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(token),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok) {
      throw new Error('ERROR_AL_OBTENER_CIFRA_TRAZABILIDAD');
    }

    return await response.json();
  }

  /**
   * POST /v1/evaluaciones/{id_evaluacion}/sensibilidad
   * Estrés Histórico: Reevalúa la propuesta bajo escenarios de estrés (mas_seco, mas_calido, secuencia_seca_adicional).
   */
  async evaluarSensibilidad(
    idEvaluacion: string,
    parametros: { tipo_estres: 'mas_seco' | 'mas_calido' | 'secuencia_seca_adicional' },
    token?: string
  ) {
    const url = `${BASE_URL}/evaluaciones/${idEvaluacion}/sensibilidad`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify(parametros),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok) {
      throw new Error('ERROR_AL_EVALUAR_SENSIBILIDAD');
    }

    return await response.json();
  }

  /**
   * GET /v1/evaluaciones/{id_evaluacion}/textos
   * Textos de IA: Textos explicativos generados por Gemini con filtros anti-prescripción.
   */
  async obtenerTextosIA(idEvaluacion: string, token?: string) {
    const url = `${BASE_URL}/evaluaciones/${idEvaluacion}/textos`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(token),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok) {
      throw new Error('ERROR_AL_OBTENER_TEXTOS_IA');
    }

    return await response.json();
  }

  /**
   * POST /v1/evaluaciones/{id_evaluacion}/exportaciones
   * Exportar: Genera reporte de la evaluación en formato json, csv o pdf.
   */
  async exportarEvaluacion(idEvaluacion: string, formato: 'json' | 'csv' | 'pdf', token?: string) {
    const url = `${BASE_URL}/evaluaciones/${idEvaluacion}/exportaciones`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({ formato }),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok) {
      throw new Error('ERROR_AL_EXPORTAR_EVALUACION');
    }

    return await response.blob();
  }
}

export const apiEvaluacionAdapter = new ApiEvaluacionAdapter();
