import type { NoDamageReason } from './hit';
import type { SkillCategory } from './skill-spec';

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
  skills: SkillsPresentation;
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

/** Boule de feu : projectile lumineux avec traînée (démo `launch`, et projectiles de la compétence boule de feu via `SkillFx`). */
export interface FxFireball {
  maxFireballs: number;
  /** px/s, en temps d'effet (donc ralentie pendant un ralenti). */
  speed: number;
  radius: number;
  trailPoints: number;
  /** Un point de traînée tous les `trailSampleMs` de temps d'effet (> 0) : la traînée dure `trailPoints` x `trailSampleMs`, à toutes les fréquences d'image. */
  trailSampleMs: number;
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

/** Effet d'un événement de compétence (cue, coup, fin de projectile) : tout est facultatif, les effets sont ceux de la story 003. */
export interface CueEffect {
  /** Où : le sol sous le lanceur, sa main avant ou son torse (ignoré pour un coup ou un projectile : le point est donné). */
  anchor: 'feet' | 'hand' | 'torso';
  /** Nombre d'étincelles. */
  sparks?: number;
  /** Rayon de l'onde de choc, en px. */
  shockwave?: number;
  /** Flash blanc du lanceur. */
  flash?: boolean;
  /** Traînée du lanceur : `start` la lance, `stop` la laisse s'éteindre. */
  trail?: 'start' | 'stop';
  /** Ralenti (`fx.slowmo`). */
  slowmo?: boolean;
  /** Efface la cible marquée du lanceur (`SkillLook.marker`), par exemple à l'atterrissage du saut. */
  hideMarker?: boolean;
}

/** Ce que le spectateur voit d'une compétence : nom, couleur, cible marquée, effets par événement. */
export interface SkillLook {
  /** Nom affiché au lancement. */
  name: string;
  /** Couleur du bandeau, de la cible et de la traînée. */
  color: number;
  /** Marque la cible au sol et trace l'arc du saut dès le lancement. */
  marker: boolean;
  /** Effets par nom d'événement de phase (`SkillPhase.cue`). */
  cues: Readonly<Record<string, CueEffect>>;
  /** Effets quand la compétence touche (à l'impact). */
  onHit?: CueEffect;
  /** Effets quand son projectile s'arrête sans toucher. */
  onMiss?: CueEffect;
}

/** Bandeau du nom de compétence, au-dessus du lanceur. */
export interface SkillBannerLook {
  font: string;
  textColor: string;
  backColor: number;
  backAlpha: number;
  borderWidth: number;
  paddingX: number;
  paddingY: number;
  radius: number;
  /** Hauteur au-dessus de la tête, en px. */
  offsetY: number;
  /** Écart minimal entre deux bandeaux affichés en même temps, en px : ils s'écartent l'un de l'autre au lieu de se chevaucher. */
  gap: number;
  /** Temps d'effet affiché, puis fondu. */
  durationMs: number;
  fadeMs: number;
  riseDistance: number;
}

/** Texte de la raison d'un coup sans dégâts, qui monte et s'efface au point d'impact. */
export interface SkillReasonsLook {
  font: string;
  strokeColor: string;
  strokeWidth: number;
  durationMs: number;
  riseDistance: number;
  /** Hauteur de naissance au-dessus du point d'impact, en px, pour ne pas le cacher. */
  lift: number;
  /** Textes de raison affichables en même temps ; au-delà, le plus ancien emplacement est réutilisé. */
  maxShown: number;
  /** Texte et couleur de chaque raison. */
  byReason: Readonly<Record<NoDamageReason, { text: string; color: string }>>;
}

/** Cible du saut : ellipse au sol et arc pointillé du lanceur à elle. */
export interface SkillMarkerLook {
  alpha: number;
  ringRadius: number;
  ringSquash: number;
  ringWidth: number;
  arcHeight: number;
  dashLength: number;
  gapLength: number;
  lineWidth: number;
  arcSegments: number;
}

/** Traînée d'un combattant qui fonce ou saute : le chemin de son torse, qui s'affine. */
export interface SkillTrailLook {
  /** Points gardés : la traînée dure `points` x `sampleMs` de temps d'effet. */
  points: number;
  /** Pas d'échantillonnage, en ms de temps d'effet (indépendant des FPS, suit le ralenti). */
  sampleMs: number;
  width: number;
  alpha: number;
}

/** Tout ce que le rendu sait des compétences ; les identifiants viennent de `content/skills/`. */
export interface SkillsPresentation {
  banner: SkillBannerLook;
  reasons: SkillReasonsLook;
  marker: SkillMarkerLook;
  trail: SkillTrailLook;
  /** Libellé de chaque catégorie de compétence (`SkillSpec.category`). */
  categories: Readonly<Record<SkillCategory, string>>;
  byId: Readonly<Record<string, SkillLook>>;
}
