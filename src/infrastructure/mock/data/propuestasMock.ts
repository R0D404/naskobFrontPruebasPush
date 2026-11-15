import { PropuestaCultivo } from '@/domain/models/escenario';

export const DATOS_PROPUESTAS: Record<'A' | 'B' | 'C', PropuestaCultivo> = {
  B: {
    id: 'B',
    cultivo: 'frijol',
    nombre: 'Opción B: Frijol',
    subtitulo: 'Recomendación Principal',
    badge: 'Recomendado',
    tipoBadge: 'recomendado',
    agua: 'Temporal',
    suelo: 'Fija Nitrógeno',
    cosecha: '~110 días',
    porqueEncabezado: '¿Por qué te conviene sembrar Frijol?',
    porque:
      'Sembraste maíz 3 ciclos seguidos y la tierra va perdiendo fuerza. El frijol es una leguminosa que le devuelve nitrógeno natural al suelo, pide menos agua que el maíz y se cosecha rápido (~110 días), permitiéndote aprovechar el temporal sin necesidad de comprar equipo de riego.',
    beneficios: [
      'Recuperas tu tierra: Sus raíces fijan nitrógeno biológico que servirá de abono para la siguiente siembra.',
      'Rompes plagas: Al cambiar de familia botánica (poácea a fabácea), las plagas del maíz se cortan.',
      'Menor gasto de agua: Consume entre 300 y 500 mm (el maíz pide más de 600 mm).',
    ],
    riesgos: [
      'Cuida la floración: Entre los días 35 y 60 necesita humedad para llenar la vaina.',
      'Calor en flor: Días con temperaturas arriba de 31 °C pueden provocar aborto de flor.',
    ],
    trazabilidad: {
      fuentesNasa: 'NASA POWER / IMERG / SRTM',
      serieHistorica: '2001–2025 (25 años completos)',
      resolucion: '30m SRTM / ~11km IMERG',
      fVal: '0.985 (98.5% días válidos)',
      filtroRc5: 'APROBADO (Temporal)',
      versionAlgoritmo: 'v2026.4.1_chiapas',
      idEjecucion: 'EXEC-88902-X',
    },
    scoreAjuste: 92,
    tarjeta5Partes: {
      por_que_se_sugirio:
        'Supera a tu rotación actual en agua (+0.15) y en suelo (+0.30), devolviéndole nitrógeno natural a la tierra tras 3 ciclos continuos de maíz.',
      evidencia: [
        {
          texto: 'Lluvia de mayo a octubre, 2001 a 2025 · IMERG ≈ 11 km',
          fuenteBadge: 'Satelital',
        },
        {
          texto: 'Inicio de lluvias: ~18 de mayo (rango 2 may a 9 jun)',
          fuenteBadge: 'Satelital',
        },
        {
          texto: 'Textura de suelo y siembra de temporal declarada',
          fuenteBadge: 'Declarado',
        },
        {
          texto: 'El frijol aporta fijación biológica de nitrógeno',
          fuenteBadge: 'De literatura',
        },
      ],
      carencias_informacion: [
        'La precipitación proviene de una celda satelital de resolución aproximada de 11 km.',
        'No sustituye un análisis de laboratorio para hongos, nemátodos o bacterias del suelo.',
        'Ficha basada en series agroclimáticas históricas; no predice el clima de la semana entrante.',
      ],
      beneficios_posibles: [
        'Recuperas tu tierra: Las raíces fijan nitrógeno que servirá de abono orgánico para la siguiente siembra.',
        'Rompes plagas: Al rotar de poácea a fabácea, se corta el ciclo biológico de plagas específicas del maíz.',
        'Ahorro de agua: Demanda acumulada de 300–500 mm (el maíz exige más de 600 mm).',
      ],
      riesgos_revision_local: [
        'Sensible a canícula: Entre los días 35 y 60 requiere humedad para un buen llenado de vainas.',
        'Estrés por calor: Temperaturas sostenidas sobre 31 °C en floración pueden inducir aborto floral.',
        'Validación de mercado: Verificar disponibilidad de semilla certificada y precio local en ejido.',
      ],
    },
  },
  A: {
    id: 'A',
    cultivo: 'maiz',
    nombre: 'Opción A: Maíz',
    subtitulo: 'Línea Base',
    badge: 'Seguir igual',
    tipoBadge: 'linea_base',
    agua: 'Temporal',
    suelo: 'Agota nutrientes',
    cosecha: '~125 días',
    porqueEncabezado: '¿Por qué considerar Maíz?',
    porque:
      'Es lo que sembraste en los ciclos anteriores. Ya conoces cómo manejarlo y tienes clientes asegurados, pero sembrar maíz por cuarto ciclo seguido seguirá desgastando el nitrógeno de la tierra y obligándote a gastar más en fertilizantes químicos.',
    beneficios: [
      'Conocimiento previo: Ya sabes exactamente cómo trabajarlo en tu terreno.',
      'Comercialización: Facilidad para vender el grano en el mercado local.',
    ],
    riesgos: [
      'Agotamiento de la tierra: La parcela no descansa y pierde fertilidad natural cada año.',
      'Mayor riesgo de sequía: Su ciclo es más largo (125 días) y pide más agua acumulada.',
    ],
    trazabilidad: {
      fuentesNasa: 'NASA POWER / IMERG / SRTM',
      serieHistorica: '2001–2025 (25 años completos)',
      resolucion: '30m SRTM / ~11km IMERG',
      fVal: '0.985 (98.5% días válidos)',
      filtroRc5: 'APROBADO (Temporal)',
      versionAlgoritmo: 'v2026.4.1_chiapas',
      idEjecucion: 'EXEC-88901-A',
    },
    scoreAjuste: 68,
    tarjeta5Partes: {
      por_que_se_sugirio:
        'Es tu cultivo de referencia y línea base histórica. Mantienes el dominio del manejo técnico y canal de comercialización, pero acumulas desgaste en nitrógeno del suelo (-0.25).',
      evidencia: [
        {
          texto: 'Historial de 3 ciclos consecutivos de maíz en la parcela',
          fuenteBadge: 'Declarado',
        },
        {
          texto: 'Demanda hídrica alta (>600 mm acumulados en temporal)',
          fuenteBadge: 'De literatura',
        },
        {
          texto: 'Frecuencia de canícula de 18 a 22 días entre julio y agosto',
          fuenteBadge: 'Satelital',
        },
        {
          texto: 'Mercado de grano activo con compradores en la región Frailesca',
          fuenteBadge: 'Declarado',
        },
      ],
      carencias_informacion: [
        'No se cuenta con análisis químico de fertilidad N-P-K reciente para estimar la dosis exacta de urea requerida.',
        'La celda satelital de 11 km no detecta microclimas o laderas con sombra de lluvia.',
        'Riesgo de plagas de raíz acumuladas por monocultivo no diagnosticado en campo.',
      ],
      beneficios_posibles: [
        'Dominio del cultivo: Conoces a fondo las labores de siembra, limpia y fertilización de tu terreno.',
        'Comercialización rápida: Mercado fluido y compradores habituales en la zona de Villaflores.',
        'Aprovechamiento forrajero: Puedes usar el rastrojo para alimentar ganado o como acolchado.',
      ],
      riesgos_revision_local: [
        'Agotamiento progresivo del suelo: Cuarto ciclo continuo reduce rendimiento sin altas dosis de fertilizante.',
        'Vulnerabilidad a la canícula: Si la racha seca coincide con floración/espigamiento, la merma es alta.',
        'Mayor costo financiero: Obliga a gastar más en insumos nitrogenados para compensar la tierra.',
      ],
    },
  },
  C: {
    id: 'C',
    cultivo: 'cacahuate',
    nombre: 'Opción C: Cacahuate',
    subtitulo: 'Propuesta Alternativa',
    badge: 'Rotación',
    tipoBadge: 'alternativa',
    agua: 'Temporal',
    suelo: 'Diversifica tierra',
    cosecha: '~130 días',
    porqueEncabezado: '¿Por qué considerar Cacahuate?',
    porque:
      'Es una alternativa para rotar de familia botánica y darle un descanso al maíz. Tolera bien el calor de Chiapas, aunque su ciclo dura 130 días, por lo que debes sembrarlo temprano para que no te agarre el fin de las lluvias.',
    beneficios: [
      'Rotación efectiva: Corta plagas del maíz y diversifica los ingresos familiares.',
      'Tolerancia al calor: Resiste bien temperaturas de hasta 35 °C en temporal.',
    ],
    riesgos: [
      'Ciclo largo: Tarda 130 días a cosecha; si las lluvias cesan temprano puede faltarle agua al final.',
      'Tipo de suelo: En tierra arcillosa pesada puede costar más trabajo desenterrar las vainas.',
    ],
    trazabilidad: {
      fuentesNasa: 'NASA POWER / IMERG / SRTM',
      serieHistorica: '2001–2025 (25 años completos)',
      resolucion: '30m SRTM / ~11km IMERG',
      fVal: '0.985 (98.5% días válidos)',
      filtroRc5: 'APROBADO (Temporal)',
      versionAlgoritmo: 'v2026.4.1_chiapas',
      idEjecucion: 'EXEC-88903-C',
    },
    scoreAjuste: 79,
    tarjeta5Partes: {
      por_que_se_sugirio:
        'Alternativa de rotación con buena tolerancia térmica (+0.10) y diversificación económica, aunque con ciclo más largo (~130 días) que exige sembrar con las primeras lluvias.',
      evidencia: [
        {
          texto: 'Ventana de inicio de lluvias histórica detectada en mayo',
          fuenteBadge: 'Satelital',
        },
        {
          texto: 'Tolerancia fisiológica a temperaturas de hasta 35 °C en temporal',
          fuenteBadge: 'De literatura',
        },
        {
          texto: 'Suelo declarado con textura adecuada para leguminosa subterránea',
          fuenteBadge: 'Declarado',
        },
        {
          texto: 'Corte de ciclo biológico del gusano cogollero del maíz',
          fuenteBadge: 'De literatura',
        },
      ],
      carencias_informacion: [
        'Precipitación histórica basada en cuadrícula satelital de 11 km; verificar drenaje real en la parcela.',
        'No considera fluctuaciones semanales en el precio pagado por intermediarios locales.',
        'Requiere corroborar textura de tierra: en suelos muy arcillosos se dificulta el arrancado mecánico o manual.',
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
};

export const LISTA_ORDENADA_PROPUESTAS: PropuestaCultivo[] = [
  DATOS_PROPUESTAS.B,
  DATOS_PROPUESTAS.A,
  DATOS_PROPUESTAS.C,
];
