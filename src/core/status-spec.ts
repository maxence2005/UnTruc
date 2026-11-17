/**
 * Définition d'un statut de combat (story 013) : de la donnée, lue par le moteur générique
 * (`StatusSystem`). Un statut porte des charges ; chacune a sa propre durée et expire seule.
 * Un statut non cumulable a `maxCharges: 1`.
 *
 * Exemple : `{ id: 'bleed', chargeDurationMs: 4000, maxCharges: 5, damagePerSecondPerCharge: 1, weightLossPerCharge: 3, weightFloorShare: 0.8 }`.
 */
export interface StatusSpec {
  id: string;
  /** Durée d'une charge, en ms, à partir de son application. */
  chargeDurationMs: number;
  /** Charges au plus (entier, 1 au moins) ; au-delà, une nouvelle charge remplace la plus ancienne. */
  maxCharges: number;
  /** PV perdus par seconde et par charge (entier, pour un décompte exact au tick, voir `StatusSystem`). 0 = aucun dégât. */
  damagePerSecondPerCharge: number;
  /** Poids retiré par charge, rendu quand la charge expire. 0 = le poids ne bouge pas. */
  weightLossPerCharge: number;
  /** Plancher du poids effectif, en part du poids de base, dans ]0, 1]. */
  weightFloorShare: number;
}

/** Charges d'un statut qu'un coup applique à sa victime (`SkillHit.applies`, `PendingHit.applies`). */
export interface StatusApplication {
  status: StatusSpec;
  /** Charges ajoutées (entier, 1 au moins). */
  charges: number;
}

/** Un statut actif sur un combattant : ses charges et le reste de dégâts pas encore infligé. */
export interface ActiveStatus {
  readonly spec: StatusSpec;
  /** Ticks restants de chaque charge, de la plus ancienne (la plus proche de l'expiration) à la plus récente. */
  readonly chargeTicks: number[];
  /** Dégâts accumulés, en PV × `stepHz` (entier) : un PV part chaque fois qu'il atteint `stepHz`. */
  damageAcc: number;
}

function fail(id: string, message: string): never {
  throw new Error(`Statut ${id} : ${message}`);
}

function integerAtLeast(id: string, what: string, value: number, min: number): void {
  if (!Number.isInteger(value) || value < min) fail(id, `${what} doit être un entier d'au moins ${min} (reçu ${value})`);
}

/** Vérifie un statut ; lève une erreur qui nomme le statut et la valeur fautive. Appelée pour chaque entrée du registre. */
export function assertStatusSpec(spec: StatusSpec): void {
  const { id } = spec;
  if (id.trim() === '') throw new Error('Statut sans identifiant');
  if (!Number.isFinite(spec.chargeDurationMs) || spec.chargeDurationMs <= 0) fail(id, `chargeDurationMs doit être positif (reçu ${spec.chargeDurationMs})`);
  integerAtLeast(id, 'maxCharges', spec.maxCharges, 1);
  integerAtLeast(id, 'damagePerSecondPerCharge', spec.damagePerSecondPerCharge, 0);
  if (!Number.isFinite(spec.weightLossPerCharge) || spec.weightLossPerCharge < 0) fail(id, `weightLossPerCharge doit être positif ou nul (reçu ${spec.weightLossPerCharge})`);
  if (!(spec.weightFloorShare > 0 && spec.weightFloorShare <= 1)) fail(id, `weightFloorShare doit être dans ]0, 1] (reçu ${spec.weightFloorShare})`);
}

/** Vérifie les statuts appliqués par une compétence ; `owner` nomme la compétence dans l'erreur. */
export function assertStatusApplications(owner: string, applications: readonly StatusApplication[]): void {
  for (const { status, charges } of applications) {
    assertStatusSpec(status);
    if (!Number.isInteger(charges) || charges < 1) throw new Error(`${owner} : charges de ${status.id} doit être un entier d'au moins 1 (reçu ${charges})`);
  }
}
