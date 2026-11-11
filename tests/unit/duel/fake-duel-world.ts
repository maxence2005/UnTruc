import type { BodyPartName, ContactReport, DuelWorld, PartTransform } from '../../../src/core/duel-world';

/**
 * Monde physique factice pour tester les règles du duel sans Matter ni
 * navigateur : les combattants restent à portée l'un de l'autre, et le test
 * décide des contacts renvoyés à chaque pas.
 */
export class FakeDuelWorld implements DuelWorld {
  /** Contacts à renvoyer au prochain `drainContacts`, rejoués à chaque pas tant qu'ils ne sont pas changés. */
  contacts: ContactReport[] = [];
  steps = 0;

  constructor(private readonly positions: readonly [number, number]) {}

  drive(): void {}

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
export function punchContact(attacker: number, strikingPart: BodyPartName, relativeSpeed: number): ContactReport {
  return { fighterA: attacker, partA: strikingPart, fighterB: 1 - attacker, partB: 'torso', relativeSpeed };
}
