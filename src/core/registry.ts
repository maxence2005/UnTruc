/** Une entrée de registre : tout contenu a un identifiant unique. */
export interface Identified {
  id: string;
}

/**
 * Registre de contenu par identifiant (armes, plus tard compétences, cosmétiques) :
 * l'unique façon de déclarer et de retrouver un élément (ADR-0001, section 3).
 */
export interface Registry<T extends Identified> {
  /** Retrouve une entrée ; lève une erreur si l'identifiant n'existe pas. */
  get(id: string): T;
  has(id: string): boolean;
  /** Toutes les entrées, dans l'ordre de déclaration. */
  all(): readonly T[];
}

/** Construit un registre ; lève une erreur si deux entrées portent le même identifiant. */
export function createRegistry<T extends Identified>(kind: string, entries: readonly T[]): Registry<T> {
  const list = [...entries];
  const byId = new Map<string, T>();
  for (const entry of list) {
    if (entry.id.trim() === '') throw new Error(`${kind} : entrée sans identifiant`);
    if (byId.has(entry.id)) throw new Error(`${kind} : identifiant déclaré deux fois (${entry.id})`);
    byId.set(entry.id, entry);
  }
  return {
    get(id) {
      const entry = byId.get(id);
      if (entry === undefined) throw new Error(`${kind} : identifiant inconnu (${id})`);
      return entry;
    },
    has: (id) => byId.has(id),
    all: () => list,
  };
}
