/** Apparence du HUD du duel : tailles en pixels, couleurs, polices et textes. */
export interface HudPresentation {
  margin: number;
  barWidth: number;
  barHeight: number;
  /** Couleurs de remplissage au format 0xRRGGBB. */
  barBackColor: number;
  barBorderColor: number;
  barBorderThickness: number;
  nameFont: string;
  winnerFont: string;
  /** Couleur du texte au format CSS (`#rrggbb`). */
  textColor: string;
  winnerY: number;
  /** `{name}` est remplacé par le nom du vainqueur. */
  winnerText: string;
  /** Message affiché en cas d'égalité (double KO). */
  drawText: string;
}

/**
 * Apparence de l'arène et de l'interface (0xRRGGBB pour les couleurs). Le
 * type vit dans `core` pour que `content/` le remplisse et que `render/` et
 * `ui/` le reçoivent par injection, sans importer `content/`.
 */
export interface PresentationConfig {
  skyColor: number;
  groundColor: number;
  groundEdgeColor: number;
  groundEdgeThickness: number;
  hud: HudPresentation;
}
