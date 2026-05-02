import { useEffect, useRef, useState } from 'react';
import { COLOR_TO_HEX, COLORS } from '../core/constants';
import type { MaterialColor } from '../types';

function getContrastColor(hex: string) {
  const clean = hex.replace('#', '');

  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 145 ? '#000000' : '#ffffff';
}

export function ColorSelect({
  value,
  onChange
}: {
  value: MaterialColor;
  onChange: (value: MaterialColor) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const currentHex = COLOR_TO_HEX[value] ?? '#cccccc';

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="color-select" ref={wrapperRef}>
      <button
        type="button"
        className="color-select-current"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          backgroundColor: currentHex,
          color: getContrastColor(currentHex)
        }}
      >
        {value}
      </button>

      {open && (
        <div className="color-select-list">
          {COLORS.map((colorName) => {
            const hex = COLOR_TO_HEX[colorName] ?? '#cccccc';

            return (
              <button
                key={colorName}
                type="button"
                className="color-select-option"
                onClick={() => {
                  onChange(colorName as any);
                  setOpen(false);
                }}
                style={{
                  backgroundColor: hex,
                  color: getContrastColor(hex)
                }}
              >
                {colorName}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}