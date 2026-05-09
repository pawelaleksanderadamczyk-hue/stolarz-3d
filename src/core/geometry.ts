import * as THREE from 'three';
import type {
  BoardItem,
  RectCornerNotchDims,
  RectCutCornerDims,
  RectDims,
  RectInnerCutoutDims
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
  shape.lineTo(width, 0);
  shape.lineTo(width - rightInset, height);
  shape.lineTo(leftInset, height);
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
  hole.moveTo(cutoutOffsetWidth, cutoutOffsetLength);
  hole.lineTo(cutoutOffsetWidth + cutoutWidth, cutoutOffsetLength);
  hole.lineTo(cutoutOffsetWidth + cutoutWidth, cutoutOffsetLength + cutoutLength);
  hole.lineTo(cutoutOffsetWidth, cutoutOffsetLength + cutoutLength);
  hole.lineTo(cutoutOffsetWidth, cutoutOffsetLength);
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
  return new THREE.ExtrudeGeometry(shape, {
    depth: getThickness(item),
    bevelEnabled: false
  });
}

export function createEdgeGeometry(width: number, thickness: number, length: number) {
  return new THREE.BoxGeometry(length, width, thickness);
}
