import { useState, useEffect } from 'react';
import { Sprout, MapPin, Check, ChevronLeft } from 'lucide-react';
import { BotonInstalarPWA } from './components/BotonInstalarPWA';
import { LoginAuthView } from '@/presentation/views/LoginAuthView';
import { DashboardParcelasView } from '@/presentation/views/DashboardParcelasView';
import { ParcelaView } from '@/presentation/views/ParcelaView';
import { HistorialSueloView } from '@/presentation/views/HistorialSueloView';
import { ManejoPrioridadesView } from '@/presentation/views/ManejoPrioridadesView';
import { CompararEscenariosView } from '@/presentation/views/CompararEscenariosView';
import { Parcela } from '@/domain/models/parcela';
import { SesionUsuario } from '@/domain/models/auth';
import { ParcelaResumen } from '@/domain/models/parcelaResumen';
import { obtenerSesion, guardarSesion, limpiarSesion } from '@/utils/sessionStorage';
import { obtenerParcelasLocales } from '@/utils/parcelasStorage';
import { sincronizarParcelasPendientes } from '@/utils/sincronizadorParcelas';
import { apiAuthAdapter } from '@/infrastructure/adapters/apiAuthAdapter';
import {
  DeclaracionCompleta,
  MANEJO_PREDETERMINADO,
  ROTACION_PREDETERMINADA_3_CICLOS,
  ManejoPrioridades,
  TipoTierra,
  CicloRotacion,
} from '@/domain/models/declaracion';

export type PasoFlujo = 1 | 2 | 3 | 4;
export type VistaApp = 'dashboard' | 'flujo_parcela';

export default function App() {
  // Estado de Sesión (Persistido en localStorage para funcionar offline)
  const [sesion, setSesion] = useState<SesionUsuario | null>(() => obtenerSesion());

  // Navegación principal: Dashboard de Parcelas o Flujo de Evaluación de Parcela (Pasos 1 a 4)
  const [vistaActual, setVistaActual] = useState<VistaApp>('dashboard');
  const [pasoActual, setPasoActual] = useState<PasoFlujo>(1);

  const [parcelaActiva, setParcelaActiva] = useState<Parcela | null>(null);
  const [cargandoSimulacion, setCargandoSimulacion] = useState<boolean>(false);

  // Estado unificado de la declaración agronómica
  const [declaracion, setDeclaracion] = useState<DeclaracionCompleta>({
    id_parcela: undefined,
    rotacion_existente: ROTACION_PREDETERMINADA_3_CICLOS,
    tipo_tierra: 'negra',
    manejo: MANEJO_PREDETERMINADO,
  });

  // Sincronización automática de parcelas locales pendientes al recuperar conexión a internet
  useEffect(() => {
    const intentarSincronizacion = async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine && sesion?.token && !sesion.esInvitado) {
        try {
          await sincronizarParcelasPendientes();
        } catch (err) {
          console.warn('[App] Error en sincronización de parcelas pendientes:', err);
        }
      }
    };

    intentarSincronizacion();
    window.addEventListener('online', intentarSincronizacion);
    return () => {
      window.removeEventListener('online', intentarSincronizacion);
    };
  }, [sesion]);

  // Manejador de Autenticación Exitosa
  const handleAutenticado = (nuevaSesion: SesionUsuario) => {
    guardarSesion(nuevaSesion);
    setSesion(nuevaSesion);
    setVistaActual('dashboard');
  };

  // Manejador de Cierre de Sesión
  const handleCerrarSesion = () => {
    if (sesion?.token) {
      apiAuthAdapter.cerrarSesion(sesion.token);
    }
    limpiarSesion();
    setSesion(null);
    setVistaActual('dashboard');
    setParcelaActiva(null);
  };

  // Iniciar delimitación de una nueva parcela desde el dashboard
  const handleIniciarNuevaParcela = () => {
    setParcelaActiva(null);
    setDeclaracion({
      id_parcela: undefined,
      rotacion_existente: ROTACION_PREDETERMINADA_3_CICLOS,
      tipo_tierra: 'negra',
      manejo: MANEJO_PREDETERMINADO,
    });
    setPasoActual(1);
    setVistaActual('flujo_parcela');
  };

  // Seleccionar una parcela existente para consultar o re-evaluar
  const handleSeleccionarParcelaExistente = (resumen: ParcelaResumen) => {
    // Buscar si existe guardada localmente con todos sus datos completos
    const locales = obtenerParcelasLocales();
    const guardada = locales.find((l) => l.id_parcela === resumen.id_parcela);

    if (guardada) {
      setParcelaActiva(guardada.parcela);
      if (guardada.declaracion) {
        setDeclaracion(guardada.declaracion);
        setPasoActual(4); // Si ya tenía declaración, abre directo sus resultados
      } else {
        setDeclaracion((prev) => ({
          ...prev,
          id_parcela: guardada.id_parcela,
        }));
        setPasoActual(2);
      }
      setVistaActual('flujo_parcela');
      return;
    }

    const parcelaMock: Parcela = {
      id_parcela: resumen.id_parcela,
      area_ha: resumen.area_ha,
      poligono: {
        type: 'Polygon',
        coordinates: [
          [
            [-93.2, 16.2],
            [-93.2, 16.21],
            [-93.19, 16.21],
            [-93.19, 16.2],
            [-93.2, 16.2],
          ],
        ],
      },
      metodo_delimitacion: 'dibujo',
      region: 'chiapas',
      estado_region: 'preparada',
      fecha_creacion: new Date().toISOString(),
    };
    setParcelaActiva(parcelaMock);
    setDeclaracion((prev) => ({
      ...prev,
      id_parcela: resumen.id_parcela,
    }));
    setPasoActual(2);
    setVistaActual('flujo_parcela');
  };

  // Manejador del avance en Paso 1 (Parcela confirmada en el mapa)
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

    // Simulación de cálculo con series satelitales NASA POWER (1.2s de latencia)
    setCargandoSimulacion(true);
    setTimeout(() => {
      setCargandoSimulacion(false);
      setPasoActual(4);
    }, 1200);
  };

  // Reiniciar flujo y volver al dashboard de parcelas
  const handleReiniciarTodo = () => {
    setParcelaActiva(null);
    setVistaActual('dashboard');
  };

  // ========================================================
  // 1. SI NO HAY SESIÓN: PANTALLA DE LOGIN
  // ========================================================
  if (!sesion) {
    return <LoginAuthView alAutenticar={handleAutenticado} />;
  }

  // ========================================================
  // 2. SI HAY SESIÓN Y ESTÁ EN DASHBOARD: MIS PARCELAS
  // ========================================================
  if (vistaActual === 'dashboard') {
    return (
      <DashboardParcelasView
        sesion={sesion}
        alAgregarParcela={handleIniciarNuevaParcela}
        alCerrarSesion={handleCerrarSesion}
        alSeleccionarParcela={handleSeleccionarParcelaExistente}
      />
    );
  }

  // ========================================================
  // 3. SI HAY SESIÓN Y ESTÁ EN FLUJO: DELIMITACIÓN / EVALUACIÓN
  // ========================================================
  return (
    <div className="flex flex-col h-screen w-screen bg-cream text-ink overflow-hidden">
      {/* Encabezado Principal del Flujo de Parcela */}
      <header className="h-[65px] px-4 border-b border-cream-line bg-white flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setVistaActual('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cream-line bg-cream/70 hover:bg-cream text-ink text-xs font-bold transition-all shrink-0"
            title="Volver al listado de parcelas"
          >
            <ChevronLeft className="w-4 h-4 text-ink" />
            <span className="hidden sm:inline">Mis Parcelas</span>
          </button>

          <div className="w-8 h-8 rounded-xl bg-ink text-white flex items-center justify-center shadow-sm shrink-0">
            <Sprout className="w-4 h-4 text-maize" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-ink">NasKob</span>
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  esActivo
                    ? 'bg-ink text-white shadow-sm'
                    : esCompletado
                    ? 'text-ok bg-ok-bg/50 hover:bg-ok-bg cursor-pointer'
                    : 'text-ink-muted opacity-50 cursor-not-allowed'
                }`}
              >
                {esCompletado && (
                  <Check className="w-3 h-3 stroke-[3]" />
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
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 bg-ok-bg text-ok rounded-lg text-xs font-semibold border border-ok/30 max-w-[160px] sm:max-w-xs truncate"
              title={parcelaActiva.nombre || `Parcela ${parcelaActiva.area_ha} ha`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {parcelaActiva.nombre || `Parcela ${parcelaActiva.area_ha} ha`}
              </span>
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
            alIrADashboard={() => setVistaActual('dashboard')}
          />
        )}
      </main>
    </div>
  );
}
