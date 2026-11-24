const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Genera la lista de viviendas de un edificio a partir de su estructura.
// Ejemplo: { floors: 2, doorsPerFloor: 2, groundFloorDoors: 1 }
//   → Bajo A, 1º A, 1º B, 2º A, 2º B
export function buildDwellings({ floors, doorsPerFloor, groundFloorDoors = 0 }) {
  const dwellings = [];

  for (let i = 0; i < groundFloorDoors; i++) {
    dwellings.push({ floor: 0, door: LETTERS[i], label: `Bajo ${LETTERS[i]}` });
  }

  for (let floor = 1; floor <= floors; floor++) {
    for (let i = 0; i < doorsPerFloor; i++) {
      dwellings.push({ floor, door: LETTERS[i], label: `${floor}º ${LETTERS[i]}` });
    }
  }

  return dwellings;
}