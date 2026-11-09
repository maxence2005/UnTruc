import type { DuelConfig } from './duel-config';
import { msToTicks } from './duel-config';
import type { BodyPartName, ContactReport, DuelWorld } from './duel-world';
import { EventBus } from './events';
import { Fighter } from './fighter';
import type { FighterSpec } from './fighter-spec';
import type { Rng } from './rng';

/** Phase globale du duel : en cours, KO prononcé (la physique finit de tomber), figé. */
export type DuelPhase = 'running' | 'ending' | 'over';

type TurnPhase = 'gap' | 'acting';

/**
 * Règles du duel au tour par tour : un combattant agit (approche, attaque,
 * récupération), puis l'autre, jusqu'au KO. Aucune dépendance à Phaser ni à
 * Matter : la physique est atteinte uniquement par l'interface `DuelWorld`.
 *
 * Implémente la feature 1 de `design/game-brief.md` (story-001).
 */
export class Duel {
  readonly fighters: readonly [Fighter, Fighter];
  readonly events = new EventBus();
  /** Positions x de départ des bassins, tirées avec le RNG (le duel est donc rejouable à seed fixe). */
  readonly spawnX: readonly [number, number];
  tick = 0;
  winner: number | null = null;
  phase: DuelPhase = 'running';

  private actor: number;
  private turnPhase: TurnPhase = 'gap';
  private gapTicksLeft: number;
  private settleTicksLeft: number;
  private readonly gapTicks: number;
  private readonly approachTimeoutTicks: number;

  constructor(
    private readonly config: DuelConfig,
    specs: readonly [FighterSpec, FighterSpec],
    private readonly rng: Rng,
  ) {
    const { arena, stepHz, turn } = config;
    this.fighters = [new Fighter(0, specs[0], 1, stepHz), new Fighter(1, specs[1], -1, stepHz)];
    const centerX = arena.width / 2;
    this.spawnX = [
      centerX - arena.spawnHalfGap + rng.range(-arena.spawnJitter, arena.spawnJitter),
      centerX + arena.spawnHalfGap + rng.range(-arena.spawnJitter, arena.spawnJitter),
    ];
    this.actor = rng.int(0, 1);
    this.gapTicks = msToTicks(turn.gapMs, stepHz);
    this.approachTimeoutTicks = msToTicks(turn.approachTimeoutMs, stepHz);
    this.gapTicksLeft = msToTicks(turn.firstDelayMs, stepHz);
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
      this.advanceTurn(world);
    } else {
      this.settleTicksLeft -= 1;
      if (this.settleTicksLeft <= 0) this.phase = 'over';
    }
    for (const fighter of this.fighters) world.drive(fighter.index, fighter.intent());
    world.step();
    this.tick += 1;
  }

  private resolveContacts(contacts: readonly ContactReport[]): void {
    const attacker = this.fighters[this.actor];
    if (!attacker.inStrikeWindow || attacker.hasHit) return;
    for (const contact of contacts) {
      if (contact.relativeSpeed < this.config.minHitSpeed) continue;
      const part = this.strikingPartOf(contact, attacker);
      if (part === null) continue;
      this.applyHit(attacker, this.fighters[1 - this.actor], part);
      return;
    }
  }

  private strikingPartOf(contact: ContactReport, attacker: Fighter): BodyPartName | null {
    const strikingParts = attacker.spec.attack.strikingParts;
    if (contact.fighterA === attacker.index && strikingParts.includes(contact.partA)) return contact.partA;
    if (contact.fighterB === attacker.index && strikingParts.includes(contact.partB)) return contact.partB;
    return null;
  }

  private applyHit(attacker: Fighter, victim: Fighter, part: BodyPartName): void {
    const { damageMin, damageMax } = attacker.spec.attack;
    const damage = this.rng.int(damageMin, damageMax);
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
    if (victim.hp === 0) {
      victim.machine.transition('ko');
      this.winner = attacker.index;
      this.phase = 'ending';
      this.events.emit('ko', { tick: this.tick, fighter: victim.index });
      this.events.emit('duelEnd', { tick: this.tick, winner: attacker.index });
      attacker.machine.transition('recovery');
    } else {
      victim.machine.transition('stunned');
    }
  }

  private endStuns(): void {
    for (const fighter of this.fighters) {
      if (fighter.state === 'stunned' && fighter.machine.ticksInState >= fighter.stunTicks) {
        fighter.machine.transition('idle');
      }
    }
  }

  private advanceTurn(world: DuelWorld): void {
    const actor = this.fighters[this.actor];
    const opponent = this.fighters[1 - this.actor];
    if (this.turnPhase === 'gap') {
      this.gapTicksLeft -= 1;
      if (this.gapTicksLeft <= 0 && opponent.state === 'idle' && actor.state === 'idle') {
        this.turnPhase = 'acting';
        actor.machine.transition('approach');
        this.events.emit('turnStart', { tick: this.tick, actor: actor.index });
      }
      return;
    }
    const { attack } = actor.spec;
    const ticks = actor.machine.ticksInState;
    switch (actor.state) {
      case 'approach': {
        const distance = Math.abs(world.fighterX(opponent.index) - world.fighterX(actor.index));
        if (distance <= attack.reach || ticks >= this.approachTimeoutTicks) {
          actor.hasHit = false;
          actor.machine.transition('attack');
        }
        break;
      }
      case 'attack':
        if (ticks >= actor.windupTicks + actor.strikeTicks) actor.machine.transition('recovery');
        break;
      case 'recovery':
        if (ticks >= actor.recoveryTicks) {
          actor.machine.transition('idle');
          this.actor = opponent.index;
          this.turnPhase = 'gap';
          this.gapTicksLeft = this.gapTicks;
        }
        break;
      default:
        break;
    }
  }
}
