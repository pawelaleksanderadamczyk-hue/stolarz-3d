export type ShapeType = 'RECT' | 'RECT_CUT_CORNER' | 'RECT_CORNER_NOTCH' | 'RECT_INNER_CUTOUT';
export type PartRole = 'KORPUS' | 'FRONT' | 'BLAT';
export type PlaneType = 'ZX' | 'XZ' | 'XY' | 'YX' | 'YZ' | 'ZY';
export type MaterialColor = 'biały' | 'niebieski' | 'żółty' | 'czerwony';
export type MaterialIndex = 1 | 2 | 3;

export interface Vec3 { x: number; y: number; z: number; }
export interface Rotation3 { x: number; y: number; z: number; }
export interface Quaternion4 { x: number; y: number; z: number; w: number; }

export interface MaterialAssignment {
  role: PartRole;
  materialIndex: MaterialIndex;
  edgingIndex: MaterialIndex;
}

export interface ProjectMaterialPalette {
  korpus: Record<MaterialIndex, MaterialColor>;
  front: Record<MaterialIndex, MaterialColor>;
  blat: Record<MaterialIndex, MaterialColor>;
  okleina: Record<MaterialIndex, MaterialColor>;
}

export interface RectDims { length: number; width: number; thickness: number; }
export interface RectCutCornerDims { length1: number; width1: number; length2: number; width2: number; thickness: number; }
export interface RectCornerNotchDims { length1: number; width1: number; length2: number; width2: number; thickness: number; }
export interface RectInnerCutoutDims {
  length: number;
  width: number;
  cutoutOffsetLength: number;
  cutoutOffsetWidth: number;
  cutoutLength: number;
  cutoutWidth: number;
  thickness: number;
}

export type ShapeDimensions = RectDims | RectCutCornerDims | RectCornerNotchDims | RectInnerCutoutDims;
export type EdgeSelection = Record<string, boolean>;

export interface BoardItem {
  id: string;
  number: string;
  name?: string;
  shape: ShapeType;
  role: PartRole;
  material: MaterialAssignment;
  dimensions: ShapeDimensions;
  plane: PlaneType;
  anchor: Vec3;
  rotation: Rotation3;
  rotationQuaternion?: Quaternion4;
  edging: EdgeSelection;
}

export interface ProjectData {
  version: 1;
  nextCounters: Record<ShapeType, number>;
  globalAnchor: Vec3;
  materials: ProjectMaterialPalette;
  boards: BoardItem[];
}

export interface NewBoardForm {
  shape: ShapeType;
  role: PartRole;
  materialIndex: MaterialIndex;
  edgingIndex: MaterialIndex;
  dimensions: ShapeDimensions;
  plane: PlaneType;
}

export type ViewMode = 'IZOMETRIA' | 'GÓRA' | 'PRZÓD' | 'BOK';
