import * as Phaser from 'phaser';
import type { ArenaConfig } from '../../core/duel-config';
import type { DuelWorld } from '../../core/duel-world';
import type { EventBus } from '../../core/events';
import type { FxConfig } from '../../core/presentation-config';
import { createRng } from '../../core/rng';
import { FX_DEPTH, type FighterView } from '../fighter-view';
import { FireballFx } from './fireball';
import { FlashTracker } from './flash';
import { classifyHit, impactPoint } from './hit-impact';
import { ShockwaveFx } from './shockwave';
import { SparkFx } from './sparks';
import { TimeScale } from './time-scale';

/** Profondeur du voile sombre du ralenti : devant le décor (-10), derrière les combattants (0 et plus). */
const VEIL_DEPTH = -5;

/**
 * Effets d'impact : étincelles, onde de choc, flash du touché, ralenti, boule de feu. Ils
 * s'abonnent au bus du duel (`hit`, `ko`) et lisent la physique en lecture seule ; la logique
 * de `core/` ne les appelle jamais. Implémente `design/art/art-bible.md` (« Gros impact »)
 * et la story 003. Le ralenti n'agit que sur `timeScale`, que la scène applique au temps réel
 * qu'elle accumule : le pas de simulation, donc le duel, ne change pas.
 *
 * Les effets avancent en temps d'effet (temps réel x échelle) : ils ralentissent avec le monde.
 * Le bus n'a pas de désabonnement ; `destroy` coupe les réactions (le bus d'un duel fini est jeté).
 */
export class ImpactFx {
  private readonly layer: Phaser.GameObjects.Graphics;
  private readonly veil: Phaser.GameObjects.Graphics;
  private readonly timer = new TimeScale();
  private readonly flash: FlashTracker;
  private readonly sparks: SparkFx;
  private readonly shockwaves: ShockwaveFx;
  private readonly fireballs: FireballFx;
  private demoDelayMs: number | null = null;
  private nextShooter = 0;
  private destroyed = false;
  private layerDirty = false;

  constructor(
    scene: Phaser.Scene,
    bus: EventBus,
    private readonly world: DuelWorld,
    private readonly views: readonly FighterView[],
    private readonly maxHp: (fighter: number) => number,
    arena: ArenaConfig,
    private readonly config: FxConfig,
  ) {
    const rng = createRng(config.seed);
    this.layer = scene.add.graphics().setDepth(FX_DEPTH);
    this.veil = scene.add.graphics().setDepth(VEIL_DEPTH).setAlpha(0);
    this.veil.fillStyle(config.slowmo.veilColor, 1);
    this.veil.fillRect(0, 0, arena.width, arena.height);
    this.flash = new FlashTracker(views.length, config.flash.durationMs, config.flash.peakAlpha);
    this.sparks = new SparkFx(config.sparks, rng);
    this.shockwaves = new ShockwaveFx(config.shockwave);
    this.fireballs = new FireballFx(config.fireball, (x, y) => this.shockwaves.emit(x, y, config.fireball.impactRadius));
    bus.on('hit', (hit) => {
      if (this.destroyed) return;
      const impact = classifyHit(hit.damage, hit.parried, this.maxHp(hit.victim), config.thresholds);
      const victimTorso = this.world.readPart(hit.victim, 'torso');
      const point = impactPoint(this.world.readPart(hit.attacker, hit.part), victimTorso, config.impactPullToVictim);
      const outward = Math.atan2(point.y - victimTorso.y, point.x - victimTorso.x);
      const { sparks } = config;
      const count = impact.sparks === 'strong' ? sparks.strongCount : impact.sparks === 'parried' ? sparks.parriedCount : sparks.count;
      this.sparks.emit(point.x, point.y, count, outward, impact.sparks === 'parried' ? sparks.parriedSpeedScale : 1);
      if (!hit.parried) this.flash.start(hit.victim);
      if (impact.shockwave) this.shockwaves.emit(point.x, point.y, config.shockwave.radius);
      if (impact.slowmo) this.timer.trigger(config.slowmo.scale, config.slowmo.durationMs, config.slowmo.rampMs);
    });
    bus.on('ko', (ko) => {
      if (this.destroyed) return;
      const torso = this.world.readPart(ko.fighter, 'torso');
      this.shockwaves.emit(torso.x, torso.y, config.shockwave.koRadius);
      this.flash.start(ko.fighter);
      this.timer.trigger(config.slowmo.koScale, config.slowmo.koDurationMs, config.slowmo.rampMs);
    });
  }

  /** Échelle de temps à appliquer au temps réel de la boucle (1 hors ralenti). */
  get timeScale(): number {
    return this.timer.value;
  }

  /** Lance la boule de feu du combattant `fighter` vers son adversaire. Aucune compétence ne l'appelle encore. */
  launchFireball(fighter: number): void {
    if (this.destroyed) return;
    const from = this.world.readPart(fighter, 'foreArmFront');
    const to = this.world.readPart(1 - fighter, 'torso');
    this.fireballs.launch(from, to);
  }

  /** Lance une boule de feu à la main, en alternant les tireurs (touche F). */
  launchDemoFireball(): void {
    this.launchFireball(this.nextShooter);
    this.nextShooter = 1 - this.nextShooter;
  }

  /** Programme des boules de feu de démonstration : la première `fireball.demoDelayMs` après le début, puis toutes les `demoRepeatMs` (`?fx=fireball`). */
  scheduleDemoFireball(): void {
    this.demoDelayMs = this.config.fireball.demoDelayMs;
  }

  /** À appeler une fois par image, après les pas de simulation, avec le temps réel écoulé (déjà plafonné) et avant `FighterView.update`. */
  update(realMs: number): void {
    if (this.destroyed) return;
    if (this.demoDelayMs !== null) {
      this.demoDelayMs -= realMs;
      if (this.demoDelayMs <= 0) {
        this.demoDelayMs = this.config.fireball.demoRepeatMs;
        this.launchDemoFireball();
      }
    }
    this.timer.advance(realMs);
    const dtMs = realMs * this.timer.value;
    this.sparks.update(dtMs);
    this.shockwaves.update(dtMs);
    this.fireballs.update(dtMs);
    this.flash.advance(dtMs);
    for (let fighter = 0; fighter < this.views.length; fighter += 1) this.views[fighter].setFlash(this.flash.alpha(fighter));
    const { slowmo } = this.config;
    const span = 1 - slowmo.scale;
    const darkness = span > 0 ? Phaser.Math.Clamp((1 - this.timer.value) / span, 0, 1) : 0;
    this.veil.setAlpha(slowmo.veilAlpha * darkness);
    this.redraw();
  }

  /** Coupe les réactions aux événements ; les objets Phaser sont détruits avec la scène. */
  destroy(): void {
    this.destroyed = true;
  }

  private redraw(): void {
    const active = this.sparks.active || this.shockwaves.active || this.fireballs.active;
    if (!active && !this.layerDirty) return;
    this.layer.clear();
    this.layerDirty = active;
    if (!active) return;
    this.shockwaves.draw(this.layer);
    this.sparks.draw(this.layer);
    this.fireballs.draw(this.layer);
  }
}
