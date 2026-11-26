import { describe, expect, it } from 'vitest';
import { FIGHTERS } from '../../../src/content/fighters';
import { MANAGEMENT } from '../../../src/content/management';
import { SKILLS } from '../../../src/content/skills';
import { WEAPONS } from '../../../src/content/weapons';
import { addSkill, applyLoadout, createLoadoutStore, loadoutOf, loadoutPoints, removeSkill, replaceSkill, setWeapon, skillAddStatus, validateLoadout, type Loadout } from '../../../src/core/loadout';

const CATALOG = { weapons: WEAPONS, skills: SKILLS };
const RULES = { maxSkills: MANAGEMENT.maxSkillSlots };
const EMPTY: Loadout = { weaponId: null, skillIds: [] };

describe('équipement : règles', () => {
  it('le départ est celui de FIGHTERS[0] et il est valide', () => {
    const start = loadoutOf(FIGHTERS[0]);
    expect(start).toEqual({ weaponId: null, skillIds: ['jump', 'charge'] });
    expect(validateLoadout(start, RULES, CATALOG)).toEqual([]);
  });

  it('signale ids inconnus, doublons et emplacements dépassés', () => {
    const issues = validateLoadout({ weaponId: 'lance', skillIds: ['jump', 'jump', 'zzz', 'charge', 'fireball'] }, RULES, CATALOG);
    expect(issues.map((issue) => issue.kind).sort()).toEqual(['duplicate-skill', 'too-many-skills', 'unknown-skill', 'unknown-weapon']);
  });

  it('ajoute dans l\'ordre, refuse doublon, inconnu et plein, sans modifier l\'original', () => {
    const one = addSkill(EMPTY, RULES, CATALOG, 'jump');
    expect(one.skillIds).toEqual(['jump']);
    expect(EMPTY.skillIds).toEqual([]);
    expect(addSkill(one, RULES, CATALOG, 'jump')).toBe(one);
    expect(addSkill(one, RULES, CATALOG, 'zzz')).toBe(one);
    const full = addSkill(addSkill(one, RULES, CATALOG, 'charge'), RULES, CATALOG, 'fireball');
    expect(skillAddStatus(full, RULES, CATALOG, 'transformation')).toBe('full');
    expect(skillAddStatus(one, RULES, CATALOG, 'jump')).toBe('duplicate');
    expect(skillAddStatus(one, RULES, CATALOG, 'zzz')).toBe('unknown');
    expect(addSkill(full, RULES, CATALOG, 'transformation')).toBe(full);
  });

  it('retire, remplace dans le même emplacement, refuse un remplacement invalide', () => {
    const three: Loadout = { weaponId: null, skillIds: ['jump', 'charge', 'fireball'] };
    expect(removeSkill(three, 'charge').skillIds).toEqual(['jump', 'fireball']);
    expect(removeSkill(three, 'transformation')).toBe(three);
    expect(replaceSkill(three, CATALOG, 'charge', 'transformation').skillIds).toEqual(['jump', 'transformation', 'fireball']);
    expect(replaceSkill(three, CATALOG, 'charge', 'jump')).toBe(three);
    expect(replaceSkill(three, CATALOG, 'charge', 'zzz')).toBe(three);
    expect(replaceSkill(three, CATALOG, 'transformation', 'jump')).toBe(three);
  });

  it('choisit et retire l\'arme', () => {
    const sword = setWeapon(EMPTY, 'sword', CATALOG);
    expect(sword.weaponId).toBe('sword');
    expect(setWeapon(sword, null, CATALOG).weaponId).toBeNull();
    expect(setWeapon(sword, 'lance', CATALOG)).toBe(sword);
  });

  it('additionne les points des compétences (affichage, pas de budget)', () => {
    expect(loadoutPoints({ weaponId: null, skillIds: ['jump', 'fireball', 'transformation'] }, CATALOG)).toBe(2 + 3 + 4);
  });

  it('la transformation s\'équipe comme les autres', () => {
    expect(addSkill(EMPTY, RULES, CATALOG, 'transformation').skillIds).toEqual(['transformation']);
  });
});

describe('applyLoadout', () => {
  const frozenBefore = JSON.stringify(FIGHTERS[0].skills?.map((skill) => skill.id));

  it('rend une copie avec l\'arme et les compétences choisies', () => {
    const spec = applyLoadout(FIGHTERS[0], { weaponId: 'hammer', skillIds: ['fireball', 'jump'] }, CATALOG);
    expect(spec).not.toBe(FIGHTERS[0]);
    expect(spec.weapon).toBe(WEAPONS.get('hammer'));
    expect(spec.skills?.map((skill) => skill.id)).toEqual(['fireball', 'jump']);
    expect(spec.stats).toEqual(FIGHTERS[0].stats);
    expect(spec.look).toBe(FIGHTERS[0].look);
  });

  it('ne modifie jamais les données', () => {
    applyLoadout(FIGHTERS[0], { weaponId: 'sword', skillIds: [] }, CATALOG);
    expect(FIGHTERS[0].weapon).toBeUndefined();
    expect(JSON.stringify(FIGHTERS[0].skills?.map((skill) => skill.id))).toBe(frozenBefore);
  });

  it('sans arme : pas de clé weapon, même si le combattant en tenait une', () => {
    const armed = applyLoadout(FIGHTERS[0], { weaponId: 'sword', skillIds: [] }, CATALOG);
    const bare = applyLoadout(armed, EMPTY, CATALOG);
    expect('weapon' in bare).toBe(false);
    expect(bare.skills).toEqual([]);
  });

  it('une compétence à déclenchement reste à déclenchement', () => {
    const spec = applyLoadout(FIGHTERS[0], { weaponId: null, skillIds: ['transformation'] }, CATALOG);
    expect(spec.skills?.[0]).toBe(SKILLS.get('transformation'));
    expect(spec.skills?.[0].trigger).toBeDefined();
  });

  it('lève une erreur sur un id inconnu', () => {
    expect(() => applyLoadout(FIGHTERS[0], { weaponId: 'lance', skillIds: [] }, CATALOG)).toThrow();
  });
});

describe('LoadoutStore', () => {
  it('garde l\'équipement, le rend en copie, revient au départ, sans état partagé', () => {
    const a = createLoadoutStore(loadoutOf(FIGHTERS[0]));
    const b = createLoadoutStore(loadoutOf(FIGHTERS[0]));
    a.set({ weaponId: 'sword', skillIds: ['fireball'] });
    expect(a.get()).toEqual({ weaponId: 'sword', skillIds: ['fireball'] });
    expect(b.get().weaponId).toBeNull();
    expect(a.get()).not.toBe(a.get());
    a.reset();
    expect(a.get()).toEqual({ weaponId: null, skillIds: ['jump', 'charge'] });
  });
});
