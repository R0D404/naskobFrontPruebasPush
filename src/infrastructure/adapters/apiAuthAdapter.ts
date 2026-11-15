import { AuthPort } from '@/domain/ports/AuthPort';
import { SesionUsuario, CredencialesLogin, RegistroCuenta } from '@/domain/models/auth';

const rawBase = (import.meta.env.VITE_API_BASE_URL || '/v1').trim().replace(/\/$/, '');
const BASE_URL = rawBase.endsWith('/v1') ? rawBase : `${rawBase}/v1`;
const PWA_API_KEY = (import.meta.env.VITE_PWA_API_KEY || 'aSqiDA7E0XyW8TSTVxvYaCo7OxvHbPR1qfEe9Qp4e2I').trim();

export class ApiAuthAdapter implements AuthPort {
  async iniciarSesion(credenciales: CredencialesLogin): Promise<SesionUsuario> {
    const url = `${BASE_URL}/sesiones`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': PWA_API_KEY,
        },
        body: JSON.stringify({
          correo: credenciales.correo.trim().toLowerCase(),
          contrasena: credenciales.contrasena,
        }),
      });
    } catch (networkError) {
      throw new Error(
        'No se pudo conectar con el servidor de autenticación. Verifica que el backend esté en ejecución o tu conexión a internet.'
      );
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 400) {
        throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.');
      }
      if (response.status === 403) {
        throw new Error('Clave API no autorizada (x-api-key inválida).');
      }
      let detalle = 'Error al iniciar sesión.';
      try {
        const errorData = await response.json();
        detalle = errorData.detail || errorData.title || detalle;
      } catch {
        // Ignorar error al parsear JSON
      }
      throw new Error(detalle);
    }

    const data = await response.json();
    return {
      token: data.token,
      tipo: data.tipo || 'Bearer',
      expira_utc: data.expira_utc,
      correo: credenciales.correo.trim().toLowerCase(),
      esInvitado: false,
    };
  }

  async crearCuenta(datos: RegistroCuenta): Promise<void> {
    const url = `${BASE_URL}/cuentas`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': PWA_API_KEY,
        },
        body: JSON.stringify({
          correo: datos.correo.trim().toLowerCase(),
          contrasena: datos.contrasena,
        }),
      });
    } catch (networkError) {
      throw new Error('No se pudo conectar con el servidor. Revisa tu conexión.');
    }

    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('Ya existe una cuenta registrada con este correo electrónico.');
      }
      let detalle = 'Error al registrar la cuenta.';
      try {
        const errorData = await response.json();
        detalle = errorData.detail || errorData.title || detalle;
      } catch {
        // Ignorar
      }
      throw new Error(detalle);
    }
  }

  async cerrarSesion(token: string): Promise<void> {
    if (!token || token.startsWith('demo_')) return;
    const url = `${BASE_URL}/sesiones/actual`;

    try {
      await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': PWA_API_KEY,
        },
      });
    } catch {
      // Ignorar errores al cerrar sesión si no hay red
    }
  }

  /**
   * DELETE /v1/cuenta
   * Eliminación definitiva de cuenta y datos del dispositivo.
   */
  async eliminarCuenta(token: string): Promise<void> {
    if (!token || token.startsWith('demo_')) return;
    const url = `${BASE_URL}/cuenta`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': PWA_API_KEY,
      },
    });

    if (!response.ok && response.status !== 204 && response.status !== 404) {
      throw new Error('ERROR_ELIMINAR_CUENTA');
    }
  }
}

export const apiAuthAdapter = new ApiAuthAdapter();
