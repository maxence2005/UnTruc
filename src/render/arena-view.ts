import * as Phaser from 'phaser';
import type { ArenaConfig } from '../core/duel-config';
import { PRESENTATION } from '../content/presentation';

/** Dessine le ciel et le sol de l'arène, une fois. Ne lit aucun état de duel. */
export function drawArena(scene: Phaser.Scene, arena: ArenaConfig): void {
  scene.cameras.main.setBackgroundColor(PRESENTATION.skyColor);
  const groundY = arena.height - arena.groundHeight;
  const ground = scene.add.graphics().setDepth(-10);
  ground.fillStyle(PRESENTATION.groundColor, 1);
  ground.fillRect(0, groundY, arena.width, arena.groundHeight);
  ground.fillStyle(PRESENTATION.groundEdgeColor, 1);
  ground.fillRect(0, groundY, arena.width, PRESENTATION.groundEdgeThickness);
}
