import { aimLaunch } from './ballistics';
import { msToTicks, type DuelConfig } from './duel-config';
import type { DuelWorld } from './duel-world';
import type { EventBus } from './events';
import type { Fighter } from './fighter';
import { emitNoDamage, type PendingHit } from './hit';
import { createProjectile, type Projectile } from './projectile';
import { rollReaction, type Reaction } from './reactions';
import type { Rng } from './rng';
import { chooseSkill, tickCooldowns } from './skill-choice';
import { SkillRun } from './skill-run';
import { skillDamage, type SkillProjectile, type SkillSpec } from './skill-spec';

export type { Projectile } from './projectile';

/** Ce que le moteur de compétences demande au duel qui le porte. */
export interface SkillHost {
  readonly config: DuelConfig;
  readonly events: EventBus;
  readonly fighters: readonly [Fighter, Fighter];
  readonly rng: Rng;
  tick(): number;
  /** Applique un coup par le chemin commun (parade, étourdissement, recul, dégâts). */
  applyHit(hit: PendingHit, victim: Fighter, world: DuelWorld): void;
  /** Le défenseur joue sa réaction, s'il est en état de le faire et a l'endurance. */
  playReaction(defender: Fighter, attacker: Fighter, reaction: Reaction): void;
  endIfKo(): void;
  /** Délai avant la prochaine action, en ticks (tirage seedé, comme après un coup simple). */
  drawActionDelay(fighter: Fighter): number;
}

/**
 * Moteur générique de compétences : choix, paiement, lecture de la timeline (pose, impulsion,
 * projectile, fenêtre de coup), raison des coups sans dégâts. Une compétence est une
 * donnée (`SkillSpec`) ; ce code n'en connaît aucune. Les coups passent par le chemin commun du
 * duel (`SkillHost.applyHit`). Émet `skillStart`, `skillCue`, `skillEnd`, `projectileEnd`,
 * `noDamage` ; rendu et effets s'y abonnent. Implémente la story 004.
 */
export class SkillSystem {
  /** Projectiles en vol. */
  readonly projectiles: Projectile[] = [];
  private nextProjectileId = 0;

  constructor(private readonly host: SkillHost) {
    // Au KO, `tick()` ne tourne plus : les compétences en cours (des deux combattants) sont closes ici,
    // avant que `endIfKo` ne rende la main au vainqueur.
    host.events.on('ko', () => {
      this.projectiles.length = 0;
      for (const fighter of host.fighters) this.endRun(fighter, true);
    });
  }

  /** Vrai si au moins un combattant a une compétence. */
  get enabled(): boolean {
    return this.host.fighters.some((fighter) => fighter.skills.length > 0);
  }

  /** Un tick : fait baisser les recharges et clôt les compétences interrompues (combattant sonné). */
  tick(): void {
    for (const fighter of this.host.fighters) {
      tickCooldowns(fighter.skills, fighter.cooldowns);
      if (fighter.skillRun !== null && fighter.state !== 'skill') this.endRun(fighter, true);
    }
  }

  /** Tente de lancer une compétence ; faux (sans tirage) si le combattant n'en a aucune de possible. */
  tryStart(fighter: Fighter, distance: number, world: DuelWorld): boolean {
    if (fighter.skills.length === 0) return false;
    const { stats } = fighter.spec;
    const context = { distance, stamina: fighter.stamina, mana: fighter.mana, hp: fighter.hp, maxHp: stats.hp, cooldowns: fighter.cooldowns };
    const skill = chooseSkill(fighter.skills, context, stats.intelligence, this.host.config.skills, this.host.rng);
    if (skill === null) return false;
    this.start(fighter, skill, world);
    return true;
  }

  /** Vrai si `attacker` menace son adversaire : coup simple, compétence avant sa dernière fenêtre de coup, ou projectile en route. */
  threatens(attacker: Fighter): boolean {
    if (attacker.state === 'attack') return true;
    if (attacker.state === 'skill' && attacker.skillRun?.threatening === true) return true;
    for (const projectile of this.projectiles) {
      if (projectile.owner === attacker.index && !projectile.passed) return true;
    }
    return false;
  }

  /** Un tick d'une compétence en cours : entrée de phase, réaction de l'adversaire, avance, coup raté, fin. */
  act(fighter: Fighter, world: DuelWorld): void {
    const run = fighter.skillRun;
    if (run === null) return;
    const opponent = this.host.fighters[1 - fighter.index];
    if (run.takeEntry()) this.enter(fighter, opponent, run, world);
    if (run.elapsed === this.reactionTick(run)) this.playPlannedReaction(fighter, opponent);
    const wasStriking = run.strikeWindow;
    if (fighter.hasHit && run.phase.endOnHit === true) run.skipPhase();
    else run.advance();
    if (wasStriking && !run.strikeWindow && !fighter.hasHit) this.reportNoContact(fighter, opponent, run, world);
    if (run.finished) {
      fighter.machine.transition('idle');
      this.endRun(fighter, false);
    }
  }

  /** Tick (depuis le lancement) où l'adversaire joue sa réaction : `reactions.leadMs` avant la première fenêtre de coup ; `null` sans fenêtre. */
  private reactionTick(run: SkillRun): number | null {
    const strikeTick = run.firstStrikeTick;
    if (strikeTick === null) return null;
    const { reactions, stepHz } = this.host.config;
    return Math.max(1, strikeTick - msToTicks(reactions.leadMs, stepHz));
  }

  /** L'adversaire joue la réaction tirée au lancement de la compétence. */
  private playPlannedReaction(fighter: Fighter, opponent: Fighter): void {
    const reaction = fighter.plannedReaction;
    fighter.plannedReaction = 'none';
    this.host.playReaction(opponent, fighter, reaction);
  }

  /** La fenêtre de coup se ferme sans contact : « Esquivé » si l'adversaire esquive, sinon « Raté ». */
  private reportNoContact(fighter: Fighter, opponent: Fighter, run: SkillRun, world: DuelWorld): void {
    const reason = opponent.state === 'dodge' ? 'dodged' : 'missed';
    emitNoDamage(this.host.events, world, this.host.tick(), fighter, opponent, reason, run.skill.id);
  }

  /** Fait voler les projectiles, dans l'ordre de lancement : réaction du défenseur, touche, esquive, sortie de l'arène. */
  stepProjectiles(world: DuelWorld): void {
    let index = 0;
    while (index < this.projectiles.length) {
      if (!this.stepProjectile(this.projectiles[index], world)) index += 1;
    }
  }

  /** Nombres décrivant l'état des compétences, pour l'empreinte du duel ; vide sans compétences. */
  snapshot(): number[] {
    if (!this.enabled) return [];
    const values: number[] = [];
    for (const fighter of this.host.fighters) {
      const run = fighter.skillRun;
      values.push(run === null ? -1 : run.phaseIndex, run === null ? -1 : run.ticks);
      for (const skill of fighter.skills) values.push(fighter.cooldowns[skill.id] ?? 0);
    }
    for (const projectile of this.projectiles) values.push(projectile.x, projectile.y, projectile.vx, projectile.vy);
    return values;
  }

  /** Un tick d'un projectile ; vrai s'il a quitté la liste (touche, sortie, ou KO qui la vide). */
  private stepProjectile(projectile: Projectile, world: DuelWorld): boolean {
    const victim = this.host.fighters[1 - projectile.owner];
    this.advance(projectile, world, victim);
    const near = this.nearestHitPart(projectile, world, victim);
    this.reactWhenClose(projectile, victim, near);
    if (near <= projectile.spec.hitRadius && this.touch(projectile, victim, world)) return true;
    return this.leaveIfOut(projectile, world, victim);
  }

  /** Avance d'un pas ; le projectile est « passé » une fois au-delà de sa cible. */
  private advance(projectile: Projectile, world: DuelWorld, victim: Fighter): void {
    projectile.x += projectile.vx;
    projectile.y += projectile.vy;
    projectile.ticksLeft -= 1;
    if ((world.fighterX(victim.index) - projectile.x) * projectile.vx < 0) projectile.passed = true;
  }

  /** Distance (px) à la plus proche des parties visées de la victime. */
  private nearestHitPart(projectile: Projectile, world: DuelWorld, victim: Fighter): number {
    let near = Number.POSITIVE_INFINITY;
    for (const part of projectile.spec.hitParts) {
      const at = world.readPart(victim.index, part);
      near = Math.min(near, Math.hypot(at.x - projectile.x, at.y - projectile.y));
    }
    return near;
  }

  /** La victime joue sa réaction quand le projectile arrive à la distance d'anticipation (`reactions.leadMs`). */
  private reactWhenClose(projectile: Projectile, victim: Fighter, near: number): void {
    const { config } = this.host;
    const leadReach = projectile.spec.speed * msToTicks(config.reactions.leadMs, config.stepHz);
    if (projectile.reactionPlayed || near > leadReach) return;
    projectile.reactionPlayed = true;
    this.host.playReaction(victim, this.host.fighters[projectile.owner], projectile.reaction);
  }

  /** Projectile au contact : esquivé (il continue sa course), ou coup par le chemin commun. Vrai s'il a touché. */
  private touch(projectile: Projectile, victim: Fighter, world: DuelWorld): boolean {
    const { config, events } = this.host;
    const { skill, spec } = projectile;
    const owner = this.host.fighters[projectile.owner];
    if (victim.state === 'dodge' && skill.reactions.dodgeable) {
      projectile.passed = true;
      if (!projectile.reported) emitNoDamage(events, world, this.host.tick(), owner, victim, 'dodged', skill.id);
      projectile.reported = true;
      return false;
    }
    if (projectile.reported) return false;
    this.remove(projectile, 'hit');
    const damage = skillDamage(config, skill.hit, owner.spec.stats, spec.speed);
    const point = { x: projectile.x, y: projectile.y };
    const hit: PendingHit = { attacker: owner, part: spec.spawnPart, impactSpeed: spec.speed, damage, skill: skill.id, point, parryable: skill.reactions.parryable, ranged: true };
    this.host.applyHit(hit, victim, world);
    this.host.endIfKo();
    return true;
  }

  /** Retire le projectile en fin de vie ou hors de l'arène (« Raté » s'il n'a encore rien rapporté). Vrai s'il est retiré. */
  private leaveIfOut(projectile: Projectile, world: DuelWorld, victim: Fighter): boolean {
    const { arena } = this.host.config;
    const groundY = arena.height - arena.groundHeight;
    const out = projectile.ticksLeft <= 0 || projectile.x < 0 || projectile.x > arena.width || projectile.y > groundY;
    if (!out) return false;
    if (!projectile.reported) {
      const owner = this.host.fighters[projectile.owner];
      emitNoDamage(this.host.events, world, this.host.tick(), owner, victim, 'missed', projectile.skill.id, { x: projectile.x, y: projectile.y });
    }
    this.remove(projectile, projectile.reported ? 'dodged' : 'missed');
    return true;
  }

  private start(fighter: Fighter, skill: SkillSpec, world: DuelWorld): void {
    const { config, events } = this.host;
    const opponent = this.host.fighters[1 - fighter.index];
    fighter.spendStamina(skill.cost.stamina);
    fighter.spendMana(skill.cost.mana);
    fighter.cooldowns[skill.id] = msToTicks(skill.cooldownMs, config.stepHz);
    fighter.hasHit = false;
    fighter.comboHits = 1;
    const target = { x: world.fighterX(opponent.index), y: config.arena.height - config.arena.groundHeight };
    fighter.skillRun = new SkillRun(skill, config.stepHz, target);
    fighter.machine.transition('skill');
    fighter.actionTicksLeft = this.host.drawActionDelay(fighter);
    const melee = skill.timeline.some((phase) => phase.strikeWindow === true);
    fighter.plannedReaction = melee ? rollReaction(config.reactions, opponent, this.host.rng, skill.reactions) : 'none';
    events.emit('skillStart', { tick: this.host.tick(), fighter: fighter.index, skill: skill.id, target });
  }

  private enter(fighter: Fighter, opponent: Fighter, run: SkillRun, world: DuelWorld): void {
    const { phase } = run;
    if (phase.impulse !== undefined) {
      const { impulse } = phase;
      const goalX = run.target.x - fighter.facing * impulse.standoff;
      const aim = aimLaunch({
        dx: goalX - world.fighterX(fighter.index),
        dy: 0,
        ticks: run.flightTicks,
        gravity: world.gravityPerStep(),
        drag: fighter.spec.body.frictionAir,
        maxSpeedX: impulse.maxSpeedX,
        maxSpeedY: impulse.maxSpeedY,
      });
      world.impulse(fighter.index, aim.vx, aim.vy);
    }
    if (phase.projectile !== undefined) this.launch(fighter, opponent, run.skill, phase.projectile, world);
    if (phase.cue !== undefined) {
      const at = world.readPart(fighter.index, 'torso');
      this.host.events.emit('skillCue', { tick: this.host.tick(), fighter: fighter.index, skill: run.skill.id, cue: phase.cue, x: at.x, y: at.y });
    }
  }

  private launch(fighter: Fighter, opponent: Fighter, skill: SkillSpec, spec: SkillProjectile, world: DuelWorld): void {
    const { config, rng } = this.host;
    this.projectiles.push(createProjectile({ id: this.nextProjectileId++, fighter, opponent, skill, spec, config, rng }, world));
  }

  private remove(projectile: Projectile, reason: 'hit' | 'dodged' | 'missed'): void {
    this.projectiles.splice(this.projectiles.indexOf(projectile), 1);
    this.host.events.emit('projectileEnd', { tick: this.host.tick(), fighter: projectile.owner, skill: projectile.skill.id, id: projectile.id, reason, x: projectile.x, y: projectile.y });
  }

  private endRun(fighter: Fighter, interrupted: boolean): void {
    const run = fighter.skillRun;
    fighter.skillRun = null;
    if (run !== null) this.host.events.emit('skillEnd', { tick: this.host.tick(), fighter: fighter.index, skill: run.skill.id, interrupted });
  }
}
