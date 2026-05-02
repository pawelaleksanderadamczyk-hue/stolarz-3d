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
