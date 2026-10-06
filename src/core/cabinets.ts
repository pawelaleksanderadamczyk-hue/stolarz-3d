import type {
  BoardItem,
  CabinetTemplate
} from '../types';

export function createCabinetId(): string {
  return `cabinet-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

export function createCabinetTemplate(
  name: string,
  boards: BoardItem[],
  dimensions: {
    height: number;
    width: number;
    depth: number;
    plinth: number;
  }
): CabinetTemplate {
  return {
    id: createCabinetId(),
    name,

boards: boards.map((board) => ({
  board: structuredClone(board),

  D1: Number(board.dimensions.length),
  S1: Number(board.dimensions.width),
  G1: Number(board.dimensions.thickness),

  formulas: {
    D2: '',
    S2: '',
    G2: '',
    X2: '',
    Y2: '',
    Z2: ''
  }
})),


    baseDimensions: {
      height: dimensions.height,
      width: dimensions.width,
      depth: dimensions.depth,
      plinth: dimensions.plinth
    }
  };
}