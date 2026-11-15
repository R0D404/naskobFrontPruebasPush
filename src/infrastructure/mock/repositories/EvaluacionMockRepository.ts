import { Evaluacion, EscenarioResultado, EscenarioDescartado } from '@/domain/models/evaluacion';
import { DeclaracionCompleta } from '@/domain/models/declaracion';
import { EvaluacionRepository } from '@/domain/ports/EvaluacionRepository';

export class EvaluacionMockRepository implements EvaluacionRepository {
  async ejecutarEvaluacion(idParcela: string, declaracion: DeclaracionCompleta): Promise<Evaluacion> {
    // Simulación realista de latencia de red / cálculo satelital NASA (150ms)
    await new Promise((resolve) => setTimeout(resolve, 150));

    const esTemporal = declaracion.manejo.riego_veces_semana === 0;
    const tipoTierraStr =
      declaracion.tipo_tierra === 'negra'
        ? 'tierra negra fértil'
        : declaracion.tipo_tierra === 'arcillosa'
        ? 'tierra arcillosa pesada'
        : 'tierra arenosa';

    const cultivosPrevios = declaracion.rotacion_existente.map((c) => c.cultivo.toLowerCase());
    const monoMaiz = cultivosPrevios.every((c) => c.includes('maíz') || c.includes('maiz'));
    const textoHistorial = monoMaiz
      ? '3 ciclos continuos de maíz'
      : `${declaracion.rotacion_existente.length} temporadas registradas`;

    // Pesos según prioridad del productor
    const pesosMap: Record<string, Record<string, number>> = {
      agua: { agua: 0.5, riesgo: 0.25, suelo: 0.25 },
      riesgo: { agua: 0.25, riesgo: 0.5, suelo: 0.25 },
      suelo: { agua: 0.25, riesgo: 0.25, suelo: 0.5 },
      igual: { agua: 0.333, riesgo: 0.333, suelo: 0.334 },
    };
    const pesosUsados = pesosMap[declaracion.manejo.prioridad_principal] || pesosMap.igual;

    // Regla de Descarte RC5: En temporal estricto (0 riegos), se descartan cultivos demandantes
    const escenariosDescartados: EscenarioDescartado[] = esTemporal
      ? [
          {
            codigo_escenario: 'D',
            nombre: 'Sandía Comercial',
            motivo:
              'Descartada por regla RC5: Requiere riego tecnificado continuo (3 a 5 veces/semana) y tu parcela está declarada en régimen de temporal estricto.',
          },
          {
            codigo_escenario: 'E',
            nombre: 'Chile Habanero',
            motivo:
              'Descartado por regla RC5: No tolera sequías intempestivas en floración sin auxilio de riego por goteo.',
          },
        ]
      : [];

    // Puntajes calculados dinámicamente según prioridad
    let scoreFrijol = 92;
    let scoreMaiz = 68;
    let scoreCacahuate = 79;

    if (declaracion.manejo.prioridad_principal === 'suelo') {
      scoreFrijol = 96;
      scoreMaiz = 58;
      scoreCacahuate = 82;
    } else if (declaracion.manejo.prioridad_principal === 'agua') {
      scoreFrijol = 94;
      scoreMaiz = 62;
      scoreCacahuate = 75;
    } else if (declaracion.manejo.prioridad_principal === 'riesgo') {
      scoreFrijol = 89;
      scoreMaiz = 66;
      scoreCacahuate = 84;
    }

    const ejecucionId = `EXEC-${Math.floor(10000 + Math.random() * 90000)}`;

    const escenarios: EscenarioResultado[] = [
      {
        codigo_escenario: 'B',
        orden_visual: 1,
        nombre: 'Opción B: Frijol',
        subtitulo: 'Recomendación Principal',
        badge: 'Recomendado',
        tipo_badge: 'recomendado',
        es_linea_base: false,
        secuencia_cultivos: [...declaracion.rotacion_existente.map((c) => c.cultivo), 'Frijol'],
        confianza: 'alta',
        puntaje_valor: scoreFrijol,
        puntaje_p10: 84,
        puntaje_p90: 97,
        robustez: 'consistente',
        etiqueta_agua: esTemporal ? 'Temporal' : 'Riego aux.',
        etiqueta_suelo: 'Fija Nitrógeno',
        duracion_ciclo_dias: '~110 días',
        resumen: `Ideal tras ${textoHistorial}: le devuelve nutrientes a tu ${tipoTierraStr} y aprovecha las lluvias sin requerir equipo de riego.`,
        criterios_detalle: {
          agua: 0.9,
          suelo: 0.95,
          riesgo: 0.88,
        },
        delta_vs_a: {
          agua: 0.15,
          suelo: 0.3,
          riesgo: 0.12,
        },
        trazabilidad: {
          fuentesNasa: 'NASA POWER / IMERG / SRTM',
          serieHistorica: '2001–2025 (25 años completos)',
          resolucion: '30m SRTM / ~11km IMERG',
          fVal: '0.985 (98.5% días válidos)',
          filtroRc5: esTemporal ? 'APROBADO (Temporal estricto)' : 'APROBADO (Riego auxiliar)',
          versionAlgoritmo: 'v2026.4.1_chiapas',
          idEjecucion: `${ejecucionId}-B`,
        },
        tarjeta_5_partes: {
          por_que_se_sugirio: `Supera a tu rotación actual en agua (+0.15) y en suelo (+0.30), devolviéndole nitrógeno biológico a tu ${tipoTierraStr} tras ${textoHistorial}.`,
          evidencia_agroclimatica: [
            'Lluvia de mayo a octubre, 2001 a 2025 · IMERG ≈ 11 km [Satelital]',
            'Inicio de lluvias: ~18 de mayo (rango 2 may a 9 jun) [Satelital]',
            `Textura de ${tipoTierraStr} y manejo de temporal declarados [Declarado]`,
            'El frijol aporta fijación biológica de nitrógeno asimilable [De literatura]',
          ],
          carencias_informacion: [
            'La precipitación proviene de una celda satelital de resolución aproximada de 11 km.',
            'No sustituye un análisis de laboratorio para hongos, nemátodos o bacterias del suelo.',
            'Ficha basada en series agroclimáticas históricas; no predice el clima de la semana entrante.',
          ],
          beneficios_posibles: [
            'Recuperas tu tierra: Las raíces fijan nitrógeno orgánico que servirá de abono para la siguiente siembra.',
            'Rompes plagas: Al rotar de poácea a fabácea, se corta el ciclo biológico del gusano cogollero del maíz.',
            'Ahorro de agua: Demanda hídrica de 300–500 mm (el maíz exige más de 600 mm).',
          ],
          riesgos_revision_local: [
            'Sensible a canícula: Entre los días 35 y 60 requiere humedad para un buen llenado de vainas.',
            'Estrés por calor: Temperaturas sostenidas sobre 31 °C en floración pueden inducir aborto floral.',
            'Validación de mercado: Verificar disponibilidad de semilla certificada y precio local en ejido.',
          ],
        },
      },
      {
        codigo_escenario: 'A',
        orden_visual: 2,
        nombre: 'Opción A: Maíz',
        subtitulo: 'Línea Base',
        badge: 'Seguir igual',
        tipo_badge: 'linea_base',
        es_linea_base: true,
        secuencia_cultivos: [...declaracion.rotacion_existente.map((c) => c.cultivo), 'Maíz'],
        confianza: 'alta',
        puntaje_valor: scoreMaiz,
        puntaje_p10: 55,
        puntaje_p90: 75,
        robustez: 'sensible',
        etiqueta_agua: esTemporal ? 'Temporal' : 'Riego aux.',
        etiqueta_suelo: 'Agota nutrientes',
        duracion_ciclo_dias: '~125 días',
        resumen: `Lo que vienes sembrando. Conoces el cultivo y el mercado, pero continuar con maíz desgastará más la fertilidad de tu ${tipoTierraStr}.`,
        criterios_detalle: {
          agua: 0.72,
          suelo: 0.61,
          riesgo: 0.71,
        },
        trazabilidad: {
          fuentesNasa: 'NASA POWER / IMERG / SRTM',
          serieHistorica: '2001–2025 (25 años completos)',
          resolucion: '30m SRTM / ~11km IMERG',
          fVal: '0.985 (98.5% días válidos)',
          filtroRc5: esTemporal ? 'APROBADO (Temporal estricto)' : 'APROBADO (Riego auxiliar)',
          versionAlgoritmo: 'v2026.4.1_chiapas',
          idEjecucion: `${ejecucionId}-A`,
        },
        tarjeta_5_partes: {
          por_que_se_sugirio:
            'Es tu cultivo de referencia y línea base histórica. Mantienes el dominio del manejo técnico y canal de comercialización, pero acumulas desgaste en nitrógeno del suelo (-0.25).',
          evidencia_agroclimatica: [
            `Historial de ${textoHistorial} registrado en tu parcela [Declarado]`,
            'Demanda hídrica alta (>600 mm acumulados en temporal) [De literatura]',
            'Frecuencia de canícula de 18 a 22 días entre julio y agosto [Satelital]',
            'Mercado de grano activo con compradores consolidados en la Frailesca [Declarado]',
          ],
          carencias_informacion: [
            'No se cuenta con análisis químico de fertilidad N-P-K reciente para estimar la dosis exacta de fertilizante químico requerido.',
            'La celda satelital de 11 km no detecta microclimas o laderas con sombra de lluvia en tu terreno.',
            'Riesgo de plagas de raíz acumuladas por monocultivo no diagnosticado en campo.',
          ],
          beneficios_posibles: [
            'Dominio del cultivo: Conoces a fondo las labores de siembra, limpia y fertilización de tu terreno.',
            'Comercialización rápida: Mercado fluido y compradores habituales en la zona de Villaflores.',
            'Aprovechamiento forrajero: Puedes usar el rastrojo para alimentar ganado o como acolchado.',
          ],
          riesgos_revision_local: [
            `Agotamiento de suelo: Sembrar maíz por otra temporada en ${tipoTierraStr} reduce el rendimiento sin dosis mayores de abono.`,
            'Vulnerabilidad a la canícula: Si la racha seca coincide con floración/espigamiento, la merma de grano es alta.',
            'Mayor costo financiero: Obliga a gastar más en insumos nitrogenados para compensar la tierra.',
          ],
        },
      },
      {
        codigo_escenario: 'C',
        orden_visual: 3,
        nombre: 'Opción C: Cacahuate',
        subtitulo: 'Propuesta Alternativa',
        badge: 'Rotación',
        tipo_badge: 'alternativa',
        es_linea_base: false,
        secuencia_cultivos: [...declaracion.rotacion_existente.map((c) => c.cultivo), 'Cacahuate'],
        confianza: 'media',
        puntaje_valor: scoreCacahuate,
        puntaje_p10: 68,
        puntaje_p90: 88,
        robustez: 'consistente',
        etiqueta_agua: esTemporal ? 'Temporal' : 'Riego aux.',
        etiqueta_suelo: 'Diversifica tierra',
        duracion_ciclo_dias: '~130 días',
        resumen: `Buena opción para cortar plagas y descansar del maíz en ${tipoTierraStr}, aunque requiere sembrarse temprano por su ciclo de 130 días.`,
        criterios_detalle: {
          agua: 0.8,
          suelo: 0.83,
          riesgo: 0.78,
        },
        delta_vs_a: {
          agua: 0.08,
          suelo: 0.22,
          riesgo: 0.07,
        },
        trazabilidad: {
          fuentesNasa: 'NASA POWER / IMERG / SRTM',
          serieHistorica: '2001–2025 (25 años completos)',
          resolucion: '30m SRTM / ~11km IMERG',
          fVal: '0.985 (98.5% días válidos)',
          filtroRc5: esTemporal ? 'APROBADO (Temporal estricto)' : 'APROBADO (Riego auxiliar)',
          versionAlgoritmo: 'v2026.4.1_chiapas',
          idEjecucion: `${ejecucionId}-C`,
        },
        tarjeta_5_partes: {
          por_que_se_sugirio:
            'Alternativa de rotación con buena tolerancia térmica (+0.10) y diversificación económica, aunque con ciclo más largo (~130 días) que exige sembrar con las primeras lluvias.',
          evidencia_agroclimatica: [
            'Ventana de inicio de lluvias histórica detectada en mayo [Satelital]',
            'Tolerancia fisiológica a temperaturas de hasta 35 °C en temporal [De literatura]',
            `Suelo declarado con textura de ${tipoTierraStr} compatible con leguminosa [Declarado]`,
            'Corte del ciclo biológico del gusano cogollero del maíz [De literatura]',
          ],
          carencias_informacion: [
            'Precipitación histórica basada en cuadrícula satelital de 11 km; verificar drenaje real en la parcela.',
            'No considera fluctuaciones semanales en el precio pagado por intermediarios locales.',
            'Requiere corroborar textura de tierra: en suelos muy compactados se dificulta el arrancado mecánico o manual.',
          ],
          beneficios_posibles: [
            'Diversificación de ingresos: Precio por tonelada usualmente superior al maíz comercial.',
            'Salud del suelo: Aporte de materia orgánica y corte efectivo del ciclo de plagas del maíz.',
            'Cobertura vegetal: Su follaje rastrero reduce la evaporación directa y protege la humedad del suelo.',
          ],
          riesgos_revision_local: [
            'Ciclo largo (~130 días): Si el temporal se retira temprano en octubre, puede faltar humedad de llenado.',
            'Cosecha laboriosa en barro: En suelos arcillosos pesados o compactados se complica sacar las vainas.',
            'Canal de comercialización: Conviene asegurar compradores o cooperativas locales antes de sembrar.',
          ],
        },
      },
    ];

    return {
      id_evaluacion: `eval_${Date.now()}`,
      id_parcela: idParcela,
      id_declaracion: `decl_${Date.now()}`,
      generado_utc: new Date().toISOString(),
      vigencia_hasta: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      pesos_usados: pesosUsados,
      escenarios,
      escenarios_descartados: escenariosDescartados,
    };
  }
}
