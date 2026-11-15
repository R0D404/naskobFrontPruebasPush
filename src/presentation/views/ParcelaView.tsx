import React from 'react';
import { Parcela, MetodoDelimitacion } from '@/domain/models/parcela';
import { MapaParcelaNaskob } from '@/components/MapaParcelaNaskob';
import { ResultadoParcelaConfirmada } from '@/types/parcela';

interface ParcelaViewProps {
  parcelaInicial?: Parcela | null;
  onParcelaConfirmada: (parcela: Parcela) => void;
}

export const ParcelaView: React.FC<ParcelaViewProps> = ({
  parcelaInicial,
  onParcelaConfirmada,
}) => {
  const handleConfirmada = (resultado: ResultadoParcelaConfirmada) => {
    const coordsWgs84 = resultado.verticesWGS84.map(([lng, lat]) => [lng, lat]);
    if (
      coordsWgs84.length > 0 &&
      (coordsWgs84[0][0] !== coordsWgs84[coordsWgs84.length - 1][0] ||
        coordsWgs84[0][1] !== coordsWgs84[coordsWgs84.length - 1][1])
    ) {
      coordsWgs84.push([...coordsWgs84[0]]);
    }

    const metodo: MetodoDelimitacion =
      resultado.modoCaptura === 'caminando' ? 'caminando' : 'dibujo';

    const nuevaParcela: Parcela = {
      id_parcela: `parc_${Date.now()}`,
      nombre: resultado.nombre || `Parcela ${resultado.areaHectareas.toFixed(2)} ha`,
      area_ha: resultado.areaHectareas,
      estado_region: resultado.estadoRegion,
      metodo_delimitacion: metodo,
      region: 'chiapas',
      fecha_creacion: new Date().toISOString(),
      poligono: {
        type: 'Polygon',
        coordinates: [coordsWgs84],
      },
    };

    onParcelaConfirmada(nuevaParcela);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-cream p-3 sm:p-5">
      <div className="max-w-5xl mx-auto space-y-4">
        <MapaParcelaNaskob
          onParcelaConfirmada={handleConfirmada}
          nombreInicial={parcelaInicial?.nombre}
        />
      </div>
    </div>
  );
};
