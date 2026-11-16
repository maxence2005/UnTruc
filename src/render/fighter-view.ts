import * as Phaser from 'phaser';
import { BODY_PART_NAMES, type BodyPartName, type DuelWorld } from '../core/duel-world';
import type { Facing } from '../core/fighter';
import type { BodySpec, FighterColors, FighterLook } from '../core/fighter-spec';
import { weaponCenter, type WeaponSpec } from '../core/weapon-spec';
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

/** Écart de profondeur entre deux combattants : chacun a moins de `DEPTH_STRIDE` couches. */
const DEPTH_STRIDE = 10;
const HEAD_LAYER = 2;
/**
 * Les armes passent devant les deux combattants : une arme qui frappe est dessinée
 * devant la victime, quel que soit le combattant qui la tient.
 */
const WEAPON_DEPTH = 2 * DEPTH_STRIDE;

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
 * d'encre ; la tête porte le visage de `look`, retourné à chaque image pour qui
 * regarde à gauche (`facing` est lu, jamais décidé ici) et qui tourne avec le corps
 * de la tête. Les membres « avant » restent dessinés devant même retournés. Lecture seule : ne modifie ni la
 * physique ni les règles.
 */
export class FighterView {
  private readonly shapes = new Map<BodyPartName, Phaser.GameObjects.Graphics>();
  private readonly weaponShape?: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    private readonly world: DuelWorld,
    private readonly fighter: number,
    body: BodySpec,
    colors: FighterColors,
    private readonly facing: () => Facing,
    look: FighterLook,
    weapon?: WeaponSpec,
  ) {
    const looks = limbLooks(body, colors);
    for (const part of BODY_PART_NAMES) {
      const shape = scene.add.graphics();
      if (part === 'head') {
        drawFace(shape, body.headRadius, look, colors);
        shape.setDepth(fighter * DEPTH_STRIDE + HEAD_LAYER);
      } else {
        const limb = looks[part];
        fillOutlinedRect(shape, 0, 0, limb.width, limb.height, limb.radius, limb.color, 1, look.outlineWidth, colors.outline);
        shape.setDepth(fighter * DEPTH_STRIDE + limb.layer);
      }
      this.shapes.set(part, shape);
    }
    if (weapon !== undefined) this.weaponShape = drawWeapon(scene, weapon, look.outlineWidth, colors.outline).setDepth(WEAPON_DEPTH + fighter);
  }

  /** Recale chaque partie sur la position et l'angle de son corps physique ; le visage suit le regard courant. */
  update(): void {
    for (const [part, shape] of this.shapes) {
      const transform = this.world.readPart(this.fighter, part);
      shape.setPosition(transform.x, transform.y);
      shape.setRotation(transform.angle);
    }
    this.shapes.get('head')!.setScale(this.facing(), 1);
    if (this.weaponShape !== undefined) {
      const transform = this.world.readPart(this.fighter, 'weapon');
      this.weaponShape.setPosition(transform.x, transform.y).setRotation(transform.angle);
    }
  }
}

/**
 * Dessin minimal d'une arme : un rectangle arrondi par morceau, centré sur le
 * centre de masse comme le corps physique. Tous les contours d'abord, puis les
 * aplats : les morceaux qui se recouvrent forment une seule silhouette cernée.
 */
function drawWeapon(scene: Phaser.Scene, weapon: WeaponSpec, outline: number, ink: number): Phaser.GameObjects.Graphics {
  const shape = scene.add.graphics();
  const center = weaponCenter(weapon);
  for (const pass of ['outline', 'fill'] as const) {
    for (const piece of weapon.pieces) {
      const x = piece.x - center.x;
      const y = piece.y + piece.length / 2 - center.y;
      if (pass === 'outline') fillOutlinedRect(shape, x, y, piece.width, piece.length, piece.radius, ink, 1, outline, ink);
      else fillOutlinedRect(shape, x, y, piece.width, piece.length, piece.radius, piece.color, 1, 0, ink);
    }
  }
  return shape;
}
