/** Apparence de l'arène et textes de l'interface (0xRRGGBB pour les couleurs). */
export const PRESENTATION = {
  skyColor: 0x1d2433,
  groundColor: 0x3b3f4a,
  groundEdgeColor: 0x7d8494,
  groundEdgeThickness: 4,
  /** Rayon de l'oeil, en part du rayon de la tête. */
  eyeRadiusRatio: 0.18,
  /** Décalage de l'oeil vers l'avant, en part du rayon de la tête. */
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
    /** `{name}` est remplacé par le nom du vainqueur. */
    winnerText: '{name} remporte le duel !',
  },
} as const;
