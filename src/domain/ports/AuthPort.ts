import { SesionUsuario, CredencialesLogin, RegistroCuenta } from '../models/auth';

export interface AuthPort {
  iniciarSesion(credenciales: CredencialesLogin): Promise<SesionUsuario>;
  crearCuenta(datos: RegistroCuenta): Promise<void>;
  cerrarSesion(token: string): Promise<void>;
}
