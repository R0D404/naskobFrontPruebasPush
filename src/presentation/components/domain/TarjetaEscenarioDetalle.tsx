import React from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Clock,
  Sprout,
  Info,
  Sparkles,
  CloudRain,
} from 'lucide-react';
import { EscenarioResultado } from '@/domain/models/evaluacion';

export interface TarjetaEscenarioDetalleProps {
  escenario: EscenarioResultado;
  alVolverAPropuestas: () => void;
  alAbrirPerfilClimatico?: () => void;
}

export const TarjetaEscenarioDetalle: React.FC<TarjetaEscenarioDetalleProps> = ({
  escenario,
  alVolverAPropuestas,
  alAbrirPerfilClimatico,
}) => {
  const tarjeta = escenario.tarjeta_5_partes;
  const scoreAjuste = escenario.puntaje_valor;

  // Helper 100% dinámico para renderizar listas o texto simple sin hardcodear
  const renderLista = (
    contenido: string | string[],
    tipoItem?: 'evidencia' | 'carencia' | 'beneficio' | 'riesgo'
  ) => {
    if (Array.isArray(contenido)) {
      return (
        <ul className="space-y-1.5 text-xs">
          {contenido.map((item, idx) => {
            // Detección de badges opcionales de fuentes [Satelital], [Declarado], [De literatura]
            const matchBadge = item.match(/\[(Satelital|Declarado|De literatura)\]/);
            const badgeTexto = matchBadge ? matchBadge[1] : null;
            const textoLimpio = matchBadge
              ? item.replace(/\s*\[(Satelital|Declarado|De literatura)\]/, '')
              : item;

            // Formateo de títulos "Título: Descripción"
            const partes = textoLimpio.split(':');
            const tieneTitulo = partes.length > 1;

            return (
              <li
                key={idx}
                className="flex items-start justify-between gap-3 text-slate-700 py-1.5 border-b border-slate-100/70 last:border-b-0"
              >
                <div className="flex items-start gap-2 flex-1">
                  {tipoItem === 'beneficio' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : tipoItem === 'riesgo' ? (
                    <span className="text-amber-600 font-bold shrink-0 mt-0.5">•</span>
                  ) : (
                    <span className="text-slate-400 font-bold shrink-0 mt-0.5">•</span>
                  )}

                  <span className="leading-relaxed">
                    {tieneTitulo ? (
                      <>
                        <strong
                          className={
                            tipoItem === 'riesgo'
                              ? 'text-amber-950 font-bold'
                              : 'text-slate-900 font-bold'
                          }
                        >
                          {partes[0]}:
                        </strong>
                        {partes.slice(1).join(':')}
                      </>
                    ) : (
                      textoLimpio
                    )}
                  </span>
                </div>

                {badgeTexto && (
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      badgeTexto === 'Satelital'
                        ? 'bg-blue-50 text-blue-700 border-blue-200/90'
                        : badgeTexto === 'Declarado'
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                    }`}
                  >
                    {badgeTexto}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      );
    }

    return (
      <p className="text-xs text-slate-700 leading-relaxed font-normal">
        {contenido}
      </p>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in flex flex-col pb-6">
      {/* ============================================================== */}
      {/* CABECERA DE NAVEGACIÓN Y TÍTULO                                */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between pt-1 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={alVolverAPropuestas}
            className="p-2 -ml-2 rounded-full hover:bg-slate-200/70 transition-colors text-slate-700 cursor-pointer flex items-center justify-center"
            title="Volver a Propuestas"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            {escenario.subtitulo && !escenario.subtitulo.toLowerCase().includes('agroecológica') && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                {escenario.subtitulo}
              </span>
            )}
            <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
              {escenario.nombre}
            </h1>
          </div>
        </div>

        {escenario.badge && (
          <span
            className={`px-2.5 py-1 text-[11px] font-bold rounded-full shrink-0 ${
              escenario.tipo_badge === 'recomendado'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {escenario.badge}
          </span>
        )}
      </div>

      {/* ============================================================== */}
      {/* CARD RESUMEN Y AJUSTE A PRIORIDADES                            */}
      {/* ============================================================== */}
      {scoreAjuste !== undefined && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700">
              Ajuste a tus prioridades declaradas:
            </span>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
              {scoreAjuste}% afinidad
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                scoreAjuste >= 85
                  ? 'bg-emerald-500'
                  : scoreAjuste >= 70
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${scoreAjuste}%` }}
            />
          </div>

          {/* Chips clave (Agua, Suelo, Cosecha) si están provistos */}
          <div className="pt-1 grid grid-cols-3 gap-2 text-center text-xs">
            {escenario.etiqueta_agua && (
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                  <Droplets className="w-3 h-3 text-blue-600" /> Agua
                </span>
                <span className="font-bold text-slate-900 mt-0.5 block">{escenario.etiqueta_agua}</span>
              </div>
            )}

            {escenario.etiqueta_suelo && (
              <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-emerald-800 font-semibold flex items-center justify-center gap-1">
                  <Sprout className="w-3 h-3 text-emerald-600" /> Suelo
                </span>
                <span className="font-bold text-emerald-900 mt-0.5 block">{escenario.etiqueta_suelo}</span>
              </div>
            )}

            {escenario.duracion_ciclo_dias && (
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" /> Cosecha
                </span>
                <span className="font-bold text-slate-900 mt-0.5 block">{escenario.duracion_ciclo_dias}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ESTRUCTURA OFICIAL EN 5 PARTES (PANTALLA 06B)                   */}
      {/* ============================================================== */}

      {/* BLOQUE 1: POR QUÉ SE SUGIRIÓ */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-ink text-white font-bold text-xs flex items-center justify-center shrink-0">
            1
          </span>
          <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">
            Por qué se sugirió
          </h2>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <p className="text-xs text-slate-700 leading-relaxed font-normal">
            {tarjeta.por_que_se_sugirio}
          </p>
        </div>
      </div>

      {/* BLOQUE 2: EVIDENCIA */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-ink text-white font-bold text-xs flex items-center justify-center shrink-0">
            2
          </span>
          <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">
            Evidencia
          </h2>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          {renderLista(tarjeta.evidencia_agroclimatica, 'evidencia')}
        </div>
      </div>

      {/* BLOQUE 3: CARENCIA DE INFORMACIÓN */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-ink text-white font-bold text-xs flex items-center justify-center shrink-0">
            3
          </span>
          <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">
            Carencias de información
          </h2>
        </div>
        <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-4 shadow-xs">
          {renderLista(tarjeta.carencias_informacion, 'carencia')}
        </div>
      </div>

      {/* BLOQUE 4: BENEFICIOS POSIBLES (INSIGHTS DE IA) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-ink text-white font-bold text-xs flex items-center justify-center shrink-0">
              4
            </span>
            <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">
              Beneficios posibles
            </h2>
          </div>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-md flex items-center gap-1 shadow-xs">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Insights de IA
          </span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-xs">
          {renderLista(tarjeta.beneficios_posibles, 'beneficio')}
        </div>
      </div>

      {/* BLOQUE 5: RIESGOS PARA LA REVISIÓN LOCAL (INSIGHTS DE IA) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-ink text-white font-bold text-xs flex items-center justify-center shrink-0">
              5
            </span>
            <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">
              Riesgos para la revisión local
            </h2>
          </div>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold rounded-md flex items-center gap-1 shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-700" />
            Insights de IA
          </span>
        </div>
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-amber-950 font-bold text-xs pb-1 border-b border-amber-200/60">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Aspectos para consultar con tu agrónomo o técnico de campo:</span>
          </div>
          {renderLista(tarjeta.riesgos_revision_local, 'riesgo')}
        </div>
      </div>

      {/* ============================================================== */}
      {/* PIE DE LA VISTA: HONESTIDAD Y NAVEGACIÓN                       */}
      {/* ============================================================== */}
      <div className="space-y-2.5 pt-2">
        {/* Sello de honestidad */}
        <div className="p-3 bg-amber-50/80 border border-amber-300/80 rounded-xl text-xs text-amber-950 leading-tight flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p>
            <strong>Nota de campo:</strong> Esta herramienta apoya tu decisión; no sustituye la experiencia local ni a un técnico agrícola.
          </p>
        </div>

        {/* Acceso al Perfil Agroclimático y Lluvias NASA */}
        {alAbrirPerfilClimatico && (
          <button
            type="button"
            onClick={alAbrirPerfilClimatico}
            className="w-full py-2.5 px-3.5 bg-blue-50/90 hover:bg-blue-100 border border-blue-200 text-blue-900 rounded-xl text-xs font-bold flex items-center justify-between transition-colors shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-blue-600" />
              <span>Ver lluvias y clima histórico de tu parcela (NASA)</span>
            </div>
            <span className="text-blue-600 font-bold">→</span>
          </button>
        )}

        {/* Botón Primario: Volver a Propuestas */}
        <button
          type="button"
          onClick={alVolverAPropuestas}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Volver a Propuestas</span>
        </button>
      </div>
    </div>
  );
};
