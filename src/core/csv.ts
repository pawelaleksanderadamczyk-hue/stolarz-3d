import type { BoardItem, ProjectMaterialPalette } from '../types';

function csvEscape(value: string | number) {
  const text = String(value ?? '');
  return /[",;\n]/.test(text) ? `"${text.split('"').join('""')}"` : text;
}

function getThickness(board: BoardItem) {
  return Number((board.dimensions as any).thickness ?? 0);
}

function getLength(board: BoardItem) {
  const d: any = board.dimensions;
  switch (board.shape) {
    case 'RECT':
    case 'RECT_INNER_CUTOUT':
      return Number(d.length ?? 0);
    case 'RECT_CUT_CORNER':
    case 'RECT_CORNER_NOTCH':
      return Number(d.length1 ?? 0);
    case 'RIGHT_TRAPEZOID':
      return Number(Math.max(d.lengthLeft ?? 0, d.lengthRight ?? 0));
    case 'TRAPEZOID':
    case 'TRAPEZOID_INNER_CUTOUT':
      return Number(d.height ?? 0);
    default:
      return 0;
  }
}



function getWidth(board: BoardItem) {
  const d: any = board.dimensions;
  switch (board.shape) {
    case 'RECT':
    case 'RECT_INNER_CUTOUT':
      return Number(d.width ?? 0);
    case 'RECT_CUT_CORNER':
    case 'RECT_CORNER_NOTCH':
      return Number(d.width1 ?? 0);
    case 'RIGHT_TRAPEZOID':
      return Number(d.width ?? 0);
    case 'TRAPEZOID':
    case 'TRAPEZOID_INNER_CUTOUT':
      return Number(d.width ?? 0);
    default:
      return 0;
  }
}

function countLengthEdging(board: BoardItem) {
  return Number(Boolean(board.edging.lengthLeft)) + Number(Boolean(board.edging.lengthRight));
}

function countWidthEdging(board: BoardItem) {
  return Number(Boolean(board.edging.widthTop)) + Number(Boolean(board.edging.widthBottom));
}

function getFamily(role: BoardItem['role']): 'korpus' | 'front' | 'blat' | 'hdf' | 'inne' {
  if (role === 'FRONT') return 'front';
  if (role === 'BLAT') return 'blat';
  if (role === 'HDF') return 'hdf';
  if (role === 'INNE') return 'inne';
  return 'korpus';
}

export function boardsToCsv(boards: BoardItem[], materials: ProjectMaterialPalette) {
  const headers = [
    'Lp',
    'Numer formatki',
    'Materiał formatki',
    'Kolor okleiny',
    'Nazwa',
    'Grubość',
    'Długość',
    'Ilość oklejonych boków długości',
    'Szerokość',
    'Ilość oklejonych boków szerokości'
  ];

  const rows = boards.map((board, index) => {
    const family = getFamily(board.role);
    const materialColor = materials[family][board.material.materialIndex];
    const edgingColor = materials.okleina[board.material.edgingIndex];
    return [
      index + 1,
      board.number,
      `${family.toUpperCase()} ${board.material.materialIndex} — ${materialColor}`,
      `OKLEINA ${board.material.edgingIndex} — ${edgingColor}`,
      board.name ?? '',
      getThickness(board),
      getLength(board),
      countLengthEdging(board),
      getWidth(board),
      countWidthEdging(board)
    ];
  });

  return [headers, ...rows].map((row) => row.map(csvEscape).join(';')).join('\n');
}
