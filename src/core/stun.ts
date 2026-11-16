import { msToTicks, type DuelConfig } from './duel-config';
import type { Fighter } from './fighter';
import { stunTicksFor } from './stats';

/**
 * Sonne la victime. Déjà sonnée, elle le reste le plus long de ce qui lui restait et du
 * nouveau coup, sans que la série dépasse `maxStunSeriesMs` ; la série finit quand elle quitte `stunned`.
 */
export function stunVictim(config: DuelConfig, victim: Fighter, impactSpeed: number): void {
  const { stats, stepHz } = config;
  const elapsed = victim.state === 'stunned' ? victim.machine.ticksInState : 0;
  const remaining = victim.state === 'stunned' ? victim.stunTicks - elapsed : 0;
  victim.stunSeriesTicks = victim.state === 'stunned' ? victim.stunSeriesTicks + elapsed : 0;
  const ticksLeft = msToTicks(stats.maxStunSeriesMs, stepHz) - victim.stunSeriesTicks;
  const wanted = Math.max(remaining, stunTicksFor(config, victim.spec.stunMs, impactSpeed, victim.spec.stats));
  victim.stunTicks = Math.min(wanted, ticksLeft);
  victim.machine.transition('stunned');
}

/** Rend la main aux combattants dont l'étourdissement est écoulé. */
export function endStuns(fighters: readonly Fighter[]): void {
  for (const fighter of fighters) {
    if (fighter.state === 'stunned' && fighter.machine.ticksInState >= fighter.stunTicks) {
      fighter.machine.transition('idle');
    }
  }
}
