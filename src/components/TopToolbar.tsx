import { useRef, useState } from 'react';
import { COLORS } from '../core/constants';
import { useProjectStore } from '../store/useProjectStore';
import type { MaterialIndex, ViewMode } from '../types';
import { saveProjectToFile } from '../utils/saveProject';
const VIEW_TABS: ViewMode[] = ['IZOMETRIA', 'GÓRA', 'PRZÓD', 'BOK'];
import { ColorSelect } from './ColorSelect';

const handleSave = () => {
  const project = useProjectStore.getState().project;
  saveProjectToFile(project);
};




export function TopToolbar() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [anchorOpen, setAnchorOpen] = useState(false);

const [cabinetsOpen, setCabinetsOpen] = useState(false);
const [selectedCabinet, setSelectedCabinet] = useState<string | null>(null);

  const {
    project,
    saveProjectToFile,
    exportCsv,
    openAddBoardModal,
    updateProjectAnchor,
    resetView,
    undo,
    redo,
    setProjectMaterial,
    setViewMode,
    viewMode
  } = useProjectStore();

const cabinetNames = Array.from(
  new Set(project.boards.map((b) => b.cabinetName).filter((n) => n && n.trim()))
);

  const loadProjectFromFile = useProjectStore((s) => s.loadProjectFromFile);

  return (
    <div className="top-toolbar-wrap">
      <div className="top-toolbar">
        <div className="toolbar-main-actions">
          <button onClick={handleSave}>Zapisz projekt</button>
          <button onClick={() => fileInputRef.current?.click()}>Otwórz projekt</button>
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept="application/json"
            onChange={async (e) => {
              const input = e.target as HTMLInputElement;
              const file = input.files?.[0];
              if (file) {
                await loadProjectFromFile(file);
                input.value = '';
              }
            }}
          />
          <button onClick={exportCsv}>Export CSV</button>
          <button onClick={() => setMaterialsOpen((prev) => !prev)}>Materiał</button>
          <button onClick={openAddBoardModal}>Dodaj formatkę</button>
          <button onClick={() => setAnchorOpen((prev) => !prev)}>Narożnik dodawanych</button>
<button onClick={() => setCabinetsOpen((prev) => !prev)}>Szafki</button>
          <button onClick={resetView}>Reset widoku</button>
          <button onClick={undo}>Cofnij</button>
          <button onClick={redo}>Ponów</button>
        </div>

        <div className="toolbar-view-tabs">
          {VIEW_TABS.map((tab) => (
            <button key={tab} className={viewMode === tab ? 'active' : ''} onClick={() => setViewMode(tab)}>{tab}</button>
          ))}
        </div>
      </div>


{cabinetsOpen && (
  <div className="toolbar-panel">
    <div className="materials-popover-header">
      <strong>Szafki</strong>
      <button className="secondary" onClick={() => setCabinetsOpen(false)}>
        Zamknij
      </button>
    </div>
    {cabinetNames.length === 0 && <p>Brak szafek</p>}
    {cabinetNames.map((name) => (
      <button
        key={name}
        className="cabinet-item"
        onClick={() => {
          setSelectedCabinet(name);
        }}
      >
        {name}
      </button>
    ))}
  </div>
)}




      {materialsOpen && (
        <div className="toolbar-panel toolbar-panel-wide">
          <div className="materials-popover-header">
            <strong>Ustawienia materiałów projektu</strong>
            <button className="secondary" onClick={() => setMaterialsOpen(false)}>Zamknij</button>
          </div>

          <div className="project-materials">
            {([
  { family: 'korpus', label: 'KORPUS' },
  { family: 'front', label: 'FRONT' },
  { family: 'blat', label: 'BLAT' },
  { family: 'hdf', label: 'HDF' },
  { family: 'inne', label: 'INNE' },
  { family: 'okleina', label: 'OKLEINA' }
] as const).map(({ family, label }) => (
              <div key={family} className="material-family">
                <strong>{label}</strong>
                {[1, 2, 3].map((index) => (
                  <label key={`${family}-${index}`}>
                    {label} {index}
                    <ColorSelect
  value={project.materials[family][index as MaterialIndex]}
  onChange={(color) => setProjectMaterial(family, index as MaterialIndex, color)}
/>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {anchorOpen && (
        <div className="toolbar-panel toolbar-panel-anchor">
          <div className="materials-popover-header">
            <strong>Położenie narożnika dla nowych formatek</strong>
            <button className="secondary" onClick={() => setAnchorOpen(false)}>Zamknij</button>
          </div>

          <div className="toolbar-group anchor-group anchor-editor">
            <label>X
              <input type="number" value={project.globalAnchor.x} onChange={(e) => updateProjectAnchor({ ...project.globalAnchor, x: Number(e.target.value) })} />
            </label>
            <label>Y
              <input type="number" value={project.globalAnchor.y} onChange={(e) => updateProjectAnchor({ ...project.globalAnchor, y: Number(e.target.value) })} />
            </label>
            <label>Z
              <input type="number" value={project.globalAnchor.z} onChange={(e) => updateProjectAnchor({ ...project.globalAnchor, z: Number(e.target.value) })} />
            </label>
          </div>
        </div>
      )}


{selectedCabinet && (
  <div className="modal-backdrop">
<div className="modal-card cabinet-modal">
      <h2>{selectedCabinet}</h2>
     <table className="cabinet-table">
  <thead>
    <tr>
      <th>Nr</th>
      <th>Długość</th>
      <th>Szerokość</th>
      <th>Grubość</th>
      <th>X</th>
      <th>Y</th>
      <th>Z</th>
    </tr>
  </thead>
  <tbody>
    {project.boards
      .filter((b) => b.cabinetName === selectedCabinet)
      .map((b) => {
        const d: any = b.dimensions;
        return (
          <tr key={b.id}>
            <td>{b.number}</td>
            <td>{d.length ?? d.length1}</td>
            <td>{d.width ?? d.width1}</td>
            <td>{d.thickness}</td>
            <td>{b.anchor.x}</td>
            <td>{b.anchor.y}</td>
            <td>{b.anchor.z}</td>
          </tr>
        );
      })}
  </tbody>
</table>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
  <button
    onClick={() => {
      // zapis szafki (na razie tylko oznaczamy jako ukrytą)
      const state = useProjectStore.getState();
      const updatedBoards = state.project.boards.map((b) =>
        b.cabinetName === selectedCabinet
          ? { ...b, hiddenInProject: true }
          : b
      );
      useProjectStore.setState({
        project: {
          ...state.project,
          boards: updatedBoards
        }
      });
    }}
  >
    Zapisz szafkę
  </button>
  <button className="secondary" onClick={() => setSelectedCabinet(null)}>
    Zamknij
  </button>
</div>
    </div>
  </div>
)}




    </div>
  );
}
