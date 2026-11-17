import type { StatusSpec } from '../../core/status-spec';

/**
 * Saignement (story 013) : dégâts dans la durée et perte de poids (le sang perdu), cumulables.
 * Repères (`fighters.ts`, `duel-config.ts`) : 100 PV, poids 70, un coup simple fait ~10 PV.
 * - 1 PV/s par charge pendant 4 s : une charge coûte 4 PV, moins qu'un coup ; 5 charges font 5 PV/s.
 * - 3 de poids par charge, plancher à 80 % (56 pour un poids 70) : 5 charges (15) touchent le plancher.
 */
export const BLEED: StatusSpec = {
  id: 'bleed',
  chargeDurationMs: 4000,
  maxCharges: 5,
  damagePerSecondPerCharge: 1,
  weightLossPerCharge: 3,
  weightFloorShare: 0.8,
};
