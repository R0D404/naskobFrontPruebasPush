import { EvaluacionRepository } from '@/domain/ports/EvaluacionRepository';
import { Evaluacion } from '@/domain/models/evaluacion';
import { DeclaracionCompleta } from '@/domain/models/declaracion';

export class EvaluacionService {
  constructor(private readonly evaluacionRepository: EvaluacionRepository) {}

  async ejecutarEvaluacion(idParcela: string, declaracion: DeclaracionCompleta): Promise<Evaluacion> {
    return await this.evaluacionRepository.ejecutarEvaluacion(idParcela, declaracion);
  }
}
