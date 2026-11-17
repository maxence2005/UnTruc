/**
 * Marge d'arrondi de l'horloge d'échantillonnage, en ms : sans elle, des pas de `1000 / 60` ms
 * cumulés en flottants tombent parfois un rien sous `sampleMs` et sautent un échantillon à 60 i/s.
 */
const SAMPLE_EPSILON_MS = 1e-6;

/**
 * Horloge d'échantillonnage d'une traînée : elle compte le temps d'effet et dit combien
 * d'échantillons sont dus, un tous les `sampleMs`. Une traînée qui échantillonne à ce rythme
 * garde la même longueur en temps à toutes les fréquences d'image, et suit le ralenti.
 * Partagée par `TrailFx` et `FireballFx`.
 */
export class SampleClock {
  /** Temps d'effet accumulé depuis le dernier échantillon, en ms. */
  private clockMs = 0;

  /** `name` : la donnée d'où vient `sampleMs`, pour le message d'erreur. */
  constructor(
    private readonly sampleMs: number,
    name: string,
  ) {
    if (!(sampleMs > 0)) throw new Error(`${name} doit être > 0 (reçu ${sampleMs})`);
  }

  /** Avance de `dtMs` de temps d'effet ; rend le nombre d'échantillons dus sur cet intervalle. */
  advance(dtMs: number): number {
    this.clockMs += dtMs;
    let due = 0;
    while (this.clockMs >= this.sampleMs - SAMPLE_EPSILON_MS) {
      this.clockMs = Math.max(0, this.clockMs - this.sampleMs);
      due += 1;
    }
    return due;
  }
}
