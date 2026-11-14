import * as Phaser from 'phaser';
import { BODY_PART_NAMES, type BodyPartName, type DuelWorld } from '../core/duel-world';
import type { Facing } from '../core/fighter';
import type { BodySpec, FighterColors, FighterLook } from '../core/fighter-spec';
import { drawFace, fillOutlinedRect } from './face-drawing';

/** Aspect d'une partie du corps hors tête : un rectangle arrondi. */
interface LimbLook {
  width: number;
  height: number;
  radius: number;
  color: number;
  /** Ordre de dessin : membres arrière, torse, tête, membres avant. */
  layer: number;
}

const HEAD_LAYER = 2;

function limbLook(width: number, length: number, color: number, layer: number): LimbLook {
  return { width, height: length + width, radius: width / 2, color, layer };
}

function limbLooks(body: BodySpec, colors: FighterColors): Record<Exclude<BodyPartName, 'head'>, LimbLook> {
  return {
    torso: { width: body.torsoWidth, height: body.torsoHeight, radius: body.torsoCornerRadius, color: colors.body, layer: 1 },
    upperArmBack: limbLook(body.armWidth, body.upperArm, colors.limbBack, 0),
    foreArmBack: limbLook(body.armWidth, body.foreArm, colors.limbBack, 0),
    thighBack: limbLook(body.legWidth, body.thigh, colors.limbBack, 0),
    shinBack: limbLook(body.legWidth, body.shin, colors.limbBack, 0),
    upperArmFront: limbLook(body.armWidth, body.upperArm, colors.body, 3),
    foreArmFront: limbLook(body.armWidth, body.foreArm, colors.body, 3),
    thighFront: limbLook(body.legWidth, body.thigh, colors.body, 3),
    shinFront: limbLook(body.legWidth, body.shin, colors.body, 3),
  };
}

/**
 * Dessin d'un combattant : un objet Graphics par partie du corps, créé une fois,
 * repositionné à chaque image d'après la physique. Chaque partie porte un contour
 * d'encre ; la tête porte le visage de `look`, retourné pour qui regarde à gauche
 * et qui tourne avec le corps de la tête. Lecture seule : ne modifie ni la
 * physique ni les règles.
 */
export class FighterView {
  private readonly shapes = new Map<BodyPartName, Phaser.GameObjects.Graphics>();

  constructor(
    scene: Phaser.Scene,
    private readonly world: DuelWorld,
    private readonly fighter: number,
    body: BodySpec,
    colors: FighterColors,
    facing: Facing,
    look: FighterLook,
  ) {
    const looks = limbLooks(body, colors);
    for (const part of BODY_PART_NAMES) {
      const shape = scene.add.graphics();
      if (part === 'head') {
        drawFace(shape, body.headRadius, look, colors);
        shape.setScale(facing, 1).setDepth(fighter * 10 + HEAD_LAYER);
      } else {
        const limb = looks[part];
        fillOutlinedRect(shape, 0, 0, limb.width, limb.height, limb.radius, limb.color, 1, look.outlineWidth, colors.outline);
        shape.setDepth(fighter * 10 + limb.layer);
      }
      this.shapes.set(part, shape);
    }
  }

  /** Recale chaque partie sur la position et l'angle de son corps physique. */
  update(): void {
    for (const [part, shape] of this.shapes) {
      const transform = this.world.readPart(this.fighter, part);
      shape.setPosition(transform.x, transform.y);
      shape.setRotation(transform.angle);
    }
  }
}
