import { Parcela, ParcelaInput } from '../models/parcela';

export interface ParcelaRepository {
  guardarParcela(input: ParcelaInput): Promise<Parcela>;
  obtenerParcelaActual?(): Promise<Parcela | null>;
}
