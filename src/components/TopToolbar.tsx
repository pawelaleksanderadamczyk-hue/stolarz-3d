import { useEffect, useRef, useState } from 'react';
import { COLORS } from '../core/constants';
import { getOuterVertices3D } from '../core/project';
import { useProjectStore } from '../store/useProjectStore';
import type { MaterialIndex, ViewMode } from '../types';
import { saveProjectToFile } from '../utils/saveProject';
import { ColorSelect } from './ColorSelect';
import { jsPDF } from 'jspdf';
const VIEW_TABS: ViewMode[] = ['IZOMETRIA', 'GÓRA', 'PRZÓD', 'BOK'];

const handleSave = () => {
  const project = useProjectStore.getState().project;
  saveProjectToFile(project);
};





type PdfPoint = [number, number];

function getPdfShapePoints(board: any): PdfPoint[] {
  const d = board.dimensions;
  switch (board.shape) {
    case 'RECT':
    case 'RECT_INNER_CUTOUT':
      return [
        [0, 0],
        [d.width, 0],
        [d.width, d.length],
        [0, d.length]
      ];
case 'RECT_CUT_CORNER':
  return [
    [0, 0],
    [d.width1, 0],
    [d.width1, d.length2],
    [d.width2, d.length1],
    [0, d.length1]
  ];

    
  
    case 'RECT_CORNER_NOTCH':
      return [
        [0, 0],
        [d.width1, 0],
        [d.width1, d.length2],
        [d.width2, d.length2],
        [d.width2, d.length1],
        [0, d.length1]
      ];



case 'RECT_DOUBLE_CUTOUT':
  return [
    // LEWY DÓŁ — początek po ścięciu
    [d.width2, 0],

    // PRAWY DÓŁ
    [d.width, 0],

    // PRAWY GÓRA
    [d.width, d.length],

    // LEWY GÓRA — początek górnego ścięcia
    [d.width1, d.length],

    // LEWA — koniec górnego ścięcia
    [0, d.length - d.length1],

    // LEWA — koniec dolnego odcinka
    [0, d.length2]
  ];

    case 'RIGHT_TRAPEZOID':
      return [
        [0, 0],
        [d.width, 0],
        [d.width, d.lengthRight],
        [0, d.lengthLeft]
      ];

    case 'TRAPEZOID':
case 'TRAPEZOID_INNER_CUTOUT':
  return [
    [0, 0],
    [d.width, 0],
    [d.width - d.rightInset, d.height],
    [d.leftInset, d.height]
  ];

    default:
      return [
        [0, 0],
        [100, 0],
        [100, 100],
        [0, 100]
      ];
  }
}

function getBounds(points: PdfPoint[]) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys)
  };
}

function toPdfPoint(
  p: PdfPoint,
  startX: number,
  startY: number,
  scale: number
): PdfPoint {
  return [
    startX + p[0] * scale,
    startY - p[1] * scale
  ];
}

function drawShape(
  pdf: jsPDF,
  points: PdfPoint[],
  startX: number,
  startY: number,
  scale: number,
  board?: any
) {
  pdf.setLineWidth(0.35);

  // OBWÓD ZEWNĘTRZNY
  points.forEach((p, index) => {
    const [x, y] = toPdfPoint(p, startX, startY, scale);

    if (index === 0) {
      pdf.moveTo(x, y);
    } else {
      pdf.lineTo(x, y);
    }
  });

  pdf.close();
  pdf.stroke();

  // OTWORY
  if (board?.shape === 'RECT_DOUBLE_CUTOUT') {
    const d = board.dimensions;

drawRectHole(
  pdf,
  Number(d.hole1OffsetWidth),
  Number(d.hole1OffsetLength),
  Number(d.hole1Width),
  Number(d.hole1Height),
      startX,
      startY,
      scale
    );

drawRectHole(
  pdf,
  Number(d.hole2OffsetWidth),
  Number(d.hole2OffsetLength),
  Number(d.hole2Width),
  Number(d.hole2Height),
      startX,
      startY,
      scale
    );
  }
}





function drawDim(
  pdf: jsPDF,
  p1: PdfPoint,
  p2: PdfPoint,
  text: string,
  startX: number,
  startY: number,
  scale: number,
  offset: number
) {
  const [x1, y1] = toPdfPoint(p1, startX, startY, scale);
  const [x2, y2] = toPdfPoint(p2, startX, startY, scale);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.max(1, Math.hypot(dx, dy));

  const nx = -dy / len;
  const ny = dx / len;

  const ox = nx * offset;
  const oy = ny * offset;

  const ax = x1 + ox;
  const ay = y1 + oy;
  const bx = x2 + ox;
  const by = y2 + oy;

  pdf.setDrawColor(0);
  pdf.setLineWidth(0.2);

  // linie pomocnicze
  pdf.line(x1, y1, ax, ay);
  pdf.line(x2, y2, bx, by);

  // linia wymiarowa
  pdf.line(ax, ay, bx, by);

  // znaczniki
  const tick = 2;

  pdf.line(
    ax - tick,
    ay - tick,
    ax + tick,
    ay + tick
  );

  pdf.line(
    bx - tick,
    by - tick,
    bx + tick,
    by + tick
  );

  // =====================================================
  // TEKST
  // =====================================================

  pdf.setFontSize(10);

  const tx = (ax + bx) / 2;
  const ty = (ay + by) / 2;

  const isVertical =
    Math.abs(by - ay) > Math.abs(bx - ax);

  // tekst blisko linii, ale nigdy na niej
  const textGap = 1.8;

  if (isVertical) {
  pdf.text(
    text,
    tx + 2.5,
    ty,
    {
      angle: 90,
      align: 'center',
      baseline: 'middle'
    }
  );
}

 else {
    pdf.text(
      text,
      tx,
      ty - textGap,
      {
        align: 'center'
      }
    );
  }

  pdf.setDrawColor(0);
}






function drawRectHole(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  startX: number,
  startY: number,
  scale: number
) {
  const [px, py] = toPdfPoint([x, y + h], startX, startY, scale);
  pdf.setLineWidth(0.35);
  pdf.rect(px, py, w * scale, h * scale);
  pdf.setLineWidth(0.2);
}




function drawHoleWithDimensions(
  pdf: jsPDF,
  board: any,
  startX: number,
  startY: number,
  scale: number
) {
  const d = board.dimensions;

  if (board.shape === 'RECT_INNER_CUTOUT') {
    const x = d.cutoutOffsetWidth;
    const y = d.cutoutOffsetLength;
    const w = d.cutoutWidth;
    const h = d.cutoutLength;

    drawRectHole(pdf, x, y, w, h, startX, startY, scale);

    drawDim(
      pdf,
      [x, y + h],
      [x + w, y + h],
      `${w}`,
      startX,
      startY,
      scale,
      -8
    );

    drawDim(
      pdf,
      [x + w, y],
      [x + w, y + h],
      `${h}`,
      startX,
      startY,
      scale,
      8
    );

    drawDim(
      pdf,
      [0, y],
      [x, y],
      `${x}`,
      startX,
      startY,
      scale,
      10
    );

    drawDim(
      pdf,
      [x + w, 0],
      [x + w, y],
      `${y}`,
      startX,
      startY,
      scale,
      -10
    );
  }

  if (board.shape === 'TRAPEZOID_INNER_CUTOUT') {
    const x = d.cutoutOffsetWidth;
    const y = d.cutoutOffsetLength;
    const w = d.cutoutWidth;
    const h = d.cutoutLength;

    drawRectHole(pdf, x, y, w, h, startX, startY, scale);

    drawDim(pdf, [x, y + h], [x + w, y + h], `${w}`, startX, startY, scale, -8);
    drawDim(pdf, [x + w, y], [x + w, y + h], `${h}`, startX, startY, scale, 8);
    drawDim(pdf, [0, y], [x, y], `${x}`, startX, startY, scale, 10);
    drawDim(pdf, [x + w, 0], [x + w, y], `${y}`, startX, startY, scale, -10);
  }


if (board.shape === 'RECT_DOUBLE_CUTOUT') {
  const d = board.dimensions;

  const x1 = Number(d.hole1OffsetWidth);
  const y1 = Number(d.hole1OffsetLength);
  const w1 = Number(d.hole1Width);
  const h1 = Number(d.hole1Height);

  const x2 = Number(d.hole2OffsetWidth);
  const y2 = Number(d.hole2OffsetLength);
  const w2 = Number(d.hole2Width);
  const h2 = Number(d.hole2Height);

  // =====================================================
  // OTWÓR 1
  // =====================================================

  drawRectHole(
    pdf,
    x1,
    y1,
    w1,
    h1,
    startX,
    startY,
    scale
  );

  // szerokość otworu 1 — nad otworem
  drawDim(
    pdf,
    [x1, y1 + h1],
    [x1 + w1, y1 + h1],
    `${w1}`,
    startX,
    startY,
    scale,
    5
  );

  // wysokość otworu 1 — prawa strona
  drawDim(
    pdf,
    [x1 + w1, y1],
    [x1 + w1, y1 + h1],
    `${h1}`,
    startX,
    startY,
    scale,
    -5
  );

  // położenie X — z lewej
  drawDim(
    pdf,
    [0, y1],
    [x1, y1],
    `${x1}`,
    startX,
    startY,
    scale,
    -5
  );

  // położenie Y — od dołu
  drawDim(
    pdf,
    [x1 + w1, 0],
    [x1 + w1, y1],
    `${y1}`,
    startX,
    startY,
    scale,
    40
  );

  // =====================================================
  // OTWÓR 2
  // =====================================================

  drawRectHole(
    pdf,
    x2,
    y2,
    w2,
    h2,
    startX,
    startY,
    scale
  );

  // szerokość otworu 2
  drawDim(
    pdf,
    [x2, y2 + h2],
    [x2 + w2, y2 + h2],
    `${w2}`,
    startX,
    startY,
    scale,
    5
  );

  // wysokość otworu 2
  drawDim(
    pdf,
    [x2 + w2, y2],
    [x2 + w2, y2 + h2],
    `${h2}`,
    startX,
    startY,
    scale,
    -5
  );

  // położenie X — dalej na zewnątrz
  drawDim(
    pdf,
    [0, y2],
    [x2, y2],
    `${x2}`,
    startX,
    startY,
    scale,
    -5
  );

  // położenie Y — dalej na zewnątrz
  drawDim(
    pdf,
    [x2 + w2, 0],
    [x2 + w2, y2],
    `${y2}`,
    startX,
    startY,
    scale,
    30
  );
}
}

function drawTechnicalDimensions(
  pdf: jsPDF,
  board: any,
  points: PdfPoint[],
  startX: number,
  startY: number,
  scale: number
) {
  const d = board.dimensions;
  const b = getBounds(points);

// =========================================================
// WYMIARY ZEWNĘTRZNE
// =========================================================

// szerokość całkowita — najbliżej formatki
drawDim(
  pdf,
  [b.minX, b.minY],
  [b.maxX, b.minY],
  `${Math.round(b.width)}`,
  startX,
  startY,
  scale,
  30
);

// wysokość całkowita — na zewnątrz po lewej
drawDim(
  pdf,
  [b.minX, b.minY],
  [b.minX, b.maxY],
  `${Math.round(b.height)}`,
  startX,
  startY,
  scale,
  -30
);


if (board.shape === 'RECT_DOUBLE_CUTOUT') {
  const d = board.dimensions;

  // =====================================================
  // ZASADA:
  // 10 mm  — pierwszy poziom
  // 20 mm  — drugi
  // 30 mm  — trzeci
  // 40 mm  — czwarty
  // =====================================================

  const D1 = 10;
  const D2 = 20;
  const D3 = 30;
  const D4 = 40;

  // =====================================================
  // GÓRA — szerokość górnego odcinka
  // =====================================================

  drawDim(
    pdf,
    [d.width1, d.length],
    [d.width, d.length],
    `${Math.round(d.width - d.width1)}`,
    startX,
    startY,
    scale,
    -D2
  );

  // =====================================================
  // DÓŁ — szerokość dolnego odcinka
  // =====================================================

  drawDim(
    pdf,
    [d.width2, 0],
    [d.width, 0],
    `${Math.round(d.width - d.width2)}`,
    startX,
    startY,
    scale,
    D2
  );



// =====================================================
// LEWA STRONA
// 1900 bliżej formatki
// 2000 dalej
// =====================================================

drawDim(
  pdf,
  [0, d.length2],
  [0, d.length - d.length1],
  `${Math.round(
    d.length - d.length1 - d.length2
  )}`,
  startX,
  startY,
  scale,
  -20
);



// =====================================================
// PRAWA STRONA
// 100 bliżej formatki
// 1400 dalej
// =====================================================

// 100 — dolny odcinek
drawDim(
  pdf,
  [d.width2, 0],
  [d.width2, d.length2],
  `${Math.round(d.length2)}`,
  startX,
  startY,
  scale,
  10
);

  // =====================================================
  // ŚCIĘCIE GÓRNE
  // =====================================================

  drawDim(
    pdf,
    [d.width1, d.length],
    [0, d.length - d.length1],
    `${Math.round(
      Math.hypot(
        d.width1,
        d.length1
      )
    )}`,
    startX,
    startY,
    scale,
    D4
  );

  // =====================================================
  // ŚCIĘCIE DOLNE
  // =====================================================

  drawDim(
    pdf,
    [0, d.length2],
    [d.width2, 0],
    `${Math.round(
      Math.hypot(
        d.width2,
        d.length2
      )
    )}`,
    startX,
    startY,
    scale,
    D4
  );


  // =====================================================
  // OTWORY
  // =====================================================

  drawHoleWithDimensions(
    pdf,
    board,
    startX,
    startY,
    scale
  );
}








if (board.shape === 'RECT_CUT_CORNER') {
  // szerokość górnego odcinka
  drawDim(pdf, [0, d.length1], [d.width2, d.length1], `${d.width2}`, startX, startY, scale, -14);
  // wysokość prawa / wysokość2 na zewnątrz figury
  drawDim(pdf, [d.width1, 0], [d.width1, d.length2], `${d.length2}`, startX, startY, scale, 22);

}

if (board.shape === 'RECT_CORNER_NOTCH') {
  // szerokość górnego odcinka
  drawDim(pdf, [0, d.length1], [d.width2, d.length1], `${d.width2}`, startX, startY, scale, -14);
  // druga wysokość po prawej
  drawDim(pdf, [d.width1, 0], [d.width1, d.length2], `${d.length2}`, startX, startY, scale, 22);
}





  if (board.shape === 'RIGHT_TRAPEZOID') {
    // TP — bez drugiego 800, tylko prawa wysokość jeśli inna
    if (d.lengthRight !== d.lengthLeft) {
      drawDim(pdf, [d.width, 0], [d.width, d.lengthRight], `${d.lengthRight}`, startX, startY, scale, 16);
    }
  }

  if (board.shape === 'TRAPEZOID' || board.shape === 'TRAPEZOID_INNER_CUTOUT') {
    // TR/TR-OPR — stojąco, jeden wymiar 400 na dole
    drawDim(pdf, [0, d.height], [d.leftInset, d.height], `${d.leftInset}`, startX, startY, scale, -12);
    drawDim(pdf, [d.width - d.rightInset, d.height], [d.width, d.height], `${d.rightInset}`, startX, startY, scale, -12);
  }

//  drawHoleWithDimensions(pdf, board, startX, startY, scale);
}


function drawEdgingSquare(
  pdf: jsPDF,
  board: any,
  edgeKey: string,
  p1: PdfPoint,
  p2: PdfPoint,
  startX: number,
  startY: number,
  scale: number
) {
  if (
    !p1 ||
    !p2 ||
    p1[0] === undefined ||
    p1[1] === undefined ||
    p2[0] === undefined ||
    p2[1] === undefined
  ) {
    return;
  }

  const [x1, y1] = toPdfPoint(p1, startX, startY, scale);
  const [x2, y2] = toPdfPoint(p2, startX, startY, scale);

  if (
    !Number.isFinite(x1) ||
    !Number.isFinite(y1) ||
    !Number.isFinite(x2) ||
    !Number.isFinite(y2)
  ) {
    return;
  }

const filled = Boolean(board.edging?.[edgeKey]);

if (!filled) {
  pdf.setLineWidth(0.35);
  pdf.setDrawColor(0, 0, 0);       // zwykła krawędź — czarna
} else {
  pdf.setLineWidth(1.40);
  pdf.setDrawColor(255, 0, 0);     // okleina — czerwona
}

pdf.line(
  x1,
  y1,
  x2,
  y2
);

// wracamy do czarnego koloru
pdf.setDrawColor(0, 0, 0);
}


function getFirstExistingEdgingKey(board: any, keys: string[]) {
  return keys.find((key) => Object.prototype.hasOwnProperty.call(board.edging ?? {}, key));
}



function drawEdgingSquares(
  pdf: jsPDF,
  board: any,
  startX: number,
  startY: number,
  scale: number
) {
  const d = board.dimensions;
  if (board.shape === 'RECT' || board.shape === 'RECT_INNER_CUTOUT') {
    drawEdgingSquare(pdf, board, 'widthBottom', [0, 0], [d.width, 0], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'widthTop', [0, d.length], [d.width, d.length], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'lengthLeft', [0, 0], [0, d.length], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'lengthRight', [d.width, 0], [d.width, d.length], startX, startY, scale);
  }
  if (board.shape === 'RECT_CUT_CORNER') {
    drawEdgingSquare(pdf, board, 'widthBottom', [0, 0], [d.width1, 0], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'widthTop', [0, d.length1], [d.width2, d.length1], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'lengthLeft', [0, 0], [0, d.length1], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'lengthRight', [d.width1, 0], [d.width1, d.length2], startX, startY, scale);

drawEdgingSquare(
  pdf,
  board,
  'cut',
  [d.width2, d.length1],
  [d.width1, d.length2],
  startX,
  startY,
  scale
);

  }
  if (board.shape === 'RECT_CORNER_NOTCH') {
    drawEdgingSquare(pdf, board, 'widthBottom', [0, 0], [d.width1, 0], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'widthTop', [0, d.length1], [d.width2, d.length1], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'lengthLeft', [0, 0], [0, d.length1], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'lengthRight', [d.width1, 0], [d.width1, d.length2], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'notchVertical', [d.width2, d.length2], [d.width2, d.length1], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'notchHorizontal', [d.width2, d.length2], [d.width1, d.length2], startX, startY, scale);
  }
  if (board.shape === 'RIGHT_TRAPEZOID') {
    drawEdgingSquare(pdf, board, 'widthBottom', [0, 0], [d.width, 0], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'widthTop', [0, d.lengthLeft], [d.width, d.lengthRight], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'lengthLeft', [0, 0], [0, d.lengthLeft], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'lengthRight', [d.width, 0], [d.width, d.lengthRight], startX, startY, scale);
  }
  if (board.shape === 'TRAPEZOID' || board.shape === 'TRAPEZOID_INNER_CUTOUT') {
    drawEdgingSquare(pdf, board, 'widthBottom', [0, 0], [d.width, 0], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'widthTop', [d.leftInset, d.height], [d.width - d.rightInset, d.height], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'lengthLeft', [0, 0], [d.leftInset, d.height], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'lengthRight', [d.width, 0], [d.width - d.rightInset, d.height], startX, startY, scale);
  }
if (board.shape === 'RECT_INNER_CUTOUT') {
    const x = d.cutoutOffsetWidth;
    const y = d.cutoutOffsetLength;
    const w = d.cutoutWidth;
    const h = d.cutoutLength;

    drawEdgingSquare(pdf, board, 'otwórDół', [x, y], [x + w, y], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'otwórGóra', [x, y + h], [x + w, y + h], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'otwórLewo', [x, y], [x, y + h], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'otwórPrawo', [x + w, y], [x + w, y + h], startX, startY, scale);
  }




if (board.shape === 'RECT_DOUBLE_CUTOUT') {

  // DÓŁ
  drawEdgingSquare(
    pdf,
    board,
    'doubleBottom',
    [d.width2, 0],
    [d.width, 0],
    startX,
    startY,
    scale
  );

  // PRAWA
  drawEdgingSquare(
    pdf,
    board,
    'doubleRight',
    [d.width, 0],
    [d.width, d.length],
    startX,
    startY,
    scale
  );

  // GÓRA
  drawEdgingSquare(
    pdf,
    board,
    'doubleTop',
    [d.width, d.length],
    [d.width1, d.length],
    startX,
    startY,
    scale
  );

  // LEWE GÓRNE ŚCIĘCIE
  drawEdgingSquare(
    pdf,
    board,
    'cut2',
    [d.width1, d.length],
    [0, d.length - d.length1],
    startX,
    startY,
    scale
  );

  // LEWA
  drawEdgingSquare(
    pdf,
    board,
    'doubleLeft',
    [0, d.length - d.length1],
    [0, d.length2],
    startX,
    startY,
    scale
  );

  // LEWE DOLNE ŚCIĘCIE
  drawEdgingSquare(
    pdf,
    board,
    'cut1',
    [0, d.length2],
    [d.width2, 0],
    startX,
    startY,
    scale
  );

  // ==========================
  // OTWÓR 1
  // ==========================

  const x1 = Number(d.hole1OffsetWidth);
  const y1 = Number(d.hole1OffsetLength);
  const w1 = Number(d.hole1Width);
  const h1 = Number(d.hole1Height);

  drawEdgingSquare(
    pdf, board, 'otwór1Dół',
    [x1, y1],
    [x1 + w1, y1],
    startX, startY, scale
  );

  drawEdgingSquare(
    pdf, board, 'otwór1Góra',
    [x1, y1 + h1],
    [x1 + w1, y1 + h1],
    startX, startY, scale
  );

  drawEdgingSquare(
    pdf, board, 'otwór1Lewo',
    [x1, y1],
    [x1, y1 + h1],
    startX, startY, scale
  );

  drawEdgingSquare(
    pdf, board, 'otwór1Prawo',
    [x1 + w1, y1],
    [x1 + w1, y1 + h1],
    startX, startY, scale
  );

  // ==========================
  // OTWÓR 2
  // ==========================

  const x2 = Number(d.hole2OffsetWidth);
  const y2 = Number(d.hole2OffsetLength);
  const w2 = Number(d.hole2Width);
  const h2 = Number(d.hole2Height);

  drawEdgingSquare(
    pdf, board, 'otwór2Dół',
    [x2, y2],
    [x2 + w2, y2],
    startX, startY, scale
  );

  drawEdgingSquare(
    pdf, board, 'otwór2Góra',
    [x2, y2 + h2],
    [x2 + w2, y2 + h2],
    startX, startY, scale
  );

  drawEdgingSquare(
    pdf, board, 'otwór2Lewo',
    [x2, y2],
    [x2, y2 + h2],
    startX, startY, scale
  );

  drawEdgingSquare(
    pdf, board, 'otwór2Prawo',
    [x2 + w2, y2],
    [x2 + w2, y2 + h2],
    startX, startY, scale
  );
}






  if (board.shape === 'TRAPEZOID_INNER_CUTOUT') {
    const x = d.cutoutOffsetWidth;
    const y = d.cutoutOffsetLength;
    const w = d.cutoutWidth;
    const h = d.cutoutLength;

    drawEdgingSquare(pdf, board, 'otwórDół', [x, y], [x + w, y], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'otwórGóra', [x, y + h], [x + w, y + h], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'otwórLewo', [x, y], [x, y + h], startX, startY, scale);
    drawEdgingSquare(pdf, board, 'otwórPrawo', [x + w, y], [x + w, y + h], startX, startY, scale);
  }

}






function getIntersectionsY(x: number, pts: PdfPoint[]) {
  const ys: number[] = [];

  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];

    const x1 = a[0];
    const y1 = a[1];
    const x2 = b[0];
    const y2 = b[1];

    if ((x >= x1 && x <= x2) || (x >= x2 && x <= x1)) {
      if (x1 === x2) continue;

      const t = (x - x1) / (x2 - x1);
      const y = y1 + (y2 - y1) * t;

      ys.push(y);
    }
  }

  return ys.sort((a, b) => a - b);
}

function getIntersectionsX(y: number, pts: PdfPoint[]) {
  const xs: number[] = [];

  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];

    const x1 = a[0];
    const y1 = a[1];
    const x2 = b[0];
    const y2 = b[1];

    if ((y >= y1 && y <= y2) || (y >= y2 && y <= y1)) {
      if (y1 === y2) continue;

      const t = (y - y1) / (y2 - y1);
      const x = x1 + (x2 - x1) * t;

      xs.push(x);
    }
  }

  return xs.sort((a, b) => a - b);
}









function drawGrainDirection(
  pdf: jsPDF,
  board: any,
  points: PdfPoint[],
  startX: number,
  startY: number,
  scale: number
) {
  if (!board.grainDirection || board.grainDirection === 'none') return;

  const pdfPoints = points.map((p) =>
    toPdfPoint(p, startX, startY, scale)
  );

  const xs = pdfPoints.map((p) => p[0]);
  const ys = pdfPoints.map((p) => p[1]);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // KLIP DO PRAWDZIWEGO KSZTAŁTU FORMATKI
  pdf.saveGraphicsState();

  pdf.moveTo(pdfPoints[0][0], pdfPoints[0][1]);

  for (let i = 1; i < pdfPoints.length; i++) {
    pdf.lineTo(pdfPoints[i][0], pdfPoints[i][1]);
  }

  pdf.close();

  // =========================================================
  // RECT_DOUBLE_CUTOUT — kształt minus dwa otwory
  // =========================================================

  if (board.shape === 'RECT_DOUBLE_CUTOUT') {
    const d = board.dimensions;

const holes = [
  {
    x: Number(d.hole1OffsetWidth),
    y: Number(d.hole1OffsetLength),
    w: Number(d.hole1Width),
    h: Number(d.hole1Height)
  },
  {
    x: Number(d.hole2OffsetWidth),
    y: Number(d.hole2OffsetLength),
    w: Number(d.hole2Width),
    h: Number(d.hole2Height)
  }
];



    for (const hole of holes) {
      const left = startX + hole.x * scale;
      const right = startX + (hole.x + hole.w) * scale;

      const top =
        startY - (hole.y + hole.h) * scale;

      const bottom =
        startY - hole.y * scale;

      pdf.moveTo(left, bottom);
      pdf.lineTo(right, bottom);
      pdf.lineTo(right, top);
      pdf.lineTo(left, top);
      pdf.close();
    }

    pdf.clipEvenOdd();
  } else {
    // STARE FORMATKI — dokładnie zwykły klip
    pdf.clip();
  }

  pdf.setLineWidth(0.03);
  pdf.setDrawColor(170);

  const spacing = 7;

  // =========================================================
  // STARE OTWORY:
  // RECT_INNER_CUTOUT
  // TRAPEZOID_INNER_CUTOUT
  // =========================================================

  const hasCutout =
    board.shape === 'RECT_INNER_CUTOUT' ||
    board.shape === 'TRAPEZOID_INNER_CUTOUT';

  let cutLeft = 0;
  let cutRight = 0;
  let cutTop = 0;
  let cutBottom = 0;

  if (hasCutout) {
    const d: any = board.dimensions;

    cutLeft =
      startX +
      Number(d.cutoutOffsetWidth) * scale;

    cutRight =
      startX +
      (
        Number(d.cutoutOffsetWidth) +
        Number(d.cutoutWidth)
      ) * scale;

    cutBottom =
      startY -
      Number(d.cutoutOffsetLength) * scale;

    cutTop =
      startY -
      (
        Number(d.cutoutOffsetLength) +
        Number(d.cutoutLength)
      ) * scale;
  }

  // =========================================================
  // PION
  // =========================================================

  if (board.grainDirection === 'vertical') {
    for (let x = minX + spacing; x < maxX; x += spacing) {

      const ys = getIntersectionsY(x, pdfPoints);

      if (ys.length < 2) continue;

      const yTop = ys[0];
      const yBottom = ys[ys.length - 1];

      // STARE FORMATKI Z JEDNYM OTWOREM
      if (hasCutout) {

        if (x < cutLeft || x > cutRight) {
          pdf.line(
            x,
            yTop + 0.5,
            x,
            yBottom - 0.5
          );
        } else {
          // przerwa w miejscu otworu
          pdf.line(
            x,
            yTop + 0.5,
            x,
            cutTop - 0.5
          );

          pdf.line(
            x,
            cutBottom + 0.5,
            x,
            yBottom - 0.5
          );
        }

      } else {

        // RECT_DOUBLE_CUTOUT oraz pozostałe formatki
        // obsługiwane przez clipping
        pdf.line(
          x,
          yTop + 0.5,
          x,
          yBottom - 0.5
        );
      }
    }
  }

  // =========================================================
  // POZIOM
  // =========================================================

  if (board.grainDirection === 'horizontal') {
    for (let y = minY + spacing; y < maxY; y += spacing) {

      const xs = getIntersectionsX(y, pdfPoints);

      if (xs.length < 2) continue;

      const xLeft = xs[0];
      const xRight = xs[xs.length - 1];

      // STARE FORMATKI Z JEDNYM OTWOREM
      if (hasCutout) {

        if (y < cutTop || y > cutBottom) {

          pdf.line(
            xLeft + 0.5,
            y,
            xRight - 0.5,
            y
          );

        } else {

          // przerwa w miejscu otworu
          pdf.line(
            xLeft + 0.5,
            y,
            cutLeft - 0.5,
            y
          );

          pdf.line(
            cutRight + 0.5,
            y,
            xRight - 0.5,
            y
          );
        }

      } else {

        // RECT_DOUBLE_CUTOUT oraz pozostałe formatki
        // obsługiwane przez clipping
        pdf.line(
          xLeft + 0.5,
          y,
          xRight - 0.5,
          y
        );
      }
    }
  }

  pdf.restoreGraphicsState();

  pdf.setDrawColor(0);
}













function printSelectedBoardsToPdf() {
  const project = useProjectStore.getState().project;
  const boards = project.boards.filter((b: any) => b.printSelected);
  if (!boards.length) {
    alert('Nie wybrano żadnych formatek do wydruku.');
    return;
  }
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  boards.forEach((board: any, index: number) => {
    if (index > 0) pdf.addPage();
    const points = getPdfShapePoints(board);
    const bounds = getBounds(points);
    const maxDrawW = 140;
    const maxDrawH = 170;
    const scale = Math.min(
      maxDrawW / Math.max(bounds.width, 1),
      maxDrawH / Math.max(bounds.height, 1)
    );
// =========================================================
// CENTROWANIE FORMATKI NA A4
// =========================================================

const pageW = 210;
const pageH = 297;

const drawW = bounds.width * scale;
const drawH = bounds.height * scale;

// środek formatki = środek kartki
const startX =
  (pageW - drawW) / 2 -
  bounds.minX * scale;

const startY =
  (pageH + drawH) / 2 +
  bounds.minY * scale;
    
    pdf.setFontSize(22);
    pdf.text(board.number, 15, 22);
//    if (board.shape !== 'RECT') {
//  pdf.setLineWidth(0.15);
//  pdf.rect(
//    startX,
//    startY - bounds.height * scale,
//    bounds.width * scale,
//    bounds.height * scale
//  );
//}

drawGrainDirection(pdf, board, points, startX, startY, scale);
drawShape(pdf, points, startX, startY, scale, board);
drawTechnicalDimensions(pdf, board, points, startX, startY, scale);
drawEdgingSquares(pdf, board, startX, startY, scale);
  });
  pdf.save('formatki-do-druku.pdf');
}












export function TopToolbar() {
  
const [cabinetsOpen, setCabinetsOpen] = useState(false);

const [selectedCabinetId, setSelectedCabinetId] =
  useState<string | null>(null);
const [editingCabinetId, setEditingCabinetId] = useState<string | null>(null);

const [cabinetInsertX, setCabinetInsertX] = useState(0);
const [cabinetInsertY, setCabinetInsertY] = useState(0);
const [cabinetInsertZ, setCabinetInsertZ] = useState(0);


const [cabinetFormOpen, setCabinetFormOpen] = useState(false);
const [cabinetName, setCabinetName] = useState('');
const [cabinetHeight, setCabinetHeight] = useState(720);
const [cabinetWidth, setCabinetWidth] = useState(600);
const [cabinetDepth, setCabinetDepth] = useState(560);
const [cabinetPlinth, setCabinetPlinth] = useState(100);


const [cabinetNewHeight, setCabinetNewHeight] = useState(0);
const [cabinetNewWidth, setCabinetNewWidth] = useState(0);
const [cabinetNewDepth, setCabinetNewDepth] = useState(0);
const [cabinetNewPlinth, setCabinetNewPlinth] = useState(0);


const [setTargetX, setSetTargetX] = useState(0);
const [setTargetY, setSetTargetY] = useState(0);
const [setTargetZ, setSetTargetZ] = useState(0);








const fileInputRef = useRef<HTMLInputElement | null>(null);

const cabinetsFileInputRef =
  useRef<HTMLInputElement | null>(null);


  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [anchorOpen, setAnchorOpen] = useState(false);
const [setMoveOpen, setSetMoveOpen] = useState(false);














const {
  project,
  saveProjectToFile,
  exportCsv,
  saveCabinet,
  addCabinetToProject,
saveCabinetsToFile,
  loadCabinetsFromFile,
  deleteCabinet,
copyCabinet,
updateCabinet,
updateCabinetBoardFormulas,
removeCabinetBoard,
moveSelectedSetTo,
rotateSelectedSet90,
    openAddBoardModal,
    updateProjectAnchor,
    resetView,
    undo,
    redo,
    setProjectMaterial,
    setViewMode,
measureMode,
setMeasureMode,
clearMeasurements,
    viewMode
  } = useProjectStore();


  const loadProjectFromFile = useProjectStore((s) => s.loadProjectFromFile);





useEffect(() => {
  if (!setMoveOpen) return;

  const setBoards = project.boards.filter(
    (board) =>
      board.setSelected === true &&
      !board.hiddenInProject
  );

  if (!setBoards.length) return;

  let nearest = null;
  let nearestDistance = Infinity;

  for (const board of setBoards) {
    const vertices = getOuterVertices3D(board);

    for (const vertex of vertices) {
      const distance =
        vertex.x * vertex.x +
        vertex.y * vertex.y +
        vertex.z * vertex.z;

      if (distance < nearestDistance) {
        nearestDistance = distance;

        nearest = {
          x: vertex.x,
          y: vertex.y,
          z: vertex.z
        };
      }
    }
  }

  if (!nearest) return;

  setSetTargetX(nearest.x);
  setSetTargetY(nearest.y);
  setSetTargetZ(nearest.z);
}, [setMoveOpen, project.boards]);







  return (
    <div className="top-toolbar-wrap">
      <div className="top-toolbar">
        <div className="toolbar-main-actions">
          <button onClick={handleSave}>ZAPISZ</button>
          <button onClick={() => fileInputRef.current?.click()}>OTWÓRZ</button>
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept="application/json"
            onChange={async (e) => {
              const input = e.target as HTMLInputElement;
              const file = input.files?.[0];
              if (file) {
                await loadProjectFromFile(file);
                input.value = '';
              }
            }}
          />
          <button onClick={exportCsv}>CSV</button>
	  <button onClick={printSelectedBoardsToPdf}>WYBRANE</button>
          <button onClick={() => {setMaterialsOpen((prev) => !prev)}}>MATERIAŁ</button>

<button
  className={measureMode ? 'active' : ''}
  onClick={() => {
    setMeasureMode(!measureMode);
  }}
>
  WYMIARY
</button>

          <button onClick={openAddBoardModal}>FORMATKI</button>



<button
onClick={() => {
const boards = useProjectStore.getState().project.boards;

const hasSelectedBoards = boards.some(
  (board) =>
    board.cabinetSelected === true &&
    !board.hiddenInProject
);
  if (!hasSelectedBoards) {
    window.alert('Najpierw zaznacz formatki do tworzonej szafki.');
    return;
  }


  setCabinetName('');
  setCabinetFormOpen(true);
}}
>
  TWÓRZ SZAFKĘ
</button>



<button
  onClick={() => setCabinetsOpen(true)}
>
  DODAJ SZAFKĘ
</button>







          <button onClick={() => setAnchorOpen((prev) => !prev)}>NAROŻNIK</button>
<button onClick={() => setSetMoveOpen((prev) => !prev)}>
  ZESTAW
</button>


          <button onClick={resetView}>RESET WIDOKU</button>
          <button onClick={undo}>COFNIJ</button>
          <button onClick={redo}>PONÓW</button>
        </div>

        <div className="toolbar-view-tabs">
          {VIEW_TABS.map((tab) => (
            <button key={tab} className={viewMode === tab ? 'active' : ''} onClick={() => setViewMode(tab)}>{tab}</button>
          ))}
        </div>
      </div>



      {materialsOpen && (
        <div className="toolbar-panel toolbar-panel-wide">
          <div className="materials-popover-header">
            <strong>Ustawienia materiałów projektu</strong>
<button
  type="button"
  className="secondary"
  onClick={(e) => {
    e.stopPropagation();
    setMaterialsOpen(false);
  }}
>
  Zamknij
</button>          </div>

          <div className="project-materials">
            {([
  { family: 'korpus', label: 'KORPUS' },
  { family: 'front', label: 'FRONT' },
  { family: 'blat', label: 'BLAT' },
  { family: 'hdf', label: 'HDF' },
  { family: 'inne', label: 'INNE' },
  { family: 'okleina', label: 'OKLEINA' }
] as const).map(({ family, label }) => (
              <div key={family} className="material-family">
                <strong>{label}</strong>
                {[1, 2, 3].map((index) => (
                  <label key={`${family}-${index}`}>
                    {label} {index}
                    <ColorSelect
  value={(project.materials as any)?.[family]?.[index as MaterialIndex] ?? 'biały'}
  onChange={(color) => setProjectMaterial(
  family as any,
  index as MaterialIndex,
  color as any
)}
/>
                  </label>
                ))}


{family !== 'okleina' && (
  <label>
    Słój
    <select
      value={(project as any).defaultGrainDirections?.[family] ?? 'vertical'}
      onChange={(e) => {
  const nextGrain =
    e.target.value as 'none' | 'vertical' | 'horizontal';

  const state = useProjectStore.getState();

  const roleForFamily =
    family === 'korpus'
      ? 'KORPUS'
      : family === 'front'
      ? 'FRONT'
      : family === 'blat'
      ? 'BLAT'
      : family === 'hdf'
      ? 'HDF'
      : family === 'inne'
      ? 'INNE'
      : null;

  useProjectStore.setState({
    project: {
      ...state.project,
      defaultGrainDirections: {
        korpus: 'vertical',
        front: 'vertical',
        blat: 'vertical',
        hdf: 'vertical',
        inne: 'vertical',
        ...(state.project as any).defaultGrainDirections,
        [family]: nextGrain
      },
      boards: state.project.boards.map((board) =>
        roleForFamily && board.role === roleForFamily
          ? {
              ...board,
              grainDirection: nextGrain
            }
          : board
      )
    }
  });
}}
    >
      <option value="vertical">Pion</option>
      <option value="horizontal">Poziom</option>
      <option value="none">Brak</option>
    </select>
  </label>
)}




              </div>
            ))}






          </div>
        </div>
      )}



      {anchorOpen && (
        <div className="toolbar-panel toolbar-panel-anchor">
          <div className="materials-popover-header">
            <strong>Położenie narożnika dla nowych formatek</strong>
            <button className="secondary" onClick={() => setAnchorOpen(false)}>Zamknij</button>
          </div>

          <div className="toolbar-group anchor-group anchor-editor">
            <label>X
              <input type="number" value={project.globalAnchor.x} onChange={(e) => updateProjectAnchor({ ...project.globalAnchor, x: Number(e.target.value) })} />
            </label>
            <label>Y
              <input type="number" value={project.globalAnchor.y} onChange={(e) => updateProjectAnchor({ ...project.globalAnchor, y: Number(e.target.value) })} />
            </label>
            <label>Z
              <input type="number" value={project.globalAnchor.z} onChange={(e) => updateProjectAnchor({ ...project.globalAnchor, z: Number(e.target.value) })} />
            </label>
          </div>
        </div>
      )}




{setMoveOpen && (
  <div className="toolbar-panel toolbar-panel-anchor set-move-panel">
    <div className="set-move-row">

      <strong>PUNKT DOCELOWY ZESTAWU FORMATEK</strong>

      <label>
        X
        <input
          type="number"
          value={setTargetX}
          onChange={(e) =>
            setSetTargetX(Number(e.target.value))
          }
        />
      </label>

      <label>
        Y
        <input
          type="number"
          value={setTargetY}
          onChange={(e) =>
            setSetTargetY(Number(e.target.value))
          }
        />
      </label>

      <label>
        Z
        <input
          type="number"
          value={setTargetZ}
          onChange={(e) =>
            setSetTargetZ(Number(e.target.value))
          }
        />
      </label>

      <button
        type="button"
        onClick={() => {
          moveSelectedSetTo({
            x: setTargetX,
            y: setTargetY,
            z: setTargetZ
          });
        }}
      >
        PRZESUŃ ZESTAW
      </button>

      <button
        type="button"
        onClick={() => {
          rotateSelectedSet90();
        }}
      >
        OBRÓĆ ZESTAW 90°
      </button>

      <button
        type="button"
        className="secondary"
        onClick={() => setSetMoveOpen(false)}
      >
        ZAMKNIJ
      </button>

    </div>
  </div>
)}






{cabinetFormOpen && (
  <div className="toolbar-panel">
    <div className="materials-popover-header">
      <strong>Nowa szafka</strong>

      <button
        className="secondary"
        onClick={() => setCabinetFormOpen(false)}
      >
        Anuluj
      </button>
    </div>
    <div style={{ padding: '10px' }}>
      <label style={{ display: 'block', marginBottom: '8px' }}>
        Nazwa
        <input
          type="text"
          value={cabinetName}
          onChange={(e) => setCabinetName(e.target.value)}
          placeholder="np. Szafka dolna 600"
          style={{ display: 'block', width: '100%' }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: '8px' }}>
        Wysokość [mm]
        <input
          type="number"
          value={cabinetHeight}
          onChange={(e) => setCabinetHeight(Number(e.target.value))}
          style={{ display: 'block', width: '100%' }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: '8px' }}>
        Szerokość [mm]
        <input
          type="number"
          value={cabinetWidth}
          onChange={(e) => setCabinetWidth(Number(e.target.value))}
          style={{ display: 'block', width: '100%' }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: '8px' }}>
        Głębokość [mm]
        <input
          type="number"
          value={cabinetDepth}
          onChange={(e) => setCabinetDepth(Number(e.target.value))}
          style={{ display: 'block', width: '100%' }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: '12px' }}>
        Cokół [mm]
        <input
          type="number"
          value={cabinetPlinth}
          onChange={(e) => setCabinetPlinth(Number(e.target.value))}
          style={{ display: 'block', width: '100%' }}
        />
      </label>

      <button
        type="button"
        onClick={() => {
          if (!cabinetName.trim()) {
            window.alert('Podaj nazwę szafki.');
            return;
          }

          saveCabinet(cabinetName, {
            height: cabinetHeight,
            width: cabinetWidth,
            depth: cabinetDepth,
            plinth: cabinetPlinth
          });

          setCabinetFormOpen(false);
          setCabinetsOpen(true);
        }}
      >
        Zapisz szafkę
      </button>
    </div>
  </div>
)}



      {cabinetsOpen && (
        <div className="toolbar-panel">
<div className="materials-popover-header">
  <strong>Zapisane szafki</strong>

  <div style={{ display: 'flex', gap: '6px' }}>
    <button
      type="button"
      onClick={() =>
        cabinetsFileInputRef.current?.click()
      }
    >
      Wczytaj szafki
    </button>

    <button
      type="button"
      onClick={saveCabinetsToFile}
    >
      Zapisz szafki
    </button>

    <button
      className="secondary"
      onClick={() => setCabinetsOpen(false)}
    >
      Zamknij
    </button>
  </div>

  <input
    ref={cabinetsFileInputRef}
    hidden
    type="file"
    accept=".json,application/json"
    onChange={async (e) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];

      if (file) {
        await loadCabinetsFromFile(file);
        input.value = '';
      }
    }}
  />
</div>
          <div
  style={{
    padding: '10px',
    maxHeight: '500px',
    overflowY: 'auto',
    overflowX: 'hidden'
  }}
>
{project.cabinets?.length ? (
project.cabinets.map((cabinet) => (
                <div
                  key={cabinet.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #ccc'
                  }}
                >
<strong>{cabinet.name}</strong>

<div style={{ display: 'flex', gap: '6px' }}>
  <button
    type="button"
    onClick={() => {
      setSelectedCabinetId(cabinet.id);
    }}
  >
    Wybierz
  </button>





<button
  type="button"
  onClick={() => {
    const newName = window.prompt(
      'Podaj nazwę kopii szafki:',
      `${cabinet.name} - kopia`
    );

    if (!newName?.trim()) {
      return;
    }

    copyCabinet(
      cabinet.id,
      newName.trim()
    );
  }}
>
  Kopiuj
</button>


  <button
    type="button"
    onClick={() => {
      deleteCabinet(cabinet.id);

      if (selectedCabinetId === cabinet.id) {
        setSelectedCabinetId(null);
      }
    }}
  >
    Usuń
  </button>
</div>


{selectedCabinetId === cabinet.id && (
  <div
    style={{
      marginTop: '8px',
      padding: '8px',
      background: '#f3f3f3',
      borderRadius: '4px'
    }}
  >
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2.5fr 1fr 1fr',
        gap: '12px',
        alignItems: 'start'
      }}
    >

      {/* ================================================= */}
      {/* 1. WYMIARY SZABLONU                               */}
      {/* ================================================= */}

      <div
        style={{
          padding: '10px',
          background: '#ffffff',
          borderRadius: '4px'
        }}
      >
        <strong>Wymiary szafki:</strong>

        <div style={{ marginTop: '8px' }}>
          Wysokość: {cabinet.baseDimensions.height} mm
        </div>

        <div>
          Szerokość: {cabinet.baseDimensions.width} mm
        </div>

        <div>
          Głębokość: {cabinet.baseDimensions.depth} mm
        </div>

        <div>
          Cokół: {cabinet.baseDimensions.plinth} mm
        </div>
      </div>


      {/* ================================================= */}
      {/* 2. FORMATKI + WZORY                               */}
      {/* ================================================= */}

      <div
        style={{
          padding: '10px',
          background: '#ffffff',
          borderRadius: '4px',
          overflowX: 'auto'
        }}
      >
        <strong>Formatki w szablonie:</strong>

        <table
          style={{
            width: '100%',
            marginTop: '8px',
            borderCollapse: 'collapse',
            fontSize: '12px'
          }}
        >
<thead>
  <tr>
    <th style={{ border: '1px solid #ccc', padding: '4px' }}>
      Formatka
    </th>

    <th style={{ border: '1px solid #ccc', padding: '4px' }}>
      D1
    </th>

    <th style={{ border: '1px solid #ccc', padding: '4px' }}>
      S1
    </th>

    <th style={{ border: '1px solid #ccc', padding: '4px' }}>
      G1
    </th>

    <th style={{ border: '1px solid #ccc', padding: '4px' }}>
      D2
    </th>

    <th style={{ border: '1px solid #ccc', padding: '4px' }}>
      S2
    </th>

    <th style={{ border: '1px solid #ccc', padding: '4px' }}>
      G2
    </th>

    <th style={{ border: '1px solid #ccc', padding: '4px' }}>
      X2
    </th>

    <th style={{ border: '1px solid #ccc', padding: '4px' }}>
      Y2
    </th>

    <th style={{ border: '1px solid #ccc', padding: '4px' }}>
      Z2
    </th>

<th
  style={{
    border: '1px solid #ccc',
    padding: '4px'
  }}
>
  Akcje
</th>

  </tr>
</thead>

<tbody>
  {cabinet.boards.map((cabinetBoard) => (
    <tr key={cabinetBoard.board.id}>

      {/* Formatka */}
      <td
        style={{
          border: '1px solid #ccc',
          padding: '4px'
        }}
      >
        {cabinetBoard.board.number}
      </td>


{/* D1 */}
<td
  style={{
    border: '1px solid #ccc',
    padding: '4px'
  }}
>
  {cabinetBoard.D1}
</td>


{/* S1 */}
<td
  style={{
    border: '1px solid #ccc',
    padding: '4px'
  }}
>
  {cabinetBoard.S1}
</td>

      
{/* G1 */}
<td
  style={{
    border: '1px solid #ccc',
    padding: '4px'
  }}
>
  {cabinetBoard.G1}
</td>

      {/* D2 */}
      <td
        style={{
          border: '1px solid #ccc',
          padding: '4px'
        }}
      >
        <input
          type="text"
          value={cabinetBoard.formulas?.D2 ?? ''}
          onChange={(e) =>
            updateCabinetBoardFormulas(
              cabinet.id,
              cabinetBoard.board.id,
              { D2: e.target.value }
            )
          }
          style={{ width: '70px' }}
        />
      </td>

      {/* S2 */}
      <td
        style={{
          border: '1px solid #ccc',
          padding: '4px'
        }}
      >
        <input
          type="text"
          value={cabinetBoard.formulas?.S2 ?? ''}
          onChange={(e) =>
            updateCabinetBoardFormulas(
              cabinet.id,
              cabinetBoard.board.id,
              { S2: e.target.value }
            )
          }
          style={{ width: '70px' }}
        />
      </td>

      {/* G2 */}
      <td
        style={{
          border: '1px solid #ccc',
          padding: '4px'
        }}
      >
        <input
          type="text"
          value={cabinetBoard.formulas?.G2 ?? ''}
          onChange={(e) =>
            updateCabinetBoardFormulas(
              cabinet.id,
              cabinetBoard.board.id,
              { G2: e.target.value }
            )
          }
          style={{ width: '70px' }}
        />
      </td>

      {/* X2 */}
      <td
        style={{
          border: '1px solid #ccc',
          padding: '4px'
        }}
      >
        <input
          type="text"
          value={cabinetBoard.formulas?.X2 ?? ''}
          onChange={(e) =>
            updateCabinetBoardFormulas(
              cabinet.id,
              cabinetBoard.board.id,
              { X2: e.target.value }
            )
          }
          style={{ width: '70px' }}
        />
      </td>

      {/* Y2 */}
      <td
        style={{
          border: '1px solid #ccc',
          padding: '4px'
        }}
      >
        <input
          type="text"
          value={cabinetBoard.formulas?.Y2 ?? ''}
          onChange={(e) =>
            updateCabinetBoardFormulas(
              cabinet.id,
              cabinetBoard.board.id,
              { Y2: e.target.value }
            )
          }
          style={{ width: '70px' }}
        />
      </td>

      {/* Z2 */}
      <td
        style={{
          border: '1px solid #ccc',
          padding: '4px'
        }}
      >
        <input
          type="text"
          value={cabinetBoard.formulas?.Z2 ?? ''}
          onChange={(e) =>
            updateCabinetBoardFormulas(
              cabinet.id,
              cabinetBoard.board.id,
              { Z2: e.target.value }
            )
          }
          style={{ width: '70px' }}
        />
      </td>




<td
  style={{
    border: '1px solid #ccc',
    padding: '4px',
    textAlign: 'center'
  }}
>
  <button
    type="button"
    onClick={() => {
      removeCabinetBoard(
        cabinet.id,
        cabinetBoard.board.id
      );
    }}
  >
    Usuń
  </button>
</td>





    </tr>
  ))}
</tbody>

        </table>
      </div>


      {/* ================================================= */}
      {/* 3. GDZIE WSTAWIĆ                                 */}
      {/* ================================================= */}

      <div
        style={{
          padding: '10px',
          background: '#ffffff',
          borderRadius: '4px'
        }}
      >
        <strong>Gdzie wstawić szafkę?</strong>

        <div
          style={{
            marginTop: '8px',
            fontSize: '13px'
          }}
        >
          Współrzędne narożnika szafki najbliższego początkowi układu:
        </div>

        <label
          style={{
            display: 'block',
            marginTop: '10px'
          }}
        >
          X [mm]

          <input
            type="number"
            value={cabinetInsertX}
            onChange={(e) =>
              setCabinetInsertX(Number(e.target.value))
            }
            style={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </label>

        <label
          style={{
            display: 'block',
            marginTop: '8px'
          }}
        >
          Y [mm]

          <input
            type="number"
            value={cabinetInsertY}
            onChange={(e) =>
              setCabinetInsertY(Number(e.target.value))
            }
            style={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </label>

        <label
          style={{
            display: 'block',
            marginTop: '8px'
          }}
        >
          Z [mm]

          <input
            type="number"
            value={cabinetInsertZ}
            onChange={(e) =>
              setCabinetInsertZ(Number(e.target.value))
            }
            style={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </label>
      </div>


      {/* ================================================= */}
      {/* 4. NOWE WYMIARY                                   */}
      {/* ================================================= */}

      <div
        style={{
          padding: '10px',
          background: '#ffffff',
          borderRadius: '4px'
        }}
      >
        <strong>Nowe wymiary szafki:</strong>

        <button
          type="button"
          style={{
            display: 'block',
            marginTop: '10px',
            marginBottom: '10px'
          }}
          onClick={() => {
            setCabinetNewHeight(cabinet.baseDimensions.height);
            setCabinetNewWidth(cabinet.baseDimensions.width);
            setCabinetNewDepth(cabinet.baseDimensions.depth);
            setCabinetNewPlinth(cabinet.baseDimensions.plinth);
          }}
        >
          Ustaw wymiary szafki
        </button>

        <label
          style={{
            display: 'block',
            marginTop: '8px'
          }}
        >
          Wysokość [mm]

          <input
            type="number"
            value={cabinetNewHeight}
            onChange={(e) =>
              setCabinetNewHeight(Number(e.target.value))
            }
            style={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </label>

        <label
          style={{
            display: 'block',
            marginTop: '8px'
          }}
        >
          Szerokość [mm]

          <input
            type="number"
            value={cabinetNewWidth}
            onChange={(e) =>
              setCabinetNewWidth(Number(e.target.value))
            }
            style={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </label>

        <label
          style={{
            display: 'block',
            marginTop: '8px'
          }}
        >
          Głębokość [mm]

          <input
            type="number"
            value={cabinetNewDepth}
            onChange={(e) =>
              setCabinetNewDepth(Number(e.target.value))
            }
            style={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </label>

        <label
          style={{
            display: 'block',
            marginTop: '8px'
          }}
        >
          Cokół [mm]

          <input
            type="number"
            value={cabinetNewPlinth}
            onChange={(e) =>
              setCabinetNewPlinth(Number(e.target.value))
            }
            style={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </label>

        <button
          type="button"
          style={{
            marginTop: '12px'
          }}
          onClick={() => {
            addCabinetToProject(
              cabinet.id,
              {
                height: cabinetNewHeight,
                width: cabinetNewWidth,
                depth: cabinetNewDepth,
                plinth: cabinetNewPlinth
              },
              {
                x: cabinetInsertX,
                y: cabinetInsertY,
                z: cabinetInsertZ
              }
            );

            setCabinetsOpen(false);
            setSelectedCabinetId(null);
          }}
        >
          Dodaj szafkę
        </button>
      </div>

    </div>
  </div>
)}

                </div>
              ))
            ) : (
              <div>Brak zapisanych szafek.</div>
            )}
          </div>
        </div>
      )}





    </div>
  );
}
