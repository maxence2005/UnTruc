import { describe, expect, it } from 'vitest';
import { DUEL_CONFIG } from '../../../src/content/duel-config';
import { FIGHTERS } from '../../../src/content/fighters';
import { MANAGEMENT } from '../../../src/content/management';
import { SKILLS } from '../../../src/content/skills';
import { WEAPONS } from '../../../src/content/weapons';
import { loadoutOf } from '../../../src/core/loadout';
import { buildManagementView, type ManagementEnv, type ManagementState } from '../../../src/core/management-view';

const ENV: ManagementEnv = { config: DUEL_CONFIG, data: MANAGEMENT, catalog: { weapons: WEAPONS, skills: SKILLS }, baseSpec: FIGHTERS[0] };
const START: ManagementState = { loadout: loadoutOf(FIGHTERS[0]), hovered: null };

describe('modèle de vue', () => {
  it('montre dix stats, trois armes, quatre compétences, trois emplacements', () => {
    const view = buildManagementView(ENV, START);
    expect(view.stats).toHaveLength(10);
    expect(view.weapons).toHaveLength(3);
    expect(view.skills).toHaveLength(4);
    expect(view.slots).toEqual(['jump', 'charge', null]);
    expect(view.tooltip).toBeNull();
    expect(view.canFight).toBe(true);
    expect(view.points).toBe(4);
  });

  it('états équipé, emplacement et possibilité d\'ajout', () => {
    const view = buildManagementView(ENV, START);
    expect(view.weapons.find((w) => w.item.id === 'fists')!.equipped).toBe(true);
    expect(view.weapons.find((w) => w.item.id === 'sword')!.equipped).toBe(false);
    const charge = view.skills.find((s) => s.item.id === 'charge')!;
    expect([charge.equipped, charge.slot, charge.addStatus]).toEqual([true, 1, null]);
    expect(view.skills.find((s) => s.item.id === 'fireball')!.addStatus).toBe('ok');
    const full = buildManagementView(ENV, { ...START, loadout: { weaponId: 'sword', skillIds: ['jump', 'charge', 'fireball'] } });
    expect(full.skills.find((s) => s.item.id === 'transformation')!.addStatus).toBe('full');
    expect(full.weapons.find((w) => w.item.id === 'sword')!.equipped).toBe(true);
  });

  it('survol d\'une compétence : info-bulle et stats en évidence', () => {
    const view = buildManagementView(ENV, { ...START, hovered: { kind: 'skill', id: 'fireball' } });
    expect(view.tooltip?.title).toBe('Boule de feu');
    expect(view.tooltip?.lines.join(' ')).toContain('Mana : 20');
    expect(view.stats.filter((s) => s.highlighted).map((s) => s.id)).toEqual(['magicPower', 'mana', 'intelligence']);
  });

  it('survol d\'une arme : dégâts et portée lus dans la définition', () => {
    const view = buildManagementView(ENV, { ...START, hovered: { kind: 'weapon', id: 'hammer' } });
    expect(view.tooltip?.lines.join(' ')).toContain(`Dégâts de base ${WEAPONS.get('hammer').attack.damage}`);
    const fists = buildManagementView(ENV, { ...START, hovered: { kind: 'weapon', id: 'fists' } });
    expect(fists.tooltip?.lines.join(' ')).toContain(`portée ${FIGHTERS[0].attack.reach} px`);
  });

  it('la transformation est présentée comme un déclenchement', () => {
    const view = buildManagementView(ENV, { ...START, hovered: { kind: 'skill', id: 'transformation' } });
    expect(view.tooltip?.lines).toContain(MANAGEMENT.labels.triggered);
  });

  it('survol d\'une stat : sa description, et ce qui l\'utilise en évidence', () => {
    const view = buildManagementView(ENV, { ...START, hovered: { kind: 'stat', id: 'mana' } });
    expect(view.tooltip?.title).toBe('Mana');
    expect(view.stats.filter((s) => s.highlighted).map((s) => s.id)).toEqual(['mana']);
    expect(view.skills.filter((s) => s.highlighted).map((s) => s.item.id)).toEqual(['fireball']);
  });

  it('équipement invalide : Combattre inactif', () => {
    const view = buildManagementView(ENV, { ...START, loadout: { weaponId: null, skillIds: ['jump', 'jump'] } });
    expect(view.canFight).toBe(false);
    expect(view.issues).toHaveLength(1);
  });

  it('est déterministe et ne modifie pas l\'état', () => {
    const state: ManagementState = { loadout: { weaponId: 'sword', skillIds: ['fireball'] }, hovered: { kind: 'stat', id: 'speed' } };
    const before = JSON.stringify(state);
    expect(buildManagementView(ENV, state)).toEqual(buildManagementView(ENV, state));
    expect(JSON.stringify(state)).toBe(before);
  });
});
