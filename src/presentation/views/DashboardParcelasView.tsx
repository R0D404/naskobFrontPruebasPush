import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Plus,
  Wifi,
  WifiOff,
  LogOut,
  LogIn,
  RefreshCw,
  AlertCircle,
  Layers,
  ChevronRight,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { SesionUsuario } from '@/domain/models/auth';
import { ParcelaResumen } from '@/domain/models/parcelaResumen';
import { apiParcelaAdapter } from '@/infrastructure/adapters/apiParcelaAdapter';
import {
  eliminarParcelaLocal,
  limpiarYConsolidarParcelasLocales,
} from '@/utils/parcelasStorage';
import { sincronizarParcelasPendientes } from '@/utils/sincronizadorParcelas';

export interface DashboardParcelasViewProps {
  sesion: SesionUsuario;
  alAgregarParcela: () => void;
  alCerrarSesion: () => void;
  alIniciarSesion?: () => void;
  alSeleccionarParcela?: (parcela: ParcelaResumen) => void;
}

export const DashboardParcelasView: React.FC<DashboardParcelasViewProps> = ({
  sesion,
  alAgregarParcela,
  alCerrarSesion,
  alIniciarSesion,
  alSeleccionarParcela,
}) => {
  const [estaEnLinea, setEstaEnLinea] = useState<boolean>(navigator.onLine);
  const [parcelas, setParcelas] = useState<ParcelaResumen[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Escuchar eventos de red en tiempo real
  useEffect(() => {
    const handleOnline = () => setEstaEnLinea(true);
    const handleOffline = () => setEstaEnLinea(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const cargarParcelas = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);

    // 1. Consolidar y cargar parcelas guardadas localmente en este dispositivo
    const locales = limpiarYConsolidarParcelasLocales();
    const resumenesLocales: ParcelaResumen[] = locales.map((loc) => ({
      id_parcela: loc.id_remoto || loc.id_parcela,
      area_ha: loc.area_ha,
      estado: loc.estado,
      nombre: loc.nombre,
      fecha_guardado: loc.fecha_guardado,
      recomendacion_principal: loc.recomendacion_principal,
      origen: 'local',
    }));

    // Si no hay conexión o es usuario demo/invitado, usamos directamente las locales
    if (!navigator.onLine || sesion.token.startsWith('demo_') || sesion.esInvitado) {
      setEstaEnLinea(navigator.onLine);
      setParcelas(resumenesLocales);
      setCargando(false);
      return;
    }

    try {
      // Intentar sincronizar primero parcelas offline pendientes
      await sincronizarParcelasPendientes();

      const nube = await apiParcelaAdapter.listarParcelas(sesion.token);
      // Refrescar y consolidar locales tras la sincronización
      const localesActualizados = limpiarYConsolidarParcelasLocales();
      const idsLocales = new Set<string>();
      const firmasLocales = new Set<string>();

      localesActualizados.forEach((loc) => {
        if (loc.id_parcela) idsLocales.add(loc.id_parcela);
        if (loc.id_remoto) idsLocales.add(loc.id_remoto);
        if (loc.nombre) {
          firmasLocales.add(`${loc.nombre.trim().toLowerCase()}_${loc.area_ha.toFixed(2)}`);
        }
      });

      const resumenesActualizados: ParcelaResumen[] = localesActualizados.map((loc) => ({
        id_parcela: loc.id_remoto || loc.id_parcela,
        area_ha: loc.area_ha,
        estado: loc.estado,
        nombre: loc.nombre,
        fecha_guardado: loc.fecha_guardado,
        recomendacion_principal: loc.recomendacion_principal,
        origen: 'local' as const,
      }));

      // Deduplicar la lista que viene de la nube (evitando que parcelas repetidas en la BD se dupliquen)
      const nubeDeduplicada: ParcelaResumen[] = [];
      const firmasNubeVistas = new Set<string>();

      for (const p of nube) {
        const id = p.id_parcela;
        const firma = p.nombre
          ? `${p.nombre.trim().toLowerCase()}_${Number(p.area_ha).toFixed(2)}`
          : id;

        // Si ya está en locales o ya la agregamos de la nube, omitir
        if (idsLocales.has(id) || firmasLocales.has(firma) || firmasNubeVistas.has(firma)) {
          continue;
        }

        firmasNubeVistas.add(firma);
        nubeDeduplicada.push({
          ...p,
          origen: 'nube' as const,
        });
      }

      setParcelas([...resumenesActualizados, ...nubeDeduplicada]);
      setEstaEnLinea(true);
    } catch (err: any) {
      if (err.message === 'OFFLINE_OR_UNREACHABLE') {
        setEstaEnLinea(false);
        setParcelas(resumenesLocales);
      } else if (err.message === 'SESION_EXPIRADA') {
        alCerrarSesion();
      } else {
        // En caso de error de red con la API, mantenemos las parcelas del dispositivo
        setParcelas(resumenesLocales);
      }
    } finally {
      setCargando(false);
    }
  }, [sesion.token, alCerrarSesion]);

  useEffect(() => {
    cargarParcelas();
  }, [cargarParcelas, estaEnLinea]);

  return (
    <div className="w-full h-full min-h-screen bg-cream flex flex-col justify-between overflow-y-auto">
      {/* Contenedor Central */}
      <div className="max-w-3xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
        
        {/* Barra Superior de Estado y Perfil */}
        <div className="bg-white rounded-2xl border border-cream-line p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-cream-line flex items-center justify-center shadow-xs shrink-0 overflow-hidden p-1">
              <img src="/logo-naskob-symbol.png" alt="NasKob" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-ink">
                  Mis Parcelas
                </h1>
                {/* Indicador de Conexión en Tiempo Real */}
                {estaEnLinea ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ok bg-ok-bg px-2.5 py-0.5 rounded-full border border-ok/30">
                    <Wifi className="w-3 h-3 text-ok" />
                    En línea
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-terra bg-terra-bg px-2.5 py-0.5 rounded-full border border-terra/30">
                    <WifiOff className="w-3 h-3 text-terra" />
                    Sin conexión
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-muted truncate max-w-[240px] sm:max-w-xs">
                {sesion.esInvitado ? 'Productor Invitado (Modo Demo)' : sesion.correo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {estaEnLinea && (
              <button
                type="button"
                onClick={cargarParcelas}
                disabled={cargando}
                className="p-2.5 rounded-xl border border-cream-line text-ink hover:bg-cream transition-all text-xs font-bold flex items-center gap-1.5"
                title="Actualizar lista de parcelas"
              >
                <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-maize-dark' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            )}
            {sesion.esInvitado ? (
              <button
                type="button"
                onClick={alIniciarSesion}
                className="px-3 py-2 rounded-xl border border-cream-line bg-ink text-white hover:bg-ink-light active:scale-[0.98] transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm"
                title="Iniciar sesión"
              >
                <LogIn className="w-4 h-4 text-maize shrink-0" />
                <span>Iniciar sesión</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={alCerrarSesion}
                className="p-2.5 sm:px-3 sm:py-2 rounded-xl border border-cream-line text-terra hover:bg-terra-bg/30 active:scale-[0.98] transition-all text-xs font-bold flex items-center gap-1.5"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* BOTÓN PRINCIPAL: + AGREGAR PARCELA (SIEMPRE DISPONIBLE) */}
        {/* ======================================================== */}
        <div className="bg-gradient-to-r from-ink to-ink/90 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-maize">
              <Layers className="w-3.5 h-3.5" />
              <span>Levantamiento en Campo</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              ¿Deseas evaluar un nuevo terreno?
            </h2>
            <p className="text-xs text-white/80 max-w-md">
              Delimita el polígono de tu parcela usando el mapa satelital vectorial de Chiapas. Funciona 100% sin internet.
            </p>
          </div>

          <button
            type="button"
            onClick={alAgregarParcela}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-maize hover:bg-maize-light active:scale-[0.98] text-ink font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 shrink-0 group"
          >
            <Plus className="w-5 h-5 stroke-[2.5] text-ink group-hover:rotate-90 transition-transform duration-200" />
            <span>Agregar Parcela</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* LISTADO DE PARCELAS REGISTRADAS (LOCALES Y NUBE)         */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-extrabold text-ink tracking-tight flex items-center gap-2">
              <span>Parcelas registradas</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-ink/5 text-ink">
                {parcelas.length}
              </span>
            </h3>

            {!estaEnLinea && (
              <span className="text-[11px] font-bold text-terra bg-terra-bg px-2.5 py-0.5 rounded-full border border-terra/30 flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> Modo local
              </span>
            )}
          </div>

          {cargando ? (
            <div className="bg-white rounded-2xl border border-cream-line p-10 text-center space-y-3 shadow-sm">
              <RefreshCw className="w-8 h-8 animate-spin text-maize-dark mx-auto" />
              <p className="text-xs text-ink-muted font-medium">
                Cargando parcelas del productor...
              </p>
            </div>
          ) : errorCarga && parcelas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-terra/30 p-6 text-center space-y-3 shadow-sm">
              <AlertCircle className="w-8 h-8 text-terra mx-auto" />
              <p className="text-xs text-terra font-semibold">{errorCarga}</p>
              <button
                type="button"
                onClick={cargarParcelas}
                className="px-4 py-2 rounded-xl bg-ink text-white text-xs font-bold hover:bg-ink-light transition-all"
              >
                Reintentar
              </button>
            </div>
          ) : parcelas.length === 0 ? (
            /* Sin parcelas aún */
            !estaEnLinea ? (
              <div className="bg-white rounded-2xl border border-terra/20 p-6 sm:p-8 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-terra-bg flex items-center justify-center text-terra mx-auto">
                  <WifiOff className="w-7 h-7 text-terra" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-base font-extrabold text-ink">
                    Modo Sin Conexión a Internet
                  </h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Aún no tienes parcelas guardadas en este dispositivo.
                  </p>
                  <p className="text-xs text-ink font-semibold bg-cream/70 p-2.5 rounded-xl border border-cream-line mt-2">
                    📍 Tu mapa vectorial de Chiapas está disponible localmente. Pulsa el botón de arriba <strong>«Agregar Parcela»</strong> para delimitar parcelas en el campo sin señal.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-cream-line p-8 sm:p-12 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center text-ink-muted mx-auto">
                  <MapPin className="w-7 h-7 text-ink-muted" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h4 className="text-sm font-bold text-ink">
                    Aún no tienes parcelas registradas
                  </h4>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Presiona el botón de arriba <strong>«Agregar Parcela»</strong> para marcar tu terreno en el mapa de Chiapas y evaluar la rotación resiliente.
                  </p>
                </div>
              </div>
            )
          ) : (
            /* Grid con las parcelas del productor */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {parcelas.map((parcela, index) => (
                <div
                  key={parcela.id_parcela || index}
                  className="bg-white rounded-2xl border border-cream-line p-4 sm:p-5 shadow-sm hover:border-ink/30 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-ok-bg text-ok flex items-center justify-center font-bold text-xs shrink-0">
                        <MapPin className="w-5 h-5 text-ok" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-ink">
                          {parcela.nombre || `Parcela #${index + 1}`}
                        </h4>
                        <span className="text-[11px] text-ink-muted font-mono truncate block max-w-[170px]">
                          {parcela.id_parcela}
                        </span>
                        {parcela.recomendacion_principal && (
                          <span className="text-[11px] font-bold text-ok block mt-0.5">
                            🌱 Propuesta: {parcela.recomendacion_principal}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          parcela.estado === 'con_declaracion'
                            ? 'bg-ok-bg text-ok border border-ok/30'
                            : 'bg-cream text-ink-muted border border-cream-line'
                        }`}
                      >
                        {parcela.estado === 'con_declaracion' ? 'Evaluada' : 'Registrada'}
                      </span>
                      {parcela.origen === 'local' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cream text-ink-muted border border-cream-line">
                          📱 En dispositivo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-cream-line/70 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-ink-muted block">Superficie</span>
                      <span className="font-extrabold text-ink text-sm">
                        {parcela.area_ha.toFixed(2)} ha
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          eliminarParcelaLocal(parcela.id_parcela);
                          if (estaEnLinea && sesion?.token && !sesion.token.startsWith('demo_')) {
                            try {
                              await apiParcelaAdapter.eliminarParcela(parcela.id_parcela, sesion.token);
                            } catch (err) {
                              console.warn('[DashboardParcelasView] Error al eliminar de API:', err);
                            }
                          }
                          cargarParcelas();
                        }}
                        className="p-1.5 rounded-lg text-terra/60 hover:text-terra hover:bg-terra-bg/50 transition-all cursor-pointer"
                        title="Eliminar parcela"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => alSeleccionarParcela?.(parcela)}
                        className="px-3 py-1.5 rounded-lg bg-ink/5 hover:bg-ink hover:text-white text-ink text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ver detalle</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Garantías y Respaldo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-white/80 rounded-xl border border-cream-line p-3.5 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-ok shrink-0" />
            <span className="text-[11px] text-ink-muted">
              Cobertura estatal de Chiapas precargada en memoria IndexedDB.
            </span>
          </div>
          <div className="bg-white/80 rounded-xl border border-cream-line p-3.5 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-ok shrink-0" />
            <span className="text-[11px] text-ink-muted">
              Modelos de rotación resiliente con series NASA IMERG y POWER.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
