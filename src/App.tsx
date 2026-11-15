import { useState } from 'react';
import { Sprout, MapPin, Check } from 'lucide-react';
import { BotonInstalarPWA } from './components/BotonInstalarPWA';
import { ParcelaView } from '@/presentation/views/ParcelaView';
import { HistorialSueloView } from '@/presentation/views/HistorialSueloView';
import { ManejoPrioridadesView } from '@/presentation/views/ManejoPrioridadesView';
import { CompararEscenariosView } from '@/presentation/views/CompararEscenariosView';
import { Parcela } from '@/domain/models/parcela';
import {
  DeclaracionCompleta,
  MANEJO_PREDETERMINADO,
  ROTACION_PREDETERMINADA_3_CICLOS,
  ManejoPrioridades,
  TipoTierra,
  CicloRotacion,
} from '@/domain/models/declaracion';

export type PasoFlujo = 1 | 2 | 3 | 4;

const NOMBRES_PASOS: Record<PasoFlujo, { etiqueta: string; subtitulo: string }> = {
  1: { etiqueta: '01', subtitulo: 'Delimitar Parcela' },
  2: { etiqueta: '02', subtitulo: 'Historial de Siembra y Suelo' },
  3: { etiqueta: '03', subtitulo: 'Manejo y Prioridades' },
  4: { etiqueta: '04', subtitulo: 'Comparar Escenarios' },
};

export default function App() {
  // Inicio directo en Paso 1 (Delimitar Parcela) sin requerir login
  const [pasoActual, setPasoActual] = useState<PasoFlujo>(1);
  const [parcelaActiva, setParcelaActiva] = useState<Parcela | null>(null);
  const [cargandoSimulacion, setCargandoSimulacion] = useState<boolean>(false);

  // Estado unificado de la declaración
  const [declaracion, setDeclaracion] = useState<DeclaracionCompleta>({
    id_parcela: undefined,
    rotacion_existente: ROTACION_PREDETERMINADA_3_CICLOS,
    tipo_tierra: 'negra',
    manejo: MANEJO_PREDETERMINADO,
  });

  // Manejador del avance en Paso 1 (Parcela)
  const handleParcelaConfirmada = (parcela: Parcela) => {
    setParcelaActiva(parcela);
    setDeclaracion((prev) => ({
      ...prev,
      id_parcela: parcela.id_parcela,
    }));
    setPasoActual(2);
  };

  // Manejador del avance en Paso 2 (Historial / Suelo)
  const handleHistorialConfirmado = (datos: {
    tipo_tierra: TipoTierra;
    rotacion_existente: CicloRotacion[];
  }) => {
    setDeclaracion((prev) => ({
      ...prev,
      tipo_tierra: datos.tipo_tierra,
      rotacion_existente: datos.rotacion_existente,
    }));
    setPasoActual(3);
  };

  // Manejador del avance en Paso 3 (Manejo y Prioridades)
  const handleManejoConfirmado = (nuevoManejo: ManejoPrioridades) => {
    setDeclaracion((prev) => ({
      ...prev,
      manejo: nuevoManejo,
    }));

    // Simulación de cálculo con series satelitales NASA POWER (1.2s de latencia realista)
    setCargandoSimulacion(true);
    setTimeout(() => {
      setCargandoSimulacion(false);
      setPasoActual(4);
    }, 1200);
  };

  // Reiniciar flujo de parcela
  const handleReiniciarTodo = () => {
    setParcelaActiva(null);
    setPasoActual(1);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-cream text-ink overflow-hidden">
      {/* Encabezado Principal */}
      <header className="h-[65px] px-4 border-b border-cream-line bg-white flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ink text-white flex items-center justify-center shadow-sm">
            <Sprout className="w-5 h-5 text-maize" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-ink">NasKob</span>
              {pasoActual !== 4 && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-ink/10 text-ink rounded-full">
                  {NOMBRES_PASOS[pasoActual].etiqueta}
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-muted leading-none hidden sm:block">
              {NOMBRES_PASOS[pasoActual].subtitulo} · La Frailesca
            </p>
          </div>
        </div>

        {/* Indicador de pasos en Header para pantallas medianas/grandes */}
        <nav className="hidden md:flex items-center gap-1.5 bg-cream/70 p-1 rounded-xl border border-cream-line text-xs">
          {([1, 2, 3, 4] as const).map((paso) => {
            const esActivo = pasoActual === paso;
            const esCompletado = pasoActual > paso;
            const puedeNavegar = paso < pasoActual || (paso === 2 && parcelaActiva !== null);

            return (
              <button
                key={paso}
                type="button"
                disabled={!puedeNavegar && !esActivo}
                onClick={() => puedeNavegar && setPasoActual(paso)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  esActivo
                    ? 'bg-ink text-white shadow-sm'
                    : esCompletado
                    ? 'text-ok bg-ok-bg/50 hover:bg-ok-bg cursor-pointer'
                    : 'text-ink-muted opacity-50 cursor-not-allowed'
                }`}
              >
                {esCompletado ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  <span>{paso}</span>
                )}
                <span>
                  {paso === 1
                    ? 'Parcela'
                    : paso === 2
                    ? 'Suelo'
                    : paso === 3
                    ? 'Manejo'
                    : 'Escenarios'}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Insignia de Parcela y Botón PWA */}
        <div className="flex items-center gap-2">
          <BotonInstalarPWA />
          {parcelaActiva && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-ok-bg text-ok rounded-lg text-xs font-semibold border border-ok/30">
              <MapPin className="w-3.5 h-3.5" />
              <span>Parcela {parcelaActiva.area_ha} ha</span>
            </div>
          )}
        </div>
      </header>

      {/* Contenido Principal según el Paso */}
      <main className="flex-1 w-full h-full relative overflow-hidden">
        {pasoActual === 1 && (
          <ParcelaView
            parcelaInicial={parcelaActiva}
            onParcelaConfirmada={handleParcelaConfirmada}
          />
        )}

        {pasoActual === 2 && (
          <HistorialSueloView
            tipoTierraInicial={declaracion.tipo_tierra}
            rotacionInicial={declaracion.rotacion_existente}
            alContinuar={handleHistorialConfirmado}
            alRegresar={() => setPasoActual(1)}
          />
        )}

        {pasoActual === 3 && (
          <ManejoPrioridadesView
            valorInicial={declaracion.manejo}
            cargando={cargandoSimulacion}
            alContinuar={handleManejoConfirmado}
            alRegresar={() => setPasoActual(2)}
          />
        )}

        {pasoActual === 4 && (
          <CompararEscenariosView
            declaracion={declaracion}
            parcela={parcelaActiva}
            alRegresarManejo={() => setPasoActual(3)}
            alReiniciarTodo={handleReiniciarTodo}
          />
        )}
      </main>
    </div>
  );
}
