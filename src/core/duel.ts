import type { DuelConfig } from './duel-config';
import { assertDuelConfig, msToTicks } from './duel-config';
import type { BodyPartName, ContactReport, DuelWorld } from './duel-world';
import { EventBus } from './events';
import { Fighter } from './fighter';
import type { FighterSpec } from './fighter-spec';
import { canReact, initiativeWinner, passes, rollReaction } from './reactions';
import type { Rng } from './rng';
import { actionDelayScale, hitDamage, knockbackSpeed, stunTicksFor } from './stats';

/** Phase globale du duel : en cours, KO prononcé (la physique finit de tomber), figé. */
export type DuelPhase = 'running' | 'ending' | 'over';

/** Façon dont une attaque est lancée : après le délai d'action, en contre, ou enchaînée. */
type AttackKind = 'attack' | 'counter' | 'combo';

/** Un coup repéré pendant un tick, avant d'être appliqué. */
interface PendingHit {
  attacker: Fighter;
  part: BodyPartName;
  impactSpeed: number;
}

/**
 * Règles du duel en temps réel : chaque combattant a son propre délai avant
 * d'attaquer et frappe dès qu'il est écoulé et que l'adversaire est à portée,
 * sans attendre l'autre, jusqu'au KO. Le défenseur peut esquiver ou parer
 * (décidé au lancement de l'attaque, joué juste avant la frappe), puis
 * contre-attaquer ; un coup qui touche peut être enchaîné. Aucune dépendance à
 * Phaser ni à Matter : la physique est atteinte uniquement par `DuelWorld`.
 *
 * Implémente la feature 1 de `design/game-brief.md` (stories 001 et 009).
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
    assertDuelConfig(config);
    const { arena, stepHz, action } = config;
    this.fighters = [new Fighter(0, specs[0], 1, config), new Fighter(1, specs[1], -1, config)];
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
      this.resolveContacts(contacts, world);
    }
    for (const fighter of this.fighters) fighter.machine.tick();
    if (this.phase === 'running') {
      this.endStuns();
      for (const fighter of this.fighters) fighter.recoverStamina();
      this.settleInitiative(world);
      for (const fighter of this.fighters) this.act(fighter, world);
    } else {
      this.settleTicksLeft -= 1;
      if (this.settleTicksLeft <= 0) this.phase = 'over';
    }
    for (const fighter of this.fighters) world.drive(fighter.index, fighter.intent());
    world.step();
    this.tick += 1;
  }

  /** Deux combattants prêts au même tick : un tirage donne l'initiative à l'un, l'autre attend la fin de ce coup et peut y réagir. */
  private settleInitiative(world: DuelWorld): void {
    const [first, second] = this.fighters;
    const ready = (fighter: Fighter) => (fighter.state === 'idle' || fighter.state === 'approach') && fighter.actionTicksLeft <= 1;
    if (!ready(first) || !ready(second)) return;
    if (this.distance(world) > Math.min(first.spec.attack.reach, second.spec.attack.reach)) return;
    const winner = this.fighters[initiativeWinner([first.spec.stats.speed, second.spec.stats.speed], this.rng)];
    this.opponentOf(winner).actionTicksLeft = winner.windupTicks + winner.strikeTicks + 1;
  }

  private opponentOf(fighter: Fighter): Fighter {
    return this.fighters[1 - fighter.index];
  }

  /**
   * Repère les coups des deux combattants sur ce tick, les applique tous, puis
   * conclut : un seul combattant à 0 PV perd ; les deux à 0 PV sur le même
   * tick donnent une égalité (pas de vainqueur). Un défenseur en pleine
   * esquive ne peut pas être touché.
   */
  private resolveContacts(contacts: readonly ContactReport[], world: DuelWorld): void {
    const pending: PendingHit[] = [];
    for (const attacker of this.fighters) {
      if (!attacker.inStrikeWindow || attacker.hasHit || this.opponentOf(attacker).state === 'dodge') continue;
      for (const contact of contacts) {
        if (contact.relativeSpeed < this.config.minHitSpeed) continue;
        const part = this.strikingPartOf(contact, attacker);
        if (part === null) continue;
        pending.push({ attacker, part, impactSpeed: contact.relativeSpeed });
        break;
      }
    }
    for (const hit of pending) this.applyHit(hit, this.opponentOf(hit.attacker), world);
    this.endIfKo();
  }

  private strikingPartOf(contact: ContactReport, attacker: Fighter): BodyPartName | null {
    const strikingParts = attacker.spec.attack.strikingParts;
    if (contact.fighterA === attacker.index && strikingParts.includes(contact.partA)) return contact.partA;
    if (contact.fighterB === attacker.index && strikingParts.includes(contact.partB)) return contact.partB;
    return null;
  }

  /** Dégâts, recul et étourdissement d'un coup ; un coup paré est réduit par `parryFactor` et ne sonne pas. */
  private applyHit({ attacker, part, impactSpeed }: PendingHit, victim: Fighter, world: DuelWorld): void {
    const parried = victim.state === 'parry';
    const factor = parried ? this.config.reactions.parryFactor : 1;
    const damage = Math.round(hitDamage(this.config, attacker.spec.attack.damage, impactSpeed, attacker.spec.stats) * factor);
    attacker.hasHit = true;
    victim.hp = Math.max(0, victim.hp - damage);
    this.events.emit('hit', {
      tick: this.tick,
      attacker: attacker.index,
      victim: victim.index,
      part,
      damage,
      hpLeft: victim.hp,
      parried,
    });
    const recoil = knockbackSpeed(this.config, impactSpeed, attacker.spec.stats, victim.spec.stats) * factor;
    world.impulse(victim.index, attacker.facing * recoil, -recoil * this.config.stats.knockbackLift);
    if (victim.hp > 0 && !parried) this.stun(victim, impactSpeed);
  }

  /**
   * Sonne la victime. Déjà sonnée, elle le reste le plus long de ce qui lui restait et du
   * nouveau coup, sans que la série dépasse `maxStunSeriesMs` ; la série finit quand elle quitte `stunned`.
   */
  private stun(victim: Fighter, impactSpeed: number): void {
    const { stats, stepHz } = this.config;
    const elapsed = victim.state === 'stunned' ? victim.machine.ticksInState : 0;
    const remaining = victim.state === 'stunned' ? victim.stunTicks - elapsed : 0;
    victim.stunSeriesTicks = victim.state === 'stunned' ? victim.stunSeriesTicks + elapsed : 0;
    const ticksLeft = msToTicks(stats.maxStunSeriesMs, stepHz) - victim.stunSeriesTicks;
    const wanted = Math.max(remaining, stunTicksFor(this.config, victim.spec.stunMs, impactSpeed, victim.spec.stats));
    victim.stunTicks = Math.min(wanted, ticksLeft);
    victim.machine.transition('stunned');
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
      const winner = this.opponentOf(down[0]);
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

  /** Décision d'un combattant sur ce tick, selon son état. */
  private act(fighter: Fighter, world: DuelWorld): void {
    const ticks = fighter.machine.ticksInState;
    const opponent = this.opponentOf(fighter);
    switch (fighter.state) {
      case 'idle':
      case 'approach':
        this.actFree(fighter, world);
        break;
      case 'attack':
        if (ticks === fighter.reactionTick) this.startReaction(opponent, fighter);
        if (ticks >= fighter.windupTicks + fighter.strikeTicks) this.endAttack(fighter, world);
        break;
      case 'recovery':
        if (ticks >= fighter.recoveryTicks) fighter.machine.transition('idle');
        break;
      case 'dodge':
      case 'parry':
        fighter.actionTicksLeft = Math.max(0, fighter.actionTicksLeft - 1);
        if (opponent.state !== 'attack') this.endReaction(fighter, fighter.state, world);
        break;
      default:
        break;
    }
  }

  /** Combattant libre : attaque si prêt et à portée, sinon s'approche ; arrêté, il ne repart que hors de la marge de portée ou une fois prêt. */
  private actFree(fighter: Fighter, world: DuelWorld): void {
    fighter.actionTicksLeft = Math.max(0, fighter.actionTicksLeft - 1);
    const ready = fighter.actionTicksLeft === 0;
    const { reach } = fighter.spec.attack;
    const distance = this.distance(world);
    if (distance <= reach) {
      if (ready) this.startAttack(fighter, 'attack');
      else if (fighter.state === 'approach') fighter.machine.transition('idle');
    } else if (fighter.state === 'idle' && (ready || distance > reach + this.config.action.approachResumeMargin)) {
      fighter.machine.transition('approach');
    }
  }

  private distance(world: DuelWorld): number {
    return Math.abs(world.fighterX(1) - world.fighterX(0));
  }

  /** Vrai si l'adversaire est encore assez près pour un coup lancé sans marcher (contre, enchaînement). */
  private inFollowUpReach(fighter: Fighter, world: DuelWorld): boolean {
    return this.distance(world) <= fighter.spec.attack.reach + this.config.action.approachResumeMargin;
  }

  /**
   * Lance l'attaque : paie son coût, tire le délai du coup suivant (raccourci
   * par la vitesse) puis la réaction que l'adversaire jouera (tirages seedés,
   * toujours dans cet ordre).
   */
  private startAttack(fighter: Fighter, kind: AttackKind, trigger?: 'dodge' | 'parry'): void {
    const { action, reactions, stepHz } = this.config;
    fighter.spendStamina(reactions.staminaCost[kind]);
    fighter.hasHit = false;
    fighter.comboHits = kind === 'combo' ? fighter.comboHits + 1 : 1;
    fighter.machine.transition('attack');
    const delayMs = (action.delayBaseMs + this.rng.range(0, action.delayRandomMs)) * actionDelayScale(this.config, fighter.spec.stats);
    fighter.actionTicksLeft = msToTicks(delayMs, stepHz);
    if (kind === 'counter' && trigger) this.events.emit('counter', { tick: this.tick, fighter: fighter.index, trigger });
    if (kind === 'combo') this.events.emit('combo', { tick: this.tick, fighter: fighter.index, count: fighter.comboHits });
    this.events.emit('attackStart', { tick: this.tick, fighter: fighter.index });
    fighter.plannedReaction = rollReaction(reactions, this.opponentOf(fighter), this.rng);
  }

  /** Fin de la frappe : enchaîne un autre coup si celui-ci a touché sans être paré et que le tirage passe, sinon récupère. */
  private endAttack(fighter: Fighter, world: DuelWorld): void {
    const { reactions } = this.config;
    const canChain =
      fighter.hasHit &&
      this.opponentOf(fighter).state !== 'parry' &&
      fighter.comboHits < reactions.maxComboHits &&
      this.inFollowUpReach(fighter, world);
    if (canChain && passes(fighter, reactions.comboChance, reactions.staminaCost.combo, this.rng)) {
      this.startAttack(fighter, 'combo');
    } else {
      fighter.machine.transition('recovery');
    }
  }

  /** Le défenseur joue la réaction décidée au lancement de l'attaque, s'il est encore en état et a l'endurance. */
  private startReaction(defender: Fighter, attacker: Fighter): void {
    const reaction = attacker.plannedReaction;
    attacker.plannedReaction = 'none';
    const cost = reaction === 'none' ? 0 : this.config.reactions.staminaCost[reaction];
    if (reaction === 'none' || !canReact(defender.state) || defender.stamina < cost) return;
    defender.spendStamina(cost);
    defender.machine.transition(reaction);
    this.events.emit(reaction, { tick: this.tick, defender: defender.index, attacker: attacker.index, staminaLeft: defender.stamina });
  }

  /** L'attaque adverse est finie : contre-attaque aussitôt si le tirage passe, sinon retour à l'arrêt. */
  private endReaction(fighter: Fighter, trigger: 'dodge' | 'parry', world: DuelWorld): void {
    const { reactions } = this.config;
    if (this.inFollowUpReach(fighter, world) && passes(fighter, reactions.counterChance, reactions.staminaCost.counter, this.rng)) {
      this.startAttack(fighter, 'counter', trigger);
    } else {
      fighter.machine.transition('idle');
    }
  }
}
