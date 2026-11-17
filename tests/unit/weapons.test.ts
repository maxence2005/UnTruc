import { describe, expect, it } from 'vitest';
import { DUEL_CONFIG } from '../../src/content/duel-config';
import { FIGHTERS } from './duel/plain-fighters';
import { WEAPONS } from '../../src/content/weapons';
import { Duel } from '../../src/core/duel';
import { resolveAttack, resolveStance } from '../../src/core/equipment';
import { applyPatch } from '../../src/core/pose';
import type { FighterSpec } from '../../src/core/fighter-spec';
import { createRegistry } from '../../src/core/registry';
import { createRng } from '../../src/core/rng';
import { hitDamage } from '../../src/core/stats';
import { assertWeaponSpec, weaponCenter, weaponLength, weaponMass, type WeaponSpec } from '../../src/core/weapon-spec';
import { FakeDuelWorld, punchContact } from './duel/fake-duel-world';
import { ALWAYS, configWith, IN_REACH, REFERENCE_SPEED, SEED, setUp } from './duel/reaction-fixtures';

const SWORD = WEAPONS.get('sword');
const HAMMER = WEAPONS.get('hammer');
/** Le marteau doit peser au moins ce multiple de l'épée pour que la différence se voie. */
const HEAVY_RATIO = 4;

function armed(spec: FighterSpec, weapon: WeaponSpec): FighterSpec {
  return { ...spec, weapon };
}

/** Rouge armé frappe Bleu passif avec son arme ; renvoie les coups. */
function strikeWith(weapon: WeaponSpec) {
  const duel = new Duel(configWith({}), [armed(FIGHTERS[0], weapon), FIGHTERS[1]], createRng(SEED));
  duel.fighters[1].actionTicksLeft = Number.MAX_SAFE_INTEGER;
  const world = new FakeDuelWorld(IN_REACH);
  world.contacts = [punchContact(0, 'weapon', REFERENCE_SPEED)];
  const hits: { damage: number; part: string }[] = [];
  duel.events.on('hit', (hit) => hits.push(hit));
  while (hits.length === 0 && duel.tick < 1000) duel.update(world);
  return { duel, hits };
}

describe('Weapon registry', () => {
  it('loads every weapon and validates its data', () => {
    expect(WEAPONS.all().length).toBeGreaterThanOrEqual(2);
    for (const weapon of WEAPONS.all()) {
      expect(() => assertWeaponSpec(weapon)).not.toThrow();
      expect(WEAPONS.get(weapon.id)).toBe(weapon);
      expect(weaponMass(weapon)).toBeGreaterThan(0);
      expect(weapon.mainGrip.at).toBeGreaterThanOrEqual(0);
      expect(weapon.mainGrip.at).toBeLessThanOrEqual(weaponLength(weapon));
      expect([1, 2]).toContain(weapon.hands);
    }
  });

  it('refuses an unknown id and a duplicated id', () => {
    expect(() => WEAPONS.get('nope')).toThrow(/nope/);
    expect(() => createRegistry('Armes', [SWORD, SWORD])).toThrow(/sword/);
  });

  it('rejects a weapon whose weight, grip or hand count is invalid', () => {
    expect(() => assertWeaponSpec({ ...SWORD, pieces: [{ ...SWORD.pieces[0], density: 0 }] })).toThrow(/densité/);
    expect(() => assertWeaponSpec({ ...SWORD, mainGrip: { at: weaponLength(SWORD) + 1, stiffness: 1 } })).toThrow(/mainGrip/);
    expect(() => assertWeaponSpec({ ...SWORD, hands: 3 as 1 })).toThrow(/mains/);
    expect(() => assertWeaponSpec({ ...SWORD, hands: 2 })).toThrow(/offGrip/);
    expect(() => assertWeaponSpec({ ...SWORD, offGrip: { at: 20 } })).toThrow(/seconde prise/);
  });

  it('rejects a weapon whose material, wrist, kick or striking parts are invalid', () => {
    expect(() => assertWeaponSpec({ ...SWORD, friction: Number.NaN })).toThrow(/friction/);
    expect(() => assertWeaponSpec({ ...SWORD, restitution: -1 })).toThrow(/restitution/);
    expect(() => assertWeaponSpec({ ...SWORD, wrist: { ...SWORD.wrist, kp: 0 } })).toThrow(/wrist.kp/);
    expect(() => assertWeaponSpec({ ...SWORD, attack: { ...SWORD.attack, kick: { ...SWORD.attack.kick, down: Number.NaN } } })).toThrow(/kick/);
    expect(() => assertWeaponSpec({ ...SWORD, attack: { ...SWORD.attack, strikingParts: ['foreArmFront'] } })).toThrow(/strikingParts/);
    expect(() => assertWeaponSpec({ ...SWORD, maxSpeed: 0 })).toThrow(/maxSpeed/);
  });

  it('keeps the registry list apart from the array it was built from', () => {
    const entries = [SWORD];
    const registry = createRegistry('Armes', entries);

    entries.push(HAMMER);

    expect(registry.all()).toEqual([SWORD]);
    expect(() => createRegistry('Armes', [{ ...SWORD, id: ' ' }])).toThrow(/sans identifiant/);
  });

  it('declares two weapons of clearly different weights', () => {
    expect(weaponMass(HAMMER)).toBeGreaterThan(HEAVY_RATIO * weaponMass(SWORD));
  });

  it('puts the hammer weight in its head, far from the hands', () => {
    expect(weaponCenter(HAMMER).y).toBeGreaterThan(weaponLength(HAMMER) / 2);
  });
});

describe('Weapon guard', () => {
  it('parries with the weapon guard pose and angle', () => {
    const { duel, of, runUntil } = setUp({ config: configWith({ parryChance: ALWAYS }), specs: [FIGHTERS[0], armed(FIGHTERS[1], SWORD)], passive: [1] });

    runUntil(() => of('parry').length > 0);

    const defender = duel.fighters[1];
    const intent = defender.intent();
    expect(defender.state).toBe('parry');
    expect(intent.pose).toEqual(applyPatch(resolveStance(armed(FIGHTERS[1], SWORD)), SWORD.guard!.pose));
    expect(intent.weapon!.angle).toBe(SWORD.guard!.angle);
  });

  it('never parries with a weapon that has no guard, but still dodges', () => {
    expect(HAMMER.guard).toBeUndefined();
    const parrying = setUp({ config: configWith({ parryChance: ALWAYS }), specs: [FIGHTERS[0], armed(FIGHTERS[1], HAMMER)], passive: [1] });
    const dodging = setUp({ config: configWith({ dodgeChance: ALWAYS }), specs: [FIGHTERS[0], armed(FIGHTERS[1], HAMMER)], passive: [1] });

    parrying.run(600);
    dodging.run(600);

    expect(parrying.duel.fighters[1].canParry).toBe(false);
    expect(parrying.of('parry')).toHaveLength(0);
    expect(parrying.of('hit').length).toBeGreaterThan(0);
    expect(dodging.of('dodge').length).toBeGreaterThan(0);
  });

  it('keeps the bare-hand parry for a fighter without weapon', () => {
    const { duel } = setUp({});

    expect(duel.fighters[1].canParry).toBe(true);
    expect(duel.fighters[1].parryPose).toBe(FIGHTERS[1].parryPose);
  });
});

describe('Two-handed weapon', () => {
  it('declares a second grip further on the shaft than the first', () => {
    const twoHanded = WEAPONS.all().filter((weapon) => weapon.hands === 2);
    expect(twoHanded.length).toBeGreaterThan(0);
    for (const weapon of twoHanded) {
      expect(weapon.offGrip).toBeDefined();
      expect(weapon.offGrip!.at).toBeGreaterThan(weapon.mainGrip.at);
    }
    expect(() => assertWeaponSpec({ ...HAMMER, offGrip: { at: HAMMER.mainGrip.at } })).toThrow(/plus loin/);
  });
});

describe('Weapon attack', () => {
  it('reads the attack timing, reach and poses from the weapon data', () => {
    const spec = armed(FIGHTERS[0], HAMMER);
    const attack = resolveAttack(spec);
    expect(attack.windupMs).toBe(HAMMER.attack.windupMs);
    expect(attack.reach).toBe(HAMMER.attack.reach);
    expect(attack.strikingParts).toEqual(HAMMER.attack.strikingParts);
    expect(attack.windupPose).toEqual({ ...resolveStance(spec), ...HAMMER.attack.windupPose });
    expect(attack.strikePose.shoulderBack).toBe(HAMMER.attack.strikePose.shoulderBack);
  });

  it('keeps the bare-hand attack untouched for a fighter without weapon', () => {
    expect(resolveAttack(FIGHTERS[0])).toBe(FIGHTERS[0].attack);
    expect(resolveStance(FIGHTERS[0])).toBe(FIGHTERS[0].stance);
  });

  it('gives the weapon its kick once, on the first strike tick', () => {
    const duel = new Duel(DUEL_CONFIG, [armed(FIGHTERS[0], SWORD), FIGHTERS[1]], createRng(SEED));
    const world = new FakeDuelWorld(IN_REACH);
    const kicks: number[] = [];
    while (duel.tick < 200) {
      duel.update(world);
      const intent = duel.fighters[0].intent();
      if (intent.weapon?.kick) kicks.push(duel.fighters[0].machine.ticksInState);
    }
    expect(kicks.length).toBeGreaterThan(0);
    for (const tick of kicks) expect(tick).toBe(duel.fighters[0].windupTicks);
  });

  it('counts a hit only with the weapon when the fighter holds one', () => {
    const duel = new Duel(configWith({}), [armed(FIGHTERS[0], SWORD), FIGHTERS[1]], createRng(SEED));
    duel.fighters[1].actionTicksLeft = Number.MAX_SAFE_INTEGER;
    const world = new FakeDuelWorld(IN_REACH);
    world.contacts = [punchContact(0, 'foreArmFront', REFERENCE_SPEED)];
    let hits = 0;
    duel.events.on('hit', () => (hits += 1));
    while (duel.tick < 300) duel.update(world);
    expect(hits).toBe(0);
  });
});

describe('Weapon damage', () => {
  it('takes the damage of a weapon hit from the weapon config', () => {
    for (const weapon of [SWORD, HAMMER]) {
      const { hits } = strikeWith(weapon);
      expect(hits[0].part).toBe('weapon');
      expect(hits[0].damage).toBe(hitDamage(DUEL_CONFIG, weapon.attack.damage, REFERENCE_SPEED, FIGHTERS[0].stats));
    }
  });

  it('changes the damage when only the weapon data changes', () => {
    const stronger = { ...SWORD, attack: { ...SWORD.attack, damage: SWORD.attack.damage * 2 } };
    expect(strikeWith(stronger).hits[0].damage).toBe(2 * strikeWith(SWORD).hits[0].damage);
  });
});
