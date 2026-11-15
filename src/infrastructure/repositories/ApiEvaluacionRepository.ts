import { EvaluacionRepository } from '@/domain/ports/EvaluacionRepository';
import { Evaluacion } from '@/domain/models/evaluacion';
import { DeclaracionCompleta } from '@/domain/models/declaracion';
import { apiEvaluacionAdapter } from '@/infrastructure/adapters/apiEvaluacionAdapter';
import { apiParcelaAdapter } from '@/infrastructure/adapters/apiParcelaAdapter';
import { obtenerSesion } from '@/utils/sessionStorage';

export class ApiEvaluacionRepository implements EvaluacionRepository {
  async ejecutarEvaluacion(idParcela: string, declaracion: DeclaracionCompleta): Promise<Evaluacion> {
    const sesion = obtenerSesion();
    const token = sesion?.token;
    const esDemo = !sesion || sesion.esInvitado || (token && token.startsWith('demo_'));

    // Si el usuario no tiene conexión de red:
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('SIN_CONEXION_RED');
    }

    if (esDemo) {
      // Modo de Demostración: Simulación Directa en memoria sin persistir parcela en BD
      return await apiEvaluacionAdapter.simularEvaluacion(declaracion, token);
    }

    // Usuario Registrado: Guarda declaración y evalúa parcela asociada en BD
    try {
      if (idParcela && idParcela !== 'parcela_activa') {
        try {
          await apiParcelaAdapter.guardarDeclaracion(idParcela, declaracion, token);
        } catch (declErr) {
          console.warn('[ApiEvaluacionRepository] No se pudo guardar la declaración previa:', declErr);
        }
      }
      return await apiEvaluacionAdapter.evaluarParcela(idParcela, declaracion, token);
    } catch (err: any) {
      if (err?.message === 'SIN_CONEXION_RED') {
        throw err;
      }
      // Si la parcela no existe en BD, recurrir a simulación directa
      return await apiEvaluacionAdapter.simularEvaluacion(declaracion, token);
    }
  }
}
