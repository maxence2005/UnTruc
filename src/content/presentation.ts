import type { PresentationConfig } from '../core/presentation-config';

/** Apparence de l'arène et textes de l'interface (0xRRGGBB pour les couleurs). */
export const PRESENTATION: PresentationConfig = {
  skyColor: 0x1d2433,
  groundColor: 0x3b3f4a,
  groundEdgeColor: 0x7d8494,
  groundEdgeThickness: 4,
  eyeRadiusRatio: 0.18,
  eyeOffsetRatio: 0.45,
  hud: {
    margin: 40,
    barWidth: 420,
    barHeight: 26,
    barBackColor: 0x111111,
    barBorderColor: 0xffffff,
    barBorderThickness: 2,
    nameFont: '24px sans-serif',
    winnerFont: 'bold 64px sans-serif',
    textColor: '#ffffff',
    winnerY: 260,
    winnerText: '{name} remporte le duel !',
    drawText: 'Égalité !',
  },
};
