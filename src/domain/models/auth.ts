export interface SesionUsuario {
  token: string;
  tipo: string;
  expira_utc?: string;
  correo: string;
  esInvitado: boolean;
}

export const SESION_INVITADO: SesionUsuario = {
  correo: 'productor.demo@naskob.org',
  token: 'demo_token_invitado',
  tipo: 'Bearer',
  esInvitado: true,
};

export interface CredencialesLogin {
  correo: string;
  contrasena: string;
}

export interface RegistroCuenta {
  correo: string;
  contrasena: string;
}
