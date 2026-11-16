/**
 * Échelle de temps du ralenti. Elle multiplie le temps réel que la scène donne à son
 * accumulateur ; le pas de simulation et la logique n'en savent rien. Le maintien et
 * le retour se comptent en temps réel (jamais en temps ralenti).
 */
export class TimeScale {
  private scale = 1;
  private holdLeftMs = 0;
  private rampLeftMs = 0;
  private rampTotalMs = 0;

  /**
   * Lance un ralenti. Pendant un ralenti en cours, un plus fort (échelle plus basse) le remplace ;
   * un plus faible n'est pas pris en compte, sauf s'il dure plus longtemps (le maintien s'allonge).
   */
  trigger(scale: number, durationMs: number, rampMs: number): void {
    if (scale < this.value) {
      this.scale = scale;
      this.holdLeftMs = Math.max(this.holdLeftMs, durationMs);
      this.rampTotalMs = rampMs;
      this.rampLeftMs = rampMs;
    } else if (this.holdLeftMs > 0) {
      this.holdLeftMs = Math.max(this.holdLeftMs, durationMs);
    }
  }

  /** Fait avancer le ralenti de `realMs` ms de temps réel. */
  advance(realMs: number): void {
    let left = realMs;
    if (this.holdLeftMs > 0) {
      const used = Math.min(left, this.holdLeftMs);
      this.holdLeftMs -= used;
      left -= used;
    }
    if (this.holdLeftMs <= 0 && this.rampLeftMs > 0) this.rampLeftMs = Math.max(0, this.rampLeftMs - left);
  }

  /** Échelle courante : 1 hors ralenti, constante pendant le maintien, puis remontant linéairement vers 1. */
  get value(): number {
    if (this.holdLeftMs > 0) return this.scale;
    if (this.rampLeftMs <= 0 || this.rampTotalMs <= 0) return 1;
    const progress = 1 - this.rampLeftMs / this.rampTotalMs;
    return this.scale + (1 - this.scale) * progress;
  }
}
