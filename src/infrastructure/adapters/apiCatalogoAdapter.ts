function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '/v1').trim();
  if (
    !envUrl ||
    envUrl === '/v1' ||
    envUrl === '/' ||
    (typeof window !== 'undefined' && envUrl.includes('duckdns.org') && window.location.hostname.includes('vercel.app'))
  ) {
    return '/v1';
  }
  const clean = envUrl.replace(/\/$/, '');
  return clean.endsWith('/v1') ? clean : `${clean}/v1`;
}

const BASE_URL = getApiBaseUrl();
const PWA_API_KEY = (import.meta.env.VITE_PWA_API_KEY || 'aSqiDA7E0XyW8TSTVxvYaCo7OxvHbPR1qfEe9Qp4e2I').trim();

export class ApiCatalogoAdapter {
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
   * GET /v1/catalogos/cultivos
   * Fichas técnicas de los 6 cultivos oficiales (Kc, umbral de calor, días a cosecha, requerimiento de riego).
   */
  async obtenerCultivos(token?: string) {
    const response = await fetch(`${BASE_URL}/catalogos/cultivos`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    if (!response.ok) throw new Error('ERROR_OBTENER_CULTIVOS');
    return await response.json();
  }

  /**
   * GET /v1/catalogos/escenarios
   * Catálogo de tipos de escenarios (Línea Base A, Diversificación B, etc.).
   */
  async obtenerEscenarios(token?: string) {
    const response = await fetch(`${BASE_URL}/catalogos/escenarios`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    if (!response.ok) throw new Error('ERROR_OBTENER_ESCENARIOS');
    return await response.json();
  }

  /**
   * GET /v1/catalogos/criterios
   * Descripción y ponderaciones de los 4 criterios (c_agua, c_riesgo, c_suelo, c_apt).
   */
  async obtenerCriterios(token?: string) {
    const response = await fetch(`${BASE_URL}/catalogos/criterios`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    if (!response.ok) throw new Error('ERROR_OBTENER_CRITERIOS');
    return await response.json();
  }

  /**
   * GET /v1/catalogos/glosario
   * Términos agronómicos explicados en lenguaje campesino (< 25 palabras).
   */
  async obtenerGlosario(token?: string) {
    const response = await fetch(`${BASE_URL}/catalogos/glosario`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    if (!response.ok) throw new Error('ERROR_OBTENER_GLOSARIO');
    return await response.json();
  }

  /**
   * GET /v1/regiones
   * Regiones agroecológicas piloto habilitadas (La Frailesca, etc.).
   */
  async obtenerRegiones(token?: string) {
    const response = await fetch(`${BASE_URL}/regiones`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    if (!response.ok) throw new Error('ERROR_OBTENER_REGIONES');
    return await response.json();
  }

  /**
   * GET /v1/parametros
   * Parámetros de calibración vigentes del motor agroclimático.
   */
  async obtenerParametros(token?: string) {
    const response = await fetch(`${BASE_URL}/parametros`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    if (!response.ok) throw new Error('ERROR_OBTENER_PARAMETROS');
    return await response.json();
  }

  /**
   * GET /v1/ejecuciones/{id_ejecucion}
   * Auditoría técnica de ejecución con hash de código y dependencias.
   */
  async obtenerEjecucion(idEjecucion: string, token?: string) {
    const response = await fetch(`${BASE_URL}/ejecuciones/${idEjecucion}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    if (!response.ok) throw new Error('ERROR_OBTENER_EJECUCION');
    return await response.json();
  }

  /**
   * GET /v1/salud
   * Diagnóstico de operatividad de APIs de la NASA (estrategia de degradación).
   */
  async obtenerDiagnosticoSalud(token?: string) {
    const response = await fetch(`${BASE_URL}/salud`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    if (!response.ok) throw new Error('ERROR_OBTENER_SALUD');
    return await response.json();
  }

  /**
   * GET /v1/version
   * Versión del API (v1.2.0), motor y reglas de negocio.
   */
  async obtenerVersion(token?: string) {
    const response = await fetch(`${BASE_URL}/version`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    if (!response.ok) throw new Error('ERROR_OBTENER_VERSION');
    return await response.json();
  }

  /**
   * GET /health
   * Healthcheck rápido del servidor.
   */
  async healthCheck() {
    const rootUrl = BASE_URL.replace(/\/v1$/, '');
    const response = await fetch(`${rootUrl}/health`);
    if (!response.ok) throw new Error('ERROR_HEALTHCHECK');
    return await response.json();
  }
}

export const apiCatalogoAdapter = new ApiCatalogoAdapter();
