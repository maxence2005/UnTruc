import { msToTicks } from './duel-config';
import type { FighterIntent } from './duel-world';
import type { FighterSpec } from './fighter-spec';
import { FighterStateMachine, type FighterState } from './fighter-state';
import { lerpPose, type Pose } from './pose';

/** Direction du regard : 1 = vers la droite de l'écran, -1 = vers la gauche. */
export type Facing = 1 | -1;

/**
 * État d'un combattant pendant un duel : PV, machine à états, et les ordres
 * (pose cible, force) que la logique envoie à la physique à chaque tick.
 */
export class Fighter {
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
  readonly stunTicks: number;
  private readonly walkCycleTicks: number;

  constructor(
    readonly index: number,
    readonly spec: FighterSpec,
    readonly facing: Facing,
    stepHz: number,
  ) {
    this.hp = spec.maxHp;
    this.windupTicks = msToTicks(spec.attack.windupMs, stepHz);
    this.strikeTicks = msToTicks(spec.attack.strikeMs, stepHz);
    this.recoveryTicks = msToTicks(spec.attack.recoveryMs, stepHz);
    this.stunTicks = msToTicks(spec.stunMs, stepHz);
    this.walkCycleTicks = msToTicks(spec.walk.cycleMs, stepHz);
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
    };
    if (this.state === 'approach') {
      intent.walkVelocity = this.facing * spec.walk.speed;
    } else if (this.inStrikeWindow) {
      intent.walkVelocity = this.facing * spec.attack.lungeSpeed;
      intent.armBoost = spec.attack.strikeArmBoost;
    }
    return intent;
  }

  private pose(): Pose {
    const { spec } = this;
    const ticks = this.machine.ticksInState;
    switch (this.state) {
      case 'idle':
        return spec.stance;
      case 'approach':
        return this.walkPose(ticks);
      case 'attack': {
        if (ticks < this.windupTicks) {
          return lerpPose(spec.stance, spec.attack.windupPose, ticks / this.windupTicks);
        }
        const t = Math.min(1, (ticks - this.windupTicks) / this.strikeTicks);
        return lerpPose(spec.attack.windupPose, spec.attack.strikePose, t);
      }
      case 'recovery':
        return lerpPose(spec.attack.strikePose, spec.stance, Math.min(1, ticks / this.recoveryTicks));
      case 'stunned':
      case 'ko':
        return spec.slump;
    }
  }

  private walkPose(ticks: number): Pose {
    const { stance, walk } = this.spec;
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
