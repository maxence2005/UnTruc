import { msToTicks, type DuelConfig } from './duel-config';
import type { FighterIntent, WeaponIntent } from './duel-world';
import { resolveAttack, resolveParry, resolveStance } from './equipment';
import type { Facing } from './facing';
import type { AttackSpec, FighterSpec } from './fighter-spec';
import { FighterStateMachine, type FighterState } from './fighter-state';
import { lerpPose, type Pose } from './pose';
import type { Reaction } from './reactions';
import { staminaRegenPerTick, walkSpeedScale } from './stats';

export type { Facing } from './facing';

/**
 * État d'un combattant pendant un duel : PV, machine à états, et les ordres
 * (pose cible, force) que la logique envoie à la physique à chaque tick.
 */
export class Fighter {
  /** Attaque jouée : celle de l'arme tenue, sinon les poings (`resolveAttack`). */
  readonly attack: AttackSpec;
  /** Posture au repos, retouchée par l'arme tenue (`resolveStance`). */
  readonly stance: Pose;
  /** Posture de parade (`resolveParry`) ; `null` si l'arme tenue n'a pas de garde. */
  readonly parryPose: Pose | null;
  /** Machine à états du combattant. */
  readonly machine = new FighterStateMachine();
  /** Points de vie restants ; 0 = KO. */
  hp: number;
  /** Vrai une fois que l'attaque en cours a touché (un seul coup par attaque). */
  hasHit = false;
  /** Ticks restants avant la prochaine attaque ; ne baisse qu'à l'arrêt ou en approche. */
  actionTicksLeft = 0;
  readonly windupTicks: number;
  readonly strikeTicks: number;
  readonly recoveryTicks: number;
  /** Durée de l'étourdissement en cours, calculée à chaque coup reçu (`stunTicksFor`). */
  stunTicks = 0;
  /** Ticks déjà passés sonné dans la série d'étourdissements en cours (plafond : `maxStunSeriesMs`). */
  stunSeriesTicks = 0;
  /** Réaction que l'adversaire jouera contre l'attaque en cours de ce combattant, décidée à son lancement. */
  plannedReaction: Reaction = 'none';
  /** Rang du coup en cours dans sa série d'enchaînements (1 = coup isolé). */
  comboHits = 0;
  /** Tick de l'attaque (compté depuis son début) où l'adversaire lance sa réaction. */
  readonly reactionTick: number;
  /** Endurance restante (voir `spendStamina`, `recoverStamina`). */
  stamina: number;
  /** Mana restant (voir `spendMana`). */
  mana: number;
  /** Regard courant, vers l'adversaire ; change par `updateFacing` (core), lu par la physique (`FighterIntent.facing`) et le rendu. */
  facing: Facing;
  /** Ticks consécutifs passés avec l'adversaire franchement derrière soi (voir `updateFacing`). */
  turnTicks = 0;
  private readonly walkCycleTicks: number;
  private readonly walkSpeed: number;
  private readonly dodgeRetreatSpeed: number;
  private readonly staminaRegen: number;

  constructor(
    readonly index: number,
    readonly spec: FighterSpec,
    facing: Facing,
    config: DuelConfig,
  ) {
    const { stepHz } = config;
    this.facing = facing;
    this.attack = resolveAttack(spec);
    this.stance = resolveStance(spec);
    this.parryPose = resolveParry(spec);
    this.hp = spec.stats.hp;
    this.stamina = spec.stats.stamina;
    this.mana = spec.stats.mana;
    this.windupTicks = msToTicks(this.attack.windupMs, stepHz);
    this.strikeTicks = msToTicks(this.attack.strikeMs, stepHz);
    this.recoveryTicks = msToTicks(this.attack.recoveryMs, stepHz);
    this.walkCycleTicks = msToTicks(spec.walk.cycleMs, stepHz);
    this.reactionTick = Math.max(1, this.windupTicks - msToTicks(config.reactions.leadMs, stepHz));
    this.walkSpeed = spec.walk.speed * walkSpeedScale(config, spec.stats);
    this.dodgeRetreatSpeed = config.reactions.dodgeRetreatSpeed;
    this.staminaRegen = staminaRegenPerTick(config, spec.stats);
  }

  /** Vrai si le combattant peut parer : aux poings, ou avec une arme qui a une garde. */
  get canParry(): boolean {
    return this.parryPose !== null;
  }

  /** Regagne un tick d'endurance, hors attaque, réaction et KO ; plafonné à la stat `stamina`. */
  recoverStamina(): void {
    if (this.state === 'attack' || this.state === 'dodge' || this.state === 'parry' || this.state === 'ko') return;
    this.stamina = Math.min(this.spec.stats.stamina, this.stamina + this.staminaRegen);
  }

  /** Dépense de l'endurance ; ne descend pas sous 0. */
  spendStamina(amount: number): void {
    this.stamina = Math.max(0, this.stamina - amount);
  }

  /** Dépense du mana ; ne descend pas sous 0. */
  spendMana(amount: number): void {
    this.mana = Math.max(0, this.mana - amount);
  }

  /** État courant (raccourci vers la machine à états). */
  get state(): FighterState {
    return this.machine.state;
  }

  /** Vrai pendant la phase de frappe d'une attaque, la seule où un contact compte comme un coup. */
  get inStrikeWindow(): boolean {
    if (this.state !== 'attack') return false;
    const ticks = this.machine.ticksInState;
    return ticks >= this.windupTicks && ticks < this.windupTicks + this.strikeTicks;
  }

  /** Ordres pour le prochain pas physique, déduits de l'état courant. */
  intent(): FighterIntent {
    const { spec } = this;
    const tuning = spec.stateTuning[this.state];
    const intent: FighterIntent = {
      pose: this.pose(),
      walkVelocity: 0,
      strength: tuning.strength,
      support: tuning.support,
      armBoost: 1,
      facing: this.facing,
    };
    if (this.state === 'approach') {
      intent.walkVelocity = this.facing * this.walkSpeed;
    } else if (this.state === 'dodge') {
      intent.walkVelocity = -this.facing * this.dodgeRetreatSpeed;
    } else if (this.inStrikeWindow) {
      intent.walkVelocity = this.facing * this.attack.lungeSpeed;
      intent.armBoost = this.attack.strikeArmBoost;
    }
    if (spec.weapon !== undefined) intent.weapon = this.weaponIntent();
    return intent;
  }

  /**
   * Ordres pour l'arme : l'angle suit les mêmes phases que la pose (repos,
   * armement, frappe, récupération), et l'élan est donné une seule fois, au
   * premier tick de la frappe.
   */
  private weaponIntent(): WeaponIntent {
    const weapon = this.spec.weapon!;
    const { attack } = weapon;
    const ticks = this.machine.ticksInState;
    const mix = (from: number, to: number, t: number) => from + (to - from) * t;
    let angle = weapon.stanceAngle;
    if (this.state === 'attack') {
      angle =
        ticks < this.windupTicks
          ? mix(weapon.stanceAngle, attack.windupAngle, ticks / this.windupTicks)
          : mix(attack.windupAngle, attack.strikeAngle, Math.min(1, (ticks - this.windupTicks) / this.strikeTicks));
    } else if (this.state === 'recovery') {
      angle = mix(attack.strikeAngle, weapon.stanceAngle, Math.min(1, ticks / this.recoveryTicks));
    } else if (this.state === 'parry' && weapon.guard !== undefined) {
      angle = weapon.guard.angle;
    }
    const kicking = this.state === 'attack' && ticks === this.windupTicks;
    const { kick } = attack;
    return { angle, kick: kicking ? { x: this.facing * kick.forward, y: kick.down, spin: this.facing * (kick.spin ?? 0) } : null };
  }

  private pose(): Pose {
    const { spec } = this;
    const ticks = this.machine.ticksInState;
    switch (this.state) {
      case 'idle':
        return this.stance;
      case 'approach':
        return this.walkPose(ticks);
      case 'attack': {
        if (ticks < this.windupTicks) {
          return lerpPose(this.stance, this.attack.windupPose, ticks / this.windupTicks);
        }
        const t = Math.min(1, (ticks - this.windupTicks) / this.strikeTicks);
        return lerpPose(this.attack.windupPose, this.attack.strikePose, t);
      }
      case 'recovery':
        return lerpPose(this.attack.strikePose, this.stance, Math.min(1, ticks / this.recoveryTicks));
      case 'dodge':
        return spec.dodgePose;
      case 'parry':
        return this.parryPose ?? this.stance;
      case 'stunned':
      case 'ko':
        return spec.slump;
    }
  }

  private walkPose(ticks: number): Pose {
    const { walk } = this.spec;
    const { stance } = this;
    const phase = (2 * Math.PI * ticks) / this.walkCycleTicks;
    const swing = Math.sin(phase) * walk.hipSwing;
    return {
      ...stance,
      hipFront: stance.hipFront + swing,
      hipBack: stance.hipBack - swing,
      kneeFront: stance.kneeFront + walk.kneeBend * Math.max(0, Math.sin(phase + walk.kneeBendPhase)),
      kneeBack: stance.kneeBack + walk.kneeBend * Math.max(0, -Math.sin(phase + walk.kneeBendPhase)),
    };
  }
}
