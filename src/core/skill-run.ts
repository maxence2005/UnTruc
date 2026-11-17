import { msToTicks } from './duel-config';
import { lerpPose, applyPatch, type Pose } from './pose';
import type { SkillPhase, SkillSpec } from './skill-spec';

/** Un point du sol visé au lancement. */
export interface AimPoint {
  x: number;
  y: number;
}

/** Lecture de la timeline d'une compétence en cours : phase courante, ticks écoulés, pose du moment. */
export class SkillRun {
  /** Index de la phase courante. */
  phaseIndex = 0;
  /** Ticks passés dans la phase courante. */
  ticks = 0;
  /** Ticks depuis le lancement. */
  elapsed = 0;
  /** Tick (depuis le lancement) où commence la première fenêtre de coup, ou `null` s'il n'y en a pas. Fixé au lancement. */
  readonly firstStrikeTick: number | null;
  private readonly phaseTicks: readonly number[];
  /** Index de la dernière phase à fenêtre de coup, -1 s'il n'y en a pas. */
  private readonly lastStrikePhase: number;
  private entry = true;

  constructor(
    readonly skill: SkillSpec,
    stepHz: number,
    /** Point visé, fixé au lancement et montré au spectateur. */
    readonly target: AimPoint,
  ) {
    this.phaseTicks = skill.timeline.map((phase) => msToTicks(phase.durationMs, stepHz));
    let first = -1;
    let last = -1;
    skill.timeline.forEach((phase, index) => {
      if (phase.strikeWindow !== true) return;
      if (first < 0) first = index;
      last = index;
    });
    this.lastStrikePhase = last;
    this.firstStrikeTick = first < 0 ? null : this.phaseTicks.slice(0, first).reduce((sum, ticks) => sum + ticks, 0);
  }

  /** Phase courante. */
  get phase(): SkillPhase {
    return this.skill.timeline[this.phaseIndex];
  }

  /** Vrai une fois toutes les phases jouées. */
  get finished(): boolean {
    return this.phaseIndex >= this.skill.timeline.length;
  }

  /** Vrai pendant une phase où un contact compte comme un coup. */
  get strikeWindow(): boolean {
    return !this.finished && this.phase.strikeWindow === true;
  }

  /** Vrai tant que la phase ne rend pas la main au maintien debout. */
  get airborne(): boolean {
    return !this.finished && this.phase.airborne === true;
  }

  /** Vrai jusqu'à la fin de la dernière fenêtre de coup : l'adversaire se sent menacé (voir `SkillSystem.threatens`). */
  get threatening(): boolean {
    return this.lastStrikePhase >= 0 && this.phaseIndex <= this.lastStrikePhase;
  }

  /** Durée de vol, en ticks, d'un saut lancé à l'entrée de la phase courante : elle et les phases en l'air qui la suivent. */
  get flightTicks(): number {
    let total = 0;
    for (let index = this.phaseIndex; index < this.phaseTicks.length && this.skill.timeline[index].airborne === true; index += 1) {
      total += this.phaseTicks[index];
    }
    return total;
  }

  /** Vrai une seule fois à l'entrée de chaque phase : le moment de l'impulsion, du projectile et de l'événement de rendu. */
  takeEntry(): boolean {
    const entered = this.entry && !this.finished;
    this.entry = false;
    return entered;
  }

  /** Avance d'un tick ; passe à la phase suivante quand la durée est écoulée. */
  advance(): void {
    this.elapsed += 1;
    this.ticks += 1;
    if (this.ticks >= this.phaseTicks[this.phaseIndex]) this.nextPhase();
  }

  /** Joue un tick qui clôt aussitôt la phase courante (coup porté d'une phase `endOnHit`) ; compte dans `elapsed` comme `advance`. */
  skipPhase(): void {
    this.elapsed += 1;
    this.nextPhase();
  }

  private nextPhase(): void {
    this.phaseIndex += 1;
    this.ticks = 0;
    this.entry = true;
  }

  /** Pose voulue : la retouche de la phase courante, interpolée depuis celle de la précédente (la posture au départ). */
  pose(stance: Pose): Pose {
    if (this.finished) return stance;
    const { timeline } = this.skill;
    const from = this.phaseIndex === 0 ? stance : applyPatch(stance, timeline[this.phaseIndex - 1].pose);
    const to = applyPatch(stance, this.phase.pose);
    return lerpPose(from, to, Math.min(1, (this.ticks + 1) / this.phaseTicks[this.phaseIndex]));
  }
}
