import * as Phaser from 'phaser';
import { BODY_PART_NAMES, type BodyPartName, type DuelWorld } from '../core/duel-world';
import type { Facing } from '../core/fighter';
import type { BodySpec, FighterColors } from '../core/fighter-spec';
import type { PresentationConfig } from '../core/presentation-config';

interface PartLook {
  kind: 'rect' | 'circle';
  width: number;
  height: number;
  radius: number;
  color: number;
  /** Ordre de dessin : membres arrière, torse, tête, membres avant. */
  layer: number;
}

function limbLook(width: number, length: number, color: number, layer: number): PartLook {
  return { kind: 'rect', width, height: length + width, radius: width / 2, color, layer };
}

function partLooks(body: BodySpec, colors: FighterColors): Record<BodyPartName, PartLook> {
  return {
    torso: { kind: 'rect', width: body.torsoWidth, height: body.torsoHeight, radius: body.torsoCornerRadius, color: colors.body, layer: 1 },
    head: { kind: 'circle', width: body.headRadius * 2, height: body.headRadius * 2, radius: body.headRadius, color: colors.head, layer: 2 },
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
 * repositionné à chaque image d'après la physique. Lecture seule : ne modifie ni
 * la physique ni les règles.
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
    presentation: PresentationConfig,
  ) {
    const looks = partLooks(body, colors);
    for (const part of BODY_PART_NAMES) {
      const look = looks[part];
      const shape = scene.add.graphics().setDepth(fighter * 10 + look.layer);
      shape.fillStyle(look.color, 1);
      if (look.kind === 'circle') {
        shape.fillCircle(0, 0, look.radius);
        shape.fillStyle(colors.eye, 1);
        shape.fillCircle(
          facing * look.radius * presentation.eyeOffsetRatio,
          -look.radius * presentation.eyeOffsetRatio * 0.5,
          look.radius * presentation.eyeRadiusRatio,
        );
      } else {
        shape.fillRoundedRect(-look.width / 2, -look.height / 2, look.width, look.height, look.radius);
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
