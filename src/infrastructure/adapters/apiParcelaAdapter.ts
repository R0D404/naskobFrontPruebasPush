import { ParcelasApiPort } from '@/domain/ports/ParcelasApiPort';
import { ParcelaResumen } from '@/domain/models/parcelaResumen';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/v1').replace(/\/$/, '');

export class ApiParcelaAdapter implements ParcelasApiPort {
  async listarParcelas(token: string): Promise<ParcelaResumen[]> {
    if (!token) {
      throw new Error('Falta el token de autenticación.');
    }

    // Modo invitado / demo
    if (token.startsWith('demo_')) {
      return [];
    }

    const url = `${BASE_URL}/parcelas`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
    } catch (networkError) {
      throw new Error('OFFLINE_OR_UNREACHABLE');
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('SESION_EXPIRADA');
      }
      throw new Error('ERROR_CARGAR_PARCELAS');
    }

    const data = await response.json();
    return (data.parcelas || []).map((item: any) => ({
      id_parcela: item.id_parcela,
      area_ha: Number(item.area_ha),
      estado: item.estado,
    }));
  }
}

export const apiParcelaAdapter = new ApiParcelaAdapter();
