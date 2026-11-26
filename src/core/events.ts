import type { ContactPartName } from './duel-world';
import type { NoDamageReason } from './hit';

/** Événements émis par le duel. Rendu, UI et effets s'y abonnent ; la logique ne les appelle jamais. */
export interface DuelEvents {
  attackStart: { tick: number; fighter: number };
  /** `parried` : le coup a été paré (dégâts réduits, pas d'étourdissement). */
  /** `parried` : le coup a été paré (dégâts réduits, pas d'étourdissement). `skill` : compétence qui l'a porté ; `point` : où il tombe (projectile). */
  hit: {
    tick: number;
    attacker: number;
    victim: number;
    part: ContactPartName;
    damage: number;
    hpLeft: number;
    parried: boolean;
    skill?: string;
    point?: { x: number; y: number };
    /** Stade de déclenchement dont la forme a porté ce coup (ex. « transformation » : griffes). Les traces se montrent si `!parried` et `hpLeft > 0`. */
    form?: string;
  };
  /**
   * Un stade d'une compétence à déclenchement part (story 005) : `stage` est son identifiant ; `x`, `y` : le torse du
   * combattant ; `arena` : effet sur toute l'arène (onde et tremblement d'écran), absent si le stade n'en a pas.
   */
  skillTrigger: { tick: number; fighter: number; skill: string; stage: string; x: number; y: number; arena?: { intensity: number; durationMs: number } };
  /** Un coup ne fait pas (tous) ses dégâts, et pourquoi : `blocked` (paré), `dodged` (esquivé), `missed` (la fenêtre de coup s'est fermée sans contact). `x`, `y` : où l'afficher. */
  noDamage: { tick: number; attacker: number; victim: number; reason: NoDamageReason; skill: string | null; x: number; y: number };
  /** Une compétence part ; `target` : le point du sol visé, fixé à cet instant. */
  skillStart: { tick: number; fighter: number; skill: string; target: { x: number; y: number } };
  /** Une phase de la compétence commence et porte un événement de rendu (`SkillPhase.cue`) ; `x`, `y` : le torse du lanceur. */
  skillCue: { tick: number; fighter: number; skill: string; cue: string; x: number; y: number };
  /** La compétence est finie ; `interrupted` : le lanceur a été sonné avant la fin. */
  skillEnd: { tick: number; fighter: number; skill: string; interrupted: boolean };
  /** Un projectile s'arrête : il a touché (`hit`), été esquivé (`dodged`) ou rien touché (`missed`). */
  projectileEnd: { tick: number; fighter: number; skill: string; id: number; reason: 'hit' | 'dodged' | 'missed'; x: number; y: number };
  /** Le défenseur esquive l'attaque en cours de `attacker` : elle ne lui fera aucun dégât. */
  dodge: { tick: number; defender: number; attacker: number; staminaLeft: number };
  /** Le défenseur se met en garde contre l'attaque en cours de `attacker`. */
  parry: { tick: number; defender: number; attacker: number; staminaLeft: number };
  /** Contre-attaque lancée aussitôt après une esquive ou une parade (`trigger`). Suivi d'un `attackStart`. */
  counter: { tick: number; fighter: number; trigger: 'dodge' | 'parry' };
  /** Coup enchaîné sans délai ; `count` = rang du coup dans la série (2 pour le premier enchaînement). Suivi d'un `attackStart`. */
  combo: { tick: number; fighter: number; count: number };
  /**
   * Un coup applique un statut (story 013). `charges` : charges actives après l'application ; `chargesAdded` :
   * charges que le coup a ajoutées ; `replaced` : au plafond, la plus ancienne a été remplacée. `x`, `y` : le torse de la victime.
   */
  statusApplied: { tick: number; source: number; victim: number; status: string; charges: number; chargesAdded: number; replaced: boolean; x: number; y: number };
  /** Perte de PV due à un statut (pas un coup : ni recul ni étourdissement). `x`, `y` : le torse de la victime. */
  statusTick: { tick: number; victim: number; status: string; damage: number; hpLeft: number; charges: number; x: number; y: number };
  /** Une ou plusieurs charges ont expiré ; `chargesLeft` vaut 0 quand le statut disparaît. */
  statusExpired: { tick: number; victim: number; status: string; chargesLeft: number };
  ko: { tick: number; fighter: number };
  /** `winner` vaut `null` en cas d'égalité (les deux combattants KO sur le même tick). */
  duelEnd: { tick: number; winner: number | null };
}

type Listener<K extends keyof DuelEvents> = (payload: DuelEvents[K]) => void;

/** Bus d'événements typé, une instance par duel (pas de singleton). */
export class EventBus {
  private readonly listeners: { [K in keyof DuelEvents]: Listener<K>[] } = {
    attackStart: [],
    hit: [],
    noDamage: [],
    skillStart: [],
    skillCue: [],
    skillTrigger: [],
    skillEnd: [],
    projectileEnd: [],
    dodge: [],
    parry: [],
    counter: [],
    combo: [],
    statusApplied: [],
    statusTick: [],
    statusExpired: [],
    ko: [],
    duelEnd: [],
  };

  /** Abonne un écouteur à un type d'événement. */
  on<K extends keyof DuelEvents>(type: K, listener: Listener<K>): void {
    this.listeners[type].push(listener);
  }

  /** Notifie les écouteurs, dans l'ordre d'abonnement. */
  emit<K extends keyof DuelEvents>(type: K, payload: DuelEvents[K]): void {
    for (const listener of this.listeners[type]) listener(payload);
  }
}
