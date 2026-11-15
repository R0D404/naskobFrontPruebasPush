import { Coordenada, GeoJSONPolygon, Parcela, ParcelaInput, ValidacionRangoParcela } from '@/domain/models/parcela';
import { ParcelaRepository } from '@/domain/ports/ParcelaRepository';
import {
  calcularAreaHa,
  coordenadasAGeoJSON,
  validarRangoArea,
  verificarAutoInterseccion,
} from '@/domain/rules/parcelaRules';

export class ParcelaService {
  constructor(private readonly parcelaRepository: ParcelaRepository) {}

  calcularArea(puntos: Coordenada[]): number {
    return calcularAreaHa(puntos);
  }

  verificarCruces(puntos: Coordenada[]): boolean {
    return verificarAutoInterseccion(puntos);
  }

  validarRango(areaHa: number): ValidacionRangoParcela {
    return validarRangoArea(areaHa);
  }

  crearPoligonoGeoJSON(puntos: Coordenada[]): GeoJSONPolygon {
    return coordenadasAGeoJSON(puntos);
  }

  async guardarParcela(input: ParcelaInput): Promise<Parcela> {
    if (!input.poligono || !input.poligono.coordinates || input.poligono.coordinates.length === 0) {
      throw new Error('El polígono de la parcela es obligatorio');
    }

    if (input.area_ha <= 0) {
      throw new Error('El área calculada de la parcela debe ser mayor a 0 ha');
    }

    return await this.parcelaRepository.guardarParcela(input);
  }

  async obtenerParcelaActual(): Promise<Parcela | null> {
    if (this.parcelaRepository.obtenerParcelaActual) {
      return await this.parcelaRepository.obtenerParcelaActual();
    }
    return null;
  }
}
