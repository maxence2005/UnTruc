import type { Duel } from '../core/duel';
import type { DuelWorld } from '../core/duel-world';
import { hashNumbers } from '../core/state-hash';

/** Instantané du duel exposé sur `window.__untrucDuel`. */
export interface DuelDebugInfo {
  readonly seed: number;
  /** Nombre de ticks de simulation écoulés. */
  readonly tick: number;
  /** Vrai quand le duel est terminé et figé : les valeurs ne bougent plus. */
  readonly over: boolean;
  /** Index (0 ou 1) du vainqueur, `null` tant qu'il n'y en a pas. */
  readonly winner: number | null;
  readonly hp: readonly [number, number];
  /** Empreinte de tout l'état (ticks, PV, états, physique) : deux duels identiques donnent la même. */
  readonly stateHash: string;
}

declare global {
  interface Window {
    __untrucDuel?: DuelDebugInfo;
  }
}

/**
 * Aide au débogage : expose `window.__untrucDuel`, en lecture seule (getter sans
 * setter, objet gelé à chaque lecture), pour qu'un test sans tête compare deux
 * duels de même seed. Rien dans le jeu ne le lit.
 */
export function installDuelDebugHook(seed: number, duel: Duel, world: DuelWorld): void {
  Object.defineProperty(window, '__untrucDuel', {
    configurable: false,
    enumerable: true,
    get: (): DuelDebugInfo => {
      const [first, second] = duel.fighters;
      const stateCodes = duel.fighters.map((fighter) => fighter.state.length + fighter.machine.ticksInState * 16);
      return Object.freeze({
        seed,
        tick: duel.tick,
        over: duel.phase === 'over',
        winner: duel.winner,
        hp: Object.freeze([first.hp, second.hp] as const),
        stateHash: hashNumbers([duel.tick, first.hp, second.hp, ...stateCodes, ...world.snapshot()]),
      });
    },
  });
}
