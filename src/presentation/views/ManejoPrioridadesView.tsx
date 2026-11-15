import { useState, useMemo, useEffect } from 'react';
import {
  Droplets,
  CloudSun,
  Sprout,
  Scale,
  ShieldAlert,
  Layers,
  Plus,
  Minus,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Info,
} from 'lucide-react';
import {
  ManejoPrioridades,
  PrioridadPrincipal,
  MANEJO_PREDETERMINADO,
} from '@/domain/models/declaracion';
import {
  validarManejo,
  ajustarManejoAlCambiarRiesgo,
} from '@/domain/rules/declaracionRules';

export interface ManejoPrioridadesViewProps {
  valorInicial?: Partial<ManejoPrioridades>;
  alContinuar: (datos: ManejoPrioridades) => void;
  alRegresar?: () => void;
  cargando?: boolean;
}

interface OpcionPrioridad {
  id: PrioridadPrincipal;
  titulo: string;
  descripcion: string;
  icono: React.ComponentType<{ className?: string }>;
  badge?: string;
  requiereRiesgo?: boolean;
}

const OPCIONES_PRIORIDAD: OpcionPrioridad[] = [
  {
    id: 'agua',
    titulo: 'Agua',
    descripcion: 'Que no me falte agua de lluvia en etapas críticas',
    icono: Droplets,
  },
  {
    id: 'riesgo',
    titulo: 'Riesgo',
    descripcion: 'Tolerar canícula de julio y golpes de calor sin arruinar la siembra',
    icono: ShieldAlert,
    requiereRiesgo: true,
  },
  {
    id: 'suelo',
    titulo: 'Suelo',
    descripcion: 'Evitar que mi tierra se desgaste o pierda fertilidad',
    icono: Layers,
  },
  {
    id: 'igual',
    titulo: 'Equilibrio',
    descripcion: 'Todo me importa por igual (enfoque balanceado)',
    icono: Scale,
    badge: 'Por defecto / Recomendado',
  },
];

export const ManejoPrioridadesView: React.FC<ManejoPrioridadesViewProps> = ({
  valorInicial,
  alContinuar,
  alRegresar,
  cargando = false,
}) => {
  const [manejo, setManejo] = useState<ManejoPrioridades>({
    riego_veces_semana: valorInicial?.riego_veces_semana ?? MANEJO_PREDETERMINADO.riego_veces_semana,
    considerar_riesgo: valorInicial?.considerar_riesgo ?? MANEJO_PREDETERMINADO.considerar_riesgo,
    agrego_productos: valorInicial?.agrego_productos ?? MANEJO_PREDETERMINADO.agrego_productos,
    prioridad_principal:
      valorInicial?.prioridad_principal ?? MANEJO_PREDETERMINADO.prioridad_principal,
  });

  // Sincronización en caso de recibir valores actualizados desde fuera
  useEffect(() => {
    if (valorInicial) {
      setManejo((prev) => ({
        riego_veces_semana: valorInicial.riego_veces_semana ?? prev.riego_veces_semana,
        considerar_riesgo: valorInicial.considerar_riesgo ?? prev.considerar_riesgo,
        agrego_productos: valorInicial.agrego_productos ?? prev.agrego_productos,
        prioridad_principal: valorInicial.prioridad_principal ?? prev.prioridad_principal,
      }));
    }
  }, [valorInicial]);

  // Validación en tiempo real basada en reglas de dominio
  const validacion = useMemo(() => validarManejo(manejo), [manejo]);

  // Manejador del Stepper de Riego (0 a 7)
  const incrementarRiego = () => {
    if (manejo.riego_veces_semana < 7 && !cargando) {
      setManejo((prev) => ({
        ...prev,
        riego_veces_semana: prev.riego_veces_semana + 1,
      }));
    }
  };

  const decrementarRiego = () => {
    if (manejo.riego_veces_semana > 0 && !cargando) {
      setManejo((prev) => ({
        ...prev,
        riego_veces_semana: prev.riego_veces_semana - 1,
      }));
    }
  };

  // Manejador del Toggle de Riesgo Climático
  const toggleRiesgo = (considerar: boolean) => {
    if (cargando) return;
    setManejo((prev) => ajustarManejoAlCambiarRiesgo(prev, considerar));
  };

  // Manejador del Toggle de Abonos/Productos
  const toggleProductos = (agrego: boolean) => {
    if (cargando) return;
    setManejo((prev) => ({
      ...prev,
      agrego_productos: agrego,
    }));
  };

  // Manejador de Selección de Prioridad
  const seleccionarPrioridad = (prioridad: PrioridadPrincipal) => {
    if (cargando) return;
    setManejo((prev) => ({
      ...prev,
      prioridad_principal: prioridad,
    }));
  };

  // Envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validacion.valido && !cargando) {
      alContinuar(manejo);
    }
  };

  // Filtrado reactivo de prioridades visibles según riesgo
  const prioridadesVisibles = OPCIONES_PRIORIDAD.filter(
    (opcion) => !opcion.requiereRiesgo || manejo.considerar_riesgo
  );

  return (
    <div className="w-full h-full overflow-y-auto bg-cream px-4 py-6 md:py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Encabezado */}
        <div className="space-y-1.5">
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Prácticas de Manejo y Prioridades
          </h1>
          <p className="text-sm text-ink-muted leading-relaxed">
            Define tus posibilidades de riego auxiliar, el manejo de insumos y lo que más te interesa proteger para que el motor adapte los puntajes a tus necesidades reales.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. ¿Cuántas veces a la semana tienes posibilidad de regar? */}
          <section className="bg-white rounded-naskob border border-cream-line p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-navy-bg text-navy flex items-center justify-center shrink-0">
                <Droplets className="w-4 h-4 text-navy" />
              </div>
              <h2 className="text-base font-bold text-ink">
                1. ¿Cuántas veces a la semana tienes posibilidad de regar?
              </h2>
            </div>

            {/* Stepper centrado y limpio */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-2">
              <div className="flex items-center gap-3 bg-cream/70 rounded-2xl p-2 border border-cream-line shadow-sm">
                <button
                  type="button"
                  aria-label="Disminuir riegos por semana"
                  disabled={manejo.riego_veces_semana <= 0 || cargando}
                  onClick={decrementarRiego}
                  className="w-11 h-11 rounded-xl bg-white text-ink border border-cream-line flex items-center justify-center font-bold text-lg hover:bg-cream active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <Minus className="w-5 h-5 stroke-[2.5]" />
                </button>

                <span className="text-3xl font-black text-ink w-12 text-center leading-none">
                  {manejo.riego_veces_semana}
                </span>

                <button
                  type="button"
                  aria-label="Aumentar riegos por semana"
                  disabled={manejo.riego_veces_semana >= 7 || cargando}
                  onClick={incrementarRiego}
                  className="w-11 h-11 rounded-xl bg-white text-ink border border-cream-line flex items-center justify-center font-bold text-lg hover:bg-cream active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              <span className="text-xs font-bold text-ink">
                {manejo.riego_veces_semana === 1 ? 'riego por semana' : 'riegos por semana'}
              </span>
            </div>
          </section>

          {/* 2. ¿Deseas que consideremos el riesgo de sequías largas y calor? */}
          <section className="bg-white rounded-naskob border border-cream-line p-5 shadow-sm space-y-3.5">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-warn-bg text-warn flex items-center justify-center shrink-0 mt-0.5">
                <CloudSun className="w-4 h-4 text-warn" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-ink">
                  2. ¿Deseas que consideremos el riesgo de sequías largas y calor?
                </h2>
              </div>
            </div>

            {/* Selector Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={cargando}
                onClick={() => toggleRiesgo(true)}
                className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  manejo.considerar_riesgo
                    ? 'bg-ink text-white border-ink shadow-sm'
                    : 'bg-white text-ink border-cream-line hover:bg-cream/60'
                }`}
              >
                <span>Sí, considerar riesgo</span>
              </button>

              <button
                type="button"
                disabled={cargando}
                onClick={() => toggleRiesgo(false)}
                className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  !manejo.considerar_riesgo
                    ? 'bg-ink text-white border-ink shadow-sm'
                    : 'bg-white text-ink border-cream-line hover:bg-cream/60'
                }`}
              >
                <span>No considerarlo</span>
              </button>
            </div>
          </section>

          {/* 3. ¿Has aplicado fertilizantes, estiércol o compostas al terreno? */}
          <section className="bg-white rounded-naskob border border-cream-line p-5 shadow-sm space-y-3.5">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-ok-bg text-ok flex items-center justify-center shrink-0 mt-0.5">
                <Sprout className="w-4 h-4 text-ok" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-ink">
                  3. ¿Has aplicado fertilizantes, estiércol o compostas al terreno?
                </h2>
                <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
                  Permite ajustar la estimación de fertilidad residual en el suelo.
                </p>
              </div>
            </div>

            {/* Selector Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={cargando}
                onClick={() => toggleProductos(true)}
                className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  manejo.agrego_productos
                    ? 'bg-ink text-white border-ink shadow-sm'
                    : 'bg-white text-ink border-cream-line hover:bg-cream/60'
                }`}
              >
                <span>Sí he agregado</span>
              </button>

              <button
                type="button"
                disabled={cargando}
                onClick={() => toggleProductos(false)}
                className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  !manejo.agrego_productos
                    ? 'bg-ink text-white border-ink shadow-sm'
                    : 'bg-white text-ink border-cream-line hover:bg-cream/60'
                }`}
              >
                <span>No he agregado</span>
              </button>
            </div>
          </section>

          {/* 4. Prioridad Principal (Idéntico a la vista original) */}
          <section className="bg-white rounded-naskob border border-cream-line p-5 shadow-sm space-y-4">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-maize/20 text-maize-dark flex items-center justify-center shrink-0 mt-0.5">
                <Scale className="w-4 h-4 text-maize-dark" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-ink">
                  Prioridad principal
                </h2>
                <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
                  Selecciona el criterio que guiará el orden y la ponderación de las recomendaciones de rotación.
                </p>
              </div>
            </div>

            {/* Tarjetas de Selección Tipo Radio idénticas a la captura */}
            <div className="space-y-2.5 pt-1">
              {prioridadesVisibles.map((opcion) => {
                const seleccionada = manejo.prioridad_principal === opcion.id;
                const Icono = opcion.icono;

                return (
                  <label
                    key={opcion.id}
                    onClick={() => seleccionarPrioridad(opcion.id)}
                    className={`flex flex-col p-3.5 rounded-xl border cursor-pointer transition-all ${
                      seleccionada
                        ? 'border-ink bg-ok-bg/30 ring-2 ring-ink/20 shadow-sm'
                        : 'border-cream-line bg-white hover:bg-cream/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            seleccionada ? 'bg-ink text-white' : 'bg-cream text-ink-muted'
                          }`}
                        >
                          <Icono className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-ink">{opcion.titulo}</span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          seleccionada
                            ? 'border-ink bg-ink text-white'
                            : 'border-cream-line bg-white'
                        }`}
                      >
                        {seleccionada && <div className="w-2 h-2 rounded-full bg-maize" />}
                      </div>
                    </div>

                    <p className="text-xs text-ink-muted leading-relaxed italic mt-2">
                      "{opcion.descripcion}"
                    </p>

                    {opcion.badge && (
                      <div className="mt-2.5">
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-ok-bg text-ok border border-ok/30">
                          {opcion.badge}
                        </span>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>

            {!manejo.considerar_riesgo && (
              <div className="flex items-center gap-1.5 text-[11px] text-ink-muted bg-cream/70 p-2.5 rounded-lg border border-cream-line">
                <Info className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                <span>
                  La opción de <strong>Riesgo</strong> se encuentra deshabilitada al no tomar en cuenta el riesgo climático extremo.
                </span>
              </div>
            )}
          </section>

          {/* MENSAJE DE ERROR SI LA VALIDACIÓN FALLA */}
          {!validacion.valido && validacion.error && (
            <div className="bg-terra-bg text-terra border border-terra/30 rounded-xl p-3 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-terra" />
              <span>{validacion.error}</span>
            </div>
          )}

          {/* BOTONES DE ACCIÓN */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            {alRegresar ? (
              <button
                type="button"
                disabled={cargando}
                onClick={alRegresar}
                className="w-full sm:w-auto py-3.5 px-5 rounded-xl text-xs font-bold text-ink bg-white border border-cream-line hover:bg-cream active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Regresar al historial</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={!validacion.valido || cargando}
              className={`w-full sm:w-auto min-w-[280px] py-4 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-md ${
                !validacion.valido || cargando
                  ? 'bg-cream-line text-ink-muted cursor-not-allowed opacity-70 shadow-none'
                  : 'bg-ink text-white hover:bg-ink-light active:scale-[0.98]'
              }`}
            >
              {cargando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-maize" />
                  <span>Calculando con series satelitales NASA...</span>
                </>
              ) : (
                <>
                  <span>Evaluar y Comparar Escenarios</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
