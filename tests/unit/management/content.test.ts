import { describe, expect, it } from 'vitest';
import { MANAGEMENT } from '../../../src/content/management';
import { SKILLS } from '../../../src/content/skills';
import { WEAPONS } from '../../../src/content/weapons';
import { assertManagementData, STAT_IDS, type ManagementData } from '../../../src/core/management-spec';

const hasWeapon = (id: string): boolean => WEAPONS.has(id);
const hasSkill = (id: string): boolean => SKILLS.has(id);

describe('données de l\'écran de gestion', () => {
  it('propose poings, épée, marteau et saut, charge, boule de feu, transformation', () => {
    expect(MANAGEMENT.weapons.map((item) => item.id)).toEqual(['fists', 'sword', 'hammer']);
    expect(MANAGEMENT.skills.map((item) => item.id)).toEqual(['jump', 'charge', 'fireball', 'transformation']);
  });

  it('chaque élément a nom, effet, icône et usesStats valides', () => {
    for (const item of [...MANAGEMENT.weapons, ...MANAGEMENT.skills]) {
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.effect.length).toBeGreaterThan(0);
      expect(item.usesStats.length).toBeGreaterThan(0);
      for (const id of item.usesStats) expect(STAT_IDS).toContain(id);
    }
    expect(MANAGEMENT.weapons.every((item) => item.iconShape === 'round' && item.iconBadge === 'weapon')).toBe(true);
    expect(MANAGEMENT.skills.every((item) => item.iconShape === 'rounded-square')).toBe(true);
    for (const item of MANAGEMENT.skills) expect(item.iconBadge).toBe(SKILLS.get(item.id).category);
  });

  it('usesStats reflète le moteur : magie et mana pour la boule de feu, PV pour la transformation', () => {
    const uses = (id: string): readonly string[] => MANAGEMENT.skills.find((item) => item.id === id)!.usesStats;
    expect(uses('fireball')).toEqual(expect.arrayContaining(['magicPower', 'mana']));
    expect(uses('jump')).not.toContain('mana');
    expect(uses('transformation')).not.toContain('intelligence');
    expect(SKILLS.get('fireball').cost.mana).toBeGreaterThan(0);
    expect(SKILLS.get('jump').cost.stamina).toBeGreaterThan(0);
  });

  it('une entrée par stat, avec des textes', () => {
    expect(MANAGEMENT.stats.map((entry) => entry.id)).toEqual([...STAT_IDS]);
  });

  it('refuse les données fausses', () => {
    const bad = (patch: Partial<ManagementData>): (() => void) => () => assertManagementData({ ...MANAGEMENT, ...patch }, hasWeapon, hasSkill);
    expect(bad({ maxSkillSlots: 0 })).toThrow();
    expect(bad({ stats: MANAGEMENT.stats.slice(1) })).toThrow();
    expect(bad({ skills: [{ ...MANAGEMENT.skills[0], usesStats: ['inconnue' as never] }] })).toThrow();
    expect(bad({ skills: [{ ...MANAGEMENT.skills[0], id: 'zzz' }] })).toThrow();
    expect(bad({ skills: [{ ...MANAGEMENT.skills[0], usesStats: [] }] })).toThrow();
    expect(bad({ weapons: [{ ...MANAGEMENT.weapons[0], iconShape: 'rounded-square' }] })).toThrow();
    expect(bad({ weapons: [{ ...MANAGEMENT.weapons[1], weaponId: 'lance' }] })).toThrow();
  });
});
