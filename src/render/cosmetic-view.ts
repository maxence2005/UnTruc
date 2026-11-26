import * as Phaser from 'phaser';
import type { CosmeticChain, CosmeticSpec } from '../core/cosmetic-spec';
import type { DuelWorld, PartTransform } from '../core/duel-world';
import { partToWorld, TailChain } from './fx/tail-chain';

interface Attached {
  spec: CosmeticSpec;
  shape: Phaser.GameObjects.Graphics;
  chain: TailChain | null;
}

/** Contour d'encre d'un combattant : épaisseur et couleur (`FighterLook.outlineWidth`, `FighterColors.outline`). */
export interface InkLook {
  outlineWidth: number;
  ink: number;
}

/**
 * Cosmétiques d'un combattant (story 005, critère 5) : chaque cosmétique posé (`attach`) devient un objet
 * Graphics recalé à chaque image sur sa partie du corps, retourné selon le regard comme la tête. La queue
 * (`CosmeticSpec.chain`) est une `TailChain` redessinée à chaque image. Lecture seule : ne touche ni la
 * physique ni les règles. Objets créés à la pose (un événement), jamais par image.
 */
export class CosmeticView {
  private readonly attached: Attached[] = [];
  private readonly part: PartTransform = { x: 0, y: 0, angle: 0 };
  private readonly anchor = { x: 0, y: 0 };
  private readonly tip = { x: 0, y: 0 };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly world: DuelWorld,
    private readonly fighter: number,
    private readonly facing: () => number,
    private readonly ink: InkLook,
    /** Profondeur de base du combattant (`fighter × DEPTH_STRIDE`) ; la couche du cosmétique s'y ajoute. */
    private readonly depthBase: number,
  ) {}

  /** Pose un cosmétique (sans effet s'il est déjà posé). */
  attach(spec: CosmeticSpec): void {
    if (this.attached.some((item) => item.spec.id === spec.id)) return;
    const shape = this.scene.add.graphics().setDepth(this.depthBase + spec.layer);
    if (spec.polygons !== undefined) this.drawPolygons(shape, spec);
    const chain = spec.chain === undefined ? null : new TailChain(spec.chain);
    this.attached.push({ spec, shape, chain });
    if (chain !== null) {
      this.restOf(spec, spec.chain!);
      chain.reset(this.anchor.x, this.anchor.y, this.tip.x - this.anchor.x, this.tip.y - this.anchor.y);
    }
    this.update(0);
  }

  /** Identifiants des cosmétiques posés, dans l'ordre de pose. */
  get ids(): readonly string[] {
    return this.attached.map((item) => item.spec.id);
  }

  /** Recale les cosmétiques sur leurs parties ; fait avancer les queues de `dtMs` (temps d'effet). */
  update(dtMs: number): void {
    const facing = this.facing();
    for (const item of this.attached) {
      if (item.chain === null) {
        this.world.readPart(this.fighter, item.spec.part, this.part);
        item.shape.setPosition(this.part.x, this.part.y).setRotation(this.part.angle).setScale(facing, 1);
        continue;
      }
      const chain = item.spec.chain!;
      this.restOf(item.spec, chain);
      item.chain.update(dtMs, this.anchor.x, this.anchor.y, this.tip.x - this.anchor.x, this.tip.y - this.anchor.y);
      this.drawChain(item.shape, item.chain, chain);
    }
  }

  /** Attache de la chaîne et bout de sa direction de repos, dans le monde (`anchor`, `tip`). */
  private restOf(spec: CosmeticSpec, chain: CosmeticChain): void {
    this.world.readPart(this.fighter, spec.part, this.part);
    const facing = this.facing();
    partToWorld(this.part, facing, chain.anchor.x, chain.anchor.y, this.anchor);
    partToWorld(this.part, facing, chain.anchor.x + chain.rest.x, chain.anchor.y + chain.rest.y, this.tip);
  }

  /** Tous les contours d'abord, puis les aplats : les formes qui se recouvrent font une seule silhouette cernée. */
  private drawPolygons(shape: Phaser.GameObjects.Graphics, spec: CosmeticSpec): void {
    const shapes = spec.polygons!.map((polygon) => {
      const points: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < polygon.points.length; i += 2) points.push(new Phaser.Math.Vector2(polygon.points[i], polygon.points[i + 1]));
      return { points, color: polygon.color };
    });
    shape.lineStyle(this.ink.outlineWidth * 2, this.ink.ink, 1);
    for (const { points } of shapes) shape.strokePoints(points, true, true);
    for (const { points, color } of shapes) {
      shape.fillStyle(color, 1);
      shape.fillPoints(points, true, true);
    }
  }

  /** Queue effilée : contour d'encre, puis aplat ; un rond à chaque jointure pour des bouts arrondis. */
  private drawChain(shape: Phaser.GameObjects.Graphics, chain: TailChain, look: CosmeticChain): void {
    shape.clear();
    for (let pass = 0; pass < 2; pass += 1) {
      const extra = pass === 0 ? this.ink.outlineWidth * 2 : 0;
      const color = pass === 0 ? this.ink.ink : look.color;
      for (let i = 0; i < look.segments; i += 1) {
        const width = look.width * (1 - ((1 - look.tipShare) * i) / Math.max(1, look.segments - 1)) + extra;
        shape.lineStyle(width, color, 1);
        shape.lineBetween(chain.xs[i], chain.ys[i], chain.xs[i + 1], chain.ys[i + 1]);
        shape.fillStyle(color, 1);
        shape.fillCircle(chain.xs[i + 1], chain.ys[i + 1], width / 2);
      }
    }
  }
}
