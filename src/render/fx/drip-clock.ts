import type { StatusDripLook } from '../../core/status-presentation';

/**
 * Intervalle entre deux gouttes d'un statut à `charges` charges : `intervalMs / charges`, jamais
 * sous `minIntervalMs`. Sans charge, aucune goutte (`Infinity`). Fonction pure (story 013).
 *
 * @example dripIntervalMs(5, { intervalMs: 600, minIntervalMs: 120, ... }) // 120
 */
export function dripIntervalMs(charges: number, look: StatusDripLook): number {
  if (charges <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(look.minIntervalMs, look.intervalMs / charges);
}

/**
 * Horloge des gouttes d'un statut sur un combattant : dit combien de gouttes tombent sur un
 * intervalle de temps d'effet, au rythme de `dripIntervalMs`. La première tombe dès que le statut
 * apparaît ; un changement de charges change le rythme sans perdre le temps déjà compté.
 *
 * @example const due = clock.advance(dtMs, charges, look); // puis lancer `due` gouttes
 */
export class DripClock {
  private elapsedMs = 0;
  private idle = true;

  /** Avance de `dtMs` avec `charges` charges actives ; rend le nombre de gouttes dues (0 sans charge, ou si l'intervalle n'est pas un nombre positif fini). */
  advance(dtMs: number, charges: number, look: StatusDripLook): number {
    const interval = dripIntervalMs(charges, look);
    if (!(interval > 0 && Number.isFinite(interval))) {
      this.reset();
      return 0;
    }
    if (this.idle) {
      this.idle = false;
      this.elapsedMs = interval;
    } else {
      this.elapsedMs += dtMs;
    }
    let due = 0;
    while (this.elapsedMs >= interval) {
      this.elapsedMs -= interval;
      due += 1;
    }
    return due;
  }

  /** Oublie le temps compté : la prochaine goutte tombera dès que le statut revient. */
  reset(): void {
    this.elapsedMs = 0;
    this.idle = true;
  }
}
