import {
  marcarParcelaComoSincronizada,
  limpiarYConsolidarParcelasLocales,
} from '@/utils/parcelasStorage';
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

  // 1. Limpiar y consolidar primero duplicados locales que pudieran existir
  const locales = limpiarYConsolidarParcelasLocales();
  const pendientes = locales.filter((p) => !p.sincronizado);

  let sincronizadas = 0;
  let errores = 0;

  for (const item of pendientes) {
    try {
      let idRemoto = item.id_remoto;
      const esIdLocal =
        !item.parcela.id_parcela ||
        item.parcela.id_parcela.startsWith('parc_') ||
        item.parcela.id_parcela === 'parcela_activa';

      // Si ya tiene un UUID remoto asignado o su id_parcela es un UUID remoto real
      if (!esIdLocal && !idRemoto) {
        idRemoto = item.parcela.id_parcela;
      }

      // Comprobar si otra parcela en locales con el mismo nombre y área ya tiene id_remoto
      const nombreItem = item.nombre;
      if (!idRemoto && nombreItem) {
        const hermana = locales.find(
          (loc) =>
            loc.id_parcela !== item.id_parcela &&
            loc.id_remoto &&
            !loc.id_remoto.startsWith('parc_') &&
            loc.nombre &&
            loc.nombre.trim().toLowerCase() === nombreItem.trim().toLowerCase() &&
            Math.abs(loc.area_ha - item.area_ha) < 0.02
        );
        if (hermana && hermana.id_remoto) {
          idRemoto = hermana.id_remoto;
        }
      }

      // 1. Crear parcela en la API si aún no tiene ID remoto asignado en la BD
      if (!idRemoto) {
        if (esIdLocal) {
          const res = await apiParcelaAdapter.crearParcela(item.parcela, sesion.token);
          idRemoto = res.id_parcela;
        } else {
          idRemoto = item.parcela.id_parcela;
        }
      }

      // 2. Si tiene declaración agronómica, sincronizarla en la API
      if (item.declaracion && idRemoto) {
        try {
          await apiParcelaAdapter.guardarDeclaracion(idRemoto, item.declaracion, sesion.token);
        } catch (declErr) {
          console.warn(`[Sincronizador] No se pudo sincronizar la declaración de ${idRemoto}:`, declErr);
        }
      }

      if (idRemoto) {
        marcarParcelaComoSincronizada(item.id_parcela, idRemoto);
        sincronizadas++;
      }
    } catch (err) {
      console.warn(`[Sincronizador] Error sincronizando parcela ${item.id_parcela}:`, err);
      errores++;
    }
  }

  // Consolidar nuevamente para asegurar que no queden duplicados
  limpiarYConsolidarParcelasLocales();

  if (sincronizadas > 0) {
    console.log(`[Sincronizador] Se sincronizaron exitosamente ${sincronizadas} parcelas con la API.`);
  }

  return { sincronizadas, errores };
}
