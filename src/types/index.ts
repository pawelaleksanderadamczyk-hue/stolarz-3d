export type ShapeType =
  | 'RECT'
  | 'RECT_CUT_CORNER'
  | 'RECT_CORNER_NOTCH'
  | 'RECT_INNER_CUTOUT'
  | 'RIGHT_TRAPEZOID'
  | 'TRAPEZOID'
  | 'TRAPEZOID_INNER_CUTOUT';
export type PartRole = 'KORPUS' | 'FRONT' | 'BLAT' | 'HDF' | 'INNE';
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
  hdf: Record<MaterialIndex, MaterialColor>;
  inne: Record<MaterialIndex, MaterialColor>;
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
export interface RightTrapezoidDims {
  lengthLeft: number;
  lengthRight: number;
  width: number;
  thickness: number;
}
export interface TrapezoidDims {
  height: number;
  width: number;
  leftInset: number;
  rightInset: number;
  thickness: number;
}
export interface TrapezoidInnerCutoutDims {
  height: number;
  width: number;
  leftInset: number;
  rightInset: number;
  cutoutOffsetLength: number;
  cutoutOffsetWidth: number;
  cutoutLength: number;
  cutoutWidth: number;
  thickness: number;
}

export type ShapeDimensions = RectDims | RectCutCornerDims | RectCornerNotchDims | RectInnerCutoutDims| RightTrapezoidDims | TrapezoidDims | TrapezoidInnerCutoutDims;
export type EdgeSelection = Record<string, boolean>;

export interface BoardItem {
  id: string;
  number: string;
  name?: string;
  cabinetName?: string;
hiddenInProject?: boolean;
  shape: ShapeType;
  role: PartRole;
  material: MaterialAssignment;
  dimensions: ShapeDimensions;
  plane: PlaneType;
  anchor: Vec3;
  rotation: Rotation3;
  rotationQuaternion?: Quaternion4;
  edging: EdgeSelection;
printSelected?: boolean;
grainDirection?: 'none' | 'vertical' | 'horizontal';
}

export interface ProjectData {
  version: 1;
  nextCounters: Record<ShapeType, number>;
  globalAnchor: Vec3;
  materials: ProjectMaterialPalette;
defaultGrainDirections?: {
  korpus: 'none' | 'vertical' | 'horizontal';
  front: 'none' | 'vertical' | 'horizontal';
  blat: 'none' | 'vertical' | 'horizontal';
  hdf: 'none' | 'vertical' | 'horizontal';
  inne: 'none' | 'vertical' | 'horizontal';
};
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
