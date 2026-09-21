import { useEffect, useRef, useState } from 'react';
import { MATERIAL_OPTIONS } from '../core/constants';

function getContrastColor(hex: string) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 145 ? '#000000' : '#ffffff';
}



function isLightTexture(name: string) {
  return [
    'Kaszmir',
    
	'Kremowy'
  ].includes(name);
}







export function ColorSelect({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const materialLibrary = MATERIAL_OPTIONS;

  const current =
    materialLibrary.find((m) => m.id === value || m.name === value) ??
    materialLibrary.find((m) => m.id === 'bialy') ??
    materialLibrary[0];

  const currentHex =
    current?.type === 'color'
      ? current.color ?? '#cccccc'
      : '#dddddd';


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
        onClick={() => {
  setOpen((prev) => !prev);
}}
        style={
          current?.type === 'texture'
            ? {
                backgroundImage: `url(${current.texture})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
color: isLightTexture(current.name)
  ? '#000000'
  : '#ffffff'
              }
            : {
                backgroundColor: currentHex,
                color: getContrastColor(currentHex)
              }
        }
      >
        {current?.name ?? 'Materiał'}
      </button>

      {open && (
        <div className="color-select-list">
          {materialLibrary.map((option) => {
            const hex =
              option.type === 'color'
                ? option.color ?? '#cccccc'
                : '#dddddd';

            return (
              <button
                key={option.id}
                type="button"
                className="color-select-option"
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                style={
                  option.type === 'texture'
                    ? {
                        backgroundImage: `url(${option.texture})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
color: isLightTexture(option.name)
  ? '#000000'
  : '#ffffff'
                      }
                    : {
                        backgroundColor: hex,
                        color: getContrastColor(hex)
                      }
                }
              >
                {option.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}