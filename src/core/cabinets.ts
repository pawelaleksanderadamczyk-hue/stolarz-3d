import type {
  BoardItem,
  CabinetTemplate
} from '../types';



function getCabinetD1S1(board: BoardItem): {
  D1: number;
  S1: number;
} {
  const d = board.dimensions;

  if ('length' in d && 'width' in d) {
    return {
      D1: Number(d.length),
      S1: Number(d.width)
    };
  }

  if ('length1' in d && 'width1' in d) {
    return {
      D1: Number(d.length1),
      S1: Number(d.width1)
    };
  }

  if ('lengthLeft' in d && 'width' in d) {
    return {
      D1: Number(d.lengthLeft),
      S1: Number(d.width)
    };
  }

  if ('height' in d && 'width' in d) {
    return {
      D1: Number(d.height),
      S1: Number(d.width)
    };
  }

  return {
    D1: 0,
    S1: 0
  };
}





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

D1: getCabinetD1S1(board).D1,
S1: getCabinetD1S1(board).S1,
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