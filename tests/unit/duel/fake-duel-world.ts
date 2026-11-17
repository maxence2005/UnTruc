import type { ContactPartName, ContactReport, DuelWorld, FighterIntent, PartTransform } from '../../../src/core/duel-world';

/** Mouvement simulé : 0 partout (par défaut) = les combattants ne bougent que si le test déplace `positions`. */
export interface FakeMotion {
  /** Px parcourus par pas pour 1 px par pas de `walkVelocity` demandé. */
  walkScale: number;
  /** Px parcourus d'un coup par la victime pour 1 px par pas de recul reçu. */
  knockbackScale: number;
}

/**
 * Monde physique factice pour tester les règles du duel sans Matter ni
 * navigateur : par défaut les combattants restent où le test les met ; avec un
 * `FakeMotion`, ils marchent selon leurs ordres et le recul les déplace. Le
 * test décide des contacts renvoyés à chaque pas.
 */
export class FakeDuelWorld implements DuelWorld {
  /** Contacts à renvoyer au prochain `drainContacts`, rejoués à chaque pas tant qu'ils ne sont pas changés. */
  contacts: ContactReport[] = [];
  steps = 0;
  /** Positions x des bassins ; le test peut les déplacer entre deux pas. */
  readonly positions: [number, number];
  /** Impulsions de recul reçues, dans l'ordre. */
  readonly impulses: { fighter: number; velocityX: number; velocityY: number }[] = [];

  /** Derniers ordres reçus de chaque combattant. */
  readonly intents: (FighterIntent | undefined)[] = [undefined, undefined];

  constructor(
    positions: readonly [number, number],
    private readonly motion: FakeMotion = { walkScale: 0, knockbackScale: 0 },
  ) {
    this.positions = [...positions];
  }

  drive(fighter: number, intent: FighterIntent): void {
    this.intents[fighter] = intent;
    this.positions[fighter] += intent.walkVelocity * this.motion.walkScale;
  }

  impulse(fighter: number, velocityX: number, velocityY: number): void {
    this.impulses.push({ fighter, velocityX, velocityY });
    this.positions[fighter] += velocityX * this.motion.knockbackScale;
  }

  gravityPerStep(): number {
    return 0.28;
  }

  step(): void {
    this.steps += 1;
  }

  fighterX(fighter: number): number {
    return this.positions[fighter];
  }

  drainContacts(): ContactReport[] {
    return [...this.contacts];
  }

  readPart(fighter: number): PartTransform {
    return { x: this.positions[fighter], y: 0, angle: 0 };
  }

  snapshot(): number[] {
    return [...this.positions];
  }
}

/** Contact du poing de `attacker` sur le torse de l'autre, à la vitesse donnée. */
export function punchContact(attacker: number, strikingPart: ContactPartName, relativeSpeed: number): ContactReport {
  return { fighterA: attacker, partA: strikingPart, fighterB: 1 - attacker, partB: 'torso', relativeSpeed };
}
