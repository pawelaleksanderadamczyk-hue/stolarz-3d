import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getLeadingCorner } from '../core/project';
import { useProjectStore } from '../store/useProjectStore';
import type { BoardItem, MaterialIndex, PartRole, Vec3 } from '../types';

function roleMaterialOptions(_role: PartRole) {
  return [1, 2, 3] as MaterialIndex[];
}

function roundNearZero(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.abs(value) < 1e-5 ? 0 : Number(value.toFixed(3));
}

function degToRad(value: number) {
  return (value * Math.PI) / 180;
}

function rotateLikeThreeEulerXYZ(point: Vec3, rotation: { x: number; y: number; z: number }): Vec3 {
  // Three.js dla Euler(..., 'XYZ') daje efekt macierzy Rz * Ry * Rx,
  // więc dla punktu liczymy kolejno: Z, potem Y, potem X.
  const rx = degToRad(rotation.x);
  const ry = degToRad(rotation.y);
  const rz = degToRad(rotation.z);

  let { x, y, z } = point;

  // Z
  let nx = x * Math.cos(rz) - y * Math.sin(rz);
  let ny = x * Math.sin(rz) + y * Math.cos(rz);
  x = nx;
  y = ny;

  // Y
  nx = x * Math.cos(ry) + z * Math.sin(ry);
  let nz = -x * Math.sin(ry) + z * Math.cos(ry);
  x = nx;
  z = nz;

  // X
  ny = y * Math.cos(rx) - z * Math.sin(rx);
  nz = y * Math.sin(rx) + z * Math.cos(rx);
  y = ny;
  z = nz;

  return { x, y, z };
}

function getPanelOuterPolygon2D(board: BoardItem): Array<{ x: number; y: number }> {
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
  }
}

function getPanelLeadingCorner(board: BoardItem): Vec3 {
  const poly = getPanelOuterPolygon2D(board);
  const thickness = Number((board.dimensions as any).thickness ?? 0);
  const vertices: Vec3[] = [];

  for (const p of poly) {
    // Do pozycji narożnika bierzemy rzeczywiste wierzchołki bryły:
    // narożniki obrysu + dwa poziomy grubości.
    //
    // Stałe dodawanie na YZ:
    // długość -> Y
    // szerokość -> Z
    // grubość -> X
    const localPoints: Vec3[] = [
      { x: 0, y: p.x, z: p.y },
      { x: thickness, y: p.x, z: p.y }
    ];

    for (const onYZ of localPoints) {
      const rotated = rotateLikeThreeEulerXYZ(onYZ, board.rotation);

      vertices.push({
        x: roundNearZero(board.anchor.x + rotated.x),
        y: roundNearZero(board.anchor.y + rotated.y),
        z: roundNearZero(board.anchor.z + rotated.z)
      });
    }
  }

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
    x: roundNearZero(best.x),
    y: roundNearZero(best.y),
    z: roundNearZero(best.z)
  };
}


export function LeftPanel() {
  const project = useProjectStore((s) => s.project);
  const selectedId = useProjectStore((s) => s.selectedBoardId);
const selectedBoardIds = useProjectStore((s) => s.selectedBoardIds);

const activeSelectedId = selectedId ?? selectedBoardIds[0] ?? null;
const board = project.boards.find(
  (b) => b.id === activeSelectedId && !b.hiddenInProject
);
  const updateBoard = useProjectStore((s) => s.updateBoard);
const updateBoardAnchor = useProjectStore((s) => s.updateBoardAnchor);
  const updateBoardDimensions = useProjectStore((s) => s.updateBoardDimensions);
  const toggleEdging = useProjectStore((s) => s.toggleEdging);
  const rotateBoard90 = useProjectStore((s) => s.rotateBoard90);
  const openRotationEditor = useProjectStore((s) => s.openRotationEditor);
  const rotationEditor = useProjectStore((s) => s.rotationEditor);
  const closeRotationEditor = useProjectStore((s) => s.closeRotationEditor);
  const applyRotationEditor = useProjectStore((s) => s.applyRotationEditor);
  const copyBoard = useProjectStore((s) => s.copyBoard);
  const removeBoard = useProjectStore((s) => s.removeBoard);
  
  const [anchorInputs, setAnchorInputs] = useState({ x: '0', y: '0', z: '0' });
const [cabinetModalOpen, setCabinetModalOpen] = useState(false);
const [cabinetName, setCabinetName] = useState('');



useEffect(() => {
  if (!board) return;
  const corner = getLeadingCorner(board);
  setAnchorInputs({
    x: String(corner.x),
    y: String(corner.y),
    z: String(corner.z)
  });
}, [
  board?.id,
  board?.anchor.x,
  board?.anchor.y,
  board?.anchor.z,
  board?.rotation.x,
  board?.rotation.y,
  board?.rotation.z,
  board?.rotationQuaternion?.x,
  board?.rotationQuaternion?.y,
  board?.rotationQuaternion?.z,
  board?.rotationQuaternion?.w,
  JSON.stringify(board?.dimensions)
]);



  if (!board) return <aside className="left-panel empty">Wybierz formatkę albo dodaj nową.</aside>;

  const projectMaterialFamily =
  board.role === 'KORPUS'
    ? 'korpus'
    : board.role === 'FRONT'
    ? 'front'
    : board.role === 'BLAT'
    ? 'blat'
    : board.role === 'HDF'
    ? 'hdf'
    : 'inne';

  const renderDimensionFields = () => {
    const dims: any = board.dimensions;
    const field = (label: string, key: string) => (
      <label>
        {label}
        <input type="number" value={dims[key]} onChange={(e) => updateBoardDimensions(board.id, { ...dims, [key]: Number(e.target.value) })} />
      </label>
    );

    const row = (className: string, children: ReactNode) => <div className={className}>{children}</div>;

    if (board.shape === 'RECT') {
      return (
        <>
          {row('dimension-row dimension-row-3', <>
            {field('Wysokość', 'length')}
            {field('Szerokość', 'width')}
            {field('Grubość', 'thickness')}
          </>)}
        </>
      );
    }

    if (board.shape === 'RECT_CUT_CORNER' || board.shape === 'RECT_CORNER_NOTCH') {
      return (
        <>
          {row('dimension-row dimension-row-3', <>
            {field('Wysokość 1', 'length1')}
            {field('Szerokość 1', 'width1')}
            {field('Grubość', 'thickness')}
          </>)}
          {row('dimension-row dimension-row-2', <>
            {field('Wysokość 2', 'length2')}
            {field('Szerokość 2', 'width2')}
          </>)}
        </>
      );
    }

    return (
      <>
        {row('dimension-row dimension-row-3', <>
          {field('Wysokość', 'length')}
          {field('Szerokość', 'width')}
          {field('Grubość', 'thickness')}
        </>)}
        {row('dimension-row dimension-row-2', <>
          {field('Położenie wysokości', 'cutoutOffsetLength')}
          {field('Położenie szerokości', 'cutoutOffsetWidth')}
        </>)}
        {row('dimension-row dimension-row-2', <>
          {field('Wysokość otworu', 'cutoutLength')}
          {field('Szerokość otworu', 'cutoutWidth')}
        </>)}
      </>
    );
  };

  const rotationRow = (axis: 'x'|'y'|'z', colorClass: string, label: string) => (
  <>
    <button
      className={colorClass}
      onClick={() => {
        rotateBoard90(board.id, axis);
      }}
    >
      Obróć {label}
    </button>
    <button className={colorClass} onClick={() => openRotationEditor(axis, board.rotation[axis])}>
      Edytuj
    </button>
    <div className={`angle-badge ${colorClass}`}>{board.rotation[axis]}°</div>
  </>
);

  const edgingOptions = () => {
    const options = [
      { key: 'lengthLeft', label: 'Wysokość 1' },
      { key: 'lengthRight', label: 'Wysokość 2' },
      { key: 'widthBottom', label: 'Szerokość 1' },
      { key: 'widthTop', label: 'Szerokość 2' }
    ];

    if (board.shape === 'RECT_CUT_CORNER') {
      options.push({ key: 'cut', label: 'Bok ścięcia' });
    }

    if (board.shape === 'RECT_CORNER_NOTCH') {
      options.push(
        { key: 'notchVertical', label: 'Wycięcie wysokość' },
        { key: 'notchHorizontal', label: 'Wycięcie szerokość' }
      );
    }

    if (board.shape === 'RECT_INNER_CUTOUT') {
      options.push(
        { key: 'otwórDół', label: 'Otwór wysokość 1' },
        { key: 'otwórGóra', label: 'Otwór wysokość 2' },
        { key: 'otwórLewo', label: 'Otwór szerokość 1' },
        { key: 'otwórPrawo', label: 'Otwór szerokość 2' }
      );
    }

    return options;
  };

  const parseAxisValue = (value: string, fallback: number) => {
    const trimmed = value.trim().replace(',', '.');
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : fallback;
  };



const commitAnchor = (axis: 'x' | 'y' | 'z') => {
  if (!board) return;
  const current = getLeadingCorner(board);
  const next = {
    ...current,
    [axis]: parseAxisValue(anchorInputs[axis], current[axis])
  };
  updateBoardAnchor(board.id, next);
};



  return (
    <aside className="left-panel">
      <div className="name-number-row">
        <div className="board-number compact">{board.number}</div>
        <label className="board-name-field">
          Wpisz nazwę formatki...
          <input value={board.name ?? ''} onChange={(e) => updateBoard(board.id, { name: e.target.value })} />
        </label>
      </div>

      <div className="role-switches">
        <label><input type="radio" checked={board.role === 'KORPUS'} onChange={() => updateBoard(board.id, { role: 'KORPUS', material: { ...board.material, role: 'KORPUS', materialIndex: 1 } })} /> Korpus</label>
        <label><input type="radio" checked={board.role === 'FRONT'} onChange={() => updateBoard(board.id, { role: 'FRONT', material: { ...board.material, role: 'FRONT', materialIndex: 1 } })} /> Front</label>
        <label><input type="radio" checked={board.role === 'BLAT'} onChange={() => updateBoard(board.id, { role: 'BLAT', material: { ...board.material, role: 'BLAT', materialIndex: 1 } })} /> Blat</label>

<label>
  <input
    type="radio"
    checked={board.role === 'HDF'}
    onChange={() =>
      updateBoard(board.id, {
        role: 'HDF',
        material: { ...board.material, role: 'HDF', materialIndex: 1 }
      })
    }
  />
  HDF
</label>

<label>
  <input
    type="radio"
    checked={board.role === 'INNE'}
    onChange={() =>
      updateBoard(board.id, {
        role: 'INNE',
        material: { ...board.material, role: 'INNE', materialIndex: 1 }
      })
    }
  />
  Inne
</label>

      </div>

      <div className="material-row">
        <label>
          Materiał formatki
          <select value={board.material.materialIndex} onChange={(e) => updateBoard(board.id, { material: { ...board.material, materialIndex: Number(e.target.value) as MaterialIndex } })}>
            {roleMaterialOptions(board.role).map((idx) => <option key={idx} value={idx}>{board.role} {idx} — {project.materials[projectMaterialFamily][idx]}</option>)}
          </select>
        </label>

        <label>
          Kolor okleiny
          <select value={board.material.edgingIndex} onChange={(e) => updateBoard(board.id, { material: { ...board.material, edgingIndex: Number(e.target.value) as MaterialIndex } })}>
            {[1,2,3].map((idx) => <option key={idx} value={idx}>OKLEINA {idx} — {project.materials.okleina[idx as MaterialIndex]}</option>)}
          </select>
        </label>
      </div>

      <h3>Wymiary</h3>
      <div className="field-grid">{renderDimensionFields()}</div>

      <h3>Pozycja narożnika</h3>
      <div className="anchor-xyz-row">
        <label className="axis-red"><span>X</span><input type="text" inputMode="decimal" value={anchorInputs.x} onChange={(e) => setAnchorInputs((prev) => ({ ...prev, x: e.target.value }))} onBlur={() => commitAnchor('x')} /></label>
        <label className="axis-green"><span>Y</span><input type="text" inputMode="decimal" value={anchorInputs.y} onChange={(e) => setAnchorInputs((prev) => ({ ...prev, y: e.target.value }))} onBlur={() => commitAnchor('y')} /></label>
        <label className="axis-blue"><span>Z</span><input type="text" inputMode="decimal" value={anchorInputs.z} onChange={(e) => setAnchorInputs((prev) => ({ ...prev, z: e.target.value }))} onBlur={() => commitAnchor('z')} /></label>
      </div>

      <h3>Okleina</h3>
      <div className="edging-list">
        {edgingOptions().map((option) => (
          <label key={option.key}>
            <input
              type="checkbox"
              checked={Boolean(board.edging[option.key])}
              onChange={() => toggleEdging(board.id, option.key)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>

      <div className="rotation-grid">
        {rotationRow('x', 'red', 'X')}
        {rotationRow('y', 'green', 'Y')}
        {rotationRow('z', 'blue', 'Z')}
      </div>

      {rotationEditor && (
        <div className="rotation-editor">
          <span>+ Kąt {rotationEditor.axis.toUpperCase()}</span>
          <input type="number" value={rotationEditor.value} onChange={(e) => useProjectStore.setState({ rotationEditor: { ...rotationEditor, value: Number(e.target.value) } })} />
          <button className="secondary" onClick={closeRotationEditor}>Anuluj</button>
          <button
  onClick={() => {
    applyRotationEditor(board.id);
  }}
>
  Obróć
</button>
        </div>
      )}

<button className="copy-btn" onClick={() => copyBoard(board.id)}>Kopiuj</button>
<button className="delete-btn" onClick={() => removeBoard(board.id)}>Usuń</button>

<button
  className="create-cabinet-btn"
  onClick={() => {
    setCabinetName(board.cabinetName ?? '');
    setCabinetModalOpen(true);
  }}
>
  Twórz szafkę
</button>
{cabinetModalOpen && (
  <div className="rotation-editor">
    <span>Nazwa szafki</span>

    <input
      type="text"
      value={cabinetName}
      onChange={(e) => setCabinetName(e.target.value)}
      placeholder="np. Szafka 1"
    />

    <button className="secondary" onClick={() => setCabinetModalOpen(false)}>
      Anuluj
    </button>

    <button
      onClick={() => {
        const name = cabinetName.trim();

        if (!name) {
          alert('Wpisz nazwę szafki');
          return;
        }

        updateBoard(board.id, { cabinetName: name });
        setCabinetModalOpen(false);
      }}
    >
      Zapisz
    </button>
  </div>
)}
    </aside>
  );
}
