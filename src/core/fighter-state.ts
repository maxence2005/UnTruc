/** États possibles d'un combattant ; `dodge` et `parry` sont les réactions à une attaque adverse (story-009) ; `skill` : une compétence en cours (story 004). */
export type FighterState = 'idle' | 'approach' | 'attack' | 'recovery' | 'dodge' | 'parry' | 'stunned' | 'ko' | 'skill';

/**
 * Table des transitions autorisées : l'unique endroit où elles sont listées.
 * Toute autre transition est une erreur de programmation.
 */
export const FIGHTER_TRANSITIONS: Readonly<Record<FighterState, readonly FighterState[]>> = {
  idle: ['approach', 'attack', 'skill', 'dodge', 'parry', 'stunned', 'ko'],
  approach: ['idle', 'attack', 'skill', 'dodge', 'parry', 'stunned', 'ko'],
  // attack -> attack : coup enchaîné, sans passer par la récupération.
  attack: ['recovery', 'attack', 'stunned', 'ko'],
  recovery: ['idle', 'dodge', 'parry', 'stunned', 'ko'],
  // Une esquive ignore les coups esquivables. Un coup qui ne l'est pas (donnée `reactions.dodgeable`) fait ses
  // dégâts pleins et casse l'esquive (retour à idle, sans étourdissement), ou met KO (Maxence, 2026-11-17).
  dodge: ['idle', 'attack', 'ko'],
  // Une parade réduit les coups parables. Un coup non parable (`reactions.parryable`, boule de feu) fait ses
  // dégâts pleins et casse la garde (retour à idle, sans étourdissement), ou met KO (Maxence, 2026-11-17).
  parry: ['idle', 'attack', 'ko'],
  stunned: ['idle', 'stunned', 'ko'],
  ko: [],
  // Une compétence joue sa propre timeline, récupération comprise, puis rend la main (idle).
  // Déclarée en dernier : l'ordre des clés code l'état dans l'empreinte du duel (duel-debug-hook).
  skill: ['idle', 'stunned', 'ko'],
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
