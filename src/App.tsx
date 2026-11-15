import { useState } from 'react';
import { Sprout, CheckCircle2, MapPin, Database } from 'lucide-react';
import { MapaParcelaNaskob } from './components/MapaParcelaNaskob';
import { BotonInstalarPWA } from './components/BotonInstalarPWA';
import { ResultadoParcelaConfirmada } from './types/parcela';

export default function App() {
  const [parcelaConfirmada, setParcelaConfirmada] =
    useState<ResultadoParcelaConfirmada | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-cream text-ink">
      <header className="p-3 sm:p-4 border-b border-cream-line bg-white flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-ink text-white flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight block leading-none">
              NasKob · Rotación Resiliente
            </span>
            <span className="text-[10px] sm:text-[11px] text-ink-muted">
              Delimitación de Parcela y Filtrado Satelital NASA (Online / Offline)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BotonInstalarPWA />
          <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1 bg-ok-bg text-ok rounded-full">
            Offline Ready · PMTiles
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col gap-5">
        <MapaParcelaNaskob
          onParcelaConfirmada={(resultado) => setParcelaConfirmada(resultado)}
        />

        {parcelaConfirmada && (
          <section className="bg-white border-2 border-ok rounded-naskob p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-ok font-extrabold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  Parcela Confirmada y Datos de la NASA Filtrados para{' '}
                  {parcelaConfirmada.ubicacionFiltroNasa.municipioReferencia}
                </span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-cream font-semibold text-ink">
                Modo captura: {parcelaConfirmada.modoCaptura.toUpperCase()} · Vista:{' '}
                {parcelaConfirmada.modoMapaUsado.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-cream border border-cream-line">
                <div className="flex items-center gap-1.5 font-bold text-ink mb-1">
                  <MapPin className="w-4 h-4 text-terra" />
                  <span>Resumen Geométrico</span>
                </div>
                <p>
                  <strong>Área:</strong> {parcelaConfirmada.areaHectareas} ha (
                  {parcelaConfirmada.areaMetrosCuadrados.toLocaleString()} m²)
                </p>
                <p>
                  <strong>Perímetro:</strong> {parcelaConfirmada.perimetroMetros} m
                </p>
                <p>
                  <strong>Vértices:</strong> {parcelaConfirmada.verticesWGS84.length} puntos
                </p>
                <p>
                  <strong>Centroide:</strong>{' '}
                  {parcelaConfirmada.ubicacionFiltroNasa.latitud},{' '}
                  {parcelaConfirmada.ubicacionFiltroNasa.longitud}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-cream border border-cream-line md:col-span-2">
                <div className="flex items-center gap-1.5 font-bold text-ink mb-1">
                  <Database className="w-4 h-4 text-navy" />
                  <span>
                    Payload Listo para API / Motor de Reglas (POST /v1/parcelas)
                  </span>
                </div>
                <pre className="text-[11px] bg-white p-2.5 rounded border border-cream-line overflow-x-auto max-h-44">
                  {JSON.stringify(
                    {
                      modo_captura: parcelaConfirmada.modoCaptura,
                      area_ha: parcelaConfirmada.areaHectareas,
                      estado_region: parcelaConfirmada.estadoRegion,
                      ubicacion_filtro_nasa: parcelaConfirmada.ubicacionFiltroNasa,
                      perfil_nasa_filtrado: parcelaConfirmada.perfilNasaAsociado,
                      geometria_geojson: parcelaConfirmada.geometriaGeoJSON,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
