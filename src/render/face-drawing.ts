import type * as Phaser from 'phaser';
import type { FaceColorRole, FacePiece, FighterColors, FighterLook } from '../core/fighter-spec';

function roleColor(colors: FighterColors, role: FaceColorRole): number {
  switch (role) {
    case 'skin':
      return colors.head;
    case 'shade':
      return colors.headShade;
    case 'hair':
      return colors.hair;
    case 'ink':
      return colors.outline;
    case 'white':
      return colors.eyeWhite;
    case 'cheek':
      return colors.cheek;
  }
}

/**
 * Rectangle arrondi centré en (`x`, `y`), cerné d'un contour `outline` de couleur
 * `ink` (aucun contour si `outline` vaut 0) : le contour est un rectangle plein
 * plus grand, dessiné dessous.
 */
export function fillOutlinedRect(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: number,
  alpha: number,
  outline: number,
  ink: number,
): void {
  if (outline > 0) {
    g.fillStyle(ink, 1);
    g.fillRoundedRect(x - width / 2 - outline, y - height / 2 - outline, width + outline * 2, height + outline * 2, radius + outline);
  }
  g.fillStyle(color, alpha);
  g.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
}

/** Pointe (triangle) de base centrée en (`x`, `y`), agrandie de `grow` de chaque côté et vers le sommet. */
function fillSpike(g: Phaser.GameObjects.Graphics, piece: Extract<FacePiece, { shape: 'spike' }>, radius: number, grow: number): void {
  const baseX = piece.x * radius;
  const baseY = piece.y * radius;
  const dx = piece.tipX * radius - baseX;
  const dy = piece.tipY * radius - baseY;
  const length = Math.hypot(dx, dy);
  const stretch = length > 0 ? grow / length : 0;
  const half = piece.halfBase * radius + grow;
  g.fillTriangle(baseX - half, baseY, baseX + half, baseY, baseX + dx * (1 + stretch), baseY + dy * (1 + stretch));
}

/** Pièces pleines : cercle, ellipse, rectangle, calotte, pointe ; cernées d'encre si `outlined`. */
function drawFilled(g: Phaser.GameObjects.Graphics, piece: FacePiece, radius: number, color: number, alpha: number, outline: number, ink: number): void {
  switch (piece.shape) {
    case 'circle':
      if (piece.outlined) {
        g.fillStyle(ink, 1);
        g.fillCircle(piece.x * radius, piece.y * radius, piece.r * radius + outline);
      }
      g.fillStyle(color, alpha);
      g.fillCircle(piece.x * radius, piece.y * radius, piece.r * radius);
      break;
    case 'ellipse':
      g.fillStyle(color, alpha);
      g.fillEllipse(piece.x * radius, piece.y * radius, piece.width * radius, piece.height * radius);
      break;
    case 'rect':
      fillOutlinedRect(g, piece.x * radius, piece.y * radius, piece.width * radius, piece.height * radius, piece.radius * radius, color, alpha, piece.outlined ? outline : 0, ink);
      break;
    case 'cap':
      g.fillStyle(color, alpha);
      g.slice(piece.x * radius, piece.y * radius, piece.r * radius, piece.from, piece.to, false);
      g.fillPath();
      break;
    case 'spike':
      if (piece.outlined) {
        g.fillStyle(ink, 1);
        fillSpike(g, piece, radius, outline);
      }
      g.fillStyle(color, alpha);
      fillSpike(g, piece, radius, 0);
      break;
    default:
      break;
  }
}

function drawPiece(g: Phaser.GameObjects.Graphics, piece: FacePiece, radius: number, look: FighterLook, colors: FighterColors): void {
  const color = roleColor(colors, piece.color);
  const alpha = piece.alpha ?? 1;
  if (piece.shape === 'line') {
    g.lineStyle(piece.width * radius, color, alpha);
    g.lineBetween(piece.x1 * radius, piece.y1 * radius, piece.x2 * radius, piece.y2 * radius);
  } else if (piece.shape === 'arc') {
    g.lineStyle(piece.width * radius, color, alpha);
    g.beginPath();
    g.arc(piece.x * radius, piece.y * radius, piece.r * radius, piece.from, piece.to, false);
    g.strokePath();
  } else {
    drawFilled(g, piece, radius, color, alpha, look.outlineWidth, colors.outline);
  }
}

/**
 * Dessine le visage d'un combattant dans `g` (origine au centre de la tête, `+x`
 * vers l'avant) : cheveux arrière, crâne, nez, oreille, joue, barbe, yeux avec
 * sourcil, bouche, cheveux avant. Les formes viennent de `look.kit`, rien n'est
 * en dur ici.
 */
export function drawFace(g: Phaser.GameObjects.Graphics, radius: number, look: FighterLook, colors: FighterColors): void {
  const hair = look.kit.hair[look.hair];
  const pieces = [
    ...hair.back,
    ...look.kit.base,
    ...(look.beard ? look.kit.beard : []),
    ...look.kit.eyes[look.eyes],
    ...look.kit.mouths[look.mouth],
    ...hair.front,
  ];
  for (const piece of pieces) drawPiece(g, piece, radius, look, colors);
}
