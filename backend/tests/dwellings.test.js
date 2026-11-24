import { describe, expect, it } from 'vitest';
import { buildDwellings } from '../src/utils/dwellings.js';

const labels = (structure) => buildDwellings(structure).map((d) => d.label);

describe('buildDwellings', () => {
  it('genera la planta baja y las plantas superiores con sus puertas', () => {
    expect(labels({ floors: 2, doorsPerFloor: 4, groundFloorDoors: 2 })).toEqual([
      'Bajo A',
      'Bajo B',
      '1º A',
      '1º B',
      '1º C',
      '1º D',
      '2º A',
      '2º B',
      '2º C',
      '2º D',
    ]);
  });

  it('no crea viviendas en la planta baja si groundFloorDoors es 0', () => {
    expect(labels({ floors: 1, doorsPerFloor: 2, groundFloorDoors: 0 })).toEqual(['1º A', '1º B']);
  });

  it('admite un edificio solo con planta baja', () => {
    expect(labels({ floors: 0, doorsPerFloor: 3, groundFloorDoors: 2 })).toEqual([
      'Bajo A',
      'Bajo B',
    ]);
  });

  it('guarda la planta y la puerta de cada vivienda', () => {
    const [bajo, primero] = buildDwellings({ floors: 1, doorsPerFloor: 1, groundFloorDoors: 1 });
    expect(bajo).toEqual({ floor: 0, door: 'A', label: 'Bajo A' });
    expect(primero).toEqual({ floor: 1, door: 'A', label: '1º A' });
  });

  it('llega hasta la puerta Z con 26 puertas por planta', () => {
    const result = labels({ floors: 1, doorsPerFloor: 26, groundFloorDoors: 0 });
    expect(result).toHaveLength(26);
    expect(result.at(-1)).toBe('1º Z');
  });
});