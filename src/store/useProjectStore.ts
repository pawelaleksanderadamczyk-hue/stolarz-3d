import { create } from 'zustand';
import { boardsToCsv } from '../core/csv';
import { SHAPE_CODES } from '../core/constants';
import { createBoard, createDefaultDimensions, createEmptyProject, identityQuaternion, moveBoardByLeadingCorner, rotateQuaternionAroundWorldAxis } from '../core/project';
import type {
  BoardItem,
  MaterialColor,
  MaterialIndex,
  PartRole,
  PlaneType,
  ProjectData,
  ProjectMaterialPalette,
  ShapeDimensions,
  ShapeType,
  Vec3,
  ViewMode
} from '../types';

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
  moveSelectedBoardsTo: (target: Vec3) => void;
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
    project.boards[idx] = moveBoardByLeadingCorner(project.boards[idx], anchor);
    set({ history: pushHistory(state), future: [], project });
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
    set({ history: pushHistory(get()), future: [], project: parsed, selectedBoardId: null, selectedBoardIds: [] });
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
    set({ project: previous, history, future: [cloneProject(state.project), ...state.future], selectedBoardId: null });
  },

  redo: () => {
    const state = get();
    const [next, ...rest] = state.future;
    if (!next) return;
    set({ project: cloneProject(next), history: [...state.history, cloneProject(state.project)], future: rest, selectedBoardId: null });
  }
}));
