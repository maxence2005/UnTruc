/** Durée restante du flash de chaque combattant ; calcule l'opacité du voile blanc. */
export class FlashTracker {
  private readonly leftMs: number[];

  constructor(
    fighters: number,
    private readonly durationMs: number,
    private readonly peakAlpha: number,
  ) {
    this.leftMs = new Array<number>(fighters).fill(0);
  }

  /** Déclenche (ou relance) le flash du combattant touché. */
  start(fighter: number): void {
    this.leftMs[fighter] = this.durationMs;
  }

  /** Fait avancer les flashs de `dtMs` (temps d'effet). */
  advance(dtMs: number): void {
    for (let i = 0; i < this.leftMs.length; i++) this.leftMs[i] = Math.max(0, this.leftMs[i] - dtMs);
  }

  /** Opacité du flash : maximale au coup, nulle à la fin de la durée. */
  alpha(fighter: number): number {
    return this.durationMs > 0 ? this.peakAlpha * (this.leftMs[fighter] / this.durationMs) : 0;
  }
}
