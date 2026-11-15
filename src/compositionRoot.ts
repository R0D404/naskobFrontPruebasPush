import { ParcelaMockRepository } from '@/infrastructure/mock/repositories/ParcelaMockRepository';
import { ParcelaService } from '@/application/services/ParcelaService';
import { EvaluacionMockRepository } from '@/infrastructure/mock/repositories/EvaluacionMockRepository';
import { EvaluacionService } from '@/application/services/EvaluacionService';

// Composition root para inyección de dependencias
const parcelaRepository = new ParcelaMockRepository();
export const parcelaService = new ParcelaService(parcelaRepository);

const evaluacionRepository = new EvaluacionMockRepository();
export const evaluacionService = new EvaluacionService(evaluacionRepository);
