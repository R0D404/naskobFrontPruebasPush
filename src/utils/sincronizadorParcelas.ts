import { obtenerParcelasLocales, marcarParcelaComoSincronizada } from '@/utils/parcelasStorage';
import { apiParcelaAdapter } from '@/infrastructure/adapters/apiParcelaAdapter';
import { obtenerSesion } from '@/utils/sessionStorage';

export async function sincronizarParcelasPendientes(): Promise<{
  sincronizadas: number;
  errores: number;
}> {
  const sesion = obtenerSesion();
  if (!sesion?.token || sesion.esInvitado) {
    return { sincronizadas: 0, errores: 0 };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { sincronizadas: 0, errores: 0 };
  }

  const locales = obtenerParcelasLocales();
  const pendientes = locales.filter((p) => !p.sincronizado);

  let sincronizadas = 0;
  let errores = 0;

  for (const item of pendientes) {
    try {
      // 1. Crear parcela en la API
      const res = await apiParcelaAdapter.crearParcela(item.parcela, sesion.token);
      const idRemoto = res.id_parcela;

      // 2. Si tiene declaración, guardarla en la API
      if (item.declaracion && idRemoto) {
        try {
          await apiParcelaAdapter.guardarDeclaracion(idRemoto, item.declaracion, sesion.token);
        } catch (declErr) {
          console.warn(`[Sincronizador] No se pudo sincronizar la declaración de ${idRemoto}:`, declErr);
        }
      }

      marcarParcelaComoSincronizada(item.id_parcela, idRemoto);
      sincronizadas++;
    } catch (err) {
      console.warn(`[Sincronizador] Error sincronizando parcela ${item.id_parcela}:`, err);
      errores++;
    }
  }

  if (sincronizadas > 0) {
    console.log(`[Sincronizador] Se sincronizaron exitosamente ${sincronizadas} parcelas con la API.`);
  }

  return { sincronizadas, errores };
}
