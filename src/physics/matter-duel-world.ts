import type * as Phaser from 'phaser';
import type { DuelConfig } from '../core/duel-config';
import type { ContactPartName, ContactReport, DuelWorld, FighterIntent, PartTransform } from '../core/duel-world';
import { BODY_PART_NAMES } from '../core/duel-world';
import type { Facing } from '../core/fighter';
import type { FighterSpec } from '../core/fighter-spec';
import { massScale } from '../core/stats';
import { applyIntent } from './muscles';
import { buildRagdoll, type Ragdoll } from './ragdoll';
import { buildWeapon, driveWeapon, gripGaps, offGripPoint, type WeaponBody } from './weapon-body';

interface BodyOwner {
  fighter: number;
  part: ContactPartName;
}

/** Forme minimale des événements de collision Matter relayés par Phaser. */
interface CollisionBody {
  parent: { id: number; velocity: { x: number; y: number } };
}
interface CollisionEvent {
  pairs: { bodyA: CollisionBody; bodyB: CollisionBody }[];
}

/**
 * Adaptateur Matter du duel : arène (sol, murs), ragdolls, muscles. Le monde
 * Matter n'avance jamais seul (`autoUpdate: false` dans la config du jeu) :
 * seul `step()` le fait avancer, d'un pas de durée constante.
 */
export class MatterDuelWorld implements DuelWorld {
  private readonly ragdolls: Ragdoll[];
  /** Arme tenue de chaque combattant (même index que `ragdolls`) ; `undefined` = poings. */
  private readonly weapons: (WeaponBody | undefined)[];
  private readonly owners = new Map<number, BodyOwner>();
  private contacts: ContactReport[] = [];
  /** Vitesse de chaque corps juste avant le pas en cours, par id de corps (voir `collectContacts`). */
  private readonly preStepVelocity = new Map<number, { x: number; y: number }>();
  private readonly groundY: number;
  private readonly stepMs: number;

  constructor(
    private readonly matter: Phaser.Physics.Matter.MatterPhysics,
    private readonly config: DuelConfig,
    private readonly specs: readonly FighterSpec[],
    facings: readonly Facing[],
    spawnX: readonly number[],
  ) {
    const { arena, physics, stepHz } = config;
    this.stepMs = 1000 / stepHz;
    this.groundY = arena.height - arena.groundHeight;
    const { world } = matter;
    world.setGravity(0, physics.gravityY);
    world.engine.positionIterations = physics.positionIterations;
    world.engine.velocityIterations = physics.velocityIterations;
    world.engine.constraintIterations = physics.constraintIterations;
    this.buildArena();
    this.ragdolls = specs.map((spec, index) =>
      buildRagdoll(matter, spec.body, spawnX[index], this.groundY, facings[index], physics.jointStiffness, massScale(config, spec.stats)),
    );
    this.weapons = specs.map((spec, index) => (spec.weapon === undefined ? undefined : buildWeapon(matter, spec, this.ragdolls[index])));
    this.ragdolls.forEach((ragdoll, fighter) => {
      for (const part of BODY_PART_NAMES) {
        const { id } = ragdoll.parts[part];
        this.owners.set(id, { fighter, part });
        this.preStepVelocity.set(id, { x: 0, y: 0 });
      }
      const weapon = this.weapons[fighter];
      if (weapon === undefined) return;
      this.owners.set(weapon.body.id, { fighter, part: 'weapon' });
      this.preStepVelocity.set(weapon.body.id, { x: 0, y: 0 });
    });
    // Pas de désabonnement à écrire : `World.shutdown()` de Phaser retire tous les écouteurs à l'arrêt de la scène.
    world.on('collisionstart', (event: CollisionEvent) => this.collectContacts(event, false));
    world.on('collisionactive', (event: CollisionEvent) => this.collectContacts(event, true));
  }

  drive(fighter: number, intent: FighterIntent): void {
    const spec = this.specs[fighter];
    const weapon = this.weapons[fighter];
    const backHandTarget = weapon === undefined ? undefined : offGripPoint(weapon);
    applyIntent(this.matter, this.ragdolls[fighter], intent, spec.muscles, spec.body, this.config.physics, this.groundY, backHandTarget);
    if (weapon !== undefined && intent.weapon !== undefined) {
      driveWeapon(this.matter, this.ragdolls[fighter], weapon, intent.weapon, intent.facing, intent.strength, intent.armBoost);
    }
  }

  impulse(fighter: number, velocityX: number, velocityY: number): void {
    const { parts } = this.ragdolls[fighter];
    for (const part of BODY_PART_NAMES) {
      const body = parts[part];
      this.matter.body.setVelocity(body, { x: body.velocity.x + velocityX, y: body.velocity.y + velocityY });
    }
    const weapon = this.weapons[fighter]?.body;
    if (weapon !== undefined) {
      this.matter.body.setVelocity(weapon, { x: weapon.velocity.x + velocityX, y: weapon.velocity.y + velocityY });
    }
  }

  step(): void {
    const bodies = this.ragdolls.flatMap((ragdoll) => BODY_PART_NAMES.map((part) => ragdoll.parts[part]));
    for (const weapon of this.weapons) if (weapon !== undefined) bodies.push(weapon.body);
    for (const body of bodies) {
      const stored = this.preStepVelocity.get(body.id)!;
      stored.x = body.velocity.x;
      stored.y = body.velocity.y;
    }
    this.matter.world.step(this.stepMs);
  }

  fighterX(fighter: number): number {
    return this.ragdolls[fighter].parts.torso.position.x;
  }

  drainContacts(): ContactReport[] {
    const drained = this.contacts;
    this.contacts = [];
    return drained;
  }

  /**
   * Debug : écarts main-manche du combattant (voir `gripGaps`) et hauteur de son torse,
   * ou rien s'il se bat aux poings. Lu par la sonde des armes, jamais par les règles.
   */
  weaponProbe(fighter: number): { main: number; off?: number; torsoY: number } | undefined {
    const weapon = this.weapons[fighter];
    if (weapon === undefined) return undefined;
    const ragdoll = this.ragdolls[fighter];
    return { ...gripGaps(ragdoll, weapon, this.specs[fighter].body.foreArm), torsoY: ragdoll.parts.torso.position.y };
  }

  readPart(fighter: number, part: ContactPartName): PartTransform {
    const body = part === 'weapon' ? this.weapons[fighter]?.body : this.ragdolls[fighter].parts[part];
    if (body === undefined) throw new Error(`Le combattant ${fighter} ne tient pas d'arme`);
    return { x: body.position.x, y: body.position.y, angle: body.angle };
  }

  snapshot(): number[] {
    const values: number[] = [];
    for (const ragdoll of this.ragdolls) {
      for (const part of BODY_PART_NAMES) {
        const body = ragdoll.parts[part];
        values.push(body.position.x, body.position.y, body.angle, body.velocity.x, body.velocity.y, body.angularVelocity);
      }
    }
    for (const weapon of this.weapons) {
      if (weapon === undefined) continue;
      const { body } = weapon;
      values.push(body.position.x, body.position.y, body.angle, body.velocity.x, body.velocity.y, body.angularVelocity);
    }
    return values;
  }

  private buildArena(): void {
    const { arena, physics } = this.config;
    const solid = { isStatic: true, friction: physics.groundFriction };
    const { add } = this.matter;
    add.rectangle(arena.width / 2, this.groundY + arena.groundHeight / 2, arena.width + arena.wallThickness * 2, arena.groundHeight, solid);
    add.rectangle(-arena.wallThickness / 2, 0, arena.wallThickness, arena.height * 2, solid);
    add.rectangle(arena.width + arena.wallThickness / 2, 0, arena.wallThickness, arena.height * 2, solid);
  }

  /**
   * Relève les contacts entre combattants avec leur vitesse d'approche. Matter
   * émet `collisionstart` avant de résoudre la collision (la vitesse des corps
   * est encore celle de l'impact) mais `collisionactive` après (vitesse déjà
   * amortie) : pour un contact qui dure, on prend la vitesse d'avant le pas.
   */
  private collectContacts(event: CollisionEvent, afterResolution: boolean): void {
    for (const pair of event.pairs) {
      const [parentA, parentB] = [pair.bodyA.parent, pair.bodyB.parent];
      const ownerA = this.owners.get(parentA.id);
      const ownerB = this.owners.get(parentB.id);
      if (!ownerA || !ownerB || ownerA.fighter === ownerB.fighter) continue;
      const bodyA = afterResolution ? { velocity: this.preStepVelocity.get(parentA.id)! } : parentA;
      const bodyB = afterResolution ? { velocity: this.preStepVelocity.get(parentB.id)! } : parentB;
      this.contacts.push({
        fighterA: ownerA.fighter,
        partA: ownerA.part,
        fighterB: ownerB.fighter,
        partB: ownerB.part,
        relativeSpeed: Math.hypot(bodyA.velocity.x - bodyB.velocity.x, bodyA.velocity.y - bodyB.velocity.y),
      });
    }
  }
}
