import { DripClock } from './fx/drip-clock';

/** Un statut affiché sur un combattant : son identifiant, ses charges, l'horloge de ses gouttes. */
export interface BoardEntry {
  status: string;
  charges: number;
  readonly clock: DripClock;
}

/**
 * Ce que le rendu sait des statuts actifs de chaque combattant, tenu à jour par les seuls événements
 * du duel (`statusApplied`, `statusTick`, `statusExpired`) : le rendu ne lit pas l'état de `core/`.
 * Les statuts gardent l'ordre de leur première application. Au plus `maxPerFighter` par combattant
 * (`StatusBadgeLook.maxPerFighter`) : au-delà, un nouveau statut n'est pas suivi. Les entrées sont
 * créées une fois et réutilisées. Logique pure, sans Phaser.
 *
 * @example board.set(victim, status, charges); for (const entry of board.entries(0)) ...
 */
export class StatusBoard {
  private readonly slots: BoardEntry[][];
  private readonly counts: number[];

  constructor(fighters: number, maxPerFighter: number) {
    this.slots = Array.from({ length: fighters }, () => Array.from({ length: maxPerFighter }, () => ({ status: '', charges: 0, clock: new DripClock() })));
    this.counts = new Array<number>(fighters).fill(0);
  }

  /** Fixe les charges d'un statut ; 0 le retire (et décale les suivants), un statut nouveau prend la place suivante. */
  set(fighter: number, status: string, charges: number): void {
    const index = this.indexOf(fighter, status);
    if (charges <= 0) {
      if (index >= 0) this.remove(fighter, index);
      return;
    }
    if (index >= 0) {
      this.slots[fighter][index].charges = charges;
      return;
    }
    if (this.counts[fighter] >= this.slots[fighter].length) return;
    const entry = this.slots[fighter][this.counts[fighter]];
    entry.status = status;
    entry.charges = charges;
    entry.clock.reset();
    this.counts[fighter] += 1;
  }

  /** Oublie tous les statuts de tous les combattants (fin du duel) ; les entrées restent pour être réutilisées. */
  clear(): void {
    for (let fighter = 0; fighter < this.counts.length; fighter += 1) {
      while (this.counts[fighter] > 0) this.remove(fighter, this.counts[fighter] - 1);
    }
  }

  /** Nombre de statuts suivis sur le combattant. */
  count(fighter: number): number {
    return this.counts[fighter];
  }

  /** Le statut de rang `index` (0 = le plus ancien) ; à lire seulement pour `index` < `count(fighter)`. */
  entry(fighter: number, index: number): BoardEntry {
    return this.slots[fighter][index];
  }

  /** Charges du statut sur le combattant, 0 s'il n'est pas suivi. */
  charges(fighter: number, status: string): number {
    const index = this.indexOf(fighter, status);
    return index < 0 ? 0 : this.slots[fighter][index].charges;
  }

  private indexOf(fighter: number, status: string): number {
    for (let i = 0; i < this.counts[fighter]; i += 1) if (this.slots[fighter][i].status === status) return i;
    return -1;
  }

  /** Retire l'entrée `index` : les suivantes remontent d'un rang, l'objet retiré passe en fin de liste pour être réutilisé. */
  private remove(fighter: number, index: number): void {
    const row = this.slots[fighter];
    const removed = row[index];
    for (let i = index; i < this.counts[fighter] - 1; i += 1) row[i] = row[i + 1];
    this.counts[fighter] -= 1;
    row[this.counts[fighter]] = removed;
    removed.status = '';
    removed.charges = 0;
    removed.clock.reset();
  }
}
