import type * as Phaser from 'phaser';
import type { ArenaConfig } from '../core/duel-config';
import type { DuelWorld, PartTransform } from '../core/duel-world';
import type { DuelEvents, EventBus } from '../core/events';
import type { PresentationConfig } from '../core/presentation-config';
import { createRng } from '../core/rng';
import type { ScratchLook, StageFlashLook, StageLook } from '../core/stage-presentation';
import { CosmeticView, type InkLook } from './cosmetic-view';
import { DEPTH_STRIDE, FX_DEPTH } from './fighter-view';
import { FlashLimiter } from './fx/flash-limiter';
import { GrowlWave } from './fx/growl-wave';
import type { ImpactFx } from './fx/impact-fx';
import { ScratchPool, scratchAngle } from './fx/scratches';
import { SparkFx } from './fx/sparks';
import { arenaShake, leavesScratches, scratchLooksByForm } from './stage-look';

const UP = -Math.PI / 2;
/** Éclairs de stade affichables en même temps (deux combattants, deux stades chacun). */
const MAX_PULSES = 4;

interface Pulse {
  alive: boolean;
  fighter: number;
  ageMs: number;
  look: StageFlashLook | null;
}

/**
 * Rendu des compétences à déclenchement (story 005) : cosmétiques posés par un stade (oreilles, museau,
 * griffes, queue), onde du grognement et tremblement d'écran, éclair et éclat de particules au déclenchement,
 * ralenti, griffures à l'impact des coups portés sous une forme. S'abonne à `skillTrigger` et `hit` ; la
 * logique ne l'appelle jamais. Tout ce qui s'affiche vient de `SkillLook.stages` (`content/presentation.ts`).
 * Le nom du stade est affiché par `SkillFx` (bandeau commun).
 */
export class TransformationFx {
  private readonly layer: Phaser.GameObjects.Graphics;
  private readonly views: CosmeticView[];
  private readonly scratchLooks: Map<string, ScratchLook>;
  private readonly scratches = new Map<string, ScratchPool>();
  private readonly bursts = new Map<string, SparkFx>();
  /** Les mêmes pools en tableaux, parcourus à chaque image sans itérateur. */
  private readonly scratchList: ScratchPool[] = [];
  private readonly burstList: SparkFx[] = [];
  private readonly pulses: Pulse[] = Array.from({ length: MAX_PULSES }, () => ({ alive: false, fighter: 0, ageMs: 0, look: null }));
  private readonly growl: GrowlWave;
  private readonly limiter: FlashLimiter;
  private readonly part: PartTransform = { x: 0, y: 0, angle: 0 };
  private readonly torso: PartTransform = { x: 0, y: 0, angle: 0 };
  private readonly torsoOf = (fighter: number) => this.world.readPart(fighter, 'torso', this.part);
  private readonly headOf = (fighter: number) => this.world.readPart(fighter, 'head', this.part);
  private destroyed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    bus: EventBus,
    private readonly world: DuelWorld,
    private readonly impact: ImpactFx,
    arena: ArenaConfig,
    private readonly presentation: PresentationConfig,
    inks: readonly InkLook[],
    private readonly facing: (fighter: number) => number,
    private readonly reducedMotion: boolean,
  ) {
    const { skills, fx } = presentation;
    this.layer = scene.add.graphics().setDepth(FX_DEPTH);
    this.views = inks.map((ink, fighter) => new CosmeticView(scene, world, fighter, () => facing(fighter), ink, fighter * DEPTH_STRIDE));
    this.scratchLooks = scratchLooksByForm(skills);
    for (const [form, look] of this.scratchLooks) {
      const pool = new ScratchPool(look);
      this.scratches.set(form, pool);
      this.scratchList.push(pool);
    }
    for (const [skill, look] of Object.entries(skills.byId)) {
      for (const [stage, stageLook] of Object.entries(look.stages ?? {})) {
        if (stageLook.burst === undefined) continue;
        const sparks = new SparkFx({ ...fx.sparks, colors: stageLook.burst.colors, spreadDeg: stageLook.burst.spreadDeg }, createRng(fx.seed + 2));
        this.bursts.set(`${skill}/${stage}`, sparks);
        this.burstList.push(sparks);
      }
    }
    this.growl = new GrowlWave(Math.hypot(arena.width, arena.height));
    this.limiter = new FlashLimiter(skills.stageFlashLimit.maxFlashes, skills.stageFlashLimit.windowMs);
    bus.on('skillTrigger', (event) => this.onTrigger(event));
    bus.on('hit', (hit) => this.onHit(hit));
  }

  /** À appeler une fois par image, après `ImpactFx.update`, avec le temps réel écoulé (plafonné). */
  update(realMs: number): void {
    if (this.destroyed) return;
    this.limiter.advance(realMs);
    const dtMs = realMs * this.impact.timeScale;
    for (const view of this.views) view.update(dtMs);
    for (const pool of this.scratchList) pool.update(dtMs);
    for (const sparks of this.burstList) sparks.update(dtMs);
    this.growl.update(dtMs);
    this.layer.clear();
    this.drawPulses(dtMs);
    this.growl.draw(this.layer, this.headOf);
    for (const sparks of this.burstList) sparks.draw(this.layer);
    for (const pool of this.scratchList) pool.draw(this.layer, this.torsoOf);
  }

  /** Coupe les réactions aux événements ; les objets Phaser sont détruits avec la scène. */
  destroy(): void {
    this.destroyed = true;
  }

  /** Un stade part : cosmétiques, éclair (limité), éclat, ralenti, onde et tremblement d'arène. */
  private onTrigger(event: DuelEvents['skillTrigger']): void {
    const look = this.presentation.skills.byId[event.skill]?.stages?.[event.stage];
    if (this.destroyed || look === undefined) return;
    for (const cosmetic of look.cosmetics ?? []) this.views[event.fighter].attach(cosmetic);
    if (look.flash !== undefined && this.limiter.tryFlash()) this.startPulse(event.fighter, look.flash);
    if (look.burst !== undefined) this.bursts.get(`${event.skill}/${event.stage}`)?.emit(event.x, event.y, look.burst.count, UP, 1);
    if (look.slowmo === true) {
      const { slowmo } = this.presentation.fx;
      this.impact.timer.trigger(slowmo.scale, slowmo.durationMs, slowmo.rampMs);
    }
    this.startArena(event, look);
  }

  /** Onde dans toute l'arène et tremblement de caméra (coupé en mouvement réduit). */
  private startArena(event: DuelEvents['skillTrigger'], look: StageLook): void {
    if (event.arena === undefined || look.arena === undefined) return;
    this.growl.emit(look.arena, event.fighter, this.facing(event.fighter), event.x, event.y, event.arena.intensity, event.arena.durationMs);
    const shake = arenaShake(event.arena, look.arena, this.reducedMotion);
    if (shake !== null) this.scene.cameras.main.shake(shake.durationMs, shake.intensity, true);
  }

  /** Coup porté sous une forme à griffes : griffures sur la partie touchée, qui suivent la victime. */
  private onHit(hit: DuelEvents['hit']): void {
    if (this.destroyed || !leavesScratches(hit, this.scratchLooks)) return;
    const look = this.scratchLooks.get(hit.form!)!;
    this.world.readPart(hit.victim, 'torso', this.torso);
    const at = hit.point ?? this.world.readPart(hit.victim, hit.part, this.part);
    const dx = at.x - this.torso.x;
    const dy = at.y - this.torso.y;
    const attackerX = this.world.readPart(hit.attacker, 'torso', this.part).x;
    this.scratches.get(hit.form!)!.emit(hit.victim, dx, dy, scratchAngle(attackerX, this.torso.x, look.angleDeg));
  }

  private startPulse(fighter: number, look: StageFlashLook): void {
    const pulse = this.pulses.find((candidate) => !candidate.alive) ?? this.pulses[0];
    pulse.alive = true;
    pulse.fighter = fighter;
    pulse.ageMs = 0;
    pulse.look = look;
  }

  /** Éclair de stade : disque qui grandit et s'efface autour du torse. */
  private drawPulses(dtMs: number): void {
    for (const pulse of this.pulses) {
      if (!pulse.alive || pulse.look === null) continue;
      pulse.ageMs += dtMs;
      const t = pulse.ageMs / pulse.look.durationMs;
      if (t >= 1) {
        pulse.alive = false;
        continue;
      }
      const torso = this.torsoOf(pulse.fighter);
      this.layer.fillStyle(pulse.look.color, pulse.look.alpha * (1 - t));
      this.layer.fillCircle(torso.x, torso.y, pulse.look.radius * (1 + pulse.look.growth * t));
    }
  }
}
