import * as THREE from 'three';
import type {
  BoardItem,
  RectCornerNotchDims,
  RectCutCornerDims,
  RectDims,
  RectInnerCutoutDims,
  RectDoubleCutoutDims
} from '../types';

function shapeRect(d: RectDims) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(d.length, 0);
  s.lineTo(d.length, d.width);
  s.lineTo(0, d.width);
  s.closePath();
  return s;
}

function shapeRectCutCorner(d: RectCutCornerDims) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(d.length1, 0);
  s.lineTo(d.length1, d.width2);
  s.lineTo(d.length2, d.width1);
  s.lineTo(0, d.width1);
  s.closePath();
  return s;
}

function shapeRectCornerNotch(d: RectCornerNotchDims) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(d.length1, 0);
  s.lineTo(d.length1, d.width2);
  s.lineTo(d.length2, d.width2);
  s.lineTo(d.length2, d.width1);
  s.lineTo(0, d.width1);
  s.closePath();
  return s;
}

function shapeRectInnerCutout(d: RectInnerCutoutDims) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(d.length, 0);
  s.lineTo(d.length, d.width);
  s.lineTo(0, d.width);
  s.closePath();
  const hole = new THREE.Path();
  hole.moveTo(d.cutoutOffsetLength, d.cutoutOffsetWidth);
  hole.lineTo(d.cutoutOffsetLength + d.cutoutLength, d.cutoutOffsetWidth);
  hole.lineTo(d.cutoutOffsetLength + d.cutoutLength, d.cutoutOffsetWidth + d.cutoutWidth);
  hole.lineTo(d.cutoutOffsetLength, d.cutoutOffsetWidth + d.cutoutWidth);
  hole.closePath();
  s.holes.push(hole);
  return s;
}


function shapeRectDoubleCutout(d: RectDoubleCutoutDims) {
  const s = new THREE.Shape();

// LEWY DOLNY POCZĄTEK ŚCIĘCIA
s.moveTo(d.width2, 0);

// DÓŁ
s.lineTo(d.width, 0);

// PRAWA
s.lineTo(d.width, d.length);

// GÓRA
s.lineTo(d.width1, d.length);

// LEWE GÓRNE ŚCIĘCIE
s.lineTo(0, d.length - d.length1);

// LEWY PROSTY BOK
s.lineTo(0, d.length2);

// LEWE DOLNE ŚCIĘCIE
s.lineTo(d.width2, 0);

s.closePath();


  // OTWÓR 1
  const hole1 = new THREE.Path();

  hole1.moveTo(
    d.hole1OffsetWidth,
    d.hole1OffsetLength
  );

  hole1.lineTo(
    d.hole1OffsetWidth + d.hole1Width,
    d.hole1OffsetLength
  );

  hole1.lineTo(
    d.hole1OffsetWidth + d.hole1Width,
    d.hole1OffsetLength + d.hole1Height
  );

  hole1.lineTo(
    d.hole1OffsetWidth,
    d.hole1OffsetLength + d.hole1Height
  );

  hole1.closePath();

  s.holes.push(hole1);

  // OTWÓR 2
  const hole2 = new THREE.Path();

  hole2.moveTo(
    d.hole2OffsetWidth,
    d.hole2OffsetLength
  );

  hole2.lineTo(
    d.hole2OffsetWidth + d.hole2Width,
    d.hole2OffsetLength
  );

  hole2.lineTo(
    d.hole2OffsetWidth + d.hole2Width,
    d.hole2OffsetLength + d.hole2Height
  );

  hole2.lineTo(
    d.hole2OffsetWidth,
    d.hole2OffsetLength + d.hole2Height
  );

  hole2.closePath();

  s.holes.push(hole2);

  return s;
}









function createRightTrapezoidShape(
  width: number,
  height1: number,
  height2: number
) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, width);
  shape.lineTo(height2, width);
  shape.lineTo(height1, 0);
  shape.lineTo(0, 0);
  return shape;
}

function createTrapezoidShape(
  width: number,
  height: number,
  leftInset: number,
  rightInset: number
) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(height, leftInset);
  shape.lineTo(height, width - rightInset);
  shape.lineTo(0, width);
  shape.lineTo(0, 0);
  return shape;
}

function createTrapezoidInnerCutoutShape(
  width: number,
  height: number,
  leftInset: number,
  rightInset: number,
  cutoutOffsetLength: number,
  cutoutOffsetWidth: number,
  cutoutLength: number,
  cutoutWidth: number
) {
  const shape = createTrapezoidShape(
    width,
    height,
    leftInset,
    rightInset
  );
  const hole = new THREE.Path();
  hole.moveTo(cutoutOffsetLength, cutoutOffsetWidth);
hole.lineTo(cutoutOffsetLength + cutoutLength, cutoutOffsetWidth);
hole.lineTo(cutoutOffsetLength + cutoutLength, cutoutOffsetWidth + cutoutWidth);
hole.lineTo(cutoutOffsetLength, cutoutOffsetWidth + cutoutWidth);
hole.lineTo(cutoutOffsetLength, cutoutOffsetWidth);
  shape.holes.push(hole);
  return shape;
}









export function getShape2D(item: BoardItem) {
  switch (item.shape) {
    case 'RECT':
      return shapeRect(item.dimensions as RectDims);

    case 'RECT_CUT_CORNER':
      return shapeRectCutCorner(item.dimensions as RectCutCornerDims);

    case 'RECT_CORNER_NOTCH':
      return shapeRectCornerNotch(item.dimensions as RectCornerNotchDims);

    case 'RECT_INNER_CUTOUT':
  return shapeRectInnerCutout(item.dimensions as RectInnerCutoutDims);

case 'RECT_DOUBLE_CUTOUT':
  return shapeRectDoubleCutout(
    item.dimensions as RectDoubleCutoutDims
  );

case 'RIGHT_TRAPEZOID': {
  const d: any = item.dimensions;
  return createRightTrapezoidShape(
    d.width,
    d.lengthLeft,
    d.lengthRight
  );
}

    case 'TRAPEZOID': {
  const d: any = item.dimensions;
  return createTrapezoidShape(
    d.width,
    d.height,
    d.leftInset,
    d.rightInset
  );
}

    case 'TRAPEZOID_INNER_CUTOUT': {
  const d: any = item.dimensions;
  return createTrapezoidInnerCutoutShape(
    d.width,
    d.height,
    d.leftInset,
    d.rightInset,
    d.cutoutOffsetLength,
    d.cutoutOffsetWidth,
    d.cutoutLength,
    d.cutoutWidth
  );
}
  }
}

export function getThickness(item: BoardItem) {
  return item.dimensions.thickness;
}

export function createBoardGeometry(item: BoardItem) {
  const shape = getShape2D(item);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: getThickness(item),
    bevelEnabled: false
  });
  const pos = geometry.attributes.position;
  const uvs: number[] = [];
  // 600 mm = pełny rozmiar tekstury
  const textureScale = 600;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
const y = pos.getY(i);

if (item.shape === 'RECT_DOUBLE_CUTOUT') {
  // Obracamy mapowanie tekstury o 90°,
  // żeby słoje szły wzdłuż długości formatki.
  uvs.push(
    y / textureScale,
    x / textureScale
  );
} else {
  uvs.push(
    x / textureScale,
    y / textureScale
  );
}
  }
  geometry.setAttribute(
    'uv',
    new THREE.Float32BufferAttribute(uvs, 2)
  );
  return geometry;
}

export function createEdgeGeometry(width: number, thickness: number, length: number) {
  return new THREE.BoxGeometry(length, width, thickness);
}
