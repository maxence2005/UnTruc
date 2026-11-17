import { msToTicks, type DuelConfig } from './duel-config';
import type { DuelWorld } from './duel-world';
import type { EventBus } from './events';
import type { Fighter } from './fighter';
import { massScale } from './stats';
import type { ActiveStatus, StatusApplication, StatusSpec } from './status-spec';

/** Ce que le moteur de statuts demande au duel qui le porte. */
export interface StatusHost {
  readonly config: DuelConfig;
  readonly events: EventBus;
  readonly fighters: readonly [Fighter, Fighter];
  tick(): number;
}

/**
 * Poids effectif : poids de base − somme des pertes des charges actives, jamais sous le plus haut
 * plancher (`weightFloorShare` × poids de base) des statuts qui retirent du poids.
 */
export function effectiveWeight(baseWeight: number, statuses: readonly ActiveStatus[]): number {
  let loss = 0;
  let floorShare = 0;
  for (const { spec, chargeTicks } of statuses) {
    if (spec.weightLossPerCharge === 0 || chargeTicks.length === 0) continue;
    loss += spec.weightLossPerCharge * chargeTicks.length;
    floorShare = Math.max(floorShare, spec.weightFloorShare);
  }
  if (loss === 0) return baseWeight;
  return Math.max(baseWeight * floorShare, baseWeight - loss);
}

/**
 * Moteur générique des statuts de combat (story 013) : application par charges, cumul plafonné
 * (au plafond, la charge la plus ancienne est remplacée), durée propre à chaque charge, dégâts
 * dans la durée et poids effectif. Un statut est une donnée (`StatusSpec`) ; ce code n'en connaît
 * aucun. Les PV perdus ne sont pas des coups : pas de recul ni d'étourdissement ; le KO passe par
 * `endIfKo` du duel, appelé juste après `tick`. Émet `statusApplied`, `statusTick`, `statusExpired`.
 */
export class StatusSystem {
  constructor(private readonly host: StatusHost) {}

  /** Ajoute les charges déclarées par un coup à sa victime, puis recalcule son poids. */
  apply(source: Fighter, victim: Fighter, applications: readonly StatusApplication[], world: DuelWorld): void {
    for (const { status, charges } of applications) {
      const active = this.activeOn(victim, status);
      let replaced = false;
      for (let i = 0; i < charges; i += 1) replaced = this.addCharge(active) || replaced;
      const { x, y } = world.readPart(victim.index, 'torso');
      this.host.events.emit('statusApplied', {
        tick: this.host.tick(), source: source.index, victim: victim.index, status: status.id,
        charges: active.chargeTicks.length, chargesAdded: charges, replaced, x, y,
      });
    }
    this.updateWeight(victim, world);
  }

  /** Un tick : dégâts de chaque statut, puis expiration des charges écoulées et poids rendu. */
  tick(world: DuelWorld): void {
    for (const fighter of this.host.fighters) {
      if (fighter.statuses.length === 0) continue;
      for (let i = fighter.statuses.length - 1; i >= 0; i -= 1) {
        const active = fighter.statuses[i];
        this.bleed(fighter, active, world);
        this.expire(fighter, active, i);
      }
      this.updateWeight(fighter, world);
    }
  }

  /** État de tous les statuts actifs, dans un ordre stable (pour l'empreinte) ; vide sans statut. */
  snapshot(): number[] {
    const values: number[] = [];
    for (const fighter of this.host.fighters) {
      for (const active of fighter.statuses) {
        values.push(fighter.index, active.chargeTicks.length, ...active.chargeTicks, active.damageAcc, fighter.effectiveStats.weight);
      }
    }
    return values;
  }

  private activeOn(victim: Fighter, status: StatusSpec): ActiveStatus {
    const found = victim.statuses.find((active) => active.spec.id === status.id);
    if (found !== undefined) return found;
    const created: ActiveStatus = { spec: status, chargeTicks: [], damageAcc: 0 };
    victim.statuses.push(created);
    return created;
  }

  /** Ajoute une charge à pleine durée ; au plafond, retire d'abord la plus ancienne. Vrai si une charge a été remplacée. */
  private addCharge(active: ActiveStatus): boolean {
    const replaced = active.chargeTicks.length >= active.spec.maxCharges;
    if (replaced) active.chargeTicks.shift();
    active.chargeTicks.push(msToTicks(active.spec.chargeDurationMs, this.host.config.stepHz));
    return replaced;
  }

  /** Dégâts du tick, comptés en entiers (PV × `stepHz`) : aucune dérive d'arrondi. */
  private bleed(fighter: Fighter, active: ActiveStatus, world: DuelWorld): void {
    const { stepHz } = this.host.config;
    active.damageAcc += active.spec.damagePerSecondPerCharge * active.chargeTicks.length;
    const damage = Math.floor(active.damageAcc / stepHz);
    if (damage === 0) return;
    active.damageAcc -= damage * stepHz;
    fighter.hp = Math.max(0, fighter.hp - damage);
    const { x, y } = world.readPart(fighter.index, 'torso');
    this.host.events.emit('statusTick', {
      tick: this.host.tick(), victim: fighter.index, status: active.spec.id,
      damage, hpLeft: fighter.hp, charges: active.chargeTicks.length, x, y,
    });
  }

  /** Décompte d'un tick sur chaque charge ; les charges écoulées (les plus anciennes) partent, le statut vide aussi. */
  private expire(fighter: Fighter, active: ActiveStatus, index: number): void {
    const { chargeTicks } = active;
    for (let i = 0; i < chargeTicks.length; i += 1) chargeTicks[i] -= 1;
    let expired = 0;
    while (chargeTicks.length > 0 && chargeTicks[0] <= 0) {
      chargeTicks.shift();
      expired += 1;
    }
    if (expired === 0) return;
    if (chargeTicks.length === 0) fighter.statuses.splice(index, 1);
    this.host.events.emit('statusExpired', { tick: this.host.tick(), victim: fighter.index, status: active.spec.id, chargesLeft: chargeTicks.length });
  }

  /** Recalcule le poids effectif ; s'il change, la marche et la masse du corps suivent. */
  private updateWeight(fighter: Fighter, world: DuelWorld): void {
    const weight = effectiveWeight(fighter.spec.stats.weight, fighter.statuses);
    if (weight === fighter.effectiveStats.weight) return;
    fighter.setWeight(this.host.config, weight);
    world.setMassScale(fighter.index, massScale(this.host.config, fighter.effectiveStats));
  }
}
