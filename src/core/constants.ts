import type { MaterialColor, ProjectMaterialPalette, ShapeType } from '../types';

export const COLORS: string[] = [
  'biały',
  'biały połysk',
  'grafit',
  'czarny',
  'dąb sonoma',
  'dąb naturalny',
  'dąb złoty',
  'buk',
  'jesion',
  'orzech',
  'wenge',
  'szary jasny',
  'szary ciemny',
  'czerwony',
  'ciemnoczerwony',
  'różowy',
  'pomarańczowy',
  'brzoskwiniowy',
  'żółty',
  'żółty jasny',
  'zielony',
  'ciemnozielony',
  'limonkowy',
  'niebieski',
  'ciemnoniebieski',
  'błękitny',
  'fioletowy',
  'lawendowy',
  'brązowy',
  'beżowy'
];

export const COLOR_TO_HEX: Record<string, string> = {
  'biały': '#f5f5f5',
  'biały połysk': '#ffffff',
  'grafit': '#374151',
  'czarny': '#111111',
  'dąb sonoma': '#c8a165',
  'dąb naturalny': '#d2a679',
  'dąb złoty': '#cfa76e',
  'buk': '#deb887',
  'jesion': '#e6d3b3',
  'orzech': '#6b3e2e',
  'wenge': '#3b2f2f',
  'szary jasny': '#d1d5db',
  'szary ciemny': '#6b7280',
  'czerwony': '#ef4444',
  'ciemnoczerwony': '#991b1b',
  'różowy': '#ec4899',
  'pomarańczowy': '#f97316',
  'brzoskwiniowy': '#fca5a5',
  'żółty': '#facc15',
  'żółty jasny': '#fef08a',
  'zielony': '#22c55e',
  'ciemnozielony': '#166534',
  'limonkowy': '#84cc16',
  'niebieski': '#3b82f6',
  'ciemnoniebieski': '#1e3a8a',
  'błękitny': '#38bdf8',
  'fioletowy': '#a855f7',
  'lawendowy': '#c4b5fd',
  'brązowy': '#8b5a2b',
  'beżowy': '#e5c29f'
};

export const DEFAULT_PROJECT_MATERIALS: ProjectMaterialPalette = {
  korpus: { 1: 'biały', 2: 'niebieski', 3: 'żółty' },
  front: { 1: 'biały', 2: 'niebieski', 3: 'żółty' },
  blat: { 1: 'biały', 2: 'niebieski', 3: 'żółty' },
  hdf: { 1: 'biały', 2: 'niebieski', 3: 'żółty' },
  inne: { 1: 'biały', 2: 'niebieski', 3: 'żółty' },
  okleina: { 1: 'biały', 2: 'niebieski', 3: 'żółty' }
};


export const SHAPE_LABELS: Record<ShapeType, string> = {
  RECT: 'Prostokąt',
  RECT_CUT_CORNER: 'Prostokąt ze ściętym rogiem',
  RECT_CORNER_NOTCH: 'Prostokąt z wyciętym prostokątem w narożu',
  RECT_INNER_CUTOUT: 'Prostokąt z wyciętym prostokątem wewnątrz',
  RIGHT_TRAPEZOID: 'Trapez prostokątny',
  TRAPEZOID: 'Trapez klasyczny',
  TRAPEZOID_INNER_CUTOUT: 'Trapez z wyciętym prostokątem wewnątrz'
};

export const SHAPE_CODES: Record<ShapeType, string> = {
  RECT: 'PR',
  RECT_CUT_CORNER: 'PR/S',
  RECT_CORNER_NOTCH: 'PR/WPR',
  RECT_INNER_CUTOUT: 'PR/OPR',
  RIGHT_TRAPEZOID: 'TP',
  TRAPEZOID: 'TR',
  TRAPEZOID_INNER_CUTOUT: 'TR/OPR'
};


export const MATERIAL_OPTIONS = [
  {
    id: '5527-stone-oak',
    name: '5527 Stone Oak',
    type: 'texture',
    texture: '/textures/5527_Stone_Oak.jpg',
    hasGrain: true
  },

  {
    id: 'k003-gold-craft-oak',
    name: 'K003 Gold Craft Oak',
    type: 'texture',
    texture: '/textures/K003_Gold_Craft_Oak.jpg',
    hasGrain: true
  },

  {
    id: 'k365-coast-evoke-oak',
    name: 'K365 Coast Evoke Oak',
    type: 'texture',
    texture: '/textures/K365_Coast_Evoke_Oak.jpg',
    hasGrain: true
  },

  {
    id: '4298-light-atelier',
    name: '4298 Light Atelier',
    type: 'texture',
    texture: '/textures/4298_Light_Atelier.jpg',
    hasGrain: false
  },

  {
    id: 'bialy',
    name: 'Biały',
    type: 'color',
    color: '#ffffff',
    hasGrain: false
  },

{
  id: 'niebieski',
  name: 'Niebieski',
  type: 'color',
  color: '#87b5ff',
  hasGrain: false
},

{
  id: 'zolty',
  name: 'Żółty',
  type: 'color',
  color: '#ffe066',
  hasGrain: false
},

{
  id: 'czerwony',
  name: 'Czerwony',
  type: 'color',
  color: '#ff6b6b',
  hasGrain: false
},

{
  id: 'czarny',
  name: 'Czarny',
  type: 'color',
  color: '#111111',
  hasGrain: false
}


] as const;




