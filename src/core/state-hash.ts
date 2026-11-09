const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * Empreinte FNV-1a de la représentation binaire exacte des nombres
 * (aucun arrondi : deux simulations identiques au bit près donnent la même).
 * Sert à vérifier le déterminisme d'un duel.
 */
export function hashNumbers(values: readonly number[]): string {
  const floats = new Float64Array(values);
  const words = new Uint32Array(floats.buffer);
  let hash = FNV_OFFSET;
  for (const word of words) {
    hash = Math.imul(hash ^ word, FNV_PRIME) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
