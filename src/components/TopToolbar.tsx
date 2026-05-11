import { useRef, useState } from 'react';
import { COLORS } from '../core/constants';
import { useProjectStore } from '../store/useProjectStore';
import type { MaterialIndex, ViewMode } from '../types';
import { saveProjectToFile } from '../utils/saveProject';
const VIEW_TABS: ViewMode[] = ['IZOMETRIA', 'GÓRA', 'PRZÓD', 'BOK'];
import { ColorSelect } from './ColorSelect';
import { jsPDF } from 'jspdf';

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

function drawShape(pdf: jsPDF, points: PdfPoint[], startX: number, startY: number, scale: number) {
  pdf.setLineWidth(1.05);

  points.forEach((p, index) => {
    const [x, y] = toPdfPoint(p, startX, startY, scale);

    if (index === 0) pdf.moveTo(x, y);
    else pdf.lineTo(x, y);
  });

  pdf.close();
  pdf.stroke();
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

  pdf.setLineWidth(0.2);

  // linie pomocnicze
  pdf.line(x1, y1, ax, ay);
  pdf.line(x2, y2, bx, by);

  // linia wymiarowa
  pdf.line(ax, ay, bx, by);

  // znaczniki końców
  pdf.line(ax - 2, ay - 2, ax + 2, ay + 2);
  pdf.line(bx - 2, by - 2, bx + 2, by + 2);

  pdf.setFontSize(13.5);

const tx = (ax + bx) / 2;
const ty = (ay + by) / 2;

const isVertical = Math.abs(by - ay) > Math.abs(bx - ax);

if (isVertical) {
  pdf.text(text, tx - 2, ty + pdf.getTextWidth(text) / 2, {
    angle: 90
  });
} else {
  pdf.text(text, tx - pdf.getTextWidth(text) / 2, ty - 2);
}
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
  pdf.setLineWidth(1.05);
  pdf.rect(px, py, w * scale, h * scale);
  pdf.setLineWidth(0.2);
}

function drawHoleWithDimensions(pdf: jsPDF, board: any, startX: number, startY: number, scale: number) {
  const d = board.dimensions;

  if (board.shape === 'RECT_INNER_CUTOUT') {
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

  // wymiar poziomy dół
  drawDim(
    pdf,
    [b.minX, b.minY],
    [b.maxX, b.minY],
    `${Math.round(b.width)}`,
    startX,
    startY,
    scale,
    14
  );

  // wymiar pionowy lewy — tylko raz
  drawDim(
    pdf,
    [b.minX, b.minY],
    [b.minX, b.maxY],
    `${Math.round(b.height)}`,
    startX,
    startY,
    scale,
    -18
  );

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

  drawHoleWithDimensions(pdf, board, startX, startY, scale);
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
const mx = (x1 + x2) / 2;
const my = (y1 + y2) / 2;
const size = 5;
const rx = mx - size / 2;
const ry = my - size / 2;
if (
  !Number.isFinite(rx) ||
  !Number.isFinite(ry)
) {
  return;
}
const filled = Boolean(board.edging?.[edgeKey]);
pdf.setLineWidth(0.35);
if (filled) {
  pdf.setFillColor(0, 0, 0);
  pdf.rect(rx, ry, size, size, 'F');
} else {
  pdf.rect(rx, ry, size, size);
}
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

  // KLIP do prawdziwego kształtu formatki
  pdf.saveGraphicsState();

  pdf.moveTo(pdfPoints[0][0], pdfPoints[0][1]);

  for (let i = 1; i < pdfPoints.length; i++) {
    pdf.lineTo(pdfPoints[i][0], pdfPoints[i][1]);
  }

  pdf.close();
  pdf.clip();

  pdf.setLineWidth(0.03);
  pdf.setDrawColor(170);

  const spacing = 7;

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
    startX + Number(d.cutoutOffsetWidth) * scale;

  cutRight =
    startX +
    (Number(d.cutoutOffsetWidth) + Number(d.cutoutWidth)) *
      scale;

  cutBottom =
    startY - Number(d.cutoutOffsetLength) * scale;

  cutTop =
    startY -
    (Number(d.cutoutOffsetLength) + Number(d.cutoutLength)) *
      scale;
}

// PION
if (board.grainDirection === 'vertical') {
  for (let x = minX + spacing; x < maxX; x += spacing) {

    const ys = getIntersectionsY(x, pdfPoints);

    if (ys.length < 2) continue;

    const yTop = ys[0];
    const yBottom = ys[ys.length - 1];

    if (!hasCutout || x < cutLeft || x > cutRight) {
      pdf.line(x, yTop + 0.5, x, yBottom - 0.5);
    } else {
      pdf.line(x, yTop + 0.5, x, cutTop - 0.5);
      pdf.line(x, cutBottom + 0.5, x, yBottom - 0.5);
    }
  }
}

// POZIOM
if (board.grainDirection === 'horizontal') {
  for (let y = minY + spacing; y < maxY; y += spacing) {

    const xs = getIntersectionsX(y, pdfPoints);

    if (xs.length < 2) continue;

    const xLeft = xs[0];
    const xRight = xs[xs.length - 1];

    if (!hasCutout || y < cutTop || y > cutBottom) {
      pdf.line(xLeft + 0.5, y, xRight - 0.5, y);
    } else {
      pdf.line(xLeft + 0.5, y, cutLeft - 0.5, y);
      pdf.line(cutRight + 0.5, y, xRight - 0.5, y);
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
    const startX = 45;
    const startY = 240;
    pdf.setFontSize(22);
    pdf.text(board.number, 15, 22);
    if (board.shape !== 'RECT') {
  pdf.setLineWidth(0.15);
  pdf.rect(
    startX,
    startY - bounds.height * scale,
    bounds.width * scale,
    bounds.height * scale
  );
}

drawGrainDirection(pdf, board, points, startX, startY, scale);
drawShape(pdf, points, startX, startY, scale);
drawEdgingSquares(pdf, board, startX, startY, scale);
drawTechnicalDimensions(pdf, board, points, startX, startY, scale);
  });
  pdf.save('formatki-do-druku.pdf');
}


export function TopToolbar() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [anchorOpen, setAnchorOpen] = useState(false);


  const {
    project,
    saveProjectToFile,
    exportCsv,
    openAddBoardModal,
    updateProjectAnchor,
    resetView,
    undo,
    redo,
    setProjectMaterial,
    setViewMode,
    viewMode
  } = useProjectStore();


  const loadProjectFromFile = useProjectStore((s) => s.loadProjectFromFile);

  return (
    <div className="top-toolbar-wrap">
      <div className="top-toolbar">
        <div className="toolbar-main-actions">
          <button onClick={handleSave}>Zapisz projekt</button>
          <button onClick={() => fileInputRef.current?.click()}>Otwórz projekt</button>
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
          <button onClick={exportCsv}>Export CSV</button>
	  <button onClick={printSelectedBoardsToPdf}>Drukuj wybrane</button>
          <button onClick={() => setMaterialsOpen((prev) => !prev)}>Materiał</button>
          <button onClick={openAddBoardModal}>Dodaj formatkę</button>
          <button onClick={() => setAnchorOpen((prev) => !prev)}>Narożnik dodawanych</button>
          <button onClick={resetView}>Reset widoku</button>
          <button onClick={undo}>Cofnij</button>
          <button onClick={redo}>Ponów</button>
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
            <button className="secondary" onClick={() => setMaterialsOpen(false)}>Zamknij</button>
          </div>

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
  onChange={(color) => setProjectMaterial(family as any, index as MaterialIndex, color)}
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
    </div>
  );
}
