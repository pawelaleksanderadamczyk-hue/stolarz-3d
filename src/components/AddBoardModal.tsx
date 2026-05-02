import { useState } from 'react';
import { SHAPE_LABELS } from '../core/constants';
import { useProjectStore } from '../store/useProjectStore';
import type { ShapeType } from '../types';

export function AddBoardModal() {
  const { addBoardModalOpen, closeAddBoardModal, addBoard } = useProjectStore();
  const [shape, setShape] = useState<ShapeType>('RECT');

  if (!addBoardModalOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>Wybierz typ formatki</h2>
        <label>
          Typ formatki
          <select value={shape} onChange={(e) => setShape(e.target.value as ShapeType)}>
            {Object.entries(SHAPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <div className="modal-actions">
          <button className="secondary" onClick={closeAddBoardModal}>Anuluj</button>
          <button onClick={() => addBoard(shape, 'YZ')}>Wybierz</button>
        </div>
      </div>
    </div>
  );
}
