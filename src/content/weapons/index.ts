import { createRegistry } from '../../core/registry';
import { assertWeaponSpec } from '../../core/weapon-spec';
import { HAMMER } from './hammer';
import { SWORD } from './sword';

const WEAPON_LIST = [SWORD, HAMMER];
WEAPON_LIST.forEach(assertWeaponSpec);

/** Registre des armes, par identifiant : `WEAPONS.get('sword')`. Chaque entrée est vérifiée au chargement. */
export const WEAPONS = createRegistry('Registre des armes', WEAPON_LIST);
