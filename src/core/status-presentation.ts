/**
 * Ce que le spectateur voit des statuts de combat (story 013, critères 5 et 6). Le type vit dans
 * `core` comme `PresentationConfig`, que `content/presentation.ts` remplit et que `render/` reçoit
 * par injection. Couleurs 0xRRGGBB (dessin) ou `#rrggbb` (texte), tailles en px, durées en ms.
 */

/** Dessin d'un statut dans sa pastille ; un nouveau statut ajoute ici sa forme, dessinée par `drawGlyph` (`render/status-badge.ts`). */
export type StatusGlyph = 'drop';

/**
 * Pastille d'un statut : carré arrondi de la couleur du statut, son dessin au milieu, son nombre de
 * charges en chiffre dans le coin bas droit. Composant réutilisable (`StatusBadge`) : affiché au-dessus
 * de la tête pour l'instant, sous la barre de vie du HUD à la story 014.
 */
export interface StatusBadgeLook {
  /** Côté du carré. */
  size: number;
  radius: number;
  borderWidth: number;
  borderColor: number;
  /** Couleur du dessin (la goutte), sur la couleur du statut. */
  glyphColor: number;
  /** Rayon du rond de la goutte, en part de `size` (sa pointe monte à 2,3 rayons au-dessus). */
  glyphShare: number;
  /** Décalage vertical du dessin vers le bas, en part de `size` (la goutte est plus haute que large). */
  glyphDropShare: number;
  countFont: string;
  countColor: string;
  countStrokeColor: string;
  countStrokeWidth: number;
  /** Retrait du chiffre depuis le coin bas droit, en px. */
  countInset: number;
  /** Écart entre deux pastilles d'un même combattant, et entre la barre de vie et la rangée. */
  gap: number;
  /** Pastilles au plus par combattant ; au-delà, les statuts suivants ne s'affichent pas. */
  maxPerFighter: number;
}

/** Chiffre de PV perdus à cause d'un statut : il monte et s'efface à côté du torse. */
export interface StatusDamageLook {
  /** `{damage}` est remplacé par les PV perdus. */
  text: string;
  font: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  /** Écart horizontal depuis le centre du torse (du côté droit), en px. */
  offsetX: number;
  /** Hauteur de naissance au-dessus du centre du torse. */
  lift: number;
  riseDistance: number;
  durationMs: number;
  /** Chiffres affichables en même temps ; au-delà, le plus ancien emplacement est réutilisé. */
  maxShown: number;
}

/** Gouttes et petits flashs : deux pools de taille fixe partagés par tous les statuts. */
export interface BloodLook {
  maxDrops: number;
  /** Rayon du rond d'une goutte (sa pointe monte à 2,3 rayons). */
  dropRadius: number;
  outlineWidth: number;
  outlineColor: number;
  /** px/s au carré. */
  gravity: number;
  /** Une goutte disparaît au sol ou au bout de cette durée. */
  lifeMs: number;
  maxPulses: number;
  /** Rayon du disque du petit flash à sa naissance ; il grandit de `pulseGrowth` fois ce rayon jusqu'à sa fin. */
  pulseRadius: number;
  pulseGrowth: number;
  pulseDurationMs: number;
  pulseAlpha: number;
}

/** Les gouttes qui tombent du corps tant que le statut est actif ; leur cadence monte avec les charges. */
export interface StatusDripLook {
  /** Intervalle entre deux gouttes avec une charge ; divisé par le nombre de charges. */
  intervalMs: number;
  /** Intervalle le plus court, quel que soit le nombre de charges. */
  minIntervalMs: number;
  /** Demi-largeur et demi-hauteur de la zone du torse d'où partent les gouttes. */
  spreadX: number;
  spreadY: number;
  /** Vitesse initiale vers le bas, tirée dans [0, `fallSpeedMax`] px/s. */
  fallSpeedMax: number;
}

/** Ce que déclenche chaque perte de PV due au statut (`statusTick`), plus discret qu'un coup. */
export interface StatusTickLook {
  /** Gouttes projetées depuis le torse. */
  splash: number;
  splashSpeedMin: number;
  splashSpeedMax: number;
  /** Demi-ouverture du cône de projection autour de la verticale, en degrés. */
  splashSpreadDeg: number;
  /** Petit flash (disque de `flashColor` sur le torse), limité par `StatusesPresentation.flashLimit`. */
  flash: boolean;
}

/** Apparence d'un statut, par identifiant (`StatusSpec.id`). */
export interface StatusLook {
  glyph: StatusGlyph;
  /** Fond de la pastille. */
  color: number;
  dropColor: number;
  flashColor: number;
  /** Absent : le statut ne fait pas tomber de gouttes. */
  drips?: StatusDripLook;
  onTick: StatusTickLook;
}

/** Tout ce que le rendu sait des statuts ; les identifiants viennent de `content/statuses/`. */
export interface StatusesPresentation {
  badge: StatusBadgeLook;
  damage: StatusDamageLook;
  blood: BloodLook;
  /** Petits flashs des statuts au plus, sur une fenêtre glissante de temps réel (accessibilité : 3 par seconde au plus). */
  flashLimit: { maxFlashes: number; windowMs: number };
  byId: Readonly<Record<string, StatusLook>>;
}
