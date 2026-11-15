import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Download,
  AlertTriangle,
  Info,
  Satellite,
  Loader2,
  Save,
  Check,
  Bookmark,
} from 'lucide-react';
import { DeclaracionCompleta } from '@/domain/models/declaracion';
import { Parcela } from '@/domain/models/parcela';
import {
  Evaluacion,
  EscenarioResultado,
} from '@/domain/models/evaluacion';
import { evaluacionService } from '@/compositionRoot';
import { ExportarReporteService } from '@/application/services/ExportarReporteService';
import { TarjetaEscenarioDetalle } from '@/presentation/components/domain/TarjetaEscenarioDetalle';
import { guardarParcelaLocal } from '@/utils/parcelasStorage';

export type SubvistaComparador = 'lista' | 'detalle' | 'auditoria';

export interface CompararEscenariosViewProps {
  declaracion: DeclaracionCompleta;
  parcela: Parcela | null;
  evaluacionInicial?: Evaluacion | null;
  alRegresarManejo: () => void;
  alReiniciarTodo: () => void;
  alIrADashboard?: () => void;
}

export const CompararEscenariosView: React.FC<CompararEscenariosViewProps> = ({
  declaracion,
  parcela,
  evaluacionInicial = null,
  alRegresarManejo,
  alReiniciarTodo,
  alIrADashboard,
}) => {
  const [evaluacion, setEvaluacion] = useState<Evaluacion | null>(evaluacionInicial);
  const [cargando, setCargando] = useState<boolean>(!evaluacionInicial);
  const [subvista, setSubvista] = useState<SubvistaComparador>('lista');
  const [codigoSeleccionado, setCodigoSeleccionado] = useState<string>('B');
  const [guardadoExitoso, setGuardadoExitoso] = useState<boolean>(false);

  const handleGuardarParcela = () => {
    if (!parcela) return;
    const mejorCultivo = evaluacion?.escenarios[0]?.nombre || 'Frijol';
    guardarParcelaLocal(parcela, declaracion, mejorCultivo);
    setGuardadoExitoso(true);
  };

  // Carga reactiva de la evaluación mediante el servicio inyectado
  useEffect(() => {
    if (evaluacionInicial) {
      setEvaluacion(evaluacionInicial);
      if (evaluacionInicial.escenarios.length > 0) {
        setCodigoSeleccionado(evaluacionInicial.escenarios[0].codigo_escenario);
      }
      setCargando(false);
      return;
    }

    let montado = true;
    setCargando(true);

    evaluacionService
      .ejecutarEvaluacion(parcela?.id_parcela || 'parcela_activa', declaracion)
      .then((resultado) => {
        if (montado) {
          setEvaluacion(resultado);
          if (resultado.escenarios.length > 0) {
            setCodigoSeleccionado(resultado.escenarios[0].codigo_escenario);
          }
          setCargando(false);
        }
      })
      .catch((error) => {
        console.error('Error al generar la evaluación agronómica:', error);
        if (montado) {
          setCargando(false);
        }
      });

    return () => {
      montado = false;
    };
  }, [declaracion, parcela, evaluacionInicial]);

  const handleVerDetalle = (codigo: string) => {
    setCodigoSeleccionado(codigo);
    setSubvista('detalle');
  };

  const handleDescargarCSV = () => {
    if (!evaluacion) return;
    ExportarReporteService.descargarCSV({
      parcela,
      declaracion,
      evaluacion,
    });
  };

  // Escenario seleccionado activo para vistas de Detalle y Auditoría
  const escenarioActual: EscenarioResultado | undefined =
    evaluacion?.escenarios.find((e) => e.codigo_escenario === codigoSeleccionado) ||
    evaluacion?.escenarios[0];

  if (cargando) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-cream px-4">
        <Loader2 className="w-8 h-8 text-ink animate-spin mb-3" />
        <p className="text-xs font-bold text-ink">Procesando evaluación satelital NASA...</p>
        <p className="text-[11px] text-ink-muted mt-1">
          Analizando series históricas e índices para tu parcela
        </p>
      </div>
    );
  }

  if (!evaluacion || evaluacion.escenarios.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-cream px-4 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-600 mb-2" />
        <h2 className="text-base font-extrabold text-slate-900">
          No se pudieron calcular escenarios
        </h2>
        <p className="text-xs text-slate-600 mt-1 max-w-sm">
          Por favor revisa los datos de suelo y manejo ingresados para volver a evaluar.
        </p>
        <button
          type="button"
          onClick={alRegresarManejo}
          className="mt-4 px-4 py-2 bg-ink text-white rounded-xl text-xs font-bold"
        >
          Ajustar Manejo
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-cream px-3 py-4 sm:px-6 sm:py-8">
      <div className="max-w-xl mx-auto flex flex-col space-y-4">
        {/* ============================================================== */}
        {/* VISTA 1: LISTA DE PROPUESTAS (100% DINÁMICA)                   */}
        {/* ============================================================== */}
        {subvista === 'lista' && (
          <div className="space-y-3.5 animate-fade-in flex flex-col">
            {/* Header de la lista */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Propuestas
                </h1>
                <p className="text-xs text-ink-muted mt-0.5">
                  Recomendaciones calculadas según tu suelo y clima histórico
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {escenarioActual && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200/90 text-[10.5px] font-bold rounded-md flex items-center gap-1 shadow-xs capitalize">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    Confianza: {escenarioActual.confianza}
                  </span>
                )}
              </div>
            </div>

            {/* Mapeo dinámico de escenarios desde la API */}
            <div className="space-y-3 pt-1">
              {evaluacion.escenarios.map((item) => {
                const esRecomendado =
                  item.tipo_badge === 'recomendado' ||
                  (!item.es_linea_base && item.orden_visual === 1);
                const esLineaBase = item.es_linea_base;

                return (
                  <div
                    key={item.codigo_escenario}
                    onClick={() => handleVerDetalle(item.codigo_escenario)}
                    className={`bg-white rounded-2xl p-4 transition-all cursor-pointer hover:shadow-md active:scale-[0.99] space-y-2.5 ${
                      esRecomendado
                        ? 'border-2 border-emerald-500 shadow-sm'
                        : esLineaBase
                        ? 'border border-slate-300 shadow-xs'
                        : 'border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        {esRecomendado ? (
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                              {item.badge || 'Recomendado'}
                            </span>
                          </div>
                        ) : (
                          item.subtitulo && (
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider block mb-0.5 ${
                                esLineaBase ? 'text-blue-700' : 'text-slate-400'
                              }`}
                            >
                              {item.subtitulo}
                            </span>
                          )
                        )}
                        <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
                          {item.nombre}
                        </h2>
                      </div>

                      {item.badge && (
                        <span
                          className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full shrink-0 ${
                            esRecomendado
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {/* Resumen dinámico extraído de la tarjeta o resumen del backend */}
                    <p className="text-xs text-slate-600 leading-snug">
                      {item.resumen || item.tarjeta_5_partes.por_que_se_sugirio}
                    </p>

                    <div className="flex justify-end pt-1 border-t border-slate-100">
                      <span className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1">
                        {esRecomendado ? 'Ver por qué te conviene →' : 'Ver detalle →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SECCIÓN DINÁMICA DE DESCARTADOS (Filtro RC5 provisto por la API) */}
            {evaluacion.escenarios_descartados.length > 0 && (
              <div className="bg-[#FDF4F2] rounded-2xl p-3.5 border border-red-200/80 mt-1 space-y-2">
                <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Cultivos Descartados (Filtro de Riego RC5)</span>
                </h3>
                <div className="space-y-1.5">
                  {evaluacion.escenarios_descartados.map((descartado) => (
                    <p
                      key={descartado.codigo_escenario}
                      className="text-[11px] text-amber-950/85 leading-relaxed"
                    >
                      <strong className="text-amber-950 font-bold">
                        {descartado.nombre}:
                      </strong>{' '}
                      {descartado.motivo}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Aviso legal agronómico */}
            <div className="p-3 bg-amber-50 border border-amber-300/80 rounded-xl flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-900 leading-tight">
                Esta herramienta apoya tu decisión; no sustituye la experiencia local ni a un técnico agrícola.
              </p>
            </div>

            {/* Tarjeta y Botón Principal: Guardar Parcela en Mis Parcelas */}
            {parcela && (
              <div className="bg-white border-2 border-ok/30 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-black text-ink">
                    <Bookmark className="w-4 h-4 text-ok" />
                    <span>Guardar Parcela</span>
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    Guarda el polígono de {parcela.area_ha.toFixed(2)} ha y las opciones recomendadas en tu panel.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleGuardarParcela}
                    disabled={guardadoExitoso}
                    className={`w-full sm:w-auto py-3 px-6 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                      guardadoExitoso
                        ? 'bg-ok text-white cursor-default'
                        : 'bg-maize hover:bg-maize-light text-ink active:scale-98'
                    }`}
                  >
                    {guardadoExitoso ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>¡Parcela Guardada!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-ink" />
                        <span>Guardar Parcela</span>
                      </>
                    )}
                  </button>

                  {guardadoExitoso && alIrADashboard && (
                    <button
                      type="button"
                      onClick={alIrADashboard}
                      className="w-full sm:w-auto py-3 px-4 rounded-xl text-xs font-black bg-ink text-white hover:bg-ink-light transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>Ir a Mis Parcelas</span>
                      <span>→</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Botones de acción inferiores */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleDescargarCSV}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-bold text-ink bg-white border border-cream-line hover:bg-cream active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-ink-muted" />
                <span>Descargar Reporte (CSV)</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={alRegresarManejo}
                  className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl text-xs font-bold text-ink bg-white border border-cream-line hover:bg-cream active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ajustar Manejo</span>
                </button>

                <button
                  type="button"
                  onClick={alReiniciarTodo}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold text-ink-muted hover:text-ink bg-cream hover:bg-cream-line active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Trazar nueva parcela"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nueva</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VISTA 2: DETALLE DINÁMICO (TARJETA EN 5 PARTES - PANTALLA 06B)  */}
        {/* ============================================================== */}
        {subvista === 'detalle' && escenarioActual && (
          <TarjetaEscenarioDetalle
            escenario={escenarioActual}
            alVolverAPropuestas={() => setSubvista('lista')}
            alAbrirAuditoria={() => setSubvista('auditoria')}
          />
        )}

        {/* ============================================================== */}
        {/* VISTA 3: TRAZABILIDAD DE CIFRA (AUDITORÍA SATELITAL NASA)        */}
        {/* ============================================================== */}
        {subvista === 'auditoria' && escenarioActual && (
          <div className="space-y-3.5 animate-fade-in flex flex-col pb-4">
            {/* Header de Auditoría */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSubvista('detalle')}
                  className="p-2 -ml-2 rounded-full hover:bg-slate-200/70 transition-colors text-slate-700 cursor-pointer"
                  title="Volver al Detalle"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Trazabilidad de Cifra
                </h1>
              </div>
              <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-full">
                Auditoría NASA
              </span>
            </div>

            {/* Ficha técnica satelital */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Ficha Técnica Satelital ({escenarioActual.nombre})
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Auditoría de datos evaluados con satélites NASA:
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full shrink-0">
                  Validez OK
                </span>
              </div>

              {escenarioActual.trazabilidad ? (
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2 flex justify-between items-center gap-2">
                    <span className="text-slate-500 font-medium">Fuentes NASA</span>
                    <span className="font-bold text-slate-900 text-right">
                      {escenarioActual.trazabilidad.fuentesNasa}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between items-center gap-2">
                    <span className="text-slate-500 font-medium">Serie Histórica</span>
                    <span className="font-mono text-slate-700">
                      {escenarioActual.trazabilidad.serieHistorica}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between items-center gap-2">
                    <span className="text-slate-500 font-medium">Resolución Espacial</span>
                    <span className="font-mono text-slate-700">
                      {escenarioActual.trazabilidad.resolucion}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between items-center gap-2">
                    <span className="text-slate-500 font-medium">f_val (Calidad datos)</span>
                    <span className="font-mono font-bold text-slate-900">
                      {escenarioActual.trazabilidad.fVal}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between items-center gap-2">
                    <span className="text-slate-500 font-medium">Filtro Riego RC5</span>
                    <span className="font-mono text-emerald-700 font-bold">
                      {escenarioActual.trazabilidad.filtroRc5}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between items-center gap-2">
                    <span className="text-slate-500 font-medium">Versión Algoritmo</span>
                    <span className="font-mono text-slate-700">
                      {escenarioActual.trazabilidad.versionAlgoritmo}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between items-center gap-2">
                    <span className="text-slate-500 font-medium">ID Ejecución</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {escenarioActual.trazabilidad.idEjecucion}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  ID de Evaluación: {evaluacion.id_evaluacion}
                </p>
              )}
            </div>

            {/* Transparencia Algorítmica */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-blue-950">
              <h3 className="font-bold text-blue-900 flex items-center gap-1.5">
                <Satellite className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Transparencia Algorítmica</span>
              </h3>
              <p className="text-[11px] leading-relaxed text-blue-900/80">
                Las reglas de recomendación son deterministas y pueden ser verificadas sin conexión con el motor open-source de la PWA. No se generan predicciones meteorológicas a futuro, sino evaluaciones de estabilidad frente a la serie histórica 2001–2025.
              </p>
            </div>

            {/* Botones de navegación */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSubvista('detalle')}
                className="w-full sm:flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Detalle</span>
              </button>

              <button
                type="button"
                onClick={() => setSubvista('lista')}
                className="w-full sm:w-auto py-3 px-4 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer"
              >
                <span>Ir a Propuestas</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
