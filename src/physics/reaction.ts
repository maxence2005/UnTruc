/** Ce que `spreadReaction` lit d'un corps : sa masse et sa vitesse (px par pas). */
export interface MovingBody {
  readonly mass: number;
  readonly velocity: { readonly x: number; readonly y: number };
}

/**
 * Rend à un combattant la poussée d'un de ses muscles : `pushX`/`pushY` est la quantité
 * de mouvement que le muscle vient de donner à un os (masse × écart de vitesse). La même
 * vitesse, opposée, est retirée à chaque corps de `bodies` (l'os poussé compris), de sorte
 * que leur quantité de mouvement totale revient à ce qu'elle était avant le muscle et que
 * les vitesses relatives voulues par le muscle restent intactes. Un muscle agit alors comme
 * une force interne : il plie le corps, il ne le fait pas voler. Sans Matter, pour être testé.
 */
export function spreadReaction<T extends MovingBody>(
  bodies: readonly T[],
  pushX: number,
  pushY: number,
  setVelocity: (body: T, velocity: { x: number; y: number }) => void,
): void {
  let totalMass = 0;
  for (const body of bodies) totalMass += body.mass;
  if (totalMass <= 0) return;
  const dx = -pushX / totalMass;
  const dy = -pushY / totalMass;
  for (const body of bodies) setVelocity(body, { x: body.velocity.x + dx, y: body.velocity.y + dy });
}
