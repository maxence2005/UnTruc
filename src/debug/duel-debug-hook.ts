import type { Duel } from '../core/duel';
import type { DuelWorld } from '../core/duel-world';
import { FIGHTER_TRANSITIONS, type FighterState } from '../core/fighter-state';
import type { Reaction } from '../core/reactions';
import { hashNumbers } from '../core/state-hash';

const REACTIONS: readonly Reaction[] = ['none', 'dodge', 'parry'];
/** Lignes gardées dans le journal des compétences. */
const LOG_LIMIT = 400;
const FIGHTER_STATES = Object.keys(FIGHTER_TRANSITIONS) as FighterState[];

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
  /** Regard courant de chaque combattant (1 = vers la droite, -1 = vers la gauche). */
  readonly facing: readonly [number, number];
  /** Empreinte de tout l'état (ticks, PV, états, regard, physique) : deux duels identiques donnent la même. */
  readonly stateHash: string;
  /** Compétences lancées, par identifiant, et coups sans dégâts, par raison (story 004). */
  readonly skills: { readonly starts: Readonly<Record<string, number>>; readonly noDamage: Readonly<Record<string, number>>; readonly log: readonly string[] };
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
  const starts: Record<string, number> = {};
  const noDamage: Record<string, number> = {};
  const log: string[] = [];
  const note = (line: string) => {
    if (log.length < LOG_LIMIT) log.push(line);
  };
  duel.events.on('skillStart', ({ tick, fighter, skill, target }) => {
    starts[skill] = (starts[skill] ?? 0) + 1;
    note(`${tick} f${fighter} start ${skill} cible x=${Math.round(target.x)} depuis x=${Math.round(world.fighterX(fighter))}`);
  });
  duel.events.on('skillCue', ({ tick, fighter, skill, cue, x, y }) => note(`${tick} f${fighter} ${skill}:${cue} x=${Math.round(x)} y=${Math.round(y)}`));
  duel.events.on('noDamage', ({ tick, attacker, reason, skill }) => {
    noDamage[reason] = (noDamage[reason] ?? 0) + 1;
    note(`${tick} f${attacker} ${skill ?? 'coup'} ${reason}`);
  });
  duel.events.on('hit', ({ tick, attacker, skill, damage, parried }) => note(`${tick} f${attacker} ${skill ?? 'coup'} touche ${damage}${parried ? ' (paré)' : ''}`));
  Object.defineProperty(window, '__untrucDuel', {
    // Redéfinissable : une scène relancée réinstalle le hook sur son nouveau duel.
    configurable: true,
    enumerable: true,
    get: (): DuelDebugInfo => {
      const [first, second] = duel.fighters;
      const stateCodes = duel.fighters.flatMap((fighter) => [
        FIGHTER_STATES.indexOf(fighter.state),
        fighter.machine.ticksInState,
        fighter.actionTicksLeft,
        fighter.hasHit ? 1 : 0,
        fighter.stunTicks,
        fighter.stamina,
        fighter.mana,
        fighter.comboHits,
        fighter.stunSeriesTicks,
        REACTIONS.indexOf(fighter.plannedReaction),
        fighter.facing,
        fighter.turnTicks,
      ]);
      return Object.freeze({
        seed,
        tick: duel.tick,
        over: duel.phase === 'over',
        winner: duel.winner,
        hp: Object.freeze([first.hp, second.hp] as const),
        facing: Object.freeze([first.facing, second.facing] as const),
        stateHash: hashNumbers([duel.tick, first.hp, second.hp, ...stateCodes, ...world.snapshot(), ...duel.skills.snapshot(), ...duel.statuses.snapshot()]),
        skills: { starts: { ...starts }, noDamage: { ...noDamage }, log: [...log] },
      });
    },
  });
}
