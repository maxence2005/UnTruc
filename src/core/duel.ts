import type { DuelConfig } from './duel-config';
import { msToTicks } from './duel-config';
import type { BodyPartName, ContactReport, DuelWorld } from './duel-world';
import { EventBus } from './events';
import { Fighter } from './fighter';
import type { FighterSpec } from './fighter-spec';
import type { Rng } from './rng';

/** Phase globale du duel : en cours, KO prononcé (la physique finit de tomber), figé. */
export type DuelPhase = 'running' | 'ending' | 'over';

/** Un coup repéré pendant un tick, avant d'être appliqué. */
interface PendingHit {
  attacker: Fighter;
  part: BodyPartName;
  impactSpeed: number;
}

/**
 * Règles du duel en temps réel : chaque combattant a son propre délai avant
 * d'attaquer et frappe dès qu'il est écoulé et que l'adversaire est à portée,
 * sans attendre l'autre, jusqu'au KO. Aucune dépendance à Phaser ni à Matter :
 * la physique est atteinte uniquement par l'interface `DuelWorld`.
 *
 * Implémente la feature 1 de `design/game-brief.md` (story-001).
 */
export class Duel {
  /** Les deux combattants : index 0 à gauche, index 1 à droite. */
  readonly fighters: readonly [Fighter, Fighter];
  /** Bus d'événements du duel ; rendu, UI et effets s'y abonnent. */
  readonly events = new EventBus();
  /** Positions x de départ des bassins, tirées avec le RNG (le duel est donc rejouable à seed fixe). */
  readonly spawnX: readonly [number, number];
  /** Nombre de pas de simulation joués. */
  tick = 0;
  /** Index du vainqueur ; `null` tant que le duel dure, et à la fin en cas d'égalité (double KO). */
  winner: number | null = null;
  /** Phase courante du duel. */
  phase: DuelPhase = 'running';

  private settleTicksLeft: number;

  constructor(
    private readonly config: DuelConfig,
    specs: readonly [FighterSpec, FighterSpec],
    private readonly rng: Rng,
  ) {
    const { arena, stepHz, action } = config;
    this.fighters = [new Fighter(0, specs[0], 1, stepHz), new Fighter(1, specs[1], -1, stepHz)];
    const centerX = arena.width / 2;
    this.spawnX = [
      centerX - arena.spawnHalfGap + rng.range(-arena.spawnJitter, arena.spawnJitter),
      centerX + arena.spawnHalfGap + rng.range(-arena.spawnJitter, arena.spawnJitter),
    ];
    for (const fighter of this.fighters) {
      fighter.actionTicksLeft = msToTicks(action.firstDelayMs + action.firstDelayStaggerMs * fighter.index, stepHz);
    }
    this.settleTicksLeft = msToTicks(config.endSettleMs, stepHz);
  }

  /** Un tick fixe : logique du duel, ordres aux muscles, puis un pas de physique. */
  update(world: DuelWorld): void {
    if (this.phase === 'over') return;
    const contacts = world.drainContacts();
    if (this.phase === 'running') {
      this.resolveContacts(contacts);
    }
    for (const fighter of this.fighters) fighter.machine.tick();
    if (this.phase === 'running') {
      this.endStuns();
      for (const fighter of this.fighters) this.act(fighter, world);
    } else {
      this.settleTicksLeft -= 1;
      if (this.settleTicksLeft <= 0) this.phase = 'over';
    }
    for (const fighter of this.fighters) world.drive(fighter.index, fighter.intent());
    world.step();
    this.tick += 1;
  }

  /**
   * Repère les coups des deux combattants sur ce tick, les applique tous, puis
   * conclut : un seul combattant à 0 PV perd ; les deux à 0 PV sur le même
   * tick donnent une égalité (pas de vainqueur).
   */
  private resolveContacts(contacts: readonly ContactReport[]): void {
    const pending: PendingHit[] = [];
    for (const attacker of this.fighters) {
      if (!attacker.inStrikeWindow || attacker.hasHit) continue;
      for (const contact of contacts) {
        if (contact.relativeSpeed < this.config.minHitSpeed) continue;
        const part = this.strikingPartOf(contact, attacker);
        if (part === null) continue;
        pending.push({ attacker, part, impactSpeed: contact.relativeSpeed });
        break;
      }
    }
    for (const hit of pending) this.applyHit(hit, this.fighters[1 - hit.attacker.index]);
    this.endIfKo();
  }

  private strikingPartOf(contact: ContactReport, attacker: Fighter): BodyPartName | null {
    const strikingParts = attacker.spec.attack.strikingParts;
    if (contact.fighterA === attacker.index && strikingParts.includes(contact.partA)) return contact.partA;
    if (contact.fighterB === attacker.index && strikingParts.includes(contact.partB)) return contact.partB;
    return null;
  }

  /** Dégât de base de l'attaque × (vitesse d'impact / vitesse de référence) borné, arrondi à l'entier. */
  private damageFor(attacker: Fighter, impactSpeed: number): number {
    const { referenceSpeed, minFactor, maxFactor } = this.config.damage;
    const factor = Math.min(maxFactor, Math.max(minFactor, impactSpeed / referenceSpeed));
    return Math.round(attacker.spec.attack.damage * factor);
  }

  private applyHit({ attacker, part, impactSpeed }: PendingHit, victim: Fighter): void {
    const damage = this.damageFor(attacker, impactSpeed);
    attacker.hasHit = true;
    victim.hp = Math.max(0, victim.hp - damage);
    this.events.emit('hit', {
      tick: this.tick,
      attacker: attacker.index,
      victim: victim.index,
      part,
      damage,
      hpLeft: victim.hp,
    });
    if (victim.hp > 0) victim.machine.transition('stunned');
  }

  /** Termine le duel si au moins un combattant est à 0 PV : KO, vainqueur ou égalité. */
  private endIfKo(): void {
    const down = this.fighters.filter((fighter) => fighter.hp === 0);
    if (down.length === 0) return;
    for (const fighter of down) {
      fighter.machine.transition('ko');
      this.events.emit('ko', { tick: this.tick, fighter: fighter.index });
    }
    this.phase = 'ending';
    if (down.length === 1) {
      const winner = this.fighters[1 - down[0].index];
      this.winner = winner.index;
      winner.machine.transition(winner.state === 'attack' ? 'recovery' : 'idle');
    }
    this.events.emit('duelEnd', { tick: this.tick, winner: this.winner });
  }

  private endStuns(): void {
    for (const fighter of this.fighters) {
      if (fighter.state === 'stunned' && fighter.machine.ticksInState >= fighter.stunTicks) {
        fighter.machine.transition('idle');
      }
    }
  }

  /** Décision d'un combattant sur ce tick : attendre, s'approcher, attaquer, ou finir son attaque en cours. */
  private act(fighter: Fighter, world: DuelWorld): void {
    const ticks = fighter.machine.ticksInState;
    switch (fighter.state) {
      case 'idle':
      case 'approach': {
        fighter.actionTicksLeft = Math.max(0, fighter.actionTicksLeft - 1);
        const opponent = this.fighters[1 - fighter.index];
        const distance = Math.abs(world.fighterX(opponent.index) - world.fighterX(fighter.index));
        if (distance > fighter.spec.attack.reach) {
          if (fighter.state === 'idle') fighter.machine.transition('approach');
        } else if (fighter.actionTicksLeft === 0) {
          this.startAttack(fighter);
        } else if (fighter.state === 'approach') {
          fighter.machine.transition('idle');
        }
        break;
      }
      case 'attack':
        if (ticks >= fighter.windupTicks + fighter.strikeTicks) fighter.machine.transition('recovery');
        break;
      case 'recovery':
        if (ticks >= fighter.recoveryTicks) fighter.machine.transition('idle');
        break;
      default:
        break;
    }
  }

  /** Lance l'attaque et tire tout de suite le délai du coup suivant (seedé, dans l'ordre des index). */
  private startAttack(fighter: Fighter): void {
    const { action, stepHz } = this.config;
    fighter.hasHit = false;
    fighter.machine.transition('attack');
    fighter.actionTicksLeft = msToTicks(action.delayBaseMs + this.rng.range(0, action.delayRandomMs), stepHz);
    this.events.emit('attackStart', { tick: this.tick, fighter: fighter.index });
  }
}
