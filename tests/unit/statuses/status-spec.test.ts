import { describe, expect, it } from 'vitest';
import { SKILLS } from '../../../src/content/skills';
import { BLEED, STATUSES } from '../../../src/content/statuses';
import { assertSkillSpec } from '../../../src/core/skill-spec';
import { assertStatusSpec } from '../../../src/core/status-spec';
import { bleedWith } from './status-fixtures';

describe('Status data format', () => {
  it('declares the bleed in the status registry and accepts it', () => {
    expect(STATUSES.get('bleed')).toBe(BLEED);
    expect(() => assertStatusSpec(BLEED)).not.toThrow();
  });

  it.each([
    { field: 'id', patch: { id: ' ' } },
    { field: 'chargeDurationMs', patch: { chargeDurationMs: 0 } },
    { field: 'maxCharges', patch: { maxCharges: 0 } },
    { field: 'maxCharges', patch: { maxCharges: 1.5 } },
    { field: 'damagePerSecondPerCharge', patch: { damagePerSecondPerCharge: -1 } },
    { field: 'damagePerSecondPerCharge', patch: { damagePerSecondPerCharge: 0.5 } },
    { field: 'weightLossPerCharge', patch: { weightLossPerCharge: -1 } },
    { field: 'weightFloorShare', patch: { weightFloorShare: 0 } },
    { field: 'weightFloorShare', patch: { weightFloorShare: 1.2 } },
  ])('rejects a status whose $field is invalid', ({ patch }) => {
    expect(() => assertStatusSpec(bleedWith(patch))).toThrow();
  });

  it('rejects a skill that applies zero charges of a status', () => {
    const charge = SKILLS.get('charge');
    const broken = { ...charge, hit: { ...charge.hit, applies: [{ status: BLEED, charges: 0 }] } };

    expect(() => assertSkillSpec(broken)).toThrow(/charges/);
  });

  it('rejects a skill that applies an invalid status', () => {
    const charge = SKILLS.get('charge');
    const broken = { ...charge, hit: { ...charge.hit, applies: [{ status: bleedWith({ maxCharges: 0 }), charges: 1 }] } };

    expect(() => assertSkillSpec(broken)).toThrow();
  });
});
