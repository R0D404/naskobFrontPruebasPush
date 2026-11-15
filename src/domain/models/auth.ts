export interface SesionUsuario {
  token: string;
  tipo: string;
  expira_utc?: string;
  correo: string;
  esInvitado: boolean;
}

export interface CredencialesLogin {
  correo: string;
  contrasena: string;
}

export interface RegistroCuenta {
  correo: string;
  contrasena: string;
}
