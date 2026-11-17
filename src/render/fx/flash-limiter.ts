/**
 * Limite des flashs : au plus `maxFlashes` sur toute fenêtre glissante de `windowMs` de temps réel
 * (accessibilité, `design/accessibility-requirements.md` : 3 flashs par seconde au plus). Un flash
 * refusé n'est pas reporté : l'effet se joue sans flash. Les instants sont gardés dans un anneau
 * de taille fixe : rien n'est alloué pendant le jeu.
 *
 * @example
 * limiter.advance(realMs);          // une fois par image
 * if (limiter.tryFlash()) flash();  // à chaque flash voulu
 */
export class FlashLimiter {
  private readonly times: number[];
  private next = 0;
  private nowMs = 0;

  constructor(
    maxFlashes: number,
    private readonly windowMs: number,
  ) {
    if (!Number.isInteger(maxFlashes) || maxFlashes < 1) throw new Error(`flashLimit.maxFlashes doit être un entier d'au moins 1 (reçu ${maxFlashes})`);
    this.times = new Array<number>(maxFlashes).fill(Number.NEGATIVE_INFINITY);
  }

  /** Fait avancer l'horloge de `realMs` ms de temps réel (jamais ralenti : la règle vaut pour l'œil). */
  advance(realMs: number): void {
    this.nowMs += realMs;
  }

  /** Vrai si un flash peut partir maintenant (et le compte) ; faux s'il dépasserait la limite. */
  tryFlash(): boolean {
    if (this.nowMs - this.times[this.next] < this.windowMs) return false;
    this.times[this.next] = this.nowMs;
    this.next = (this.next + 1) % this.times.length;
    return true;
  }
}
