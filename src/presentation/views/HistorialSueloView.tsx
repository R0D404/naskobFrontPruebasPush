import { useState } from 'react';
import { Layers, Sprout, ArrowRight, ArrowLeft, AlertTriangle, Calendar } from 'lucide-react';
import { TipoTierra, CicloRotacion, ROTACION_PREDETERMINADA_3_CICLOS } from '@/domain/models/declaracion';
import {
  CULTIVOS_CATALOGO,
  esCultivoDesconocido,
} from '@/domain/catalog/cultivosCatalog';
import { PERFILES_SUELO } from '@/domain/catalog/sueloCatalog';

export interface HistorialSueloViewProps {
  tipoTierraInicial?: TipoTierra;
  rotacionInicial?: CicloRotacion[];
  alContinuar: (datos: { tipo_tierra: TipoTierra; rotacion_existente: CicloRotacion[] }) => void;
  alRegresar?: () => void;
}

const ETIQUETAS_3_CICLOS: [string, string, string] = [
  'Hace 3 temporadas',
  'Hace 2 temporadas',
  'La última temporada',
];

export const HistorialSueloView: React.FC<HistorialSueloViewProps> = ({
  tipoTierraInicial = 'negra',
  rotacionInicial,
  alContinuar,
  alRegresar,
}) => {
  const [tipoTierra, setTipoTierra] = useState<TipoTierra>(tipoTierraInicial);

  // Inicialización garantizando exactamente los 3 ciclos oficiales
  const [rotacion, setRotacion] = useState<CicloRotacion[]>(() => {
    if (rotacionInicial && rotacionInicial.length === 3) {
      return rotacionInicial.map((item, idx) => ({
        ciclo: idx + 1,
        etiqueta: ETIQUETAS_3_CICLOS[idx],
        cultivo: item.cultivo || ROTACION_PREDETERMINADA_3_CICLOS[idx].cultivo,
      }));
    }

    if (rotacionInicial && rotacionInicial.length > 0) {
      return ETIQUETAS_3_CICLOS.map((etiqueta, idx) => ({
        ciclo: idx + 1,
        etiqueta,
        cultivo: rotacionInicial[idx]?.cultivo || ROTACION_PREDETERMINADA_3_CICLOS[idx].cultivo,
      }));
    }

    return ROTACION_PREDETERMINADA_3_CICLOS;
  });

  const actualizarCultivoCiclo = (index: number, nuevoCultivo: string) => {
    setRotacion((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], cultivo: nuevoCultivo };
      return copia;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alContinuar({
      tipo_tierra: tipoTierra,
      rotacion_existente: rotacion,
    });
  };

  const hayCultivoDesconocido = rotacion.some((c) => esCultivoDesconocido(c.cultivo));

  return (
    <div className="w-full h-full overflow-y-auto bg-cream px-4 py-6 md:py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Encabezado del paso */}
        <div className="space-y-1.5">
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Historial de Siembra y Suelo
          </h1>
          <p className="text-sm text-ink-muted leading-relaxed">
            Indica tu tipo de tierra y tus cosechas anteriores para recomendarte la mejor rotación.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SELECCIÓN DE TIPO DE SUELO */}
          <section className="bg-white rounded-naskob border border-cream-line p-5 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-terra-bg text-terra flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-terra" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">Tipo de tierra</h2>
                <p className="text-xs text-ink-muted">
                  Elige la opción que mejor describa el suelo de tu parcela.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {PERFILES_SUELO.map((opcion) => {
                const seleccionada = tipoTierra === opcion.id;
                return (
                  <label
                    key={opcion.id}
                    onClick={() => setTipoTierra(opcion.id)}
                    className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      seleccionada
                        ? 'border-ink bg-ok-bg/30 ring-2 ring-ink/20 shadow-sm'
                        : 'border-cream-line bg-white hover:bg-cream/50'
                    }`}
                  >
                    <div className="space-y-1 pr-3">
                      <span className="text-sm font-bold text-ink block">
                        {opcion.nombre}
                      </span>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {opcion.descripcion}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border shrink-0 mt-0.5 flex items-center justify-center ${
                        seleccionada ? 'border-ink bg-ink text-white' : 'border-cream-line bg-white'
                      }`}
                    >
                      {seleccionada && <div className="w-2 h-2 rounded-full bg-maize" />}
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          {/* HISTORIAL DE 3 CICLOS INDEPENDIENTES CON CULTIVOS DEL MD */}
          <section className="bg-white rounded-naskob border border-cream-line p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-ok-bg text-ok flex items-center justify-center shrink-0">
                  <Sprout className="w-5 h-5 text-ok" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ink">
                    ¿Qué sembraste en las últimas 3 temporadas?
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Ayuda a calcular qué nutrientes necesita reponer tu suelo.
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream text-ink text-xs font-semibold border border-cream-line shrink-0">
                <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                <span>3 Ciclos</span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {rotacion.map((item, index) => {
                const esDesconocido = esCultivoDesconocido(item.cultivo);

                return (
                  <div
                    key={item.ciclo}
                    className={`border rounded-xl p-3.5 transition-all ${
                      esDesconocido
                        ? 'bg-warn-bg/20 border-warn/40'
                        : 'bg-cream/50 border-cream-line'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-ink text-white text-[10px] font-black flex items-center justify-center">
                            {item.ciclo}
                          </span>
                          <span className="text-xs font-bold text-ink block">
                            {item.etiqueta}
                          </span>
                        </div>
                        <span className="text-[11px] text-ink-muted pl-7 block">
                          Cultivo sembrado
                        </span>
                      </div>

                      <select
                        aria-label={`Cultivo de ${item.etiqueta}`}
                        value={item.cultivo}
                        onChange={(e) => actualizarCultivoCiclo(index, e.target.value)}
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-ink transition-all ${
                          esDesconocido
                            ? 'bg-white border-warn text-warn-dark ring-1 ring-warn/30'
                            : 'bg-white border-cream-line'
                        }`}
                      >
                        {CULTIVOS_CATALOGO.map((cultivo) => (
                          <option key={cultivo} value={cultivo}>
                            {cultivo}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Chip de advertencia conciso si elige "No sé" */}
                    {esDesconocido && (
                      <div className="mt-3 p-2.5 rounded-lg bg-warn-bg text-warn border border-warn/40 text-xs flex items-center gap-2 animate-fade-in">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-warn" />
                        <span className="text-[11px] font-medium leading-tight">
                          Se asume maíz para estimar el consumo de nutrientes de tu tierra.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Banner global si hay algún cultivo "No sé" */}
            {hayCultivoDesconocido && (
              <div className="p-3 rounded-xl bg-warn-bg/40 border border-warn/30 text-xs text-warn flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-warn" />
                <span className="text-[11px] leading-relaxed">
                  Al elegir <strong>"No sé"</strong>, el sistema toma como base maíz para calcular el desgaste de nutrientes.
                </span>
              </div>
            )}
          </section>

          {/* BOTONES DE NAVEGACIÓN */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            {alRegresar ? (
              <button
                type="button"
                onClick={alRegresar}
                className="w-full sm:w-auto py-3.5 px-5 rounded-xl text-xs font-bold text-ink bg-white border border-cream-line hover:bg-cream active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al mapa</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              className="w-full sm:w-auto min-w-[280px] py-4 px-6 rounded-xl text-sm font-bold bg-ink text-white hover:bg-ink-light active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <span>Continuar a Prácticas de Manejo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
