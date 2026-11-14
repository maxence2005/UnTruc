import type { FaceKit, FacePiece } from '../core/fighter-spec';

/**
 * Pièces du visage de la tête de la piste 5, en rayon de tête (voir `FacePiece`).
 * Le prototype les avait dessinées en pixels pour une tête de 27 px ; ici tout
 * est ramené au rayon, donc la tête garde son visage quelle que soit sa taille.
 * Traits et yeux sont un peu plus gros que dans le prototype : la tête du duel
 * est deux fois plus petite.
 */

const LINE_WIDTH = 0.16;
const BROW_Y = -0.45;
const EYE: FacePiece[] = [
  { shape: 'ellipse', x: 0.45, y: -0.08, width: 0.5, height: 0.6, color: 'white' },
  { shape: 'circle', x: 0.53, y: -0.04, r: 0.17, color: 'ink' },
];

const SPIKE_COUNT = 5;
const SPIKE_FIRST_ANGLE = Math.PI + 0.25;
const SPIKE_ANGLE_STEP = 0.5;
const SPIKE_BASE = 1;
const SPIKE_TIP = 1.8;
const SPIKE_HALF_BASE = 0.2;

const SPIKES: FacePiece[] = Array.from({ length: SPIKE_COUNT }, (_, index): FacePiece => {
  const angle = SPIKE_FIRST_ANGLE + index * SPIKE_ANGLE_STEP;
  return {
    shape: 'spike',
    x: Math.cos(angle) * SPIKE_BASE,
    y: Math.sin(angle) * SPIKE_BASE,
    tipX: Math.cos(angle) * SPIKE_TIP,
    tipY: Math.sin(angle) * SPIKE_TIP,
    halfBase: SPIKE_HALF_BASE,
    color: 'hair',
    outlined: true,
  };
});

/** Catalogue du visage partagé par tous les combattants. */
export const FACE_KIT: FaceKit = {
  base: [
    { shape: 'circle', x: 0, y: 0, r: 1, color: 'skin', outlined: true },
    { shape: 'circle', x: 0.95, y: 0.05, r: 0.24, color: 'skin', outlined: true },
    { shape: 'circle', x: 0.7, y: 0.05, r: 0.25, color: 'skin' },
    { shape: 'circle', x: -0.2, y: 0.1, r: 0.22, color: 'shade' },
    { shape: 'circle', x: 0.45, y: 0.35, r: 0.2, color: 'cheek', alpha: 0.35 },
  ],
  beard: [{ shape: 'cap', x: 0.1, y: 0.28, r: 0.85, from: 0.35, to: Math.PI * 0.8, color: 'hair' }],
  eyes: {
    round: [...EYE, { shape: 'line', x1: 0.23, y1: BROW_Y, x2: 0.67, y2: BROW_Y - 0.02, width: LINE_WIDTH, color: 'ink' }],
    angry: [...EYE, { shape: 'line', x1: 0.23, y1: -0.52, x2: 0.69, y2: -0.32, width: LINE_WIDTH, color: 'ink' }],
    thin: [
      { shape: 'line', x1: 0.27, y1: -0.08, x2: 0.63, y2: -0.08, width: LINE_WIDTH, color: 'ink' },
      { shape: 'line', x1: 0.23, y1: BROW_Y, x2: 0.67, y2: BROW_Y - 0.02, width: LINE_WIDTH, color: 'ink' },
    ],
  },
  mouths: {
    grr: [{ shape: 'line', x1: 0.33, y1: 0.48, x2: 0.73, y2: 0.48, width: LINE_WIDTH, color: 'ink' }],
    smile: [{ shape: 'arc', x: 0.5, y: 0.36, r: 0.22, from: 0.3, to: Math.PI - 0.6, width: LINE_WIDTH, color: 'ink' }],
    o: [{ shape: 'circle', x: 0.55, y: 0.48, r: 0.14, color: 'ink' }],
    teeth: [
      { shape: 'rect', x: 0.525, y: 0.49, width: 0.5, height: 0.28, radius: 0.1, color: 'ink' },
      { shape: 'rect', x: 0.525, y: 0.46, width: 0.38, height: 0.1, radius: 0, color: 'white' },
    ],
  },
  hair: {
    bald: {
      back: [],
      front: [{ shape: 'ellipse', x: 0.1, y: -0.6, width: 0.6, height: 0.25, color: 'white', alpha: 0.35 }],
    },
    spikes: { back: [], front: [...SPIKES, { shape: 'cap', x: 0, y: -0.56, r: 0.85, from: Math.PI, to: Math.PI * 2, color: 'hair' }] },
    bowl: {
      back: [],
      front: [
        { shape: 'cap', x: 0, y: -0.5, r: 0.9, from: Math.PI * 0.98, to: Math.PI * 2.02, color: 'hair' },
        { shape: 'rect', x: -0.745, y: -0.2, width: 0.55, height: 0.6, radius: 0.22, color: 'hair' },
      ],
    },
    mohawk: { back: [], front: [{ shape: 'rect', x: 0, y: -1, width: 0.7, height: 0.9, radius: 0.22, color: 'hair', outlined: true }] },
    long: {
      back: [{ shape: 'rect', x: -0.55, y: 0.35, width: 1.2, height: 1.9, radius: 0.35, color: 'hair', outlined: true }],
      front: [{ shape: 'cap', x: 0, y: 0, r: 1.02, from: Math.PI * 0.9, to: Math.PI * 1.9, color: 'hair' }],
    },
    bun: {
      back: [{ shape: 'circle', x: -0.85, y: -0.75, r: 0.45, color: 'hair', outlined: true }],
      front: [{ shape: 'cap', x: 0, y: 0, r: 1.02, from: Math.PI * 0.9, to: Math.PI * 1.9, color: 'hair' }],
    },
  },
};
