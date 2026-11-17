import type { DuelConfig } from './duel-config';
import { assertDuelConfig, msToTicks } from './duel-config';
import type { ContactReport, DuelWorld } from './duel-world';
import { EventBus } from './events';
import { updateFacing } from './facing';
import { Fighter } from './fighter';
import type { FighterSpec } from './fighter-spec';
import { contactHit, emitNoDamage, reportMissedAttack, strikingPartOf, type PendingHit } from './hit';
import { canReact, initiativeWinner, passes, rollReaction, type Reaction } from './reactions';
import type { Rng } from './rng';
import { SkillSystem } from './skill-system';
import { actionDelayScale, knockbackSpeed } from './stats';
import { endStuns, stunVictim } from './stun';

/** Phase globale du duel : en cours, KO prononcé (la physique finit de tomber), figé. */
export type DuelPhase = 'running' | 'ending' | 'over';

/** Façon dont une attaque est lancée : après le délai d'action, en contre, ou enchaînée. */
type AttackKind = 'attack' | 'counter' | 'combo';

/**
 * Règles du duel en temps réel : chaque combattant a son propre délai avant
 * d'attaquer et frappe dès qu'il est écoulé et que l'adversaire est à portée,
 * sans attendre l'autre, jusqu'au KO. Le défenseur peut esquiver ou parer
 * (décidé au lancement de l'attaque, joué juste avant la frappe), puis
 * contre-attaquer ; un coup qui touche peut être enchaîné. Aucune dépendance à
 * Phaser ni à Matter : la physique est atteinte uniquement par `DuelWorld`.
 *
 * Les compétences (story 004) passent par le même chemin de touche (`SkillSystem`).
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

  /** Moteur des compétences (inactif quand aucun combattant n'en a). */
  readonly skills: SkillSystem;
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
    this.skills = new SkillSystem({
      config, events: this.events, fighters: this.fighters, rng, tick: () => this.tick,
      applyHit: this.applyHit.bind(this), playReaction: this.playReaction.bind(this),
      endIfKo: this.endIfKo.bind(this), drawActionDelay: this.drawActionDelay.bind(this),
    });
  }

  /** Un tick fixe : logique du duel, ordres aux muscles, puis un pas de physique. */
  update(world: DuelWorld): void {
    if (this.phase === 'over') return;
    const contacts = world.drainContacts();
    if (this.phase === 'running') {
      this.resolveContacts(contacts, world);
      if (this.phase === 'running') this.skills.stepProjectiles(world);
    }
    for (const fighter of this.fighters) fighter.machine.tick();
    if (this.phase === 'running') {
      this.skills.tick();
      endStuns(this.fighters);
      for (const fighter of this.fighters) updateFacing(fighter, world.fighterX(fighter.index), world.fighterX(1 - fighter.index), this.config.facing, this.config.stepHz);
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
    if (this.distance(world) > Math.min(first.attack.reach, second.attack.reach)) return;
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
      if (!attacker.inStrikeWindow || attacker.hasHit || (this.opponentOf(attacker).state === 'dodge' && attacker.dodgeable)) continue;
      for (const contact of contacts) {
        if (contact.relativeSpeed < this.config.minHitSpeed) continue;
        const part = strikingPartOf(contact, attacker);
        if (part === null) continue;
        pending.push(contactHit(this.config, attacker, part, contact.relativeSpeed));
        break;
      }
    }
    for (const hit of pending) this.applyHit(hit, this.opponentOf(hit.attacker), world);
    this.endIfKo();
  }

  /** Dégâts, recul et étourdissement d'un coup ; un coup paré est réduit par `parryFactor` et ne sonne pas. */
  private applyHit({ attacker, part, impactSpeed, damage: baseDamage, skill, point, parryable, ranged }: PendingHit, victim: Fighter, world: DuelWorld): void {
    const parried = victim.state === 'parry' && parryable !== false;
    const factor = parried ? this.config.reactions.parryFactor : 1;
    const damage = Math.round(baseDamage * factor);
    if (ranged !== true) attacker.hasHit = true;
    victim.hp = Math.max(0, victim.hp - damage);
    this.events.emit('hit', {
      tick: this.tick,
      attacker: attacker.index,
      victim: victim.index,
      part,
      damage,
      hpLeft: victim.hp,
      parried,
      ...(skill === undefined ? {} : { skill }),
      ...(point === undefined ? {} : { point }),
    });
    if (parried) emitNoDamage(this.events, world, this.tick, attacker, victim, 'blocked', skill ?? null, point);
    const recoil = knockbackSpeed(this.config, impactSpeed, attacker.spec.stats, victim.spec.stats) * factor;
    world.impulse(victim.index, attacker.facing * recoil, -recoil * this.config.stats.knockbackLift);
    if (victim.hp === 0 || parried) return;
    // Garde ou esquive face à un coup qu'elles ne retiennent pas : dégâts pleins, la réaction se casse, pas d'étourdissement (Maxence, 2026-11-17).
    if (victim.state === 'parry' || victim.state === 'dodge') victim.machine.transition('idle');
    else stunVictim(this.config, victim, impactSpeed);
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
        if (!this.skills.threatens(opponent)) this.endReaction(fighter, fighter.state, world);
        break;
      case 'skill':
        this.skills.act(fighter, world);
        break;
      default:
        break;
    }
  }

  /** Combattant libre : attaque si prêt et à portée, sinon s'approche ; arrêté, il ne repart que hors de la marge de portée ou une fois prêt. */
  private actFree(fighter: Fighter, world: DuelWorld): void {
    fighter.actionTicksLeft = Math.max(0, fighter.actionTicksLeft - 1);
    const ready = fighter.actionTicksLeft === 0;
    if (ready && this.skills.tryStart(fighter, this.distance(world), world)) return;
    const { reach } = fighter.attack;
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
    return this.distance(world) <= fighter.attack.reach + this.config.action.approachResumeMargin;
  }

  /**
   * Lance l'attaque : paie son coût, tire le délai du coup suivant (raccourci
   * par la vitesse) puis la réaction que l'adversaire jouera (tirages seedés,
   * toujours dans cet ordre).
   */
  private startAttack(fighter: Fighter, kind: AttackKind, trigger?: 'dodge' | 'parry'): void {
    const { reactions } = this.config;
    fighter.spendStamina(reactions.staminaCost[kind]);
    fighter.hasHit = false;
    fighter.comboHits = kind === 'combo' ? fighter.comboHits + 1 : 1;
    fighter.machine.transition('attack');
    fighter.actionTicksLeft = this.drawActionDelay(fighter);
    if (kind === 'counter' && trigger) this.events.emit('counter', { tick: this.tick, fighter: fighter.index, trigger });
    if (kind === 'combo') this.events.emit('combo', { tick: this.tick, fighter: fighter.index, count: fighter.comboHits });
    this.events.emit('attackStart', { tick: this.tick, fighter: fighter.index });
    fighter.plannedReaction = rollReaction(reactions, this.opponentOf(fighter), this.rng);
  }

  /** Délai avant la prochaine action, en ticks : base + part aléatoire seedée, raccourci par la vitesse. */
  private drawActionDelay(fighter: Fighter): number {
    const { action, stepHz } = this.config;
    return msToTicks((action.delayBaseMs + this.rng.range(0, action.delayRandomMs)) * actionDelayScale(this.config, fighter.spec.stats), stepHz);
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
      if (!fighter.hasHit) reportMissedAttack(this.events, world, this.tick, fighter, this.opponentOf(fighter));
      fighter.machine.transition('recovery');
    }
  }

  /** Le défenseur joue la réaction décidée au lancement de l'attaque, s'il est encore en état et a l'endurance. */
  private startReaction(defender: Fighter, attacker: Fighter): void {
    const reaction = attacker.plannedReaction;
    attacker.plannedReaction = 'none';
    this.playReaction(defender, attacker, reaction);
  }

  private playReaction(defender: Fighter, attacker: Fighter, reaction: Reaction): void {
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
