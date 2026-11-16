import type { AttackSpec, MuscleGain } from './fighter-spec';
import type { PosePatch } from './pose';

/**
 * Un morceau de l'arme : un rectangle dans le repère du manche. `x` est
 * l'écart à l'axe du manche (0 = sur l'axe), `y` la distance depuis le bout du
 * manche (la crosse) vers la pointe ; le morceau occupe `y` à `y + length`.
 * La densité est propre au morceau : une tête de marteau est dense, un manche non.
 */
export interface WeaponPiece {
  x: number;
  y: number;
  width: number;
  length: number;
  density: number;
  /** Rayon d'arrondi du dessin (la forme physique reste un rectangle). */
  radius: number;
  /** Couleur de l'aplat, 0xRRGGBB (le contour est l'encre du combattant). */
  color: number;
}

/** La prise principale : où la main avant tient le manche, et la raideur de l'articulation (0..1). */
export interface WeaponGrip {
  /** Distance depuis la crosse, le long du manche. */
  at: number;
  stiffness: number;
}

/**
 * La seconde prise d'une arme à deux mains : où la main arrière vient se poser. Ce n'est
 * pas une articulation : la main arrière suit le manche (ses muscles visent ce point),
 * sans tirer sur l'arme. Un lien physique arrachait l'arme de la main avant (story 002).
 */
export interface WeaponOffGrip {
  /** Distance depuis la crosse, le long du manche ; plus loin que la prise principale. */
  at: number;
}

/**
 * Garde de parade d'une arme (story 002) : la parade reste décidée par la logique (chance
 * tirée de l'agilité, dégâts réduits) ; la garde n'est que le geste qui la montre.
 */
export interface WeaponGuardSpec {
  /** Retouche de la posture au repos du combattant armé pendant la parade. */
  pose: PosePatch;
  /** Angle de l'arme par rapport à l'avant-bras pendant la parade (`+` = vers l'avant). */
  angle: number;
}

/** Élan donné à l'arme au début de la frappe, du point de vue du combattant. */
export interface WeaponKickSpec {
  /** Vitesse vers l'avant (px par pas). */
  forward: number;
  /** Vitesse vers le bas (px par pas). */
  down: number;
  /** Moulinet : rotation vers l'avant (rad par pas) ; absent = aucun. */
  spin?: number;
}

/**
 * Attaque propre à une arme : mêmes champs que celle des poings (durées,
 * portée, dégât de base, parties qui frappent), avec des poses données en
 * retouches de la posture du combattant, l'angle de l'arme dans la main à
 * l'armement et à la frappe, et l'élan donné à l'arme.
 */
export interface WeaponAttackSpec extends Omit<AttackSpec, 'windupPose' | 'strikePose'> {
  windupPose: PosePatch;
  strikePose: PosePatch;
  /** Angle de l'arme par rapport à l'avant-bras à l'armement (rad, `+` = vers l'avant comme les poses). */
  windupAngle: number;
  strikeAngle: number;
  kick: WeaponKickSpec;
}

/**
 * Définition d'une arme : de la donnée, lue par un moteur générique. Le poids
 * n'est pas une valeur à part : il vient des morceaux (surface × densité, voir
 * `weaponMass`), donc la forme et le poids se lisent au même endroit.
 */
export interface WeaponSpec {
  id: string;
  name: string;
  /** Une main (prise principale) ou deux (prise secondaire, plus loin sur le manche et plus souple). */
  hands: 1 | 2;
  pieces: readonly WeaponPiece[];
  mainGrip: WeaponGrip;
  /** Obligatoire à deux mains, interdite à une main. */
  offGrip?: WeaponOffGrip;
  /** Matière du corps physique. */
  friction: number;
  frictionAir: number;
  restitution: number;
  /**
   * Plafond de vitesse du corps de l'arme (px par pas), appliqué à chaque pas après l'élan ;
   * absent = aucun. Empêche l'arme de traverser la victime en un pas (voir `driveWeapon`).
   */
  maxSpeed?: number;
  /** Muscle du poignet : tient l'angle voulu de l'arme dans la main. */
  wrist: MuscleGain;
  /** Retouche de la posture quand le combattant tient l'arme au repos. */
  stancePose: PosePatch;
  /** Angle de l'arme par rapport à l'avant-bras au repos. */
  stanceAngle: number;
  /**
   * Garde de parade : posture et angle de l'arme pendant une parade. Absente = cette arme
   * ne permet pas de parer (par exemple trop lourde) : son porteur peut seulement esquiver.
   */
  guard?: WeaponGuardSpec;
  attack: WeaponAttackSpec;
}

/** Masse d'un morceau : surface × densité (comme Matter, rectangle sans chanfrein). */
function pieceMass(piece: WeaponPiece): number {
  return piece.width * piece.length * piece.density;
}

/** Poids de l'arme : somme des masses de ses morceaux (unités de Matter). */
export function weaponMass(spec: WeaponSpec): number {
  return spec.pieces.reduce((total, piece) => total + pieceMass(piece), 0);
}

/** Centre de masse dans le repère du manche (`x` à l'axe, `y` depuis la crosse). */
export function weaponCenter(spec: WeaponSpec): { x: number; y: number } {
  const mass = weaponMass(spec);
  let x = 0;
  let y = 0;
  for (const piece of spec.pieces) {
    x += (piece.x * pieceMass(piece)) / mass;
    y += ((piece.y + piece.length / 2) * pieceMass(piece)) / mass;
  }
  return { x, y };
}

/** Longueur du manche : jusqu'à l'extrémité la plus éloignée de la crosse. */
export function weaponLength(spec: WeaponSpec): number {
  return Math.max(...spec.pieces.map((piece) => piece.y + piece.length));
}

function positive(value: number, what: string, id: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Arme ${id} : ${what} doit être un nombre positif (reçu ${value})`);
}

function assertOnShaft(at: number, name: string, length: number, id: string): void {
  if (!Number.isFinite(at) || at < 0 || at > length) throw new Error(`Arme ${id} : ${name}.at hors du manche (0..${length})`);
}

/** Vérifie une arme ; lève une erreur qui nomme l'arme et la valeur fautive. Appelée pour chaque entrée du registre. */
export function assertWeaponSpec(spec: WeaponSpec): void {
  const { id, attack } = spec;
  if (id.trim() === '') throw new Error('Arme sans identifiant');
  if (spec.pieces.length === 0) throw new Error(`Arme ${id} : aucune pièce`);
  for (const piece of spec.pieces) {
    positive(piece.width, 'la largeur d\'une pièce', id);
    positive(piece.length, 'la longueur d\'une pièce', id);
    positive(piece.density, 'la densité d\'une pièce', id);
  }
  positive(weaponMass(spec), 'le poids', id);
  const length = weaponLength(spec);
  assertOnShaft(spec.mainGrip.at, 'mainGrip', length, id);
  if (!(spec.mainGrip.stiffness > 0 && spec.mainGrip.stiffness <= 1)) throw new Error(`Arme ${id} : mainGrip.stiffness doit être dans ]0, 1]`);
  if (spec.hands === 2) {
    if (spec.offGrip === undefined) throw new Error(`Arme ${id} : une arme à deux mains déclare sa seconde prise (offGrip)`);
    assertOnShaft(spec.offGrip.at, 'offGrip', length, id);
    if (spec.offGrip.at <= spec.mainGrip.at) throw new Error(`Arme ${id} : la seconde prise doit être plus loin sur le manche que la principale`);
  } else if (spec.hands === 1) {
    if (spec.offGrip !== undefined) throw new Error(`Arme ${id} : une arme à une main n'a pas de seconde prise`);
  } else {
    throw new Error(`Arme ${id} : le nombre de mains vaut 1 ou 2`);
  }
  for (const [name, value] of [['windupMs', attack.windupMs], ['strikeMs', attack.strikeMs], ['recoveryMs', attack.recoveryMs], ['reach', attack.reach], ['damage', attack.damage]] as const) {
    positive(value, `attack.${name}`, id);
  }
  if (spec.maxSpeed !== undefined) positive(spec.maxSpeed, 'maxSpeed', id);
  for (const [name, value] of [['friction', spec.friction], ['frictionAir', spec.frictionAir], ['restitution', spec.restitution]] as const) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`Arme ${id} : ${name} doit être un nombre positif ou nul (reçu ${value})`);
  }
  if (spec.guard !== undefined && !Number.isFinite(spec.guard.angle)) throw new Error(`Arme ${id} : guard.angle n'est pas un nombre`);
  positive(spec.wrist.kp, 'wrist.kp', id);
  positive(spec.wrist.kd, 'wrist.kd', id);
  const { forward, down, spin = 0 } = attack.kick;
  if (![forward, down, spin].every(Number.isFinite)) throw new Error(`Arme ${id} : attack.kick contient une valeur qui n'est pas un nombre`);
  if (!attack.strikingParts.includes('weapon')) throw new Error(`Arme ${id} : attack.strikingParts doit contenir 'weapon'`);
}
