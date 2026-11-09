import type * as Phaser from 'phaser';
import type { DuelConfig } from '../core/duel-config';
import type { BodyPartName, ContactReport, DuelWorld, FighterIntent, PartTransform } from '../core/duel-world';
import { BODY_PART_NAMES } from '../core/duel-world';
import type { Facing } from '../core/fighter';
import type { FighterSpec } from '../core/fighter-spec';
import { applyIntent } from './muscles';
import { buildRagdoll, type Ragdoll } from './ragdoll';

interface BodyOwner {
  fighter: number;
  part: BodyPartName;
}

/** Forme minimale des événements de collision Matter relayés par Phaser. */
interface CollisionEvent {
  pairs: { bodyA: { id: number; velocity: { x: number; y: number } }; bodyB: { id: number; velocity: { x: number; y: number } } }[];
}

/**
 * Adaptateur Matter du duel : arène (sol, murs), ragdolls, muscles. Le monde
 * Matter n'avance jamais seul (`autoUpdate: false` dans la config du jeu) :
 * seul `step()` le fait avancer, d'un pas de durée constante.
 */
export class MatterDuelWorld implements DuelWorld {
  private readonly ragdolls: Ragdoll[];
  private readonly owners = new Map<number, BodyOwner>();
  private contacts: ContactReport[] = [];
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
      buildRagdoll(matter, spec.body, spawnX[index], this.groundY, facings[index], physics.jointStiffness),
    );
    this.ragdolls.forEach((ragdoll, fighter) => {
      for (const part of BODY_PART_NAMES) this.owners.set(ragdoll.parts[part].id, { fighter, part });
    });
    world.on('collisionstart', this.collectContacts);
    world.on('collisionactive', this.collectContacts);
  }

  drive(fighter: number, intent: FighterIntent): void {
    const spec = this.specs[fighter];
    applyIntent(this.matter, this.ragdolls[fighter], intent, spec.muscles, spec.body, this.config.physics, this.groundY);
  }

  step(): void {
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

  readPart(fighter: number, part: BodyPartName): PartTransform {
    const body = this.ragdolls[fighter].parts[part];
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

  private readonly collectContacts = (event: CollisionEvent): void => {
    for (const { bodyA, bodyB } of event.pairs) {
      const ownerA = this.owners.get(bodyA.id);
      const ownerB = this.owners.get(bodyB.id);
      if (!ownerA || !ownerB || ownerA.fighter === ownerB.fighter) continue;
      this.contacts.push({
        fighterA: ownerA.fighter,
        partA: ownerA.part,
        fighterB: ownerB.fighter,
        partB: ownerB.part,
        relativeSpeed: Math.hypot(bodyA.velocity.x - bodyB.velocity.x, bodyA.velocity.y - bodyB.velocity.y),
      });
    }
  };
}
