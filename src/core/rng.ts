/**
 * Source d'aléatoire seedée. Toute l'aléatoire du jeu passe par une instance
 * de ce type, injectée : même seed = même suite de tirages.
 */
export interface Rng {
  /** Flottant dans [0, 1). */
  next(): number;
  /** Entier dans [min, max], bornes incluses. */
  int(min: number, max: number): number;
  /** Flottant dans [min, max). */
  range(min: number, max: number): number;
}

/** Crée un RNG mulberry32 à partir d'un entier (seed). */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    range: (min, max) => min + next() * (max - min),
  };
}
