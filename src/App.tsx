import { Sprout } from 'lucide-react';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-cream text-ink">
      <header className="p-4 border-b border-cream-line bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-ink text-white flex items-center justify-center">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">NasKob</span>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-maize/20 text-maize-dark rounded-full">
          PWA Offline Ready
        </span>
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto p-4 flex flex-col justify-center items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-ink/10 text-ink flex items-center justify-center mb-4">
          <Sprout className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold mb-2 text-ink">
          NasKob · Rotación Resiliente
        </h1>
        <p className="text-sm text-ink-muted mb-6">
          Plataforma de apoyo a la decisión de rotación de cultivos para productores de La Frailesca, Chiapas.
        </p>

        <div className="w-full bg-white border border-cream-line rounded-naskob p-4 text-left shadow-sm">
          <p className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Estado del Entorno</p>
          <ul className="text-xs space-y-1.5 text-ink-muted">
            <li className="flex items-center justify-between">
              <span>Modo de datos:</span>
              <strong className="text-ink">Mock (Offline local)</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>Mapas descargados:</span>
              <strong className="text-ok">Frailesca + Chiapas (PMTiles)</strong>
            </li>
            <li className="flex items-center justify-between">
              <span>Arquitectura:</span>
              <strong className="text-ink">Limpia / Hexagonal</strong>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
