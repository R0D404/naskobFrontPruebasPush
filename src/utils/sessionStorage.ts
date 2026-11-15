import { SesionUsuario } from '@/domain/models/auth';

const STORAGE_KEY = 'naskob_sesion_usuario';

export function guardarSesion(sesion: SesionUsuario): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
  } catch (error) {
    console.warn('No se pudo guardar la sesión en localStorage:', error);
  }
}

export function obtenerSesion(): SesionUsuario | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SesionUsuario;
  } catch (error) {
    console.warn('No se pudo leer la sesión de localStorage:', error);
    return null;
  }
}

export function limpiarSesion(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('No se pudo limpiar la sesión de localStorage:', error);
  }
}
