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
  fx: FxConfig;
}

/** Seuils des effets d'impact, en part des PV max de la victime perdue sur un seul coup (0.12 = 12 %). */
export interface FxThresholds {
  /** Un coup non paré d'au moins cette part déclenche le ralenti. */
  slowmoDamageShare: number;
  /** Un coup non paré d'au moins cette part déclenche l'onde de choc. */
  shockwaveDamageShare: number;
}

/** Réglages du ralenti : l'échelle ne touche que le temps réel consommé par la scène, jamais le pas de simulation. */
export interface FxSlowmo {
  /** Échelle de temps pendant le ralenti (0.18 = 18 % de la vitesse normale). */
  scale: number;
  /** Durée de maintien, en ms de temps réel. */
  durationMs: number;
  /** Durée du retour progressif à la vitesse normale, en ms de temps réel. */
  rampMs: number;
  /** Ralenti qui accompagne un KO. */
  koScale: number;
  koDurationMs: number;
  /** Voile sombre derrière les combattants et devant le décor, à son maximum pendant le ralenti. */
  veilColor: number;
  veilAlpha: number;
}

/** Étincelles : des traits qui jaillissent du point d'impact, plus un bref disque lumineux. */
export interface FxSparks {
  maxParticles: number;
  count: number;
  /** Nombre d'étincelles d'un gros coup (au moins `slowmoDamageShare`). */
  strongCount: number;
  /** Nombre d'étincelles d'un coup paré. */
  parriedCount: number;
  /** Part de la vitesse conservée par les étincelles d'un coup paré. */
  parriedSpeedScale: number;
  speedMin: number;
  speedMax: number;
  /** Demi-ouverture du cône de projection autour de la direction de sortie, en degrés. */
  spreadDeg: number;
  lifeMs: number;
  /** px/s au carré. */
  gravity: number;
  /** Longueur du trait, en secondes de trajet (longueur = vitesse x tailS). */
  tailS: number;
  lineWidth: number;
  colors: readonly number[];
  maxBursts: number;
  burstRadius: number;
  burstMs: number;
  burstColor: number;
  /** Taille du disque à sa naissance, en part de `burstRadius` ; il grandit d'autant (`burstGrowth`) jusqu'à sa fin. */
  burstStartScale: number;
  burstGrowth: number;
}

/** Onde de choc : un anneau qui grandit et s'efface, centré sur le contact. */
export interface FxShockwave {
  maxRings: number;
  lifeMs: number;
  radius: number;
  /** Rayon de l'onde d'un KO. */
  koRadius: number;
  lineWidth: number;
  /** Épaisseur du trait quand l'onde s'éteint (px) : le trait passe de `lineWidth + minLineWidth` à `minLineWidth`. */
  minLineWidth: number;
  color: number;
}

/** Flash blanc bref du combattant touché. */
export interface FxFlash {
  durationMs: number;
  peakAlpha: number;
  color: number;
}

/** Boule de feu : projectile lumineux avec traînée. Aucune compétence ne l'appelle encore. */
export interface FxFireball {
  maxFireballs: number;
  /** px/s, en temps d'effet (donc ralentie pendant un ralenti). */
  speed: number;
  radius: number;
  trailPoints: number;
  /** Part du rayon de la tête que garde le point le plus récent de la traînée. */
  trailTaper: number;
  outerColor: number;
  midColor: number;
  coreColor: number;
  /** Opacité de la tête de la boule (couche extérieure). */
  outerAlpha: number;
  /** Rayon de la couche du milieu et du cœur, en part du rayon. */
  midRadiusShare: number;
  coreRadiusShare: number;
  /** Opacité de la traînée : `trailAlphaMin` au point le plus ancien, + `trailAlphaGain` vers la tête. */
  trailAlphaMin: number;
  trailAlphaGain: number;
  /** Rayon de l'onde de choc à l'arrivée. */
  impactRadius: number;
  /** Délai du premier lancement automatique de `?fx=fireball`, en ms de temps réel. */
  demoDelayMs: number;
  /** Intervalle entre deux lancements automatiques de `?fx=fireball`, en ms de temps réel. */
  demoRepeatMs: number;
}

/** Tous les réglages des effets d'impact (0xRRGGBB pour les couleurs, durées en ms). */
export interface FxConfig {
  /** Seed de l'aléatoire visuel (jamais celui du duel). */
  seed: number;
  /** Part du chemin entre la partie qui frappe et le torse de la victime où naît l'impact (0 à 1). */
  impactPullToVictim: number;
  thresholds: FxThresholds;
  slowmo: FxSlowmo;
  sparks: FxSparks;
  shockwave: FxShockwave;
  flash: FxFlash;
  fireball: FxFireball;
}
