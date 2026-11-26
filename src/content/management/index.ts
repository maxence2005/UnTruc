import { FIGHTERS } from '../fighters';
import { assertManagementData, type ManagementData } from '../../core/management-spec';
import { SKILLS } from '../skills';
import { WEAPONS } from '../weapons';
import { MANAGED_SKILLS, MANAGED_WEAPONS } from './items';
import { STAT_ENTRIES } from './stats';

/**
 * Données de l'écran de gestion (story 006). Voir README.md. Les chiffres des exemples (dégât d'un coup, de la boule
 * de feu, son coût en mana) sont lus dans les définitions de jeu, pas recopiés.
 */
export const MANAGEMENT: ManagementData = {
  maxSkillSlots: 3,
  weapons: MANAGED_WEAPONS,
  skills: MANAGED_SKILLS,
  stats: STAT_ENTRIES,
  statExamples: {
    physicalBaseDamage: FIGHTERS[0].attack.damage,
    magicBaseDamage: SKILLS.get('fireball').hit.damage,
    magicManaCost: SKILLS.get('fireball').cost.mana,
  },
  labels: {
    notWiredText: 'Pas encore utilisée par le duel.',
    points: 'Coût : {points} points',
    staminaCost: 'Endurance : {stamina}',
    manaCost: 'Mana : {mana}',
    usesStats: 'Utilise : {stats}',
    triggered: 'Se déclenche, ne se tire pas',
    weaponFacts: 'Dégâts de base {damage}, portée {reach} px',
    hands: { '1': 'Une main', '2': 'Deux mains' },
    noWeaponHands: 'Aucune arme',
    slotEmpty: 'Emplacement libre',
    fight: 'Combattre',
  },
};

assertManagementData(MANAGEMENT, (id) => WEAPONS.has(id), (id) => SKILLS.has(id));
