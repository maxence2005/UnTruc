import * as Phaser from 'phaser';
import type { ArenaConfig } from '../core/duel-config';
import type { PresentationConfig } from '../core/presentation-config';

/** Dessine le ciel et le sol de l'arène, une fois. Ne lit aucun état de duel. */
export function drawArena(scene: Phaser.Scene, arena: ArenaConfig, presentation: PresentationConfig): void {
  scene.cameras.main.setBackgroundColor(presentation.skyColor);
  const groundY = arena.height - arena.groundHeight;
  const ground = scene.add.graphics().setDepth(-10);
  ground.fillStyle(presentation.groundColor, 1);
  ground.fillRect(0, groundY, arena.width, arena.groundHeight);
  ground.fillStyle(presentation.groundEdgeColor, 1);
  ground.fillRect(0, groundY, arena.width, presentation.groundEdgeThickness);
}
