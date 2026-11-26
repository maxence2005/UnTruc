import type { ManagedItem } from '../../core/management-spec';

/**
 * Armes proposées sur l'écran de gestion (story 006). Les stats d'une arme sont celles que le duel lit pour un
 * coup physique : puissance physique (dégâts), endurance (un coup en coûte), vitesse (délai entre deux actions),
 * poids (recul et étourdissement de la victime). Les trois armes lisent les mêmes ; ce sont les chiffres de l'arme
 * (dégâts de base, portée) qui changent, et l'écran les lit dans la définition de l'arme.
 */
const MELEE_STATS = ['physicalPower', 'stamina', 'speed', 'weight'] as const;

export const MANAGED_WEAPONS: readonly ManagedItem[] = [
  { id: 'fists', weaponId: null, name: 'Poings', effect: 'À mains nues : les dégâts et la portée les plus faibles des trois.', iconShape: 'round', iconBadge: 'weapon', usesStats: MELEE_STATS },
  { id: 'sword', weaponId: 'sword', name: 'Épée', effect: 'Une main : plus de dégâts et de portée que les poings, geste rapide.', iconShape: 'round', iconBadge: 'weapon', usesStats: MELEE_STATS },
  { id: 'hammer', weaponId: 'hammer', name: 'Marteau', effect: 'Deux mains : le plus gros dégât des trois, mais le geste le plus lent.', iconShape: 'round', iconBadge: 'weapon', usesStats: MELEE_STATS },
];

/**
 * Compétences proposées. Saut et charge : dégâts physiques (puissance physique), coût en endurance, et la chance de
 * les tenter dépend de l'intelligence. Boule de feu : dégâts magiques, coût en mana, même chance. Transformation :
 * se déclenche sur les PV (jamais tirée, donc pas d'intelligence) et ajoute de la vitesse et de l'agilité.
 */
export const MANAGED_SKILLS: readonly ManagedItem[] = [
  { id: 'jump', name: 'Saut', effect: 'Bondit et retombe poing en avant sur l\'endroit visé ; esquivable et parable.', iconShape: 'rounded-square', iconBadge: 'attack', usesStats: ['physicalPower', 'stamina', 'intelligence'] },
  { id: 'charge', name: 'Charge', effect: 'Fonce au sol sur l\'adversaire, épaule en avant ; esquivable et parable.', iconShape: 'rounded-square', iconBadge: 'attack', usesStats: ['physicalPower', 'stamina', 'intelligence'] },
  { id: 'fireball', name: 'Boule de feu', effect: 'Lance une boule de feu de loin ; esquivable, mais pas parable.', iconShape: 'rounded-square', iconBadge: 'magic', usesStats: ['magicPower', 'mana', 'intelligence'] },
  { id: 'transformation', name: 'Transformation', effect: 'Se déclenche seule : grognement à mi-vie, puis loup-garou à 30 % des PV.', iconShape: 'rounded-square', iconBadge: 'transformation', usesStats: ['hp', 'speed', 'agility'] },
];
