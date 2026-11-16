import type { Duel } from '../core/duel';

/** Ce que la sonde lit du monde physique (voir `MatterDuelWorld.weaponProbe`). */
export interface WeaponProbeSource {
  weaponProbe(fighter: number): { main: number; off?: number; torsoY: number } | undefined;
}

/** Mesures d'un combattant armé, cumulées depuis le début du duel. */
export interface WeaponProbeStats {
  /** Écart main avant - prise principale (px) : maximum et moyenne. Doit rester proche de 0. */
  gripMax: number;
  gripAvg: number;
  /** Écart main arrière - seconde prise (px), pour une arme à deux mains. */
  offHandMax: number | null;
  offHandAvg: number | null;
  /** Point le plus haut atteint par le torse (y le plus petit ; le sol est en bas de l'écran). */
  torsoMinY: number;
  /** Ticks où le torse était au-dessus de `flightY` sans avoir reçu de coup dans les `flightGraceTicks` précédents. */
  flightTicksWithoutHit: number;
  /** Coups portés avec l'arme, et dégâts cumulés. */
  hits: number;
  damage: number;
  /** Faux si l'arme n'a pas de garde : le combattant ne doit jamais parer. */
  canParry: boolean;
  /** Parades réussies par ce combattant, et esquives. */
  parries: number;
  dodges: number;
  /** État courant du combattant (pour capturer une parade). */
  state: string;
}

/** Seuils de la sonde : au-dessus de `flightY` sans coup reçu récemment, c'est une envolée suspecte. */
export interface WeaponProbeConfig {
  flightY: number;
  flightGraceTicks: number;
}

declare global {
  interface Window {
    __untrucWeapons?: readonly (WeaponProbeStats | null)[];
  }
}

/**
 * Sonde de debug des armes : à chaque pas, mesure si l'arme reste dans la main, si un
 * combattant s'envole sans avoir été frappé, et compte les coups d'arme. Exposée sur
 * `window.__untrucWeapons` (une entrée par combattant, `null` aux poings) pour
 * `tools/weapon-check.mjs`. Rien dans le jeu ne la lit.
 *
 * @returns la fonction à appeler après chaque pas de simulation.
 */
export function installWeaponProbe(duel: Duel, world: WeaponProbeSource, config: WeaponProbeConfig): () => void {
  const stats = duel.fighters.map((fighter) =>
    world.weaponProbe(fighter.index) === undefined
      ? null
      : { gripMax: 0, gripAvg: 0, offHandMax: null, offHandAvg: null, torsoMinY: Number.POSITIVE_INFINITY, flightTicksWithoutHit: 0, hits: 0, damage: 0, parries: 0, dodges: 0, state: fighter.state, canParry: fighter.canParry },
  ) as (WeaponProbeStats | null)[];
  const lastHitTaken = duel.fighters.map(() => Number.NEGATIVE_INFINITY);
  const sums = duel.fighters.map(() => ({ grip: 0, off: 0, samples: 0 }));
  duel.events.on('hit', (hit) => {
    lastHitTaken[hit.victim] = hit.tick;
    const attacker = stats[hit.attacker];
    if (attacker !== null && hit.part === 'weapon') {
      attacker.hits += 1;
      attacker.damage += hit.damage;
    }
  });
  duel.events.on('parry', (parry) => {
    const defender = stats[parry.defender];
    if (defender !== null) defender.parries += 1;
  });
  duel.events.on('dodge', (dodge) => {
    const defender = stats[dodge.defender];
    if (defender !== null) defender.dodges += 1;
  });
  window.__untrucWeapons = stats;
  return () => {
    for (const fighter of duel.fighters) {
      const entry = stats[fighter.index];
      const probe = world.weaponProbe(fighter.index);
      if (entry === null || probe === undefined) continue;
      const sum = sums[fighter.index];
      sum.samples += 1;
      sum.grip += probe.main;
      entry.gripMax = Math.max(entry.gripMax, probe.main);
      entry.gripAvg = sum.grip / sum.samples;
      if (probe.off !== undefined) {
        sum.off += probe.off;
        entry.offHandMax = Math.max(entry.offHandMax ?? 0, probe.off);
        entry.offHandAvg = sum.off / sum.samples;
      }
      entry.state = fighter.state;
      entry.torsoMinY = Math.min(entry.torsoMinY, probe.torsoY);
      if (probe.torsoY < config.flightY && duel.tick - lastHitTaken[fighter.index] > config.flightGraceTicks) entry.flightTicksWithoutHit += 1;
    }
  };
}
