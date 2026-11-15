import { ParcelaResumen } from '../models/parcelaResumen';

export interface ParcelasApiPort {
  listarParcelas(token: string): Promise<ParcelaResumen[]>;
}
