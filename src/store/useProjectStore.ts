import { create } from 'zustand';
import { boardsToCsv } from '../core/csv';
import { SHAPE_CODES } from '../core/constants';
import {
  createBoard,
  createDefaultDimensions,
  createEmptyProject,
  identityQuaternion,
  moveBoardByLeadingCorner,
  rotateQuaternionAroundWorldAxis,
  getOuterVertices3D
} from '../core/project';
import { createCabinetTemplate } from '../core/cabinets';
import type {
  BoardItem,
  CabinetBoard,
CabinetTemplate,
  MaterialColor,
  MaterialIndex,
  PartRole,
  PlaneType,
  ProjectData,
  ProjectMaterialPalette,
  ShapeDimensions,
  ShapeType,
    Vec3,
  MeasurePoint,
  ViewMode
} from '../types';

import {
  downloadCabinetsFile,
  readCabinetsFile
} from '../core/cabinetLibrary';




function evaluateCabinetFormula(
  formula: string | undefined,
  variables: Record<string, number>,
  cabinetBoards: CabinetBoard[]
): number | null {
  if (!formula?.trim()) return null;

  try {
    let expression = formula.trim();

    // ==================================================
    // ODNIESIENIA DO INNEJ FORMATKI
    //
    // D1.4 = długość formatki nr 4
    // S1.4 = szerokość formatki nr 4
    // G1.4 = grubość formatki nr 4
    // ==================================================

    expression = expression.replace(
      /\b(D1|S1|G1)\.(\d+)\b/g,
      (_match, dimension, boardNumber) => {

        const cabinetBoard = cabinetBoards.find((cb) => {
          const number = String(cb.board.number).trim();

          return (
            number === String(boardNumber).trim() ||
            number === `PR-${boardNumber}`
          );
        });

        if (!cabinetBoard) {
          throw new Error(
            `Nie znaleziono formatki nr ${boardNumber}`
          );
        }

        if (dimension === 'D1') {
          return String(cabinetBoard.D1);
        }

        if (dimension === 'S1') {
          return String(cabinetBoard.S1);
        }

        if (dimension === 'G1') {
          return String(cabinetBoard.G1);
        }

        throw new Error(
          `Nieznany wymiar: ${dimension}`
        );
      }
    );

    // ==================================================
    // DANE BIEŻĄCEJ FORMATKI
    //
    // D1 = długość bieżącej formatki
    // S1 = szerokość bieżącej formatki
    // G1 = grubość bieżącej formatki
    // ==================================================

    for (const [name, value] of Object.entries(variables)) {
      expression = expression.replace(
        new RegExp(`\\b${name}\\b`, 'g'),
        String(value)
      );
    }

    // Jeżeli zostały litery, wzór jest nieprawidłowy
    if (/[A-Za-z]/.test(expression)) {
      return null;
    }

    // Dozwolone tylko liczby i działania matematyczne
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
      return null;
    }

    const result = Function(
      `"use strict"; return (${expression});`
    )();

    return Number.isFinite(result)
      ? Number(result)
      : null;

  } catch (error) {
    console.error(
      'Błąd obliczania wzoru:',
      formula,
      error
    );

    return null;
  }
}



function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}


interface RotationEditState {
  axis: 'x' | 'y' | 'z';
  value: number;
}

interface ProjectStore {
  project: ProjectData;
  selectedBoardId: string | null;
  rotationEditor: RotationEditState | null;
  addBoardModalOpen: boolean;
  viewMode: ViewMode;
  history: ProjectData[];
  future: ProjectData[];
  viewResetNonce: number;
  selectionMode: boolean;
  selectedBoardIds: string[];
  setSelectionMode: (value: boolean) => void;
  setSelectedBoards: (ids: string[]) => void;
  openAddBoardModal: () => void;
  closeAddBoardModal: () => void;
  addBoard: (shape: ShapeType, plane?: PlaneType, role?: PartRole) => void;
  selectBoard: (id: string | null) => void;

measureMode: boolean;
measurePoints: MeasurePoint[];
selectedMeasurePair: number | null;
setMeasureMode: (value: boolean) => void;
addMeasurePoint: (point: MeasurePoint) => void;
setSelectedMeasurePair: (pair: number | null) => void;
removeMeasurePair: (pair: number | null) => void;
clearMeasurements: () => void;


  updateProjectAnchor: (anchor: Vec3) => void;
  updateBoard: (id: string, patch: Partial<BoardItem>) => void;
  updateBoardDimensions: (id: string, dimensions: ShapeDimensions) => void;
  updateBoardAnchor: (id: string, anchor: Vec3) => void;
  toggleEdging: (id: string, key: string) => void;
  rotateBoard90: (id: string, axis: 'x' | 'y' | 'z') => void;
  openRotationEditor: (axis: 'x' | 'y' | 'z', initialValue: number) => void;
  closeRotationEditor: () => void;
  applyRotationEditor: (id: string) => void;
  copyBoard: (id: string) => void;
  copySelectedBoards: () => void;


updateCabinetBoardFormulas: (
  cabinetId: string,
  boardId: string,
  patch: Partial<NonNullable<CabinetBoard['formulas']>>
) => void;




updateCabinetBoardDimensions: (
  cabinetId: string,
  boardId: string,
  patch: {
    D1?: number;
    S1?: number;
    G1?: number;
  }
) => void;



updateCabinetBoardPlane: (
  cabinetId: string,
  boardId: string,
  plane: 'ZY' | 'ZX' | 'XY'| 'XZ' | 'YX'| 'YZ'
) => void;



addCabinetBoard: (
  cabinetId: string
) => void;


removeCabinetBoard: (
  cabinetId: string,
  boardId: string
) => void;





saveCabinetsToFile: () => void;

loadCabinetsFromFile: (file: File) => Promise<void>;

deleteCabinet: (cabinetId: string) => void;


copyCabinet: (
  cabinetId: string,
  newName: string
) => void;



updateCabinet: (
  cabinetId: string,
  patch: {
    name?: string;
    height?: number;
    width?: number;
    depth?: number;
    plinth?: number;
  }
) => void;





saveCabinet: (
  name: string,
  dimensions: {
    height: number;
    width: number;
    depth: number;
    plinth: number;
  }
) => void;


addCabinetToProject: (
  cabinetId: string,
  dimensions: {
    height: number;
    width: number;
    depth: number;
    plinth: number;
  },
  position: Vec3
) => void;



  moveSelectedBoardsTo: (target: Vec3) => void;


moveSelectedSetTo: (target: Vec3) => void;
rotateSelectedSet90: () => void;

  removeBoard: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  resetView: () => void;
  setProjectMaterial: (family: keyof ProjectMaterialPalette, index: MaterialIndex, color: MaterialColor) => void;
  saveProjectToFile: () => void;
  loadProjectFromFile: (file: File) => Promise<void>;
  exportCsv: () => void;
  undo: () => void;
  redo: () => void;

}

function cloneProject(project: ProjectData): ProjectData {
  return JSON.parse(JSON.stringify(project));
}

function downloadFile(filename: string, contents: string, mime: string, withBom = false) {
  const payload = withBom ? '\ufeff' + contents : contents;
  const blob = new Blob([payload], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function pushHistory(state: ProjectStore) {
  return [...state.history, cloneProject(state.project)];
}


function ensureRotationQuaternions(project: ProjectData): ProjectData {
  project.boards.forEach((board) => {
    if (!board.rotationQuaternion) {
      board.rotationQuaternion = identityQuaternion();
    }
  });

  return project;
}

function renumberBoards(project: ProjectData) {
  project.boards.forEach((board, index) => {
    board.number = `${SHAPE_CODES[board.shape]}-${index + 1}`;
  });
  const next = project.boards.length + 1;
  project.nextCounters.RECT = next;
  project.nextCounters.RECT_CUT_CORNER = next;
  project.nextCounters.RECT_CORNER_NOTCH = next;
  project.nextCounters.RECT_INNER_CUTOUT = next;
  return project;
}


const COPY_OFFSET: Vec3 = { x: 100, y: 100, z: 100 };

function sameAnchor(a: Vec3, b: Vec3) {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}


function addVec(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z
  };
}


function multiplyVec(v: Vec3, multiplier: number): Vec3 {
  return {
    x: v.x * multiplier,
    y: v.y * multiplier,
    z: v.z * multiplier
  };
}


function isAnchorOccupied(project: ProjectData, anchor: Vec3) {
  return project.boards.some((board) => sameAnchor(board.anchor, anchor));
}


function getFreeAnchor(project: ProjectData, preferred: Vec3) {
  let anchor = { ...preferred };
  let shiftCount = 0;
  while (isAnchorOccupied(project, anchor)) {
    shiftCount += 1;
    anchor = addVec(preferred, multiplyVec(COPY_OFFSET, shiftCount));
  }
  if (shiftCount > 0) {
    window.alert(
      `Miejsce było zajęte. Formatka została przesunięta o XYZ = (${shiftCount * 100}, ${shiftCount * 100}, ${shiftCount * 100}).`
    );
  }
  return anchor;
}


function groupCollides(project: ProjectData, boards: BoardItem[], offset: Vec3) {
  return boards.some((board) => {
    const nextAnchor = addVec(board.anchor, offset);
    return isAnchorOccupied(project, nextAnchor);
  });
}


function getFreeGroupOffset(project: ProjectData, boards: BoardItem[]) {
  let shiftCount = 1;
  let offset = multiplyVec(COPY_OFFSET, shiftCount);
  while (groupCollides(project, boards, offset)) {
    shiftCount += 1;
    offset = multiplyVec(COPY_OFFSET, shiftCount);
  }
  if (shiftCount > 1) {
    window.alert(
      `Miejsce było zajęte. Kopia została przesunięta o XYZ = (${shiftCount * 100}, ${shiftCount * 100}, ${shiftCount * 100}).`
    );
  }
  return offset;
}





export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: createEmptyProject(),
  selectedBoardId: null,



measureMode: false,
measurePoints: [],
selectedMeasurePair: null,
setMeasureMode: (value) =>
  set({
    measureMode: value
  }),
addMeasurePoint: (point) =>
  set((state) => {
    const measurePoints = [...state.measurePoints, point];

    return {
      measurePoints,
      project: {
        ...state.project,
        measurePoints
      }
    };
  }),

setSelectedMeasurePair: (pair) =>
  set({
    selectedMeasurePair: pair
  }),
removeMeasurePair: (pair) =>
  set((state) => {
    if (pair === null) return state;

    const start = pair * 2;

    const measurePoints = state.measurePoints.filter(
      (_, index) => index !== start && index !== start + 1
    );

    return {
      history: pushHistory(state),
      future: [],
      measurePoints,
      selectedMeasurePair: null,
      project: {
        ...state.project,
        measurePoints
      }
    };
  }),


clearMeasurements: () =>
  set((state) => ({
    measurePoints: [],
    project: {
      ...state.project,
      measurePoints: []
    }
  })),



  rotationEditor: null,
  addBoardModalOpen: false,
  viewMode: 'IZOMETRIA',
  history: [],
  future: [],
  viewResetNonce: 0,
  selectionMode: false,
  selectedBoardIds: [],
  setSelectionMode: (value) => set({ selectionMode: value }),
  setSelectedBoards: (ids) => set({ selectedBoardIds: ids }),

  openAddBoardModal: () => set({ addBoardModalOpen: true }),
  closeAddBoardModal: () => set({ addBoardModalOpen: false }),

  addBoard: (shape, plane = 'YZ', role = 'KORPUS') => {
    const state = get();
    const project = cloneProject(state.project);

    const next = project.boards.length + 1;
    project.nextCounters.RECT = next;
    project.nextCounters.RECT_CUT_CORNER = next;
    project.nextCounters.RECT_CORNER_NOTCH = next;
    project.nextCounters.RECT_INNER_CUTOUT = next;
    project.nextCounters.RECT_DOUBLE_CUTOUT = next;


    const board = createBoard(project, {
      shape,
      plane,
      role,
      materialIndex: 1,
      edgingIndex: 1,
      dimensions: createDefaultDimensions(shape)
    });

    board.anchor = getFreeAnchor(project, board.anchor);

project.boards.push(board);
renumberBoards(project);

    set({
  history: pushHistory(state),
  future: [],
  project,
  selectedBoardId: board.id,
  selectedBoardIds: [board.id],
  addBoardModalOpen: false
});
  },

  selectBoard: (id) => set({ selectedBoardId: id, selectedBoardIds: id ? [id] : [] }),

  updateProjectAnchor: (anchor) => {
    const state = get();
    set({ history: pushHistory(state), future: [], project: { ...state.project, globalAnchor: anchor } });
  },

  updateBoard: (id, patch) => {
    const state = get();
    const project = cloneProject(state.project);
    const idx = project.boards.findIndex((b) => b.id === id);
    if (idx === -1) return;

    project.boards[idx] = {
      ...project.boards[idx],
      ...patch,
      material: patch.material ? { ...project.boards[idx].material, ...patch.material } : project.boards[idx].material,
      rotation: patch.rotation ? { ...project.boards[idx].rotation, ...patch.rotation } : project.boards[idx].rotation,
      anchor: patch.anchor ? { ...project.boards[idx].anchor, ...patch.anchor } : project.boards[idx].anchor,
      edging: patch.edging ? { ...project.boards[idx].edging, ...patch.edging } : project.boards[idx].edging
    };

    renumberBoards(project);

    set({ history: pushHistory(state), future: [], project });
  },

  updateBoardDimensions: (id, dimensions) => {
    const state = get();
    const project = cloneProject(state.project);
    const board = project.boards.find((b) => b.id === id);
    if (!board) return;
    board.dimensions = dimensions;
    set({ history: pushHistory(state), future: [], project });
  },

updateBoardAnchor: (id, anchor) => {
  const state = get();
  const project = cloneProject(state.project);
  const idx = project.boards.findIndex((b) => b.id === id);

  if (idx === -1) return;

  // Zapamiętujemy stare położenie formatki
  const oldAnchor = { ...project.boards[idx].anchor };

  // Przesuwamy formatkę
  project.boards[idx] = moveBoardByLeadingCorner(
    project.boards[idx],
    anchor
  );

  // Obliczamy przesunięcie formatki
  const dx = project.boards[idx].anchor.x - oldAnchor.x;
  const dy = project.boards[idx].anchor.y - oldAnchor.y;
  const dz = project.boards[idx].anchor.z - oldAnchor.z;

  // Przesuwamy razem z formatką wszystkie punkty wymiarów,
  // które są do niej przypięte
  const measurePoints = (project.measurePoints ?? []).map((point) => {
    if (point.boardId !== id) return point;

    return {
      ...point,
      x: point.x + dx,
      y: point.y + dy,
      z: point.z + dz
    };
  });

  project.measurePoints = measurePoints;

  set({
    history: pushHistory(state),
    future: [],
    project,
    measurePoints
  });
},

  toggleEdging: (id, key) => {
    const board = get().project.boards.find((b) => b.id === id);
    if (!board) return;
    get().updateBoard(id, { edging: { ...board.edging, [key]: !board.edging[key] } });
  },

  rotateBoard90: (id, axis) => {
    const board = get().project.boards.find((b) => b.id === id);
    if (!board) return;

    get().updateBoard(id, {
      rotation: {
        ...board.rotation,
        [axis]: (board.rotation[axis] + 90) % 360
      },
      rotationQuaternion: rotateQuaternionAroundWorldAxis(board.rotationQuaternion, axis, 90)
    });
  },

  openRotationEditor: (axis, initialValue) => set({ rotationEditor: { axis, value: initialValue } }),
  closeRotationEditor: () => set({ rotationEditor: null }),

  applyRotationEditor: (id) => {
    const editor = get().rotationEditor;
    const board = get().project.boards.find((b) => b.id === id);
    if (!editor || !board) return;

    const exact = ((editor.value % 360) + 360) % 360;
    const current = board.rotation[editor.axis];
    const delta = exact - current;

    get().updateBoard(id, {
      rotation: {
        ...board.rotation,
        [editor.axis]: exact
      },
      rotationQuaternion: rotateQuaternionAroundWorldAxis(board.rotationQuaternion, editor.axis, delta)
    });

    set({ rotationEditor: null });
  },

  copyBoard: (id) => {
  const state = get();
  if (state.selectedBoardIds.length > 1 && state.selectedBoardIds.includes(id)) {
    get().copySelectedBoards();
    return;
  }
  const project = cloneProject(state.project);
  const board = project.boards.find((b) => b.id === id);
  if (!board) return;
  let anchor = {
    x: board.anchor.x + 100,
    y: board.anchor.y + 100,
    z: board.anchor.z + 100
  };
  let shiftCount = 1;
  while (isAnchorOccupied(project, anchor)) {
    shiftCount += 1;
    anchor = {
      x: board.anchor.x + shiftCount * 100,
      y: board.anchor.y + shiftCount * 100,
      z: board.anchor.z + shiftCount * 100
    };
  }
  if (shiftCount > 1) {
    window.alert(
      `Miejsce było zajęte. Kopia została przesunięta o XYZ = (${shiftCount * 100}, ${shiftCount * 100}, ${shiftCount * 100}).`
    );
  }
  const clone: BoardItem = {
    ...JSON.parse(JSON.stringify(board)),
    id: createId(),
    anchor
  };
  project.boards.push(clone);
  renumberBoards(project);
  set({
    history: pushHistory(state),
    future: [],
    project,
    selectedBoardId: clone.id,
    selectedBoardIds: [clone.id]
  });
},


  copySelectedBoards: () => {
  const state = get();
  const selectedIds = state.selectedBoardIds.length
    ? state.selectedBoardIds
    : state.selectedBoardId
      ? [state.selectedBoardId]
      : [];
  if (!selectedIds.length) return;
  const project = cloneProject(state.project);
  const selectedBoards = selectedIds
    .map((id) => project.boards.find((b) => b.id === id))
    .filter((b): b is BoardItem => Boolean(b));
  if (!selectedBoards.length) return;
  const offset = getFreeGroupOffset(project, selectedBoards);
  const copiedIds: string[] = [];
  selectedBoards.forEach((board) => {
    const clone: BoardItem = {
      ...JSON.parse(JSON.stringify(board)),
      id: createId(),
      anchor: {
        x: board.anchor.x + offset.x,
        y: board.anchor.y + offset.y,
        z: board.anchor.z + offset.z
      }
    };
    copiedIds.push(clone.id);
    project.boards.push(clone);
  });
  renumberBoards(project);
  set({
    history: pushHistory(state),
    future: [],
    project,
    selectedBoardId: copiedIds[0] ?? null,
    selectedBoardIds: copiedIds
  });
},







addCabinetBoard: (cabinetId) => {
  const state = get();

  const project = cloneProject(state.project);

  const cabinet = project.cabinets?.find(
    (item) => item.id === cabinetId
  );

  if (!cabinet) {
    window.alert('Nie znaleziono szablonu szafki.');
    return;
  }

  if (!cabinet.boards.length) {
    window.alert(
      'Szablon nie zawiera żadnej formatki, na podstawie której można utworzyć nową.'
    );
    return;
  }

  const lastCabinetBoard =
    cabinet.boards[cabinet.boards.length - 1];

  const sourceBoard = lastCabinetBoard.board;

  /*
   * Nowa formatka dziedziczy:
   * - kształt
   * - materiał
   * - rolę
   * - okleinowanie
   *
   * ale NIE dziedziczy geometrii narożników/otworów
   * ani obrotu poprzedniej formatki.
   */
  const newBoard: BoardItem = {
    ...structuredClone(sourceBoard),

    id: createId(),
    number: `PR-${cabinet.boards.length + 1}`,

    plane: 'XZ',

    rotation: {
      x: 0,
      y: 0,
      z: 0
    },

    rotationQuaternion: identityQuaternion(),

    cabinetSelected: false,

    dimensions: {
      ...structuredClone(sourceBoard.dimensions)
    }
  };

  /*
   * Dla RECT_DOUBLE_CUTOUT tworzymy świeżą geometrię
   * narożników i otworów.
   *
   * D1 = długość
   * S1 = szerokość
   * G1 = grubość
   */
  if (newBoard.shape === 'RECT_DOUBLE_CUTOUT') {
    newBoard.dimensions = {
      length: lastCabinetBoard.D1,
      width: lastCabinetBoard.S1,

      width1: 0,
      length1: 0,

      width2: 0,
      length2: 0,

      hole1Width: 0,
      hole1Height: 0,
      hole1OffsetWidth: 0,
      hole1OffsetLength: 0,

      hole2Width: 0,
      hole2Height: 0,
      hole2OffsetWidth: 0,
      hole2OffsetLength: 0,

      thickness: lastCabinetBoard.G1
    };
  }

  const newCabinetBoard: CabinetBoard = {
    board: newBoard,

    D1: Number(newBoard.dimensions.length),
    S1: Number(newBoard.dimensions.width),
    G1: Number(newBoard.dimensions.thickness),

    formulas: {
      D2: '',
      S2: '',
      G2: '',
      X2: '',
      Y2: '',
      Z2: ''
    }
  };

  cabinet.boards.push(newCabinetBoard);

  set({
    history: pushHistory(state),
    future: [],
    project
  });

  downloadCabinetsFile(
    project.cabinets ?? []
  );
},





removeCabinetBoard: (cabinetId, boardId) => {
  const state = get();
  const project = cloneProject(state.project);

  const cabinet = project.cabinets?.find(
    (item) => item.id === cabinetId
  );

  if (!cabinet) {
    window.alert('Nie znaleziono szablonu szafki.');
    return;
  }

  const cabinetBoard = cabinet.boards.find(
    (item) => item.board.id === boardId
  );

  if (!cabinetBoard) {
    window.alert('Nie znaleziono formatki w szablonie.');
    return;
  }

  const confirmed = window.confirm(
    `Czy na pewno usunąć formatkę "${cabinetBoard.board.number}" z szablonu szafki?`
  );

  if (!confirmed) return;

  cabinet.boards = cabinet.boards.filter(
    (item) => item.board.id !== boardId
  );

  set({
    history: pushHistory(state),
    future: [],
    project
  });

  downloadCabinetsFile(
    project.cabinets ?? []
  );
},









updateCabinetBoardDimensions: (
  cabinetId,
  boardId,
  patch
) => {
  const state = get();
  const project = cloneProject(state.project);

  const cabinet = project.cabinets?.find(
    (item) => item.id === cabinetId
  );

  if (!cabinet) {
    window.alert('Nie znaleziono szablonu szafki.');
    return;
  }

  const cabinetBoard = cabinet.boards.find(
    (item) => item.board.id === boardId
  );

  if (!cabinetBoard) {
    window.alert('Nie znaleziono formatki.');
    return;
  }

  if (patch.D1 !== undefined) {
    cabinetBoard.D1 = patch.D1;
  }

  if (patch.S1 !== undefined) {
    cabinetBoard.S1 = patch.S1;
  }

  if (patch.G1 !== undefined) {
    cabinetBoard.G1 = patch.G1;
  }

  set({
    history: pushHistory(state),
    future: [],
    project
  });

  downloadCabinetsFile(
    project.cabinets ?? []
  );
},








updateCabinetBoardFormulas: (cabinetId, boardId, patch) => {
  const state = get();
  const project = cloneProject(state.project);

  const cabinet = project.cabinets?.find(
    (c) => c.id === cabinetId
  );

  if (!cabinet) return;

  const cabinetBoard = cabinet.boards.find(
    (cb) => cb.board.id === boardId
  );

  if (!cabinetBoard) return;

  cabinetBoard.formulas = {
    ...(cabinetBoard.formulas ?? {}),
    ...patch
  };

  set({
    history: pushHistory(state),
    future: [],
    project
  });
},






updateCabinetBoardPlane: (
  cabinetId,
  boardId,
  plane
) => {
  const state = get();
  const project = cloneProject(state.project);

  const cabinet = project.cabinets?.find(
    (item) => item.id === cabinetId
  );

  if (!cabinet) {
    window.alert('Nie znaleziono szablonu szafki.');
    return;
  }

  const cabinetBoard = cabinet.boards.find(
    (item) => item.board.id === boardId
  );

  if (!cabinetBoard) {
    window.alert('Nie znaleziono formatki.');
    return;
  }

  cabinetBoard.board.plane = plane;

  set({
    history: pushHistory(state),
    future: [],
    project
  });

  downloadCabinetsFile(
    project.cabinets ?? []
  );
},









  updateCabinetBoardFormulas: (cabinetId, boardId, patch) => {
    const state = get();
    const project = cloneProject(state.project);

    const cabinet = project.cabinets?.find(
      (c) => c.id === cabinetId
    );

    if (!cabinet) return;

    const cabinetBoard = cabinet.boards.find(
      (cb) => cb.board.id === boardId
    );

    if (!cabinetBoard) return;

    cabinetBoard.formulas = {
      ...(cabinetBoard.formulas ?? {}),
      ...patch
    };

    set({
      history: pushHistory(state),
      future: [],
      project
    });
  },





saveCabinetsToFile: async () => {
  const state = get();

  const data = {
    version: 1,
    cabinets: state.project.cabinets ?? []
  };

  const json = JSON.stringify(data, null, 2);

  try {
    const showSaveFilePicker = (
      window as typeof window & {
        showSaveFilePicker?: (options?: {
          suggestedName?: string;
          types?: Array<{
            description?: string;
            accept: Record<string, string[]>;
          }>;
        }) => Promise<{
          createWritable: () => Promise<{
            write: (data: string) => Promise<void>;
            close: () => Promise<void>;
          }>;
        }>;
      }
    ).showSaveFilePicker;

    if (!showSaveFilePicker) {
      window.alert(
        'Ta przeglądarka nie obsługuje okna "Zapisz jako".'
      );
      return;
    }

    const handle = await showSaveFilePicker({
      suggestedName: 'szafki.json',
      types: [
        {
          description: 'Plik szafek JSON',
          accept: {
            'application/json': ['.json']
          }
        }
      ]
    });

    const writable = await handle.createWritable();

    await writable.write(json);

    await writable.close();

  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {
      return;
    }

    console.error(error);

    window.alert(
      'Nie udało się zapisać pliku szafek.'
    );
  }
},







saveCabinet: (name, dimensions) => {
  const state = get();

  const selectedBoards = state.project.boards.filter(
    (board) =>
      board.cabinetSelected === true &&
      !board.hiddenInProject
  );

  if (!selectedBoards.length) {
    window.alert('Nie znaleziono zaznaczonych formatek.');
    return;
  }

  if (!name.trim()) {
    window.alert('Podaj nazwę szafki.');
    return;
  }

  const project = cloneProject(state.project);

  const cabinet = createCabinetTemplate(
    name.trim(),
    selectedBoards,
    dimensions
  );

  project.cabinets = [
    ...(project.cabinets ?? []),
    cabinet
  ];

  project.boards = project.boards.map((board) =>
    selectedBoards.some((selected) => selected.id === board.id)
      ? {
          ...board,
          cabinetName: name.trim()
        }
      : board
  );

set({
  history: pushHistory(state),
  future: [],
  project
});
},




loadCabinetsFromFile: async (file) => {
  try {
    const cabinets = await readCabinetsFile(file);

    const state = get();
    const project = cloneProject(state.project);

    project.cabinets = cabinets;

    set({
      history: pushHistory(state),
      future: [],
      project
    });

    window.alert(
      `Wczytano ${cabinets.length} szafek.`
    );
  } catch (error) {
    console.error(error);

    window.alert(
      'Nie udało się wczytać pliku szafki.json.'
    );
  }
},





updateCabinet: (cabinetId, patch) => {
  const state = get();

  const project = cloneProject(state.project);

  const cabinet = project.cabinets?.find(
    (item) => item.id === cabinetId
  );

  if (!cabinet) {
    window.alert('Nie znaleziono szafki.');
    return;
  }

  if (patch.name !== undefined) {
    cabinet.name = patch.name;
  }

  if (patch.height !== undefined) {
    cabinet.baseDimensions.height = patch.height;
  }

  if (patch.width !== undefined) {
    cabinet.baseDimensions.width = patch.width;
  }

  if (patch.depth !== undefined) {
    cabinet.baseDimensions.depth = patch.depth;
  }

  if (patch.plinth !== undefined) {
    cabinet.baseDimensions.plinth = patch.plinth;
  }

  set({
    history: pushHistory(state),
    future: [],
    project
  });
},








copyCabinet: (cabinetId, newName) => {
  const state = get();

  const cabinet = state.project.cabinets?.find(
    (item) => item.id === cabinetId
  );

  if (!cabinet) {
    window.alert('Nie znaleziono szafki.');
    return;
  }

  if (!newName.trim()) {
    window.alert('Podaj nazwę kopii szafki.');
    return;
  }

  const project = cloneProject(state.project);

  const copiedCabinet: CabinetTemplate = {
    ...JSON.parse(JSON.stringify(cabinet)),
    id: createId(),
    name: newName.trim()
  };

  project.cabinets = [
    ...(project.cabinets ?? []),
    copiedCabinet
  ];

  set({
    history: pushHistory(state),
    future: [],
    project
  });
},











deleteCabinet: (cabinetId) => {
  const state = get();

  const cabinet = state.project.cabinets?.find(
    (item) => item.id === cabinetId
  );

  if (!cabinet) {
    window.alert('Nie znaleziono szafki.');
    return;
  }

  const confirmed = window.confirm(
    `Czy na pewno usunąć szafkę "${cabinet.name}"?`
  );

  if (!confirmed) return;

  const project = cloneProject(state.project);

  project.cabinets = (
    project.cabinets ?? []
  ).filter(
    (item) => item.id !== cabinetId
  );

  set({
    history: pushHistory(state),
    future: [],
    project
  });
},






addCabinetToProject: (cabinetId, dimensions, position) => {
  const state = get();

  const cabinet = state.project.cabinets?.find(
    (item) => item.id === cabinetId
  );

  if (!cabinet) {
    window.alert('Nie znaleziono szafki.');
    return;
  }

  const project = cloneProject(state.project);

  // =========================================================
  // ZMIENNE SZAFKI DOSTĘPNE W FORMUŁACH
  //
  // H = wysokość
  // S = szerokość
  // G = głębokość
  // C = cokół
  // =========================================================

  const variables: Record<string, number> = {
    H: dimensions.height,
    S: dimensions.width,
    G: dimensions.depth,
    C: dimensions.plinth
  };

  // =========================================================
  // TWORZENIE FORMATEK Z SZABLONU
  // =========================================================

const newBoards = cabinet.boards.map(
  ({ board, D1, S1, G1, formulas }) => {

const newBoard: BoardItem = {
  ...JSON.parse(JSON.stringify(board)),
  id: createId(),
  cabinetName: cabinet.name,
  cabinetSelected: false,
  plane: board.plane
};



      // =======================================================
      // D2 = długość formatki
      // S2 = szerokość formatki
      // G2 = grubość formatki
      // X2 = pozycja X
      // Y2 = pozycja Y
      // Z2 = pozycja Z
      // =======================================================


const variables: Record<string, number> = {
  H: dimensions.height,
  S: dimensions.width,
  G: dimensions.depth,
  C: dimensions.plinth,

  D1,
  S1,
  G1
};




const D2 = evaluateCabinetFormula(
  formulas?.D2,
  variables,
  cabinet.boards
);

const S2 = evaluateCabinetFormula(
  formulas?.S2,
  variables,
  cabinet.boards
);

const G2 = evaluateCabinetFormula(
  formulas?.G2,
  variables,
  cabinet.boards
);

const X2 = evaluateCabinetFormula(
  formulas?.X2,
  variables,
  cabinet.boards
);

const Y2 = evaluateCabinetFormula(
  formulas?.Y2,
  variables,
  cabinet.boards
);

const Z2 = evaluateCabinetFormula(
  formulas?.Z2,
  variables,
  cabinet.boards
);


      // =======================================================
      // PODMIANA WYMIARÓW
      // =======================================================

      if (
        D2 !== null ||
        S2 !== null ||
        G2 !== null
      ) {
        newBoard.dimensions = {
          ...newBoard.dimensions,

          ...(D2 !== null
            ? { length: D2 }
            : {}),

          ...(S2 !== null
            ? { width: S2 }
            : {}),

          ...(G2 !== null
            ? { thickness: G2 }
            : {})
        };
      }

      // =======================================================
      // PODMIANA POŁOŻENIA
      // =======================================================

      newBoard.anchor = {
        x: X2 !== null ? X2 : newBoard.anchor.x,
        y: Y2 !== null ? Y2 : newBoard.anchor.y,
        z: Z2 !== null ? Z2 : newBoard.anchor.z
      };

      return newBoard;
    }
  );

  // =========================================================
  // ZNAJDUJEMY MINIMALNY PUNKT CAŁEJ SZAFKI
  // =========================================================

  const minX = Math.min(
    ...newBoards.map((board) => board.anchor.x)
  );

  const minY = Math.min(
    ...newBoards.map((board) => board.anchor.y)
  );

  const minZ = Math.min(
    ...newBoards.map((board) => board.anchor.z)
  );

  // =========================================================
  // PRZESUNIĘCIE SZAFKI DO WSKAZANEGO X/Y/Z
  // =========================================================

  const offset: Vec3 = {
    x: position.x - minX,
    y: position.y - minY,
    z: position.z - minZ
  };

  // =========================================================
  // PRZESUWAMY CAŁĄ SZAFKĘ
  // =========================================================

  const movedBoards = newBoards.map((board) => ({
    ...board,
    anchor: {
      x: board.anchor.x + offset.x,
      y: board.anchor.y + offset.y,
      z: board.anchor.z + offset.z
    }
  }));

  project.boards.push(...movedBoards);

  renumberBoards(project);

  set({
    history: pushHistory(state),
    future: [],
    project,
    selectedBoardId: movedBoards[0]?.id ?? null,
    selectedBoardIds: movedBoards.map(
      (board) => board.id
    )
  });
},






  moveSelectedBoardsTo: (target) => {
    const state = get();
    const selectedIds = state.selectedBoardIds.length
      ? state.selectedBoardIds
      : state.selectedBoardId
        ? [state.selectedBoardId]
        : [];

    if (!selectedIds.length) return;

    const project = cloneProject(state.project);
    const selectedBoards = selectedIds
      .map((id) => project.boards.find((b) => b.id === id))
      .filter((b): b is BoardItem => Boolean(b));

    if (!selectedBoards.length) return;

    // Punkt odniesienia zaznaczenia:
    // najbliższy początkowi układu spośród punktów anchor zaznaczonych formatek.
    // Dzięki temu całe zaznaczenie przesuwa się równolegle.
    let leading = selectedBoards[0].anchor;
    let leadingDistance = leading.x * leading.x + leading.y * leading.y + leading.z * leading.z;

    selectedBoards.forEach((board) => {
      const p = board.anchor;
      const distance = p.x * p.x + p.y * p.y + p.z * p.z;
      if (distance < leadingDistance) {
        leading = p;
        leadingDistance = distance;
      }
    });

    const dx = target.x - leading.x;
    const dy = target.y - leading.y;
    const dz = target.z - leading.z;

    project.boards = project.boards.map((board) => {
      if (!selectedIds.includes(board.id)) return board;

      return {
        ...board,
        anchor: {
          x: board.anchor.x + dx,
          y: board.anchor.y + dy,
          z: board.anchor.z + dz
        }
      };
    });

    set({
      history: pushHistory(state),
      future: [],
      project,
      selectedBoardIds: selectedIds,
      selectedBoardId: selectedIds[0] ?? null
    });
  },






moveSelectedSetTo: (target) => {
  const state = get();

  const project = cloneProject(state.project);

  const setBoards = project.boards.filter(
    (board) =>
      board.setSelected === true &&
      !board.hiddenInProject
  );

  if (!setBoards.length) {
    window.alert('Nie zaznaczono żadnej formatki do zestawu.');
    return;
  }

  // Szukamy dokładnie tego samego punktu,
  // który jest pokazywany jako zielony punkt w SceneView.
  let leading: Vec3 | null = null;
  let leadingDistance = Infinity;

  for (const board of setBoards) {
    const vertices = getOuterVertices3D(board);

    for (const vertex of vertices) {
      const distance =
        vertex.x * vertex.x +
        vertex.y * vertex.y +
        vertex.z * vertex.z;

      if (distance < leadingDistance) {
        leadingDistance = distance;

        leading = {
          x: vertex.x,
          y: vertex.y,
          z: vertex.z
        };
      }
    }
  }

  if (!leading) {
    return;
  }

  // Przesunięcie zielonego punktu do zadanego X/Y/Z.
  const dx = target.x - leading.x;
  const dy = target.y - leading.y;
  const dz = target.z - leading.z;

  // Przesuwamy wszystkie formatki należące do zestawu
  // dokładnie o ten sam wektor.
  project.boards = project.boards.map((board) => {
    if (!board.setSelected) {
      return board;
    }

    return {
      ...board,
      anchor: {
        x: board.anchor.x + dx,
        y: board.anchor.y + dy,
        z: board.anchor.z + dz
      }
    };
  });

  set({
    history: pushHistory(state),
    future: [],
    project
  });
},





  rotateSelectedSet90: () => {
    const state = get();

    const project = cloneProject(state.project);

    const setBoards = project.boards.filter(
      (board) =>
        board.setSelected === true &&
        !board.hiddenInProject
    );

    if (!setBoards.length) {
      window.alert('Nie zaznaczono żadnej formatki do zestawu.');
      return;
    }

    // Znajdujemy zielony punkt zestawu.
    let leading: Vec3 | null = null;
    let leadingDistance = Infinity;

    for (const board of setBoards) {
      const vertices = getOuterVertices3D(board);

      for (const vertex of vertices) {
        const distance =
          vertex.x * vertex.x +
          vertex.y * vertex.y +
          vertex.z * vertex.z;

        if (distance < leadingDistance) {
          leadingDistance = distance;

          leading = {
            x: vertex.x,
            y: vertex.y,
            z: vertex.z
          };
        }
      }
    }

    if (!leading) return;

    // Obrót o 90° wokół osi Z.
    project.boards = project.boards.map((board) => {
      if (!board.setSelected || board.hiddenInProject) {
        return board;
      }

      const dx = board.anchor.x - leading.x;
      const dz = board.anchor.z - leading.z;

      // Obrót wektora względem zielonego punktu:
      // X' = Z
      // Z' = -X
      const rotatedDx = dz;
      const rotatedDz = -dx;

      return {
        ...board,

        anchor: {
	  x: leading.x + rotatedDx,
	  y: board.anchor.y,
	  z: leading.z + rotatedDz
	},

        rotation: {
          ...board.rotation,
          z: (board.rotation.y + 90) % 360
        },

        rotationQuaternion:
          rotateQuaternionAroundWorldAxis(
            board.rotationQuaternion,
            'y',
            90
          )
      };
    });

    set({
      history: pushHistory(state),
      future: [],
      project
    });
  },








  removeBoard: (id) => {
    const state = get();
    const idsToRemove = state.selectedBoardIds.length > 1 && state.selectedBoardIds.includes(id)
      ? state.selectedBoardIds
      : [id];

    const project = cloneProject(state.project);
    project.boards = project.boards.filter((b) => !idsToRemove.includes(b.id));
    renumberBoards(project);

    set({
      history: pushHistory(state),
      future: [],
      project,
      selectedBoardId: idsToRemove.includes(state.selectedBoardId ?? '') ? null : state.selectedBoardId,
      selectedBoardIds: state.selectedBoardIds.filter((selectedId) => !idsToRemove.includes(selectedId))
    });
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  resetView: () => set((state) => ({ viewMode: 'IZOMETRIA', viewResetNonce: state.viewResetNonce + 1 })),

setProjectMaterial: (family, index, color) => {
  const state = get();
  const project = cloneProject(state.project);
  project.materials = {
    ...project.materials,
    [family]: {
      ...(project.materials as any)[family],
      [index]: color
    }
  } as any;
  set({
    history: pushHistory(state),
    future: [],
    project
  });
},




  saveProjectToFile: () => {
    downloadFile('projekt-stolarz3d.json', JSON.stringify(get().project, null, 2), 'application/json');
  },

  loadProjectFromFile: async (file) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as ProjectData;
    ensureRotationQuaternions(parsed);
    renumberBoards(parsed);
    set({
  history: pushHistory(get()),
  future: [],
  project: parsed,
  measurePoints: parsed.measurePoints ?? [],
  selectedBoardId: null,
  selectedBoardIds: []
});
  },

exportCsv: async () => {
  const contents = '\ufeff' + boardsToCsv(get().project.boards, get().project.materials);
  if ('showSaveFilePicker' in window) {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: 'formatki.csv',
      types: [
        {
          description: 'CSV',
          accept: { 'text/csv': ['.csv'] }
        }
      ]
    });
    const writable = await handle.createWritable();
    await writable.write(contents);
    await writable.close();
    return;
  }
  downloadFile('formatki.csv', contents, 'text/csv;charset=utf-8');
},



undo: () => {
  const state = get();
  const history = [...state.history];
  const previous = history.pop();

  if (!previous) return;

  const restoredProject = cloneProject(previous);

  set({
    project: restoredProject,
    measurePoints: restoredProject.measurePoints ?? [],
    selectedMeasurePair: null,
    history,
    future: [
      cloneProject(state.project),
      ...state.future
    ],
    selectedBoardId: null
  });
},

redo: () => {
  const state = get();
  const [next, ...rest] = state.future;

  if (!next) return;

  const restoredProject = cloneProject(next);

  set({
    project: restoredProject,
    measurePoints: restoredProject.measurePoints ?? [],
    selectedMeasurePair: null,
    history: [
      ...state.history,
      cloneProject(state.project)
    ],
    future: rest,
    selectedBoardId: null
  });
}
}));
