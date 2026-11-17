import { createRegistry } from '../../core/registry';
import { assertSkillSpec } from '../../core/skill-spec';
import { CHARGE } from './charge';
import { FIREBALL } from './fireball';
import { JUMP } from './jump';

const SKILL_LIST = [JUMP, FIREBALL, CHARGE];
SKILL_LIST.forEach(assertSkillSpec);

/** Registre des compétences, par identifiant : `SKILLS.get('jump')`. Chaque entrée est vérifiée au chargement. */
export const SKILLS = createRegistry('Registre des compétences', SKILL_LIST);
