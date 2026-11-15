import { Parcela, ParcelaInput } from '@/domain/models/parcela';
import { ParcelaRepository } from '@/domain/ports/ParcelaRepository';

export class ParcelaMockRepository implements ParcelaRepository {
  private parcelaGuardada: Parcela | null = null;

  async guardarParcela(input: ParcelaInput): Promise<Parcela> {
    // Simulación de latencia de red (200ms)
    await new Promise((resolve) => setTimeout(resolve, 200));

    const nuevaParcela: Parcela = {
      id_parcela: `parc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nombre: input.nombre || 'Parcela La Frailesca',
      poligono: input.poligono,
      area_ha: input.area_ha,
      metodo_delimitacion: input.metodo_delimitacion,
      region: 'frailesca',
      estado_region: 'preparada',
      fecha_creacion: new Date().toISOString(),
    };

    this.parcelaGuardada = nuevaParcela;
    try {
      localStorage.setItem('naskob_parcela_activa', JSON.stringify(nuevaParcela));
    } catch {
      // Manejo silencioso en caso de restricciones de almacenamiento
    }

    return nuevaParcela;
  }

  async obtenerParcelaActual(): Promise<Parcela | null> {
    if (this.parcelaGuardada) {
      return this.parcelaGuardada;
    }

    try {
      const stored = localStorage.getItem('naskob_parcela_activa');
      if (stored) {
        this.parcelaGuardada = JSON.parse(stored);
        return this.parcelaGuardada;
      }
    } catch {
      // Ignorar error de parsing
    }

    return null;
  }
}
