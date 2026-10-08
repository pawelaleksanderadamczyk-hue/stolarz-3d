import { useEffect, useState } from 'react';
import { AddBoardModal } from './components/AddBoardModal';
import { LeftPanel } from './components/LeftPanel';
import { SceneView } from './components/SceneView';
import { TopToolbar } from './components/TopToolbar';
import { useProjectStore } from './store/useProjectStore';

function KeyboardShortcuts() {
  const copySelectedBoards = useProjectStore((s) => s.copySelectedBoards);
  const removeBoard = useProjectStore((s) => s.removeBoard);
  const selectedBoardId = useProjectStore((s) => s.selectedBoardId);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();

      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.isContentEditable
      ) {
        return;
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'c'
      ) {
        event.preventDefault();
        copySelectedBoards();
      }

      if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        selectedBoardId
      ) {
        event.preventDefault();
        removeBoard(selectedBoardId);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [copySelectedBoards, removeBoard, selectedBoardId]);

  return null;
}

export default function App() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          backgroundImage: 'url("/start-screen.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Przyciemnienie zdjęcia */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.25)',
          }}
        />

        {/* NAPISY - LEWY GÓRNY RÓG */}
<div
  style={{
    position: 'absolute',
    top: '7%',
    left: '6%',
    width: '55%',
    zIndex: 10,
    textAlign: 'center',
  }}
>
          <div
            style={{
              fontSize: 'clamp(64px, 7vw, 130px)',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '4px',
              lineHeight: 0.95,
              textShadow: '4px 4px 12px rgba(0,0,0,0.9)',
            }}
          >
            STOLARZ-3D
          </div>

          <div
            style={{
              marginTop: '18px',
              fontSize: 'clamp(32px, 3.5vw, 64px)',
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '2px',
              textShadow: '3px 3px 9px rgba(0,0,0,0.9)',
            }}
          >
            Projektowanie mebli 3D
          </div>
        </div>

        {/* PRZYCISK - W MIEJSCU PRZYCISKU ZE ZDJĘCIA */}
        <button
          onClick={() => setStarted(true)}
          style={{
            position: 'absolute',

            /*
             * To jest miejsce starego przycisku ze zdjęcia.
             * Środek znajduje się mniej więcej w 36% szerokości
             * i 76% wysokości ekranu.
             */
            left: '33.5%',
            top: '50%',
            transform: 'translate(-50%, -50%)',

            zIndex: 20,

            width: '620px',
            height: '105px',

            border: 'none',
            borderRadius: '18px',

            background:
              'linear-gradient(180deg, #f5c56b 0%, #d99a32 100%)',

            color: '#111111',

            fontSize: '30px',
            fontWeight: 800,
            letterSpacing: '1px',

            cursor: 'pointer',

            boxShadow:
              '0 8px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35)',

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '22px',
          }}
        >
          <span
            style={{
              fontSize: '34px',
            }}
          >
            ▶
          </span>

          <span>URUCHOM PROGRAM</span>
        </button>
      </div>
    );
  }

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