import type { ContactPartName } from './duel-world';

/** Événements émis par le duel. Rendu, UI et effets s'y abonnent ; la logique ne les appelle jamais. */
export interface DuelEvents {
  attackStart: { tick: number; fighter: number };
  /** `parried` : le coup a été paré (dégâts réduits, pas d'étourdissement). */
  hit: { tick: number; attacker: number; victim: number; part: ContactPartName; damage: number; hpLeft: number; parried: boolean };
  /** Le défenseur esquive l'attaque en cours de `attacker` : elle ne lui fera aucun dégât. */
  dodge: { tick: number; defender: number; attacker: number; staminaLeft: number };
  /** Le défenseur se met en garde contre l'attaque en cours de `attacker`. */
  parry: { tick: number; defender: number; attacker: number; staminaLeft: number };
  /** Contre-attaque lancée aussitôt après une esquive ou une parade (`trigger`). Suivi d'un `attackStart`. */
  counter: { tick: number; fighter: number; trigger: 'dodge' | 'parry' };
  /** Coup enchaîné sans délai ; `count` = rang du coup dans la série (2 pour le premier enchaînement). Suivi d'un `attackStart`. */
  combo: { tick: number; fighter: number; count: number };
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
    dodge: [],
    parry: [],
    counter: [],
    combo: [],
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
