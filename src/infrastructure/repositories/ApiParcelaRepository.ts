import { Parcela, ParcelaInput } from '@/domain/models/parcela';
import { ParcelaRepository } from '@/domain/ports/ParcelaRepository';
import { apiParcelaAdapter } from '@/infrastructure/adapters/apiParcelaAdapter';
import { guardarParcelaLocal, obtenerParcelasLocales } from '@/utils/parcelasStorage';
import { obtenerSesion } from '@/utils/sessionStorage';

export class ApiParcelaRepository implements ParcelaRepository {
  private parcelaActiva: Parcela | null = null;

  async guardarParcela(input: ParcelaInput): Promise<Parcela> {
    const idLocal = `parc_${Date.now()}`;
    const nuevaParcela: Parcela = {
      id_parcela: idLocal,
      nombre: input.nombre || 'Parcela Chiapas',
      poligono: input.poligono,
      area_ha: input.area_ha,
      metodo_delimitacion: input.metodo_delimitacion,
      region: 'frailesca',
      estado_region: 'preparada',
      fecha_creacion: new Date().toISOString(),
    };

    // 1. Siempre guardar en almacenamiento local para funcionamiento offline
    guardarParcelaLocal(nuevaParcela);
    this.parcelaActiva = nuevaParcela;

    // 2. Si el usuario está autenticado y hay internet, sincronizar con la API inmediatamente
    const sesion = obtenerSesion();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (sesion?.token && !sesion.esInvitado && isOnline) {
      try {
        const respuesta = await apiParcelaAdapter.crearParcela(nuevaParcela, sesion.token);
        if (respuesta?.id_parcela) {
          nuevaParcela.id_parcela = String(respuesta.id_parcela);
          guardarParcelaLocal(nuevaParcela, undefined, undefined, true, String(respuesta.id_parcela), idLocal);
          this.parcelaActiva = nuevaParcela;
        }
      } catch (err) {
        console.warn('[ApiParcelaRepository] Parcela guardada localmente; se sincronizará al detectar red.', err);
      }
    }

    return nuevaParcela;
  }

  async obtenerParcelaActual(): Promise<Parcela | null> {
    if (this.parcelaActiva) {
      return this.parcelaActiva;
    }
    const guardadas = obtenerParcelasLocales();
    if (guardadas.length > 0) {
      this.parcelaActiva = guardadas[0].parcela;
      return this.parcelaActiva;
    }
    return null;
  }
}
