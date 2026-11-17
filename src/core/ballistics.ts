/** Données d'un saut visé : déplacement voulu, durée de vol, gravité et frottement de l'air du corps. */
export interface AimInput {
  /** Déplacement horizontal voulu (px, signé), puis vertical (px, `+` = vers le bas). */
  dx: number;
  dy: number;
  /** Durée du vol, en ticks (1 au moins). */
  ticks: number;
  /** Accélération de la gravité, px par pas au carré. */
  gravity: number;
  /** Frottement de l'air par pas, dans [0, 1[, tel que Matter l'applique : `v = v * (1 - drag) + g`. */
  drag: number;
  maxSpeedX: number;
  maxSpeedY: number;
}

/** Vitesse initiale (px par pas) et si elle a dû être bornée (la cible est alors hors de portée). */
export interface AimResult {
  vx: number;
  vy: number;
  clamped: boolean;
}

/** Saut impossible à viser (vol nul, frottement qui arrête tout) : on reste sur place, et on le dit. */
const NO_LAUNCH: AimResult = { vx: 0, vy: 0, clamped: true };

/** Part du déplacement que couvre une vitesse initiale de 1 sur `ticks` pas avec ce frottement (somme de `k^n`). */
function travelPerUnitSpeed(ticks: number, drag: number): number {
  const keep = 1 - drag;
  return drag < 1e-9 ? ticks : (keep * (1 - keep ** ticks)) / drag;
}

/** Vrai si la formule fermée a un sens : au moins un pas de vol, frottement dans [0, 1[. */
function canAim(ticks: number, drag: number): boolean {
  return ticks >= 1 && drag >= 0 && drag < 1;
}

/**
 * Vitesse initiale qui retombe sur la cible après `ticks` pas : intègre `v' = v (1 - drag) + g`
 * en forme fermée. Sans cette formule, le saut ratait sa cible sans raison visible
 * (`prototypes/combat-animation-concept/REPORT.md`). Les vitesses sont bornées par les maxima ;
 * `clamped` dit alors que le saut retombera court. Une entrée hors domaine (`ticks < 1`,
 * `drag` hors de [0, 1[, `NaN`) donne une vitesse nulle et `clamped` vrai, jamais `NaN` ni l'infini.
 */
export function aimLaunch(input: AimInput): AimResult {
  const { dx, dy, ticks, gravity, drag, maxSpeedX, maxSpeedY } = input;
  if (!canAim(ticks, drag)) return { ...NO_LAUNCH };
  const travel = travelPerUnitSpeed(ticks, drag);
  const fall = drag < 1e-9 ? (gravity * ticks * (ticks + 1)) / 2 : (gravity / drag) * (ticks - travel);
  const rawX = dx / travel;
  const rawY = (dy - fall) / travel;
  const vx = Math.max(-maxSpeedX, Math.min(maxSpeedX, rawX));
  const vy = Math.max(-maxSpeedY, Math.min(maxSpeedY, rawY));
  return { vx, vy, clamped: vx !== rawX || vy !== rawY };
}
