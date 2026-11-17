import * as Phaser from 'phaser';
import type { ArenaConfig } from '../core/duel-config';
import type { DuelWorld } from '../core/duel-world';
import type { EventBus } from '../core/events';
import type { CueEffect, PresentationConfig } from '../core/presentation-config';
import { createRng } from '../core/rng';
import type { Projectile } from '../core/skill-system';
import { FireballFx } from './fx/fireball';
import type { ImpactFx } from './fx/impact-fx';
import { ShockwaveFx } from './fx/shockwave';
import { SparkFx } from './fx/sparks';
import { TrailFx } from './fx/trail';
import { FX_DEPTH } from './fighter-view';
import { SkillLabels } from './skill-labels';
import { SkillMarker } from './skill-marker';

const UP = -Math.PI / 2;

/**
 * Retour visuel des compétences (story 004) : nom au lancement, cible marquée, raison d'un coup sans
 * dégâts, et les effets de chaque compétence (étincelles, onde de choc, flash, traînée, ralenti, boule
 * de feu). Tout s'abonne aux événements du duel (`skillStart`, `skillCue`, `skillEnd`, `ko`, `hit`,
 * `projectileEnd`, `noDamage`) ; la logique de `core/` ne l'appelle jamais. Ce qui s'affiche
 * (textes, tailles, couleurs, effets par événement) vient de `PresentationConfig.skills`. Le
 * ralenti et le flash passent par `ImpactFx`, pour une seule échelle de temps ; le nombre de
 * combattants aussi (`ImpactFx.fighters`).
 */
export class SkillFx {
  private readonly layer: Phaser.GameObjects.Graphics;
  private readonly sparks: SparkFx;
  private readonly shockwaves: ShockwaveFx;
  private readonly fireballs: FireballFx;
  private readonly trails: TrailFx;
  private readonly marker: SkillMarker;
  private readonly labels: SkillLabels;
  private readonly fighters: number;
  private readonly flying = new Set<number>();
  private readonly seen = new Set<number>();
  /** Lecteurs créés une fois : `update` les passe à chaque image sans allouer de fermeture. */
  private readonly torsoOf = (fighter: number) => this.world.readPart(fighter, 'torso');
  private readonly headOf = (fighter: number) => this.world.readPart(fighter, 'head');
  private destroyed = false;

  constructor(
    scene: Phaser.Scene,
    bus: EventBus,
    private readonly world: DuelWorld,
    private readonly impact: ImpactFx,
    private readonly arena: ArenaConfig,
    private readonly projectiles: () => readonly Projectile[],
    private readonly presentation: PresentationConfig,
  ) {
    const { fx, skills } = presentation;
    this.fighters = impact.fighters;
    this.layer = scene.add.graphics().setDepth(FX_DEPTH);
    this.sparks = new SparkFx(fx.sparks, createRng(fx.seed + 1));
    this.shockwaves = new ShockwaveFx(fx.shockwave);
    this.fireballs = new FireballFx(fx.fireball, () => undefined);
    this.trails = new TrailFx(this.fighters, skills.trail);
    this.marker = new SkillMarker(this.fighters, skills.marker);
    this.labels = new SkillLabels(scene, this.fighters, skills.banner, skills.reasons, this.headOf);
    this.listenToSkills(bus);
    this.listenToOutcomes(bus);
  }

  /** À appeler une fois par image, après `ImpactFx.update`, avec le temps réel écoulé (plafonné). */
  update(realMs: number): void {
    if (this.destroyed) return;
    const dtMs = realMs * this.impact.timeScale;
    this.syncFireballs();
    this.sparks.update(dtMs);
    this.shockwaves.update(dtMs);
    this.fireballs.update(dtMs);
    this.trails.update(dtMs, this.torsoOf);
    this.labels.update(dtMs);
    this.layer.clear();
    this.trails.draw(this.layer);
    this.marker.draw(this.layer, this.torsoOf);
    this.shockwaves.draw(this.layer);
    this.sparks.draw(this.layer);
    this.fireballs.draw(this.layer);
  }

  /** Coupe les réactions aux événements ; les objets Phaser sont détruits avec la scène. */
  destroy(): void {
    this.destroyed = true;
  }

  /** Vie d'une compétence : lancement (nom, cible), événements de phase, fin, et KO qui l'interrompt. */
  private listenToSkills(bus: EventBus): void {
    const { skills } = this.presentation;
    bus.on('skillStart', ({ fighter, skill, target }) => {
      const look = skills.byId[skill];
      if (this.destroyed || look === undefined) return;
      this.labels.showName(fighter, look.name, look.color);
      if (look.marker) this.marker.show(fighter, target.x, target.y, look.color);
    });
    bus.on('skillCue', ({ fighter, skill, cue }) => {
      const effect = skills.byId[skill]?.cues[cue];
      if (this.destroyed || effect === undefined) return;
      this.apply(effect, fighter, this.anchor(effect, fighter), skill);
    });
    bus.on('skillEnd', ({ fighter }) => {
      if (this.destroyed) return;
      this.trails.stop(fighter);
      this.marker.hide(fighter);
    });
    // Le KO clôt déjà les compétences en cours (`skillEnd` interrompu) ; ceci garantit en plus que rien ne reste dessiné.
    bus.on('ko', () => {
      if (this.destroyed) return;
      for (let fighter = 0; fighter < this.fighters; fighter += 1) {
        this.trails.stop(fighter);
        this.marker.hide(fighter);
      }
    });
  }

  /** Issues d'un coup : touché, projectile arrêté sans toucher, coup sans dégâts. */
  private listenToOutcomes(bus: EventBus): void {
    const { skills } = this.presentation;
    bus.on('hit', (hit) => {
      const effect = hit.skill === undefined ? undefined : skills.byId[hit.skill]?.onHit;
      if (this.destroyed || effect === undefined) return;
      this.apply(effect, hit.attacker, hit.point ?? this.world.readPart(hit.victim, 'torso'), hit.skill!);
    });
    bus.on('projectileEnd', ({ skill, fighter, reason, x, y }) => {
      const effect = reason === 'hit' ? undefined : skills.byId[skill]?.onMiss;
      if (!this.destroyed && effect !== undefined) this.apply(effect, fighter, { x, y }, skill);
    });
    bus.on('noDamage', ({ reason, x, y }) => {
      if (!this.destroyed) this.labels.showReason(reason, x, y - skills.reasons.lift);
    });
  }

  private anchor(effect: CueEffect, fighter: number): { x: number; y: number } {
    if (effect.anchor === 'feet') return { x: this.world.readPart(fighter, 'torso').x, y: this.arena.height - this.arena.groundHeight };
    return this.world.readPart(fighter, effect.anchor === 'hand' ? 'foreArmFront' : 'torso');
  }

  private apply(effect: CueEffect, fighter: number, at: { x: number; y: number }, skill: string): void {
    const { slowmo } = this.presentation.fx;
    if (effect.sparks !== undefined) this.sparks.emit(at.x, at.y, effect.sparks, UP, 1);
    if (effect.shockwave !== undefined) this.shockwaves.emit(at.x, at.y, effect.shockwave);
    if (effect.flash === true) this.impact.flash.start(fighter);
    if (effect.trail === 'start') this.trails.start(fighter, this.presentation.skills.byId[skill].color);
    if (effect.trail === 'stop') this.trails.stop(fighter);
    if (effect.hideMarker === true) this.marker.hide(fighter);
    if (effect.slowmo === true) this.impact.timer.trigger(slowmo.scale, slowmo.durationMs, slowmo.rampMs);
  }

  private syncFireballs(): void {
    this.seen.clear();
    for (const projectile of this.projectiles()) {
      this.fireballs.place(projectile.id, projectile.x, projectile.y);
      this.seen.add(projectile.id);
    }
    for (const id of this.flying) if (!this.seen.has(id)) this.fireballs.release(id);
    this.flying.clear();
    for (const id of this.seen) this.flying.add(id);
  }
}
