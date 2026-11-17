/** Ce que l'écartement lit et modifie d'un bandeau : affiché ou non, largeur, position x de l'image en cours. */
export interface BannerSpan {
  active: boolean;
  width: number;
  x: number;
}

/**
 * Deux bandeaux affichés en même temps (lancements simultanés) se chevaucheraient : on les écarte
 * de part et d'autre de leur milieu pour laisser au moins `gap` px entre leurs bords, sans changer
 * leur hauteur. Rien ne bouge si l'un des deux est caché ou s'ils sont déjà assez loin. À égalité
 * de x, `a` part à gauche. Fonction pure (hors Phaser), appelée à chaque image par `SkillLabels`.
 *
 * @example separateBanners(blueBanner, redBanner, look.gap);
 */
export function separateBanners(a: BannerSpan | undefined, b: BannerSpan | undefined, gap: number): void {
  if (a === undefined || b === undefined || !a.active || !b.active) return;
  const needed = (a.width + b.width) / 2 + gap;
  const apart = Math.abs(a.x - b.x);
  if (apart >= needed) return;
  const push = (needed - apart) / 2;
  const left = a.x <= b.x ? a : b;
  const right = left === a ? b : a;
  left.x -= push;
  right.x += push;
}
