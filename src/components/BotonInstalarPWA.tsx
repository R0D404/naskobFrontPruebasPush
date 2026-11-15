import { useState, useEffect } from 'react';
import { Download, Check, Smartphone, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function BotonInstalarPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [estaInstalada, setEstaInstalada] = useState<boolean>(false);
  const [mostrarModalGuia, setMostrarModalGuia] = useState<boolean>(false);
  const [esIOS, setEsIOS] = useState<boolean>(false);

  useEffect(() => {
    // Detectar si ya se está ejecutando como PWA instalada
    const esStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone === true);
    
    if (esStandalone) {
      setEstaInstalada(true);
    }

    // Detectar si es dispositivo iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const esDispositivoIOS = /iphone|ipad|ipod/.test(userAgent);
    setEsIOS(esDispositivoIOS);

    // Escuchar el evento antes de la instalación (Chrome, Edge, Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Escuchar cuando la app ya fue instalada
    const handleAppInstalled = () => {
      setEstaInstalada(true);
      setDeferredPrompt(null);
      setMostrarModalGuia(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleClickInstalar = async () => {
    if (estaInstalada) {
      return;
    }

    if (deferredPrompt) {
      // Disparar prompt nativo del navegador
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setEstaInstalada(true);
      }
    } else {
      // Si es iOS o el navegador aún no generó el prompt, mostrar modal de instrucciones paso a paso
      setMostrarModalGuia(true);
    }
  };

  if (estaInstalada) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-ok-bg text-ok border border-ok/20">
        <Check className="w-3.5 h-3.5" />
        <span>App Instalada</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClickInstalar}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-ok hover:bg-ok-hover active:scale-95 transition-all shadow-sm"
        title="Descargar e instalar NasKob como aplicación PWA offline"
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span>Descargar PWA</span>
      </button>

      {/* Modal Guía de Instalación para móviles / iOS / navegadores */}
      {mostrarModalGuia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-cream-line flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-ink font-bold text-base">
                <Smartphone className="w-5 h-5 text-ok" />
                <span>Instalar NasKob en tu Celular</span>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalGuia(false)}
                className="text-ink-muted hover:text-ink p-1 rounded-lg hover:bg-cream"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              Puedes instalar NasKob directamente en tu pantalla de inicio para usarla como una aplicación nativa, incluso sin conexión a internet.
            </p>

            {esIOS ? (
              <div className="bg-cream p-3.5 rounded-xl border border-cream-line flex flex-col gap-2.5 text-xs text-ink">
                <div className="font-bold flex items-center gap-1.5 text-ink">
                  <Share className="w-4 h-4 text-navy" />
                  <span>En iPhone / iPad (Safari):</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                  <li>Toca el botón <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba en la barra inferior).</li>
                  <li>Desplázate hacia abajo y selecciona <strong>"Añadir a la pantalla de inicio"</strong>.</li>
                  <li>Toca <strong>"Añadir"</strong> en la esquina superior derecha.</li>
                </ol>
              </div>
            ) : (
              <div className="bg-cream p-3.5 rounded-xl border border-cream-line flex flex-col gap-2.5 text-xs text-ink">
                <div className="font-bold flex items-center gap-1.5 text-ink">
                  <Smartphone className="w-4 h-4 text-ok" />
                  <span>En Android (Chrome / Brave / Edge):</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                  <li>Toca el menú de <strong>tres puntos (⋮)</strong> en la esquina superior derecha del navegador.</li>
                  <li>Busca la opción <strong>"Instalar aplicación"</strong> o <strong>"Añadir a la pantalla de inicio"</strong>.</li>
                  <li>Confirma la instalación y aparecerá en tus aplicaciones.</li>
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMostrarModalGuia(false)}
              className="w-full py-2 bg-ink text-white rounded-xl text-xs font-bold hover:bg-ink-hover transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
