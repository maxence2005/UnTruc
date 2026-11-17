import { FIGHTERS as CONTENT_FIGHTERS } from '../../../src/content/fighters';
import type { FighterSpec } from '../../../src/core/fighter-spec';

/**
 * Les combattants du jeu sans leurs compétences : les tests des règles de coup simple
 * (stories 001, 002, 008, 009) les gardent hors du tirage des compétences (story 004).
 */
export const FIGHTERS: readonly [FighterSpec, FighterSpec] = [
  { ...CONTENT_FIGHTERS[0], skills: [] },
  { ...CONTENT_FIGHTERS[1], skills: [] },
];
