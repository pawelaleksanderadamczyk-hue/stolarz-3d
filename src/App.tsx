import { useEffect } from 'react';
import { AddBoardModal } from './components/AddBoardModal';
import { LeftPanel } from './components/LeftPanel';
import { SceneView } from './components/SceneView';
import { TopToolbar } from './components/TopToolbar';
import { useProjectStore } from './store/useProjectStore';

//test czy dziś działa

function KeyboardShortcuts() {
  const copySelectedBoards = useProjectStore((s) => s.copySelectedBoards);
  const removeBoard = useProjectStore((s) => s.removeBoard);
  const selectedBoardId = useProjectStore((s) => s.selectedBoardId);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();

      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copySelectedBoards();
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedBoardId) {
        event.preventDefault();
        removeBoard(selectedBoardId);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [copySelectedBoards, removeBoard, selectedBoardId]);

  return null;
}

export default function App() {
  return (
    <div className="app-shell">
      <KeyboardShortcuts />
      <TopToolbar />
      <div className="workspace">
        <LeftPanel />
        <div className="canvas-pane">
          <SceneView />
        </div>
      </div>
      <AddBoardModal />
    </div>
  );
}
