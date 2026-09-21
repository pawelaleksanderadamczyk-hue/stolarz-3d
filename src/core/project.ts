import { SHAPE_CODES } from './constants';
import * as THREE from 'three';
import type {
  BoardItem,
  MaterialIndex,
  NewBoardForm,
  PlaneType,
  ProjectData,
  Rotation3,
  Quaternion4,
  ShapeDimensions,
  ShapeType,
  Vec3
} from '../types';

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}


export function createEmptyProject(): ProjectData {
  return {
    version: 1,
    nextCounters: {
      RECT: 1,
      RECT_CUT_CORNER: 1,
      RECT_CORNER_NOTCH: 1,
      RECT_INNER_CUTOUT: 1,
	RIGHT_TRAPEZOID: 1,
	TRAPEZOID: 1,
	TRAPEZOID_INNER_CUTOUT: 1
    },
    globalAnchor: { x: 0, y: 0, z: 0 },
    materials: DEFAULT_PROJECT_MATERIALS as any,


defaultGrainDirections: {
  korpus: 'vertical',
  front: 'vertical',
  blat: 'vertical',
  hdf: 'vertical',
  inne: 'vertical'
},

    boards: []
  };
}

export function createDefaultDimensions(shape: ShapeType): ShapeDimensions {
  switch (shape) {
    case 'RECT':
      return { length: 800, width: 400, thickness: 18 };
    case 'RECT_CUT_CORNER':
      return { length1: 800, width1: 400, length2: 650, width2: 150, thickness: 18 };
    case 'RECT_CORNER_NOTCH':
      return { length1: 800, width1: 400, length2: 600, width2: 200, thickness: 18 };
    case 'RECT_INNER_CUTOUT':
      return {
        length: 800,
        width: 400,
        cutoutOffsetLength: 250,
        cutoutOffsetWidth: 120,
        cutoutLength: 180,
        cutoutWidth: 100,
        thickness: 18
      };
case 'RIGHT_TRAPEZOID':
  return {
    lengthLeft: 800,
    lengthRight: 650,
    width: 400,
    thickness: 18
  };
case 'TRAPEZOID':
  return {
    height: 800,
    width: 400,
    leftInset: 100,
    rightInset: 100,
    thickness: 18
  };
case 'TRAPEZOID_INNER_CUTOUT':
  return {
    height: 800,
    width: 400,
    leftInset: 100,
    rightInset: 100,
    cutoutOffsetLength: 200,
    cutoutOffsetWidth: 100,
    cutoutLength: 100,
    cutoutWidth: 100,
    thickness: 18
  };
  }
}

export function createBoard(project: ProjectData, form: NewBoardForm): BoardItem {
  const index = project.nextCounters[form.shape];
  const number = `${SHAPE_CODES[form.shape]}-${index}`;
  return {
    id: createId(),
    number,
    name: '',
grainDirection:
  project.defaultGrainDirections?.[
    form.role === 'KORPUS'
      ? 'korpus'
      : form.role === 'FRONT'
      ? 'front'
      : form.role === 'BLAT'
      ? 'blat'
      : form.role === 'HDF'
      ? 'hdf'
      : 'inne'
  ] ?? 'vertical',
cabinetName: '',
    shape: form.shape,
    role: form.role,
    material: {
      role: form.role,
      materialIndex: form.materialIndex as MaterialIndex,
      edgingIndex: form.edgingIndex as MaterialIndex
    },
    dimensions: form.dimensions,
    plane: 'YZ',
    anchor: { ...project.globalAnchor },
    rotation: { x: 0, y: 0, z: 0 },
    rotationQuaternion: identityQuaternion(),
    edging: {
      lengthRight: false,
      lengthLeft: false,
      widthTop: false,
      widthBottom: false,
      cut: false,
      notchHorizontal: false,
      notchVertical: false,
      otwórGóra: false,
      otwórDół: false,
      otwórLewo: false,
      otwórPrawo: false
    }
  };
}

export function roundNearZero(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.abs(value) < 1e-5 ? 0 : Number(value.toFixed(3));
}

export function getOuterPolygon2D(board: BoardItem): Array<{ x: number; y: number }> {
  const d: any = board.dimensions;
  switch (board.shape) {
    case 'RECT':
      return [
        { x: 0, y: 0 },
        { x: d.length, y: 0 },
        { x: d.length, y: d.width },
        { x: 0, y: d.width }
      ];
    case 'RECT_CUT_CORNER':
      return [
        { x: 0, y: 0 },
        { x: d.length1, y: 0 },
        { x: d.length1, y: d.width2 },
        { x: d.length2, y: d.width1 },
        { x: 0, y: d.width1 }
      ];
    case 'RECT_CORNER_NOTCH':
      return [
        { x: 0, y: 0 },
        { x: d.length1, y: 0 },
        { x: d.length1, y: d.width2 },
        { x: d.length2, y: d.width2 },
        { x: d.length2, y: d.width1 },
        { x: 0, y: d.width1 }
      ];
    case 'RECT_INNER_CUTOUT':
      return [
        { x: 0, y: 0 },
        { x: d.length, y: 0 },
        { x: d.length, y: d.width },
        { x: 0, y: d.width }
      ];

case 'RIGHT_TRAPEZOID': {
  const d: any = board.dimensions;
  return [
    { x: 0, y: 0 },
    { x: 0, y: d.width },
    { x: d.lengthRight, y: d.width },
    { x: d.lengthLeft, y: 0 }
  ];
}

case 'TRAPEZOID': {
  const d: any = board.dimensions;
  return [
    { x: 0, y: 0 },
    { x: d.height, y: d.leftInset },
    { x: d.height, y: d.width - d.rightInset },
    { x: 0, y: d.width }
  ];
}

case 'TRAPEZOID_INNER_CUTOUT': {
  const d: any = board.dimensions;
  return [
    { x: 0, y: 0 },
    { x: d.height, y: d.leftInset },
    { x: d.height, y: d.width - d.rightInset },
    { x: 0, y: d.width }
  ];
}




  }
}

function getThickness(board: BoardItem) {
  return Number((board.dimensions as any).thickness ?? 0);
}

function degToRad(v: number) { return (v * Math.PI) / 180; }

export function identityQuaternion(): Quaternion4 {
  return { x: 0, y: 0, z: 0, w: 1 };
}

function normalizeQuaternion(q: Quaternion4): Quaternion4 {
  const len = Math.hypot(q.x, q.y, q.z, q.w) || 1;

  return {
    x: q.x / len,
    y: q.y / len,
    z: q.z / len,
    w: q.w / len
  };
}

export function quaternionFromAxisAngle(axis: Vec3, angleDeg: number): Quaternion4 {
  const half = degToRad(angleDeg) / 2;
  const s = Math.sin(half);

  return normalizeQuaternion({
    x: axis.x * s,
    y: axis.y * s,
    z: axis.z * s,
    w: Math.cos(half)
  });
}

export function multiplyQuaternions(a: Quaternion4, b: Quaternion4): Quaternion4 {
  return normalizeQuaternion({
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
  });
}

export function quaternionFromRotation(rotation: Rotation3): Quaternion4 {
  const qx = quaternionFromAxisAngle({ x: 1, y: 0, z: 0 }, rotation.x);
  const qy = quaternionFromAxisAngle({ x: 0, y: 1, z: 0 }, rotation.y);
  const qz = quaternionFromAxisAngle({ x: 0, y: 0, z: 1 }, rotation.z);

  // Three.js Euler XYZ odpowiada kolejności Rz * Ry * Rx.
  return multiplyQuaternions(multiplyQuaternions(qz, qy), qx);
}

export function getBoardRotationQuaternion(board: BoardItem): Quaternion4 {
  return board.rotationQuaternion ?? quaternionFromRotation(board.rotation);
}

export function rotateQuaternionAroundWorldAxis(
  current: Quaternion4 | undefined,
  axis: 'x' | 'y' | 'z',
  angleDeg: number
): Quaternion4 {
  const base = current ?? identityQuaternion();
  const axisVector =
    axis === 'x'
      ? { x: 1, y: 0, z: 0 }
      : axis === 'y'
        ? { x: 0, y: 1, z: 0 }
        : { x: 0, y: 0, z: 1 };

  const delta = quaternionFromAxisAngle(axisVector, angleDeg);

  // delta po lewej stronie = obrót względem osi świata.
  return multiplyQuaternions(delta, base);
}

export function rotateVectorByQuaternion(point: Vec3, q: Quaternion4): Vec3 {
  const qPoint: Quaternion4 = { x: point.x, y: point.y, z: point.z, w: 0 };
  const inverse: Quaternion4 = { x: -q.x, y: -q.y, z: -q.z, w: q.w };
  const rotated = multiplyQuaternions(multiplyQuaternions(q, qPoint), inverse);

  return { x: rotated.x, y: rotated.y, z: rotated.z };
}

type Basis = { length: Vec3; width: Vec3; thickness: Vec3 };

export function getPlaneBasis(plane: PlaneType): Basis {
  switch (plane) {
    case 'XY':
      return { length: { x: 1, y: 0, z: 0 }, width: { x: 0, y: 1, z: 0 }, thickness: { x: 0, y: 0, z: 1 } };
    case 'YX':
      return { length: { x: 0, y: 1, z: 0 }, width: { x: 1, y: 0, z: 0 }, thickness: { x: 0, y: 0, z: -1 } };
    case 'XZ':
      return { length: { x: 1, y: 0, z: 0 }, width: { x: 0, y: 0, z: 1 }, thickness: { x: 0, y: -1, z: 0 } };
    case 'ZX':
      return { length: { x: 0, y: 0, z: 1 }, width: { x: 1, y: 0, z: 0 }, thickness: { x: 0, y: 1, z: 0 } };
    case 'YZ':
      return { length: { x: 0, y: 1, z: 0 }, width: { x: 0, y: 0, z: 1 }, thickness: { x: 1, y: 0, z: 0 } };
    case 'ZY':
      return { length: { x: 0, y: 0, z: 1 }, width: { x: 0, y: 1, z: 0 }, thickness: { x: -1, y: 0, z: 0 } };
  }
}

export function mapLocalPointToPlane(point: Vec3, plane: PlaneType): Vec3 {
  const basis = getPlaneBasis(plane);
  return {
    x: point.x * basis.length.x + point.y * basis.width.x + point.z * basis.thickness.x,
    y: point.x * basis.length.y + point.y * basis.width.y + point.z * basis.thickness.y,
    z: point.x * basis.length.z + point.y * basis.width.z + point.z * basis.thickness.z
  };
}

export function getEffectiveRotation(board: BoardItem): Rotation3 {
  // Wszystkie formatki są traktowane jako dodane na YZ.
  // Obrót X/Y/Z odpowiada osiom świata X/Y/Z, bez zamiany osi.
  return board.rotation;
}

export function getPlaneRotationDegrees(plane: PlaneType): Rotation3 {
  // zachowane tylko dla zgodności importów; widok 3D używa teraz getPlaneBasis/mapLocalPointToPlane
  switch (plane) {
    case 'XY': return { x: 0, y: 0, z: 0 };
    case 'YX': return { x: 180, y: 0, z: 0 };
    case 'ZX': return { x: -90, y: 0, z: 0 };
    case 'XZ': return { x: 90, y: 0, z: 0 };
    case 'YZ': return { x: 0, y: 90, z: 0 };
    case 'ZY': return { x: 0, y: -90, z: 0 };
  }
}


function cleanNumber(value: number) {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) < 0.001) return rounded;
  return Math.round(value);
}


function vecToThree(v: Vec3) {
  return new THREE.Vector3(v.x, v.y, v.z);
}


function getPlaneQuaternionForBoard() {
  const basis = getPlaneBasis('YZ');
  const matrix = new THREE.Matrix4().makeBasis(
    vecToThree(basis.length),
    vecToThree(basis.width),
    vecToThree(basis.thickness)
  );
  const q = new THREE.Quaternion();
  q.setFromRotationMatrix(matrix);
  return q;
}


function getFinalBoardQuaternion(board: BoardItem) {
  const q = getBoardRotationQuaternion(board);
  const rotationQuaternion = new THREE.Quaternion(q.x, q.y, q.z, q.w);
  const planeQuaternion = getPlaneQuaternionForBoard();
  return rotationQuaternion.clone().multiply(planeQuaternion);
}





function cleanVertexCoord(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (Math.abs(value) < 0.0001) return 0;
  return Math.round(value);
}


export function getOuterVertices3D(board: BoardItem): Vec3[] {
  const poly = getOuterPolygon2D(board);
  const thickness = getThickness(board);
  const finalQuaternion = getFinalBoardQuaternion(board);
  const result: Vec3[] = [];
  poly.forEach((p) => {
    const localPoints = [
      new THREE.Vector3(p.x, p.y, 0),
      new THREE.Vector3(p.x, p.y, thickness)
    ];
    localPoints.forEach((localPoint) => {
      const transformed = localPoint
        .clone()
        .applyQuaternion(finalQuaternion)
        .add(new THREE.Vector3(board.anchor.x, board.anchor.y, board.anchor.z));
      result.push({
        x: cleanNumber(transformed.x),
        y: cleanNumber(transformed.y),
        z: cleanNumber(transformed.z)
      });
    });
  });
  return result;
}


function distanceToOriginSq(point: Vec3): number {
  return point.x * point.x + point.y * point.y + point.z * point.z;
}



function cleanCoord(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (Math.abs(value) < 0.0001) return 0;
  return Math.round(value);
}


export function getLeadingCorner(board: BoardItem): Vec3 {
  const vertices = getOuterVertices3D(board);
  if (!vertices.length) return { ...board.anchor };
  let best = vertices[0];
  let bestDistance = best.x * best.x + best.y * best.y + best.z * best.z;
  for (let i = 1; i < vertices.length; i++) {
    const point = vertices[i];
    const distance = point.x * point.x + point.y * point.y + point.z * point.z;
    if (distance < bestDistance) {
      best = point;
      bestDistance = distance;
    }
  }
  return {
    x: cleanNumber(best.x),
    y: cleanNumber(best.y),
    z: cleanNumber(best.z)
  };
}



export function moveBoardByLeadingCorner(board: BoardItem, target: Vec3): BoardItem {
  const current = getLeadingCorner(board);
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const dz = target.z - current.z;
  return {
    ...board,
    anchor: {
      x: cleanNumber(board.anchor.x + dx),
      y: cleanNumber(board.anchor.y + dy),
      z: cleanNumber(board.anchor.z + dz)
    }
  };
}


export const DEFAULT_PROJECT_MATERIALS = {
  korpus: {
    1: 'bialy-polysk',
    2: 'niebieski',
    3: 'ciemnoczerwony'
  },

  front: {
    1: 'bialy-polysk',
    2: 'niebieski',
    3: 'ciemnoczerwony'
  },

  blat: {
    1: 'bialy-polysk',
    2: 'niebieski',
    3: 'ciemnoczerwony'
  },

  hdf: {
    1: 'bialy-polysk',
    2: 'niebieski',
    3: 'ciemnoczerwony'
  },

  inne: {
    1: 'bialy-polysk',
    2: 'niebieski',
    3: 'ciemnoczerwony'
  },

  okleina: {
    1: 'bialy-polysk',
    2: 'niebieski',
    3: 'ciemnoczerwony'
  }
};