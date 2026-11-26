import { describe, expect, it } from 'vitest';
import { DUEL_CONFIG } from '../../../src/content/duel-config';
import { FIGHTERS } from '../../../src/content/fighters';
import { MANAGEMENT } from '../../../src/content/management';
import { STAT_IDS } from '../../../src/core/management-spec';
import { fillTemplate, formatNumber, formatPercent, describeStat, highlightedStats } from '../../../src/core/stat-description';
import { reactionChance } from '../../../src/core/reactions';
import { skillUseChance } from '../../../src/core/skill-choice';
import { actionDelayScale, hitDamage, massScale, staminaRegenPerTick, walkSpeedScale, type FighterStats } from '../../../src/core/stats';

const BASE = FIGHTERS[0].stats;
const describe_ = (stats: FighterStats, id: (typeof STAT_IDS)[number]) => describeStat(DUEL_CONFIG, stats, id, MANAGEMENT);
const text = (stats: FighterStats, id: (typeof STAT_IDS)[number]): string => describe_(stats, id).lines.join(' ');

describe('formatage', () => {
  it('virgule décimale et pourcentage', () => {
    expect(formatNumber(1, 2)).toBe('1,00');
    expect(formatNumber(2.5, 1)).toBe('2,5');
    expect(formatPercent(0.25)).toBe('25 %');
  });
  it('remplit les {valeurs} et refuse un nom inconnu', () => {
    expect(fillTemplate('a {x} b {y}', { x: '1', y: '2' })).toBe('a 1 b 2');
    expect(() => fillTemplate('a {z}', {})).toThrow();
  });
});

describe('describeStat : les chiffres sont ceux du moteur', () => {
  it('poids 70 : marche ×1,00, étourdissement ×1,00', () => {
    expect(text(BASE, 'weight')).toContain('marche ×1,00, étourdissement ×1,00');
  });

  it('poids 140 : valeurs des fonctions de stats.ts', () => {
    const stats = { ...BASE, weight: 140 };
    const out = text(stats, 'weight');
    expect(out).toContain(`marche ×${formatNumber(walkSpeedScale(DUEL_CONFIG, stats), 2)}`);
    expect(out).toContain(`étourdissement ×${formatNumber(1 / massScale(DUEL_CONFIG, stats), 2)}`);
  });

  it('vitesse : délai moyen = (base + aléa/2) × échelle', () => {
    const stats = { ...BASE, speed: 20 };
    const { delayBaseMs, delayRandomMs } = DUEL_CONFIG.action;
    const mean = (delayBaseMs + delayRandomMs / 2) * actionDelayScale(DUEL_CONFIG, stats);
    expect(text(stats, 'speed')).toContain(`toutes les ${formatNumber(mean)} ms`);
  });

  it('puissance physique : dégâts de hitDamage', () => {
    const stats = { ...BASE, physicalPower: 15 };
    const damage = hitDamage(DUEL_CONFIG, MANAGEMENT.statExamples.physicalBaseDamage, DUEL_CONFIG.damage.referenceSpeed, stats);
    expect(text(stats, 'physicalPower')).toContain(`fait ${damage} dégâts`);
  });

  it('agilité, intelligence, récupération', () => {
    const stats = { ...BASE, agility: 20, intelligence: 5, recovery: 12 };
    const agility = text(stats, 'agility');
    expect(agility).toContain(`esquive ${formatPercent(reactionChance(DUEL_CONFIG.reactions.dodgeChance, 20))}`);
    expect(agility).toContain(`enchaînement ${formatPercent(reactionChance(DUEL_CONFIG.reactions.comboChance, 20))}`);
    expect(text(stats, 'intelligence')).toContain(formatPercent(skillUseChance(DUEL_CONFIG.skills, 5)));
    expect(text(stats, 'recovery')).toContain(`${formatNumber(staminaRegenPerTick(DUEL_CONFIG, stats) * DUEL_CONFIG.stepHz, 1)} d'endurance`);
  });

  it('endurance et mana : nombres d\'actions possibles', () => {
    expect(text(BASE, 'stamina')).toContain(`${Math.floor(BASE.stamina / DUEL_CONFIG.reactions.staminaCost.dodge)} d'affilée`);
    expect(text(BASE, 'mana')).toContain(`${Math.floor(BASE.mana / MANAGEMENT.statExamples.magicManaCost)} lancers`);
  });

  it('chaque stat se décrit sans valeur manquante', () => {
    for (const id of STAT_IDS) {
      const stat = describe_(BASE, id);
      expect(stat.label.length).toBeGreaterThan(0);
      expect(stat.value).toBe(BASE[id]);
      for (const line of stat.lines) expect(line).not.toMatch(/[{}]|NaN|undefined/);
    }
  });

  it('une stat non branchée le dit et ne donne aucun chiffre', () => {
    const data = { ...MANAGEMENT, stats: MANAGEMENT.stats.map((entry) => (entry.id === 'mana' ? { ...entry, wired: false } : entry)) };
    const stat = describeStat(DUEL_CONFIG, BASE, 'mana', data);
    expect(stat.wired).toBe(false);
    expect(stat.lines).toEqual([MANAGEMENT.labels.notWiredText]);
  });

  it('est déterministe', () => {
    expect(describe_(BASE, 'weight')).toEqual(describe_(BASE, 'weight'));
  });
});

describe('mise en évidence', () => {
  it('rend les stats de l\'élément dans l\'ordre d\'affichage ; rien sans survol', () => {
    const fireball = MANAGEMENT.skills.find((item) => item.id === 'fireball')!;
    expect(highlightedStats(fireball)).toEqual(['magicPower', 'mana', 'intelligence']);
    expect(highlightedStats(null)).toEqual([]);
  });
});
