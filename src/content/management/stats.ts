import type { StatEntry } from '../../core/management-spec';

/**
 * Textes des dix stats. Les `{valeurs}` des `lines` sont calculées par `describeStat` avec les formules du moteur :
 * `{value}` (la stat), puis selon la stat `{ratio} {base} {damage}`, `{dodgeCost} {dodges} {parryCost} {attackCost} {attacks}`,
 * `{perSecond}`, `{cost} {casts}`, `{dodge} {parry} {counter} {combo}`, `{scale} {delayMs}`, `{walk} {stun} {mass}`, `{chance}`.
 * Ce qui est dit ici doit rester vrai : `scope` nomme qui lit la stat, vérifié dans le code (voir README.md).
 */
export const STAT_ENTRIES: readonly StatEntry[] = [
  {
    id: 'hp', label: 'Points de vie', unit: 'PV', wired: true,
    effect: 'Ce que tu peux encaisser avant d\'être KO.',
    scope: 'Lue par le duel (départ et plafond) ; la Transformation se déclenche sur une part de tes PV.',
    lines: ['Tu commences le duel avec {value} PV.'],
  },
  {
    id: 'physicalPower', label: 'Puissance physique', unit: 'points', wired: true,
    effect: 'Multiplie les dégâts de tes coups et des compétences physiques (saut, charge).',
    scope: 'Lue par les coups et les compétences physiques.',
    lines: ['Puissance {value} : tes dégâts sont ×{ratio} du dégât de base.', 'Un coup de base {base} fait {damage} dégâts à vitesse d\'impact normale.'],
  },
  {
    id: 'magicPower', label: 'Puissance magique', unit: 'points', wired: true,
    effect: 'Multiplie les dégâts des compétences magiques.',
    scope: 'Seule la boule de feu s\'en sert pour l\'instant.',
    lines: ['Puissance magique {value} : dégâts ×{ratio}.', 'Une boule de feu de base {base} fait {damage} dégâts.'],
  },
  {
    id: 'stamina', label: 'Endurance', unit: 'points', wired: true,
    effect: 'Chaque coup, esquive et parade en dépense ; à sec, tu ne peux plus réagir.',
    scope: 'Lue par les coups, les réactions et les compétences à coût d\'endurance.',
    lines: ['{value} d\'endurance au départ.', 'Un coup coûte {attackCost} ({attacks} coups), une esquive {dodgeCost} ({dodges} d\'affilée), une parade {parryCost}.'],
  },
  {
    id: 'recovery', label: 'Récupération', unit: 'points', wired: true,
    effect: 'Vitesse à laquelle l\'endurance revient.',
    scope: 'Lue par le duel, en continu.',
    lines: ['Récupération {value} : tu regagnes {perSecond} d\'endurance par seconde.'],
  },
  {
    id: 'mana', label: 'Mana', unit: 'points', wired: true,
    effect: 'Réserve dépensée par les compétences magiques ; elle ne revient pas pendant le duel.',
    scope: 'Seule la boule de feu en dépense pour l\'instant.',
    lines: ['{value} de mana au départ.', 'Une boule de feu en coûte {cost} : {casts} lancers possibles.'],
  },
  {
    id: 'agility', label: 'Agilité', unit: 'points', wired: true,
    effect: 'Chances d\'esquiver, de parer, de contre-attaquer et d\'enchaîner.',
    scope: 'Lue par les réactions du duel ; la Transformation en ajoute.',
    lines: ['Agilité {value} : esquive {dodge}, parade {parry}, contre-attaque {counter}, enchaînement {combo}.'],
  },
  {
    id: 'speed', label: 'Vitesse', unit: 'points', wired: true,
    effect: 'Raccourcit le délai entre deux actions et fait frapper en premier quand deux combattants sont prêts ensemble.',
    scope: 'Lue par le rythme des actions ; la Transformation en ajoute.',
    lines: ['Vitesse {value} : délai entre deux actions ×{scale}, soit une action toutes les {delayMs} ms en moyenne.'],
  },
  {
    id: 'weight', label: 'Poids', unit: 'points', wired: true,
    effect: 'Un lourd est plus massif : il résiste mieux au recul et à l\'étourdissement, et marche plus lentement.',
    scope: 'Lue par le corps (masse), les coups reçus (recul, étourdissement) et la marche.',
    lines: ['Poids {value} : marche ×{walk}, étourdissement ×{stun}, masse du corps ×{mass}.'],
  },
  {
    id: 'intelligence', label: 'Intelligence', unit: 'points', wired: true,
    effect: 'Chance de tenter une compétence plutôt qu\'un simple coup, quand une est possible.',
    scope: 'Lue pour les compétences que l\'on tire (pas la Transformation, qui se déclenche).',
    lines: ['Intelligence {value} : {chance} de chances de tenter une compétence possible.'],
  },
];
