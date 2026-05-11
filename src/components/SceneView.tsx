import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Edges, Line } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { COLOR_TO_HEX } from '../core/constants';
import { createBoardGeometry } from '../core/geometry';
import { getBoardRotationQuaternion, getPlaneBasis } from '../core/project';
import { useProjectStore } from '../store/useProjectStore';
import type { BoardItem, Vec3, ViewMode } from '../types';

function AxisHelper() {
  return (
    <group>
      <Line points={[[0, 0, 0], [1600, 0, 0]]} color="red" lineWidth={2} />
      <Line points={[[0, 0, 0], [0, 1600, 0]]} color="green" lineWidth={2} />
      <Line points={[[0, 0, 0], [0, 0, 1600]]} color="blue" lineWidth={2} />
    </group>
  );
}

const VIEW_POSITIONS: Record<ViewMode, [number, number, number]> = {
  IZOMETRIA: [1200, 900, 1200],
  GÓRA: [0, 2400, 0.001],
  PRZÓD: [0, 0, 2400],
  BOK: [2400, 0, 0.001]
};

function getViewPosition(viewMode: ViewMode): [number, number, number] {
  return VIEW_POSITIONS[viewMode];
}

function CameraPreset() {
  const { camera } = useThree();
  const viewMode = useProjectStore((s) => s.viewMode);

  useEffect(() => {
    camera.position.set(...getViewPosition(viewMode));
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.near = 2;
    camera.far = 80000;
    camera.updateProjectionMatrix();
  }, [camera, viewMode]);

  return null;
}

type Segment = { key: string; start: [number, number]; end: [number, number]; hole?: boolean };

function pointsEqual(a: [number, number], b: [number, number]) {
  const EPS_POINT = 0.001;
  return Math.abs(a[0] - b[0]) < EPS_POINT && Math.abs(a[1] - b[1]) < EPS_POINT;
}

function shouldExtendStripAtExternalCorner(seg: Segment, allSegments: Segment[], board: BoardItem) {
  if (seg.hole) return false;
  if (seg.key === 'notchVertical' || seg.key === 'notchHorizontal') return false;

  return allSegments.some((other) => {
    if (other === seg) return false;
    if (other.hole) return false;
    if (other.key === 'notchVertical' || other.key === 'notchHorizontal') return false;
    if (!Boolean(board.edging[other.key])) return false;

    return (
      pointsEqual(seg.start, other.start) ||
      pointsEqual(seg.start, other.end) ||
      pointsEqual(seg.end, other.start) ||
      pointsEqual(seg.end, other.end)
    );
  });
}


function getSegments(board: BoardItem): Segment[] {
  const d: any = board.dimensions;

  switch (board.shape) {
    case 'RECT':
      return [
        // Wysokość = length
        { key: 'lengthLeft', start: [0, 0], end: [d.length, 0] },
        { key: 'lengthRight', start: [0, d.width], end: [d.length, d.width] },

        // Szerokość = width
        { key: 'widthBottom', start: [0, 0], end: [0, d.width] },
        { key: 'widthTop', start: [d.length, 0], end: [d.length, d.width] }
      ];

    case 'RECT_CUT_CORNER':
      return [
        // Wysokości
        { key: 'lengthLeft', start: [0, 0], end: [d.length1, 0] },
        { key: 'lengthRight', start: [0, d.width1], end: [d.length2, d.width1] },

        // Szerokości
        { key: 'widthBottom', start: [0, 0], end: [0, d.width1] },
        { key: 'widthTop', start: [d.length1, 0], end: [d.length1, d.width2] },

        { key: 'cut', start: [d.length1, d.width2], end: [d.length2, d.width1] }
      ];

    case 'RECT_CORNER_NOTCH':
      return [
        // Wysokości zewnętrzne
        { key: 'lengthLeft', start: [0, 0], end: [d.length1, 0] },
        { key: 'lengthRight', start: [0, d.width1], end: [d.length2, d.width1] },

        // Szerokości zewnętrzne
        { key: 'widthBottom', start: [0, 0], end: [0, d.width1] },
        { key: 'widthTop', start: [d.length1, 0], end: [d.length1, d.width2] },

        // Wycięcie
        { key: 'notchVertical', start: [d.length1, d.width2], end: [d.length2, d.width2] },
        { key: 'notchHorizontal', start: [d.length2, d.width2], end: [d.length2, d.width1] }
      ];

    case 'RECT_INNER_CUTOUT':
      return [
        // Zewnętrzne wysokości
        { key: 'lengthLeft', start: [0, 0], end: [d.length, 0] },
        { key: 'lengthRight', start: [0, d.width], end: [d.length, d.width] },

        // Zewnętrzne szerokości
        { key: 'widthBottom', start: [0, 0], end: [0, d.width] },
        { key: 'widthTop', start: [d.length, 0], end: [d.length, d.width] },

        // Otwór: wysokości
        { key: 'otwórDół', start: [d.cutoutOffsetLength, d.cutoutOffsetWidth], end: [d.cutoutOffsetLength + d.cutoutLength, d.cutoutOffsetWidth], hole: true },
        { key: 'otwórGóra', start: [d.cutoutOffsetLength, d.cutoutOffsetWidth + d.cutoutWidth], end: [d.cutoutOffsetLength + d.cutoutLength, d.cutoutOffsetWidth + d.cutoutWidth], hole: true },

        // Otwór: szerokości
        { key: 'otwórLewo', start: [d.cutoutOffsetLength, d.cutoutOffsetWidth], end: [d.cutoutOffsetLength, d.cutoutOffsetWidth + d.cutoutWidth], hole: true },
        { key: 'otwórPrawo', start: [d.cutoutOffsetLength + d.cutoutLength, d.cutoutOffsetWidth], end: [d.cutoutOffsetLength + d.cutoutLength, d.cutoutOffsetWidth + d.cutoutWidth], hole: true }
      ];


case 'RIGHT_TRAPEZOID': {
  const d: any = board.dimensions;
  return [
    { key: 'widthBottom', start: [0, 0], end: [0, d.width] },
    { key: 'lengthRight', start: [0, d.width], end: [d.lengthRight, d.width] },
    { key: 'widthTop', start: [d.lengthRight, d.width], end: [d.lengthLeft, 0] },
    { key: 'lengthLeft', start: [d.lengthLeft, 0], end: [0, 0] }
  ];
}

    case 'TRAPEZOID': {
  const d: any = board.dimensions;

  return [
    { key: 'widthBottom', start: [0, 0], end: [0, d.width] },
    { key: 'lengthLeft', start: [0, 0], end: [d.height, d.leftInset] },
    { key: 'lengthRight', start: [0, d.width], end: [d.height, d.width - d.rightInset] },
    { key: 'widthTop', start: [d.height, d.leftInset], end: [d.height, d.width - d.rightInset] }
  ];
}

case 'TRAPEZOID_INNER_CUTOUT': {
  const d: any = board.dimensions;

  return [
    { key: 'widthBottom', start: [0, 0], end: [0, d.width] },
    { key: 'lengthLeft', start: [0, 0], end: [d.height, d.leftInset] },
    { key: 'lengthRight', start: [0, d.width], end: [d.height, d.width - d.rightInset] },
    { key: 'widthTop', start: [d.height, d.leftInset], end: [d.height, d.width - d.rightInset] },

    { key: 'otwórDół', start: [d.cutoutOffsetLength, d.cutoutOffsetWidth], end: [d.cutoutOffsetLength, d.cutoutOffsetWidth + d.cutoutWidth], hole: true },
    { key: 'otwórGóra', start: [d.cutoutOffsetLength + d.cutoutLength, d.cutoutOffsetWidth], end: [d.cutoutOffsetLength + d.cutoutLength, d.cutoutOffsetWidth + d.cutoutWidth], hole: true },
    { key: 'otwórLewo', start: [d.cutoutOffsetLength, d.cutoutOffsetWidth], end: [d.cutoutOffsetLength + d.cutoutLength, d.cutoutOffsetWidth], hole: true },
    { key: 'otwórPrawo', start: [d.cutoutOffsetLength, d.cutoutOffsetWidth + d.cutoutWidth], end: [d.cutoutOffsetLength + d.cutoutLength, d.cutoutOffsetWidth + d.cutoutWidth], hole: true }
  ];
}
  }
}

function toVector3(v: Vec3) {
  return new THREE.Vector3(v.x, v.y, v.z);
}

function getPlaneQuaternion(board: BoardItem) {
  const basis = getPlaneBasis('YZ');
  const m = new THREE.Matrix4().makeBasis(
    toVector3(basis.length),
    toVector3(basis.width),
    toVector3(basis.thickness)
  );
  const q = new THREE.Quaternion();
  q.setFromRotationMatrix(m);
  return q;
}


function toThreeQuaternion(q: { x: number; y: number; z: number; w: number }) {
  return new THREE.Quaternion(q.x, q.y, q.z, q.w);
}

function getFinalQuaternion(planeQuaternion: THREE.Quaternion, board: BoardItem) {
  const rotationQuaternion = toThreeQuaternion(getBoardRotationQuaternion(board));

  // Najpierw płaszczyzna YZ, potem wszystkie obroty zapamiętane jako quaternion świata.
  return rotationQuaternion.clone().multiply(planeQuaternion);
}

function EdgeStrips({ board }: { board: BoardItem }) {
  const materials = useProjectStore((s) => s.project.materials);
  const edgingName =
  materials?.okleina?.[board.material.edgingIndex] ?? 'biały';
const edgingColor =
  COLOR_TO_HEX[edgingName] ?? '#ffffff';

  const thickness = Number((board.dimensions as any).thickness ?? 18);
  const bandDepth = 0.4;
  const bandHeight = Math.max(1, thickness);
  const allSegments = getSegments(board);
  const segments = allSegments.filter((seg) => Boolean(board.edging[seg.key]));

  return (
    <group>
      {segments.map((seg) => {
        const dx = seg.end[0] - seg.start[0];
        const dy = seg.end[1] - seg.start[1];
        const rawLen = Math.hypot(dx, dy);

        // Wydłużenie tylko tam, gdzie na narożu zewnętrznym schodzą się dwie zaznaczone okleiny.
        // Naroża wewnętrzne, otwory, wycięcia i pojedyncze okleiny zostają długości boku.
        const EPS = 0.2;
        const extend = shouldExtendStripAtExternalCorner(seg, allSegments, board) ? bandDepth + EPS : 0;
        const len = Math.max(1, rawLen + extend);
        const angle = Math.atan2(dy, dx);
        const mx = (seg.start[0] + seg.end[0]) / 2;
        const my = (seg.start[1] + seg.end[1]) / 2;

        // długość = right/left, szerokość = top/bottom
        const isLengthEdge = seg.key === 'lengthRight' || seg.key === 'lengthLeft';
        const isWidthEdge = seg.key === 'widthTop' || seg.key === 'widthBottom';

        // Wypychamy pasek lekko na zewnątrz kształtu.
        // Dla otworów kierunek odwrotny.
        let nx = dy / len;
        let ny = -dx / len;

        if (board.shape !== 'RIGHT_TRAPEZOID' && board.shape !== 'TRAPEZOID' && board.shape !== 'TRAPEZOID_INNER_CUTOUT') {
  if (isLengthEdge) {
    if (seg.key === 'lengthRight') { nx = 0; ny = 1; }
    if (seg.key === 'lengthLeft') { nx = 0; ny = -1; }
  }

  if (isWidthEdge) {
    if (seg.key === 'widthTop') { nx = 1; ny = 0; }
    if (seg.key === 'widthBottom') { nx = -1; ny = 0; }
  }
}

        if (seg.key === 'notchVertical') { nx = 0; ny = -1; }
        if (seg.key === 'notchHorizontal') { nx = -1; ny = 0; }

        if (seg.key === 'otwórDół') { nx = 0; ny = 1; }
        if (seg.key === 'otwórGóra') { nx = 0; ny = -1; }
        if (seg.key === 'otwórLewo') { nx = 1; ny = 0; }
        if (seg.key === 'otwórPrawo') { nx = -1; ny = 0; }

        const dir = seg.hole ? -1 : 1;
        const isTrapezoid =
  board.shape === 'RIGHT_TRAPEZOID' ||
  board.shape === 'TRAPEZOID' ||
  board.shape === 'TRAPEZOID_INNER_CUTOUT';

const ox = isTrapezoid ? 0 : nx * dir * (bandDepth / 2 + 0.2);
const oy = isTrapezoid ? 0 : ny * dir * (bandDepth / 2 + 0.2);

        return (
          <mesh key={seg.key} position={[mx + ox, my + oy, bandHeight / 2]} rotation={[0, 0, angle]} renderOrder={2}>
            <boxGeometry args={[len, bandDepth, bandHeight]} />
            <meshStandardMaterial color={edgingColor} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
          </mesh>
        );
      })}
    </group>
  );
}









type GrainPoint = [number, number];

function getGrainPoints(board: BoardItem): GrainPoint[] {
  const d: any = board.dimensions;

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

function getGrainBounds(points: GrainPoint[]) {
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

function getIntersectionsY(x: number, pts: GrainPoint[]) {
  const ys: number[] = [];

  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];

    const [x1, y1] = a;
    const [x2, y2] = b;

    if (x1 === x2) continue;

    if ((x >= x1 && x <= x2) || (x >= x2 && x <= x1)) {
      const t = (x - x1) / (x2 - x1);
      ys.push(y1 + (y2 - y1) * t);
    }
  }

  return ys.sort((a, b) => a - b);
}

function getIntersectionsX(y: number, pts: GrainPoint[]) {
  const xs: number[] = [];

  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];

    const [x1, y1] = a;
    const [x2, y2] = b;

    if (y1 === y2) continue;

    if ((y >= y1 && y <= y2) || (y >= y2 && y <= y1)) {
      const t = (y - y1) / (y2 - y1);
      xs.push(x1 + (x2 - x1) * t);
    }
  }

  return xs.sort((a, b) => a - b);
}

function GrainOverlay({ board }: { board: BoardItem }) {
  if (!board.grainDirection || board.grainDirection === 'none') return null;

  const geometry = useMemo(() => {
    const points = getGrainPoints(board);
    const b = getGrainBounds(points);
    const d: any = board.dimensions;

    
    
    const hasCutout =
      board.shape === 'RECT_INNER_CUTOUT' ||
      board.shape === 'TRAPEZOID_INNER_CUTOUT';

    const cutLeft = hasCutout ? Number(d.cutoutOffsetWidth) : 0;
    const cutRight = hasCutout ? Number(d.cutoutOffsetWidth) + Number(d.cutoutWidth) : 0;
    const cutBottom = hasCutout ? Number(d.cutoutOffsetLength) : 0;
    const cutTop = hasCutout ? Number(d.cutoutOffsetLength) + Number(d.cutoutLength) : 0;

    const vertices: number[] = [];
    const spacing = 45;

const z = 0;

const pushLine = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  vertices.push(
    x1 ,
    y1 ,
    z

  );

  vertices.push(
    x2 ,
    y2 ,
    z
  );
};

    if (board.grainDirection === 'vertical') {
      for (let x = b.minX + spacing; x < b.maxX; x += spacing) {
        const ys = getIntersectionsY(x, points);
        if (ys.length < 2) continue;

        const y1 = ys[0];
        const y2 = ys[ys.length - 1];

        if (!hasCutout || x < cutLeft || x > cutRight) {
          pushLine(x, y1 + 2, x, y2 - 2);
        } else {
          pushLine(x, y1 + 2, x, cutBottom - 2);
          pushLine(x, cutTop + 2, x, y2 - 2);
        }
      }
    }

    if (board.grainDirection === 'horizontal') {
      for (let y = b.minY + spacing; y < b.maxY; y += spacing) {
        const xs = getIntersectionsX(y, points);
        if (xs.length < 2) continue;

        const x1 = xs[0];
        const x2 = xs[xs.length - 1];

        if (!hasCutout || y < cutBottom || y > cutTop) {
          pushLine(x1 + 2, y, x2 - 2, y);
        } else {
          pushLine(x1 + 2, y, cutLeft - 2, y);
          pushLine(cutRight + 2, y, x2 - 2, y);
        }
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return g;
  }, [board]);

  return (
    <lineSegments geometry={geometry} renderOrder={2}>
      <lineBasicMaterial
        color="#000000"
        transparent
        opacity={0.18}
        depthTest={false}
        depthWrite={false}
      />
    </lineSegments>
  );
}











function BoardMesh({ board, selected }: { board: BoardItem; selected: boolean }) {
  const selectBoard = useProjectStore((s) => s.selectBoard);
  const materials = useProjectStore((s) => s.project.materials);
  const family = board.role === 'KORPUS' ? 'korpus' : board.role === 'FRONT' ? 'front' : 'blat';
  const materialPalette = materials?.[family] ?? {};
const materialColor =
  materialPalette?.[board.material.materialIndex] ?? 'biały';
const color = selected
  ? '#f5a623'
  : COLOR_TO_HEX[materialColor] ?? '#d8b16a';

  const geometry = useMemo(() => createBoardGeometry(board), [board]);
  const planeQuaternion = useMemo(() => getPlaneQuaternion(board), [board.plane]);
  const finalQuaternion = useMemo(
    () => getFinalQuaternion(planeQuaternion, board),
    [
      planeQuaternion,
      board.rotation.x,
      board.rotation.y,
      board.rotation.z,
      board.rotationQuaternion?.x,
      board.rotationQuaternion?.y,
      board.rotationQuaternion?.z,
      board.rotationQuaternion?.w
    ]
  );

  return (
    <group
      position={[board.anchor.x, board.anchor.y, board.anchor.z]}
      quaternion={finalQuaternion}
      onClick={(e) => { e.stopPropagation(); selectBoard(board.id); }}
    >
      <mesh geometry={geometry} renderOrder={1}>
        <meshStandardMaterial
          color={color}
          side={THREE.DoubleSide}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      <EdgeStrips board={board} />


<group rotation={[-Math.PI, 0, -Math.PI / 2]}>
  <GrainOverlay board={board} />
</group>




    </group>
  );
}









type DragPoint = { x: number; y: number };

function SelectionController({
  dragStart,
  dragEnd,
  setDragStart,
  setDragEnd
}: {
  dragStart: DragPoint | null;
  dragEnd: DragPoint | null;
  setDragStart: (point: DragPoint | null) => void;
  setDragEnd: (point: DragPoint | null) => void;
}) {
  const { camera, gl } = useThree();
  const boards = useProjectStore((s) => s.project.boards);
  const selectionMode = useProjectStore((s) => s.selectionMode);
  const setSelectedBoards = useProjectStore((s) => s.setSelectedBoards);
  const selectBoard = useProjectStore((s) => s.selectBoard);
  const moveSelectedBoardsTo = useProjectStore((s) => s.moveSelectedBoardsTo);

  useEffect(() => {
    const element = gl.domElement;

    const getPoint = (event: PointerEvent): DragPoint => {
      const rect = element.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!selectionMode) return;
      event.preventDefault();
      event.stopPropagation();

      const point = getPoint(event);
      setDragStart(point);
      setDragEnd(point);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!selectionMode || !dragStart) return;
      event.preventDefault();
      event.stopPropagation();

      setDragEnd(getPoint(event));
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!selectionMode || !dragStart || !dragEnd) return;
      event.preventDefault();
      event.stopPropagation();

      const rect = element.getBoundingClientRect();
      const minX = Math.min(dragStart.x, dragEnd.x);
      const maxX = Math.max(dragStart.x, dragEnd.x);
      const minY = Math.min(dragStart.y, dragEnd.y);
      const maxY = Math.max(dragStart.y, dragEnd.y);

      const selectedIds = boards
        .filter((board) => {
          const projected = new THREE.Vector3(board.anchor.x, board.anchor.y, board.anchor.z).project(camera);
          const x = (projected.x * 0.5 + 0.5) * rect.width;
          const y = (-projected.y * 0.5 + 0.5) * rect.height;

          return x >= minX && x <= maxX && y >= minY && y <= maxY;
        })
        .map((board) => board.id);

      selectBoard(selectedIds[0] ?? null);
      setSelectedBoards(selectedIds);
      setDragStart(null);
      setDragEnd(null);
    };

    element.addEventListener('pointerdown', handlePointerDown, true);
    element.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerup', handlePointerUp, true);

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown, true);
      element.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', handlePointerUp, true);
    };
  }, [boards, camera, dragStart, dragEnd, gl, selectBoard, selectionMode, setDragEnd, setDragStart, setSelectedBoards]);

  return null;
}

function Controls() {
  const controlsRef = useRef<any>(null);
  const viewMode = useProjectStore((s) => s.viewMode);
  const viewResetNonce = useProjectStore((s) => s.viewResetNonce);
  const { camera } = useThree();

  useEffect(() => {
    if (!controlsRef.current) return;

    // Zoom kółkiem myszy do miejsca pod kursorem.
    // Przybliżanie i oddalanie trzyma punkt wskazany myszką.
    controlsRef.current.zoomToCursor = true;

    camera.position.set(...getViewPosition(viewMode));
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [camera, viewMode, viewResetNonce]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.1}
      rotateSpeed={0.7}
      zoomSpeed={0.85}
      panSpeed={0.8}
      minDistance={40}
      maxDistance={12000}
      screenSpacePanning
      enableZoom
      enablePan
    />
  );
}

export function SceneView() {
  const boards = useProjectStore((s) => s.project.boards);
  const selectedBoardId = useProjectStore((s) => s.selectedBoardId);
  const selectedBoardIds = useProjectStore((s) => s.selectedBoardIds);
  const selectionMode = useProjectStore((s) => s.selectionMode);
  const selectBoard = useProjectStore((s) => s.selectBoard);
  const moveSelectedBoardsTo = useProjectStore((s) => s.moveSelectedBoardsTo);
  const [dragStart, setDragStart] = useState<DragPoint | null>(null);
  const [dragEnd, setDragEnd] = useState<DragPoint | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState({ x: '0', y: '0', z: '0' });

  return (
    <div className={`scene-wrap ${selectionMode ? 'selection-mode' : ''}`} onContextMenu={(e) => { if (selectedBoardIds.length) { e.preventDefault(); setMoveDialogOpen(true); } }}>
      <Canvas
        camera={{ position: [1200, 900, 1200], fov: 38, near: 2, far: 80000 }}
        gl={{ antialias: true }}
        dpr={[1, Math.min(2, window.devicePixelRatio || 1)]}
        onPointerMissed={() => { selectBoard(null); useProjectStore.getState().setSelectedBoards([]); }}
      >
        <CameraPreset />
        <ambientLight intensity={1.15} />
        <directionalLight position={[700, 1200, 700]} intensity={1.2} />
        <AxisHelper />
        {boards
  .filter((board) => !board.hiddenInProject)
  .map((board) => (
          <BoardMesh
            key={board.id}
            board={board}
            selected={board.id === selectedBoardId || selectedBoardIds.includes(board.id)}
          />
        ))}
        <SelectionController dragStart={dragStart} dragEnd={dragEnd} setDragStart={setDragStart} setDragEnd={setDragEnd} />
        <Controls />
      </Canvas>

      {dragStart && dragEnd && (
        <div
          className="selection-box"
          style={{
            left: Math.min(dragStart.x, dragEnd.x),
            top: Math.min(dragStart.y, dragEnd.y),
            width: Math.abs(dragEnd.x - dragStart.x),
            height: Math.abs(dragEnd.y - dragStart.y)
          }}
        />
      )}
      {moveDialogOpen && (
        <div className="move-dialog">
          <div className="move-dialog-card">
            <div className="materials-popover-header">
              <strong>Przenieś zaznaczenie</strong>
              <button className="secondary" onClick={() => setMoveDialogOpen(false)}>Zamknij</button>
            </div>
            <p>Wpisz współrzędne punktu, do którego zostanie przeniesiony najbliższy początkowi układu punkt zaznaczenia.</p>
            <div className="corner-inputs">
              <label>X<input type="number" value={moveTarget.x} onChange={(e) => setMoveTarget((prev) => ({ ...prev, x: e.target.value }))} /></label>
              <label>Y<input type="number" value={moveTarget.y} onChange={(e) => setMoveTarget((prev) => ({ ...prev, y: e.target.value }))} /></label>
              <label>Z<input type="number" value={moveTarget.z} onChange={(e) => setMoveTarget((prev) => ({ ...prev, z: e.target.value }))} /></label>
            </div>
            <button
              onClick={() => {
                moveSelectedBoardsTo({
                  x: Number(moveTarget.x) || 0,
                  y: Number(moveTarget.y) || 0,
                  z: Number(moveTarget.z) || 0
                });
                setMoveDialogOpen(false);
              }}
            >
              Przenieś
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
