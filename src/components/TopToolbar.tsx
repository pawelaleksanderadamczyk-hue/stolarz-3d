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
    </div>
  );
}
