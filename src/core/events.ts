import type { BodyPartName } from './duel-world';

/** Événements émis par le duel. Rendu, UI et effets s'y abonnent ; la logique ne les appelle jamais. */
export interface DuelEvents {
  turnStart: { tick: number; actor: number };
  hit: { tick: number; attacker: number; victim: number; part: BodyPartName; damage: number; hpLeft: number };
  ko: { tick: number; fighter: number };
  duelEnd: { tick: number; winner: number };
}

type Listener<K extends keyof DuelEvents> = (payload: DuelEvents[K]) => void;

/** Bus d'événements typé, une instance par duel (pas de singleton). */
export class EventBus {
  private readonly listeners: { [K in keyof DuelEvents]: Listener<K>[] } = {
    turnStart: [],
    hit: [],
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
