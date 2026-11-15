import React, { useEffect, useState } from 'react';
import {
  Download,
  CheckCircle2,
  Wifi,
  WifiOff,
  AlertTriangle,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  MAP_CONFIGS,
  MapKey,
  getStoredMapBlob,
  isMapStored,
  downloadMapWithProgress,
  deleteStoredMap,
} from '../utils/mapStorage';

interface Props {
  onMapLoaded: (key: MapKey, blob: Blob) => void;
}

export const GestorMapaOffline: React.FC<Props> = ({ onMapLoaded }) => {
  const [chiapasListo, setChiapasListo] = useState<boolean>(false);
  const [descargando, setDescargando] = useState<MapKey | null>(null);
  const [progresoDescarga, setProgresoDescarga] = useState<{
    percent: number;
    loadedMb: string;
    totalMb: string;
  } | null>(null);
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [expandido, setExpandido] = useState<boolean>(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Monitorear conectividad online/offline
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Verificar mapas existentes al inicio y auto-descargar Chiapas Completo si es necesario
  useEffect(() => {
    let activo = true;

    async function verificarYInicializar() {
      try {
        const tieneChiapas = await isMapStored('chiapas');

        if (!activo) return;
        setChiapasListo(tieneChiapas);

        if (tieneChiapas) {
          const blob = await getStoredMapBlob('chiapas');
          if (blob && activo) {
            onMapLoaded('chiapas', blob);
          }
        }

        // Si Chiapas completo no está guardado y hay internet, auto-descargarlo para cobertura estatal total
        if (!tieneChiapas && navigator.onLine && activo) {
          await descargarMapaDirecto('chiapas');
        }
      } catch (err) {
        console.warn('[GestorMapaOffline] Error al verificar mapas:', err);
      }
    }

    verificarYInicializar();

    return () => {
      activo = false;
    };
  }, []);

  const descargarMapaDirecto = async (key: MapKey) => {
    setDescargando(key);
    setMensajeError(null);
    setProgresoDescarga({ percent: 0, loadedMb: '0.0', totalMb: MAP_CONFIGS[key].sizeLabel });

    try {
      const blob = await downloadMapWithProgress(key, ({ loaded, total, percent }) => {
        setProgresoDescarga({
          percent,
          loadedMb: (loaded / (1024 * 1024)).toFixed(1),
          totalMb: (total / (1024 * 1024)).toFixed(1) + ' MB',
        });
      });

      if (key === 'chiapas') setChiapasListo(true);

      onMapLoaded(key, blob);
    } catch (err: any) {
      console.error(`[GestorMapaOffline] Error descargando ${key}:`, err);
      setMensajeError(`No se pudo descargar ${MAP_CONFIGS[key].name}: ${err?.message || 'Error de conexión'}`);
    } finally {
      setDescargando(null);
      setProgresoDescarga(null);
    }
  };

  const ejecutarDescarga = async (key: MapKey) => {
    if (descargando) return;
    await descargarMapaDirecto(key);
  };

  const ejecutarEliminar = async (key: MapKey) => {
    try {
      await deleteStoredMap(key);
      if (key === 'chiapas') setChiapasListo(false);
    } catch (err) {
      console.warn('[GestorMapaOffline] Error eliminando mapa:', err);
    }
  };

  return (
    <div className="w-full bg-white border border-cream-line rounded-lg shadow-xs overflow-hidden transition-all text-xs">
      {/* Barra de Estado Resumida */}
      <div className="p-2.5 sm:p-3 flex items-center justify-between flex-wrap gap-2 bg-[#f8faf9]">
        <div className="flex items-center gap-2">
          {chiapasListo ? (
            <div className="flex items-center gap-1.5 text-ok font-bold">
              <CheckCircle2 className="w-4 h-4 text-ok shrink-0" />
              <span>Todo Chiapas Offline: Guardado (54 MB en dispositivo · Cobertura estatal completa)</span>
            </div>
          ) : descargando === 'chiapas' ? (
            <div className="flex items-center gap-1.5 text-navy font-bold">
              <Loader2 className="w-4 h-4 animate-spin text-navy shrink-0" />
              <span>
                Guardando mapa de Todo Chiapas ({progresoDescarga?.percent || 0}% · {progresoDescarga?.loadedMb} MB /{' '}
                {progresoDescarga?.totalMb})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-700 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {online
                  ? 'Mapa de Chiapas no guardado todavía'
                  : 'Sin conexión · Requiere internet una vez para guardar el mapa estatal'}
              </span>
            </div>
          )}

          {online ? (
            <span className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200">
              <Wifi className="w-3 h-3" /> En línea
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-300">
              <WifiOff className="w-3 h-3" /> Modo Campo (Offline)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!chiapasListo && !descargando && online && (
            <button
              onClick={() => ejecutarDescarga('chiapas')}
              className="px-2.5 py-1 rounded bg-ok text-white font-bold hover:bg-ok-light flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
            >
              <Download className="w-3.5 h-3.5" /> Descargar Todo Chiapas (54 MB)
            </button>
          )}

          <button
            onClick={() => setExpandido(!expandido)}
            className="p-1 rounded hover:bg-cream text-ink-muted hover:text-ink transition-colors flex items-center gap-1 text-[11px]"
            title="Administrar almacenamiento de mapas offline"
          >
            <span>{expandido ? 'Ocultar' : 'Detalles'}</span>
            {expandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Barra de progreso interactiva si está descargando */}
      {descargando && (
        <div className="w-full bg-emerald-100 h-1.5 overflow-hidden">
          <div
            className="bg-ok h-full transition-all duration-300 ease-out"
            style={{ width: `${progresoDescarga?.percent || 0}%` }}
          />
        </div>
      )}

      {/* Mensaje de error si ocurre */}
      {mensajeError && (
        <div className="p-2.5 bg-rose-50 border-t border-rose-200 text-rose-700 text-[11px] flex items-center justify-between gap-2">
          <span>{mensajeError}</span>
          <button
            onClick={() => setMensajeError(null)}
            className="font-bold underline text-rose-800 hover:text-rose-950"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Panel Detallado Expandible */}
      {expandido && (
        <div className="p-3 border-t border-cream-line space-y-3 bg-white">
          <p className="text-ink-muted text-[11px] leading-relaxed">
            NasKob almacena el mapa vectorial de todo el estado de Chiapas en la memoria local de tu dispositivo.
            Podrás delimitar parcelas, caminar linderos y orientarte en el campo agrícola aunque no tengas señal celular ni datos.
          </p>

          <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-ink text-xs">
                  {MAP_CONFIGS.chiapas.name}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-cream-line text-ink-muted">
                  {MAP_CONFIGS.chiapas.sizeLabel}
                </span>
              </div>
              <p className="text-[10px] text-ink-muted mt-0.5">
                {MAP_CONFIGS.chiapas.description}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1 sm:pt-0">
              {chiapasListo ? (
                <>
                  <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Instalado en móvil
                  </span>
                  <button
                    onClick={() => ejecutarEliminar('chiapas')}
                    disabled={descargando !== null}
                    className="text-rose-600 hover:text-rose-800 p-1 text-[11px] flex items-center gap-0.5"
                    title="Eliminar de la memoria"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Borrar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => ejecutarDescarga('chiapas')}
                  disabled={descargando !== null || !online}
                  className="w-full sm:w-auto py-1.5 px-3 rounded bg-ink text-white font-bold hover:bg-ink-light disabled:opacity-50 flex items-center justify-center gap-1 text-[11px] transition-colors"
                >
                  {descargando === 'chiapas' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" /> Descargar {MAP_CONFIGS.chiapas.sizeLabel}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
