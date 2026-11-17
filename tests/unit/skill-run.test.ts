import { describe, expect, it } from 'vitest';
import { DUEL_CONFIG } from '../../src/content/duel-config';
import { msToTicks } from '../../src/core/duel-config';
import { applyPatch, type Pose } from '../../src/core/pose';
import { SkillRun } from '../../src/core/skill-run';
import type { SkillSpec } from '../../src/core/skill-spec';
import { CHARGE, FIREBALL, JUMP } from './duel/skill-fixtures';

const TARGET = { x: 300, y: 500 };
const STANCE: Pose = { lean: 0.1, head: 0, shoulderFront: 0.2, elbowFront: 0.3, shoulderBack: 0.1, elbowBack: 0.2, hipFront: 0.1, kneeFront: 0.2, hipBack: -0.1, kneeBack: 0.2, crouch: 4 };

function ticksOf(skill: SkillSpec, phase: string): number {
  return msToTicks(skill.timeline.find((candidate) => candidate.name === phase)!.durationMs, DUEL_CONFIG.stepHz);
}

function runOf(skill: SkillSpec): SkillRun {
  return new SkillRun(skill, DUEL_CONFIG.stepHz, TARGET);
}

function advanceTo(run: SkillRun, phase: string): void {
  while (!run.finished && run.phase.name !== phase) run.advance();
}

function expectPoseClose(actual: Pose, expected: Pose): void {
  for (const key of Object.keys(expected) as (keyof Pose)[]) expect(actual[key]).toBeCloseTo(expected[key], 9);
}

describe('SkillRun timeline', () => {
  it('skipPhase on an endOnHit phase moves to the next phase at its first tick, re-opens the entry and counts one tick', () => {
    const run = runOf(CHARGE);
    advanceTo(run, 'rush');
    run.takeEntry();
    const elapsedBefore = run.elapsed;

    run.skipPhase();

    expect(run.phase.name).toBe('recover');
    expect(run.ticks).toBe(0);
    expect(run.takeEntry()).toBe(true);
    expect(run.elapsed).toBe(elapsedBefore + 1);
  });

  it('firstStrikeTick is the sum of the phases before the first strike window, and null without one', () => {
    expect(runOf(JUMP).firstStrikeTick).toBe(ticksOf(JUMP, 'crouch') + ticksOf(JUMP, 'leap'));
    expect(runOf(CHARGE).firstStrikeTick).toBe(ticksOf(CHARGE, 'brace'));
    expect(runOf(FIREBALL).firstStrikeTick).toBeNull();
  });

  it('flightTicks adds up the airborne phases from the current one and is zero on the ground', () => {
    const run = runOf(JUMP);
    const onGround = run.flightTicks;
    advanceTo(run, 'leap');
    const atLeap = run.flightTicks;
    advanceTo(run, 'dive');
    const atDive = run.flightTicks;
    advanceTo(run, 'land');

    expect(onGround).toBe(0);
    expect(atLeap).toBe(ticksOf(JUMP, 'leap') + ticksOf(JUMP, 'dive'));
    expect(atDive).toBe(ticksOf(JUMP, 'dive'));
    expect(run.flightTicks).toBe(0);
  });

  it('pose starts one tick from the stance, reaches the phase pose on its last tick, and falls back to the stance once finished', () => {
    const run = runOf(JUMP);
    const crouchTicks = ticksOf(JUMP, 'crouch');
    const crouchPose = applyPatch(STANCE, JUMP.timeline[0].pose);
    const first = run.pose(STANCE);
    for (let tick = 1; tick < crouchTicks; tick += 1) run.advance();
    const last = run.pose(STANCE);
    advanceTo(run, '');

    expect(first.crouch).toBeCloseTo(STANCE.crouch + (crouchPose.crouch - STANCE.crouch) / crouchTicks, 9);
    expectPoseClose(last, crouchPose);
    expect(run.finished).toBe(true);
    expect(run.pose(STANCE)).toBe(STANCE);
  });
});
