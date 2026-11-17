import type * as Phaser from 'phaser';
import type { SkillTrailLook } from '../../core/presentation-config';
import { SampleClock } from './sample-clock';

interface Track {
  x: Float32Array;
  y: Float32Array;
  count: number;
  head: number;
  active: boolean;
  color: number;
}

/**
 * Traînée des combattants qui sautent ou foncent : le chemin récent de leur torse, tracé en
 * ruban qui s'affine. L'échantillonnage suit le temps d'effet, pas les images : tous les
 * `look.sampleMs` de temps d'effet, une traînée lancée ajoute la position du torse et une traînée
 * arrêtée perd son point le plus ancien. Sa longueur en temps ne dépend donc ni des FPS ni du
 * ralenti (qui l'étire comme le reste du monde). Pool fixe : un ruban par combattant, rien
 * n'est alloué pendant le jeu.
 */
export class TrailFx {
  private readonly tracks: Track[];
  private readonly clock: SampleClock;

  constructor(
    fighters: number,
    private readonly look: SkillTrailLook,
  ) {
    if (!(Number.isInteger(look.points) && look.points >= 1)) throw new Error(`skills.trail.points doit être un entier >= 1 (reçu ${look.points})`);
    this.clock = new SampleClock(look.sampleMs, 'skills.trail.sampleMs');
    this.tracks = Array.from({ length: fighters }, () => ({ x: new Float32Array(look.points), y: new Float32Array(look.points), count: 0, head: 0, active: false, color: 0xffffff }));
  }

  /** Lance la traînée du combattant, de cette couleur ; une traînée encore visible repart de zéro. */
  start(fighter: number, color: number): void {
    const track = this.tracks[fighter];
    track.active = true;
    track.color = color;
    track.count = 0;
    track.head = 0;
  }

  /** Laisse la traînée du combattant s'éteindre. */
  stop(fighter: number): void {
    this.tracks[fighter].active = false;
  }

  /**
   * Une image : avance l'horloge de `dtMs` (temps d'effet, déjà ralenti) et, pour chaque
   * `sampleMs` écoulé, ajoute la position `at(fighter)` aux traînées lancées et retire un point
   * aux autres.
   */
  update(dtMs: number, at: (fighter: number) => { x: number; y: number }): void {
    for (let due = this.clock.advance(dtMs); due > 0; due -= 1) this.sample(at);
  }

  /** Vrai tant qu'une traînée est visible. */
  get active(): boolean {
    for (let i = 0; i < this.tracks.length; i += 1) if (this.tracks[i].count > 0) return true;
    return false;
  }

  /** Dessine l'état courant sur `g` (déjà effacé par l'appelant), du point le plus ancien au plus récent. */
  draw(g: Phaser.GameObjects.Graphics): void {
    const { points, width, alpha } = this.look;
    for (const track of this.tracks) {
      for (let i = 0; i < track.count; i += 1) {
        const index = (track.head - track.count + i + points) % points;
        const t = (i + 1) / (track.count + 1);
        g.fillStyle(track.color, alpha * t);
        g.fillCircle(track.x[index], track.y[index], (width / 2) * t);
      }
    }
  }

  private sample(at: (fighter: number) => { x: number; y: number }): void {
    const { points } = this.look;
    for (let fighter = 0; fighter < this.tracks.length; fighter += 1) {
      const track = this.tracks[fighter];
      if (track.active) {
        const point = at(fighter);
        track.x[track.head] = point.x;
        track.y[track.head] = point.y;
        track.head = (track.head + 1) % points;
        track.count = Math.min(track.count + 1, points);
      } else if (track.count > 0) {
        track.count -= 1;
      }
    }
  }
}
