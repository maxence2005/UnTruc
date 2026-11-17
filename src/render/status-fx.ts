import type * as Phaser from 'phaser';
import type { ArenaConfig } from '../core/duel-config';
import type { DuelWorld, PartTransform } from '../core/duel-world';
import type { EventBus } from '../core/events';
import { createRng, type Rng } from '../core/rng';
import type { StatusesPresentation, StatusLook } from '../core/status-presentation';
import { FX_DEPTH } from './fighter-view';
import { BloodFx } from './fx/blood';
import { FlashLimiter } from './fx/flash-limiter';
import type { ImpactFx } from './fx/impact-fx';
import { StatusBadge } from './status-badge';
import { badgeRowX } from './status-badge-layout';
import { StatusBoard } from './status-board';
import { StatusDamageNumbers } from './status-damage';

/** Départ d'une rangée de pastilles : un bord, et le sens de la rangée (+1 vers la droite, −1 vers la gauche). */
export interface StatusRowStart {
  x: number;
  y: number;
  direction: 1 | -1;
}

/** Ce qui place les pastilles : le HUD, sous la barre de vie de chaque combattant (`DuelHud.statusRow`). */
export interface StatusBadgeAnchor {
  statusRow(fighter: number): StatusRowStart;
}

/**
 * Ordre de dessin, comme `FX_DEPTH` et `LABEL_DEPTH` (`skill-labels.ts`, 60) : les pastilles juste
 * derrière les bandeaux de compétence, les chiffres de dégâts au même plan que les textes.
 */
const BADGE_DEPTH = 58;
const DAMAGE_DEPTH = 60;
/** Décalage du seed de l'aléatoire visuel des statuts (`fx.seed`), distinct de ceux d'`ImpactFx` (+0) et de `SkillFx` (+1). */
const STATUS_RNG_OFFSET = 2;

/**
 * Rendu des statuts de combat (story 013, critères 5 et 6) : gouttes qui tombent du corps au rythme
 * des charges, pastille du statut (pictogramme et charges) sous la barre de vie du combattant (placée par le HUD), et à chaque perte de
 * PV due au statut un petit chiffre, une éclaboussure de gouttes et un petit flash rouge (au plus
 * `flashLimit.maxFlashes` par fenêtre). Tout vient des événements `statusApplied`, `statusTick`,
 * `statusExpired` ; la logique de `core/` ne l'appelle jamais. Les effets avancent en temps d'effet
 * (ralentis avec le monde, via `ImpactFx.timeScale`) ; la limite des flashs compte en temps réel.
 * À la fin du duel (`duelEnd`), tout s'arrête : plus de gouttes ni de pastilles, les gouttes en l'air finissent leur chute.
 */
export class StatusFx {
  private readonly layer: Phaser.GameObjects.Graphics;
  private readonly board: StatusBoard;
  private readonly blood: BloodFx;
  private readonly limiter: FlashLimiter;
  private readonly damage: StatusDamageNumbers;
  /** Pastilles créées une fois : `maxPerFighter` par combattant, rang par rang. */
  private readonly badges: StatusBadge[][];
  private readonly rng: Rng;
  /** Positions lues à chaque image, réutilisées (aucune allocation). */
  private readonly torso: PartTransform = { x: 0, y: 0, angle: 0 };
  /** Départ de la rangée de pastilles de chaque combattant, sous sa barre de vie (fixe, lu une fois). */
  private readonly rows: readonly StatusRowStart[];
  private destroyed = false;
  private layerDirty = false;

  constructor(
    scene: Phaser.Scene,
    bus: EventBus,
    private readonly world: DuelWorld,
    private readonly impact: ImpactFx,
    arena: ArenaConfig,
    private readonly look: StatusesPresentation,
    fxSeed: number,
    anchor: StatusBadgeAnchor,
  ) {
    const fighters = impact.fighters;
    this.rows = Array.from({ length: fighters }, (_, fighter) => anchor.statusRow(fighter));
    this.rng = createRng(fxSeed + STATUS_RNG_OFFSET);
    this.layer = scene.add.graphics().setDepth(FX_DEPTH);
    this.board = new StatusBoard(fighters, look.badge.maxPerFighter);
    this.blood = new BloodFx(look.blood, arena.height - arena.groundHeight, this.rng);
    this.limiter = new FlashLimiter(look.flashLimit.maxFlashes, look.flashLimit.windowMs);
    this.damage = new StatusDamageNumbers(scene, look.damage, DAMAGE_DEPTH);
    this.badges = Array.from({ length: fighters }, () => Array.from({ length: look.badge.maxPerFighter }, () => new StatusBadge(scene, look.badge, BADGE_DEPTH)));
    this.listen(bus);
  }

  /** À appeler une fois par image, après `ImpactFx.update`, avec le temps réel écoulé (plafonné). */
  update(realMs: number): void {
    if (this.destroyed) return;
    this.limiter.advance(realMs);
    const dtMs = realMs * this.impact.timeScale;
    for (let fighter = 0; fighter < this.badges.length; fighter += 1) this.updateFighter(fighter, dtMs);
    this.blood.update(dtMs);
    this.damage.update(dtMs);
    this.redraw();
  }

  /** Coupe les réactions aux événements ; les objets Phaser sont détruits avec la scène. */
  destroy(): void {
    this.destroyed = true;
  }

  private listen(bus: EventBus): void {
    bus.on('statusApplied', ({ victim, status, charges }) => {
      if (!this.destroyed && this.look.byId[status] !== undefined) this.board.set(victim, status, charges);
    });
    bus.on('statusExpired', ({ victim, status, chargesLeft }) => {
      if (!this.destroyed && this.look.byId[status] !== undefined) this.board.set(victim, status, chargesLeft);
    });
    // Fin du duel : les statuts ne bougent plus dans la logique ; plus de gouttes ni de pastilles (Maxence, 2026-11-17).
    bus.on('duelEnd', () => {
      if (!this.destroyed) this.board.clear();
    });
    bus.on('statusTick', ({ victim, status, damage, charges, x, y }) => {
      const statusLook = this.look.byId[status];
      if (this.destroyed || statusLook === undefined) return;
      this.board.set(victim, status, charges);
      this.onTick(statusLook, x, y, damage);
    });
  }

  /** Une perte de PV due au statut : chiffre, éclaboussure, petit flash si la limite le permet. */
  private onTick(statusLook: StatusLook, x: number, y: number, damage: number): void {
    const { onTick } = statusLook;
    this.damage.show(x, y, damage);
    this.blood.splash(x, y, onTick.splash, onTick.splashSpeedMin, onTick.splashSpeedMax, onTick.splashSpreadDeg, statusLook.dropColor);
    if (onTick.flash && this.limiter.tryFlash()) this.blood.pulse(x, y, statusLook.flashColor);
  }

  /** Gouttes dues et pastilles d'un combattant ; cache les pastilles sans statut. */
  private updateFighter(fighter: number, dtMs: number): void {
    const count = this.board.count(fighter);
    const row = this.badges[fighter];
    if (count > 0) {
      const torso = this.world.readPart(fighter, 'torso', this.torso);
      const { size, gap } = this.look.badge;
      const start = this.rows[fighter];
      for (let i = 0; i < count; i += 1) {
        const entry = this.board.entry(fighter, i);
        const statusLook = this.look.byId[entry.status];
        if (statusLook.drips !== undefined) this.drip(statusLook, entry.clock.advance(dtMs, entry.charges, statusLook.drips), torso.x, torso.y);
        row[i].show(entry.status, statusLook, entry.charges);
        row[i].setPosition(start.x + badgeRowX(i, start.direction, size, gap), start.y + gap + size / 2);
      }
    }
    for (let i = count; i < row.length; i += 1) row[i].hide();
  }

  /** Lance `due` gouttes depuis une zone du torse, vers le bas. */
  private drip(statusLook: StatusLook, due: number, x: number, y: number): void {
    const drips = statusLook.drips;
    if (drips === undefined) return;
    for (let i = 0; i < due; i += 1) {
      const dx = this.rng.range(-drips.spreadX, drips.spreadX);
      const dy = this.rng.range(-drips.spreadY, drips.spreadY);
      this.blood.drip(x + dx, y + dy, 0, this.rng.range(0, drips.fallSpeedMax), statusLook.dropColor);
    }
  }

  private redraw(): void {
    const active = this.blood.active;
    if (!active && !this.layerDirty) return;
    this.layer.clear();
    this.layerDirty = active;
    if (active) this.blood.draw(this.layer);
  }
}

