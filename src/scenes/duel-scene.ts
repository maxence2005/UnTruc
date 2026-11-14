import * as Phaser from 'phaser';
import { Duel } from '../core/duel';
import type { DuelConfig } from '../core/duel-config';
import type { FighterSpec } from '../core/fighter-spec';
import type { PresentationConfig } from '../core/presentation-config';
import { createRng } from '../core/rng';
import { installDuelDebugHook } from '../debug/duel-debug-hook';
import { MatterDuelWorld } from '../physics/matter-duel-world';
import { drawArena } from '../render/arena-view';
import { FighterView } from '../render/fighter-view';
import { DuelHud } from '../ui/duel-hud';

/** Ce dont la scène a besoin pour jouer un duel (injecté, jamais lu en global). */
export interface DuelSceneSetup {
  seed: number;
  config: DuelConfig;
  fighters: readonly [FighterSpec, FighterSpec];
  presentation: PresentationConfig;
}

/**
 * Scène du duel : assemble les pièces et appelle le pas fixe. Aucune règle de
 * jeu ici (elles sont dans `core/`).
 */
export class DuelScene extends Phaser.Scene {
  private duel!: Duel;
  private world!: MatterDuelWorld;
  private views: FighterView[] = [];
  private hud!: DuelHud;
  private accumulatorMs = 0;

  constructor(private readonly setup: DuelSceneSetup) {
    super('duel');
  }

  /** Construit le duel, la physique, les vues et le HUD ; rappelé à chaque (re)lancement de la scène. */
  create(): void {
    const { seed, config, fighters, presentation } = this.setup;
    this.accumulatorMs = 0;
    this.duel = new Duel(config, fighters, createRng(seed));
    this.world = new MatterDuelWorld(
      this.matter,
      config,
      fighters,
      this.duel.fighters.map((fighter) => fighter.facing),
      this.duel.spawnX,
    );
    drawArena(this, config.arena, presentation);
    this.views = this.duel.fighters.map(
      (fighter) => new FighterView(this, this.world, fighter.index, fighter.spec.body, fighter.spec.colors, fighter.facing, fighter.spec.look),
    );
    this.hud = new DuelHud(this, this.duel, config.arena, presentation.hud);
    installDuelDebugHook(seed, this.duel, this.world);
  }

  /** Accumule le temps réel (plafonné) et joue autant de pas fixes qu'il en tient. */
  override update(_time: number, deltaMs: number): void {
    const { stepHz, maxFrameMs } = this.setup.config;
    const stepMs = 1000 / stepHz;
    this.accumulatorMs += Math.min(deltaMs, maxFrameMs);
    while (this.accumulatorMs >= stepMs) {
      this.duel.update(this.world);
      this.accumulatorMs -= stepMs;
    }
    for (const view of this.views) view.update();
    this.hud.update();
  }
}
