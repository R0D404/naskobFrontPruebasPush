import { Evaluacion } from '../models/evaluacion';
import { DeclaracionCompleta } from '../models/declaracion';

export interface EvaluacionRepository {
  ejecutarEvaluacion(idParcela: string, declaracion: DeclaracionCompleta): Promise<Evaluacion>;
}
