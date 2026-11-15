import { TipoTierra } from '../models/declaracion';

export interface PerfilSueloOpcion {
  id: TipoTierra;
  nombre: string;
  descripcion: string;
  diasResistenciaSeca?: number;
}

export const PERFILES_SUELO: PerfilSueloOpcion[] = [
  {
    id: 'negra',
    nombre: 'Tierra Negra',
    descripcion: 'Tierra fértil. Guarda muy bien la humedad y resiste días sin lluvia.',
    diasResistenciaSeca: 25,
  },
  {
    id: 'arcillosa',
    nombre: 'Tierra Arcillosa',
    descripcion: 'Barrosa y pesada. Retiene bastante agua, pero se endurece al secarse.',
  },
  {
    id: 'arenosa',
    nombre: 'Tierra Arenosa',
    descripcion: 'Suelta y ligera. El agua se filtra rápido y se seca con facilidad.',
  },
];
