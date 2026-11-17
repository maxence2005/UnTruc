import { createRegistry } from '../../core/registry';
import { assertStatusSpec } from '../../core/status-spec';
import { BLEED } from './bleed';

export { BLEED } from './bleed';

const STATUS_LIST = [BLEED];
STATUS_LIST.forEach(assertStatusSpec);

/** Registre des statuts, par identifiant : `STATUSES.get('bleed')`. Chaque entrée est vérifiée au chargement. */
export const STATUSES = createRegistry('Registre des statuts', STATUS_LIST);
