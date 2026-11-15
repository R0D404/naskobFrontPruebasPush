import { ParcelasApiPort } from '@/domain/ports/ParcelasApiPort';
import { ParcelaResumen } from '@/domain/models/parcelaResumen';
import { Parcela } from '@/domain/models/parcela';
import { DeclaracionCompleta } from '@/domain/models/declaracion';

const rawBase = (import.meta.env.VITE_API_BASE_URL || '/v1').trim().replace(/\/$/, '');
const BASE_URL = rawBase.endsWith('/v1') ? rawBase : `${rawBase}/v1`;
const PWA_API_KEY = (import.meta.env.VITE_PWA_API_KEY || 'aSqiDA7E0XyW8TSTVxvYaCo7OxvHbPR1qfEe9Qp4e2I').trim();

export class ApiParcelaAdapter implements ParcelasApiPort {
  private getHeaders(token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': PWA_API_KEY,
    };
    if (token && !token.startsWith('demo_')) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * POST /v1/parcelas
   * Crear Parcela: Guarda el polígono delimitado en Chiapas (1 a 10 ha).
   * La geometría se cifra con AES-GCM (privacidad RNF01).
   */
  async crearParcela(
    parcela: Parcela,
    token?: string
  ): Promise<{ id_parcela: string; area_ha: number }> {
    const url = `${BASE_URL}/parcelas`;

    // Extraer anillo de coordenadas en formato [[lng, lat], ...]
    const coords = parcela.poligono?.coordinates?.[0] || [];
    let coordinatesValidas = coords.map(([lng, lat]) => [Number(lng), Number(lat)]);

    // Asegurar anillo cerrado (primer punto = último punto)
    if (
      coordinatesValidas.length > 0 &&
      (coordinatesValidas[0][0] !== coordinatesValidas[coordinatesValidas.length - 1][0] ||
        coordinatesValidas[0][1] !== coordinatesValidas[coordinatesValidas.length - 1][1])
    ) {
      coordinatesValidas.push([...coordinatesValidas[0]]);
    }

    // ParcelaCreateDTO en backend admite 'modo', 'nombre', 'area_ha' y 'geometria'
    const payload = {
      modo: 'poligono',
      nombre: parcela.nombre || 'Parcela Chiapas',
      area_ha: parcela.area_ha,
      geometria: {
        type: 'Polygon',
        coordinates: [coordinatesValidas],
      },
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('NO_AUTORIZADO');
      }
      throw new Error('ERROR_CREAR_PARCELA');
    }

    const data = await response.json();
    return {
      id_parcela: data.id_parcela,
      area_ha: Number(data.area_ha || parcela.area_ha),
    };
  }

  /**
   * GET /v1/parcelas
   * Listar Parcelas: Obtiene las parcelas registradas por la cuenta del agricultor.
   */
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
        headers: this.getHeaders(token),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('SESION_EXPIRADA');
      }
      if (response.status === 404) {
        return [];
      }
      throw new Error('ERROR_CARGAR_PARCELAS');
    }

    const data = await response.json();
    return (data.parcelas || []).map((item: any) => ({
      id_parcela: item.id_parcela,
      nombre: item.nombre,
      area_ha: Number(item.area_ha),
      estado: item.estado,
    }));
  }

  /**
   * GET /v1/parcelas/{id_parcela}
   * Ver Parcela: Datos generales, área y declaración de rotación vigente.
   */
  async obtenerParcela(idParcela: string, token?: string) {
    const url = `${BASE_URL}/parcelas/${idParcela}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(token),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok) {
      throw new Error('ERROR_OBTENER_PARCELA');
    }

    return await response.json();
  }

  /**
   * DELETE /v1/parcelas/{id_parcela}
   * Borrar Parcela: Eliminación total de la parcela y sus registros asociados.
   */
  async eliminarParcela(idParcela: string, token?: string): Promise<void> {
    const url = `${BASE_URL}/parcelas/${idParcela}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(token),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok && response.status !== 204 && response.status !== 404) {
      throw new Error('ERROR_ELIMINAR_PARCELA');
    }
  }

  /**
   * PATCH /v1/parcelas/{id_parcela} (y fallback POST /v1/parcelas/{id_parcela}/declaraciones)
   * Guardar Declaración: Registra los 3 ciclos previos, tipo de tierra, riegos/semana y prioridad.
   */
  async guardarDeclaracion(
    idParcela: string,
    declaracion: DeclaracionCompleta,
    token?: string
  ): Promise<any> {
    const rotacion = declaracion.rotacion_existente || [];
    const payload = {
      rotacion_existente: rotacion.map((r) => ({
        ciclo: r.ciclo,
        cultivo: (r.cultivo || 'maiz').toLowerCase(),
      })),
      tipo_tierra: declaracion.tipo_tierra || 'negra',
      riego_veces_semana: Number(declaracion.manejo?.riego_veces_semana ?? 0),
      agrego_productos: Boolean(declaracion.manejo?.agrego_productos),
      considerar_riesgo: Boolean(declaracion.manejo?.considerar_riesgo ?? true),
      prioridad_principal: declaracion.manejo?.prioridad_principal || 'igual',
      region: 'frailesca',
    };

    const headers = this.getHeaders(token);

    // 1. Intentar PATCH /v1/parcelas/{id_parcela} según contrato backend oficial
    try {
      const resPatch = await fetch(`${BASE_URL}/parcelas/${idParcela}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });

      if (resPatch.ok) {
        return await resPatch.json();
      }
    } catch {
      // Continuar al siguiente intento o error de red
    }

    // 2. Fallback a POST /v1/parcelas/{id_parcela}/declaraciones
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}/parcelas/${idParcela}/declaraciones`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok) {
      throw new Error('ERROR_GUARDAR_DECLARACION');
    }

    return await response.json();
  }

  /**
   * GET /v1/parcelas/{id_parcela}/perfil
   * Perfil Agroclimático: Lluvia histórica acumulada, secuencias secas y RRE vía NASA IMERG.
   */
  async obtenerPerfilAgroclimatico(idParcela: string, token?: string) {
    const url = `${BASE_URL}/parcelas/${idParcela}/perfil`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(token),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok) {
      throw new Error('ERROR_OBTENER_PERFIL');
    }

    return await response.json();
  }

  /**
   * GET /v1/parcelas/{id_parcela}/inicio-lluvias
   * Fecha de Temporal (d0): Mediana y rango p10–p90 de inicio de lluvias de temporal.
   */
  async obtenerInicioLluvias(idParcela: string, token?: string) {
    const url = `${BASE_URL}/parcelas/${idParcela}/inicio-lluvias`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(token),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok) {
      throw new Error('ERROR_OBTENER_INICIO_LLUVIAS');
    }

    return await response.json();
  }

  /**
   * GET /v1/parcelas/{id_parcela}/heladas
   * Riesgo de Heladas: Probabilidad histórica de temperaturas ≤2°C.
   */
  async obtenerHeladas(idParcela: string, token?: string) {
    const url = `${BASE_URL}/parcelas/${idParcela}/heladas`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(token),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok) {
      throw new Error('ERROR_OBTENER_HELADAS');
    }

    return await response.json();
  }

  /**
   * GET /v1/parcelas/{id_parcela}/capas
   * Capas del Mapa: Rasters de pendiente, RRE y precipitación histórica.
   */
  async obtenerCapasMapa(idParcela: string, token?: string) {
    const url = `${BASE_URL}/parcelas/${idParcela}/capas`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(token),
      });
    } catch {
      throw new Error('SIN_CONEXION_RED');
    }

    if (!response.ok) {
      throw new Error('ERROR_OBTENER_CAPAS');
    }

    return await response.json();
  }
}

export const apiParcelaAdapter = new ApiParcelaAdapter();
