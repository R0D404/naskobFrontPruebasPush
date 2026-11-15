import { ParcelaService } from '@/application/services/ParcelaService';
import { EvaluacionService } from '@/application/services/EvaluacionService';
import { ApiParcelaRepository } from '@/infrastructure/repositories/ApiParcelaRepository';
import { ApiEvaluacionRepository } from '@/infrastructure/repositories/ApiEvaluacionRepository';

// Inyección de dependencias conectada a la API oficial (con fallback offline y modo demo/simulación)
const parcelaRepository = new ApiParcelaRepository();
export const parcelaService = new ParcelaService(parcelaRepository);

const evaluacionRepository = new ApiEvaluacionRepository();
export const evaluacionService = new EvaluacionService(evaluacionRepository);
