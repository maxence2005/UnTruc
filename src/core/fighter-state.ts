/** États possibles d'un combattant. */
export type FighterState = 'idle' | 'approach' | 'attack' | 'recovery' | 'stunned' | 'ko';

/**
 * Table des transitions autorisées : l'unique endroit où elles sont listées.
 * Toute autre transition est une erreur de programmation.
 */
export const FIGHTER_TRANSITIONS: Readonly<Record<FighterState, readonly FighterState[]>> = {
  idle: ['approach', 'attack', 'stunned', 'ko'],
  approach: ['idle', 'attack', 'stunned', 'ko'],
  attack: ['recovery', 'stunned', 'ko'],
  recovery: ['idle', 'stunned', 'ko'],
  stunned: ['idle', 'stunned', 'ko'],
  ko: [],
};

/** Machine à états d'un combattant, avec le nombre de ticks passés dans l'état courant. */
export class FighterStateMachine {
  private current: FighterState = 'idle';
  private ticks = 0;

  /** État courant. */
  get state(): FighterState {
    return this.current;
  }

  /** Ticks écoulés depuis l'entrée dans l'état courant. */
  get ticksInState(): number {
    return this.ticks;
  }

  /** Passe à l'état suivant ; lève une erreur si la transition n'est pas dans la table. */
  transition(next: FighterState): void {
    if (!FIGHTER_TRANSITIONS[this.current].includes(next)) {
      throw new Error(`Transition interdite : ${this.current} -> ${next}`);
    }
    this.current = next;
    this.ticks = 0;
  }

  /** Avance d'un tick de simulation. */
  tick(): void {
    this.ticks += 1;
  }
}
