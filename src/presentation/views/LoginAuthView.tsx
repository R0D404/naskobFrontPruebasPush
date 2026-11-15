import { useState } from 'react';
import {
  Sprout,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Satellite,
} from 'lucide-react';

export interface LoginAuthViewProps {
  alAutenticar: (usuario: { email: string; token: string; esInvitado: boolean }) => void;
}

type ModoAuth = 'login' | 'registro';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginAuthView: React.FC<LoginAuthViewProps> = ({ alAutenticar }) => {
  const [modo, setModo] = useState<ModoAuth>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmPassword, setMostrarConfirmPassword] = useState(false);

  // Errores de validación
  const [errorEmail, setErrorEmail] = useState<string | null>(null);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  const [errorConfirm, setErrorConfirm] = useState<string | null>(null);

  const validarFormulario = (): boolean => {
    let valido = true;
    setErrorEmail(null);
    setErrorPassword(null);
    setErrorConfirm(null);

    const emailLimpio = email.trim();
    if (!emailLimpio) {
      setErrorEmail('Por favor ingresa tu correo electrónico.');
      valido = false;
    } else if (!EMAIL_REGEX.test(emailLimpio)) {
      setErrorEmail('Ingresa un correo electrónico con formato válido (ej. productor@campo.mx).');
      valido = false;
    }

    if (!password) {
      setErrorPassword('Por favor ingresa tu contraseña.');
      valido = false;
    } else if (password.length < 8) {
      setErrorPassword('La contraseña debe tener al menos 8 caracteres.');
      valido = false;
    }

    if (modo === 'registro') {
      if (!confirmPassword) {
        setErrorConfirm('Por favor confirma tu contraseña.');
        valido = false;
      } else if (password !== confirmPassword) {
        setErrorConfirm('Las contraseñas no coinciden. Por favor verifica.');
        valido = false;
      }
    }

    return valido;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    alAutenticar({
      email: email.trim().toLowerCase(),
      token: `auth_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      esInvitado: false,
    });
  };

  const handleDemoMode = () => {
    alAutenticar({
      email: 'invitado@naskob.org',
      token: `demo_token_${Date.now()}`,
      esInvitado: true,
    });
  };

  const cambiarModo = (nuevoModo: ModoAuth) => {
    setModo(nuevoModo);
    setErrorEmail(null);
    setErrorPassword(null);
    setErrorConfirm(null);
  };

  return (
    <div className="w-full h-full min-h-screen overflow-y-auto bg-cream flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6 my-auto">
        {/* Card Principal de Bienvenida */}
        <div className="bg-white rounded-naskob-lg border border-cream-line shadow-sm p-6 sm:p-8 space-y-6">
          {/* Encabezado con Icono y Títulos */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ink text-white shadow-md mx-auto relative">
              <Sprout className="w-8 h-8 text-maize" />
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-maize flex items-center justify-center border-2 border-white shadow-sm">
                <Satellite className="w-3 h-3 text-ink" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="inline-block text-[10px] font-bold tracking-widest text-ink uppercase bg-ink/5 px-2.5 py-0.5 rounded-full">
                La Frailesca, Chiapas
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                NasKob · Rotación Resiliente
              </h1>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-sm mx-auto">
                Compara opciones de siembra con datos satelitales de la NASA para tu parcela en La Frailesca.
              </p>
            </div>
          </div>

          {/* Selector de Modo: Pestañas Tipo Toggle [Entrar] y [Crear cuenta] */}
          <div className="grid grid-cols-2 p-1 bg-cream/70 rounded-xl border border-cream-line text-xs font-bold">
            <button
              type="button"
              onClick={() => cambiarModo('login')}
              className={`py-2 rounded-lg transition-all ${
                modo === 'login'
                  ? 'bg-ink text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink hover:bg-cream/50'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => cambiarModo('registro')}
              className={`py-2 rounded-lg transition-all ${
                modo === 'registro'
                  ? 'bg-ink text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink hover:bg-cream/50'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {/* Formulario de Captura */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Campo: Correo Electrónico */}
            <div className="space-y-1">
              <label htmlFor="email" className="block text-xs font-bold text-ink">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorEmail) setErrorEmail(null);
                  }}
                  placeholder="ejemplo@productor.mx"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm text-ink bg-white placeholder-ink-muted/50 focus:outline-none focus:ring-2 transition-all ${
                    errorEmail
                      ? 'border-terra ring-2 ring-terra/20'
                      : 'border-cream-line focus:border-ink focus:ring-ink/20'
                  }`}
                />
              </div>
              {errorEmail && (
                <div className="flex items-center gap-1.5 text-terra text-[11px] font-semibold mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorEmail}</span>
                </div>
              )}
            </div>

            {/* Campo: Contraseña */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold text-ink">
                  Contraseña
                </label>
                <span className="text-[10px] text-ink-muted">Mínimo 8 caracteres</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorPassword) setErrorPassword(null);
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm text-ink bg-white placeholder-ink-muted/50 focus:outline-none focus:ring-2 transition-all ${
                    errorPassword
                      ? 'border-terra ring-2 ring-terra/20'
                      : 'border-cream-line focus:border-ink focus:ring-ink/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-muted hover:text-ink"
                  tabIndex={-1}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errorPassword && (
                <div className="flex items-center gap-1.5 text-terra text-[11px] font-semibold mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorPassword}</span>
                </div>
              )}
            </div>

            {/* Campo: Confirmar Contraseña (Solo en Modo Crear Cuenta) */}
            {modo === 'registro' && (
              <div className="space-y-1 animate-fade-in">
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-ink">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={mostrarConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorConfirm) setErrorConfirm(null);
                    }}
                    placeholder="Repite tu contraseña"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm text-ink bg-white placeholder-ink-muted/50 focus:outline-none focus:ring-2 transition-all ${
                      errorConfirm
                        ? 'border-terra ring-2 ring-terra/20'
                        : 'border-cream-line focus:border-ink focus:ring-ink/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmPassword(!mostrarConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-muted hover:text-ink"
                    tabIndex={-1}
                    aria-label={mostrarConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {mostrarConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errorConfirm && (
                  <div className="flex items-center gap-1.5 text-terra text-[11px] font-semibold mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorConfirm}</span>
                  </div>
                )}
              </div>
            )}

            {/* Botón Principal de Submit */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-ink text-white hover:bg-ink-light active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <span>{modo === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Separador */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-cream-line w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider shrink-0">
              o evaluación rápida
            </span>
          </div>

          {/* Acceso Directo para Evaluación / Demo (Imprescindible) */}
          <button
            type="button"
            onClick={handleDemoMode}
            className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-maize/20 hover:bg-maize/30 text-ink border-2 border-maize active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 shadow-sm group"
          >
            <Sparkles className="w-4 h-4 text-maize-dark shrink-0 group-hover:scale-110 transition-transform" />
            <div className="text-left sm:text-center">
              <span className="block font-black text-ink">
                Probar sin registrarse (Modo Demostración)
              </span>
              <span className="block text-[10px] text-ink-muted font-medium">
                Acceso inmediato como productor invitado
              </span>
            </div>
          </button>
        </div>

        {/* Card Informativa de Privacidad */}
        <div className="bg-ok-bg/50 border border-ok/20 rounded-naskob p-4 flex items-start gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-ok-bg text-ok flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-ok" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-xs font-bold text-ink">Privacidad garantizada</h2>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Tu cuenta solo guarda tus parcelas. No solicitamos tu nombre, teléfono ni datos catastrales privados.
            </p>
          </div>
        </div>
      </div>

      {/* Pie de página sutil */}
      <footer className="text-center text-[11px] text-ink-muted/80 mt-6 shrink-0">
        NasKob · Plataforma Agronómica Resiliente · Datos Satelitales NASA POWER y Levantamiento en Campo
      </footer>
    </div>
  );
};
