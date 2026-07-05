import assert from "node:assert/strict";
import "../app/fitness-target-link.js";

const { resolveTargetId, selectActiveTargetsForPlan, validateWorkoutBatch } = globalThis.FitnessTargetLink;
const userId = "08dc15cb-aa8e-40fe-bfdf-0ef659292e0e";
const cycle = {
  id: "9ce08ae2-c5b9-495d-a8c8-4eb91cb8b209",
  user_id: userId,
  domain: "fitness",
  status: "active"
};
const supersededCycle = {
  ...cycle,
  id: "fc52ab8c-1622-4bd5-b7eb-1567975107da",
  status: "superseded"
};
const target = {
  id: "c5bfceb5-73be-44bb-b1d5-53c01d96e044",
  user_id: userId,
  review_cycle_id: cycle.id,
  plan_type: "Plan B",
  exercise_key: "b_goblet_squat",
  effective_from: "2026-06-29",
  active: true
};
const workout = {
  workout_date: "2026-06-30",
  plan_type: "Plan B",
  exercise_key: "b_goblet_squat",
  target_id: null
};

assert.equal(resolveTargetId({ workout, targets: [target], activeCycle: cycle, userId }), target.id);
assert.throws(() => resolveTargetId({
  workout: { ...workout, target_id: target.id },
  targets: [{ ...target, active: false }],
  activeCycle: cycle,
  userId
}), /Stale|found 0/);
assert.throws(() => resolveTargetId({
  workout,
  targets: [target, { ...target, id: "737e0d22-e640-49dd-9ebb-4dd0ccf7afc5" }],
  activeCycle: cycle,
  userId
}), /found 2/);
assert.throws(() => resolveTargetId({
  workout,
  targets: [{ ...target, exercise_key: "b_rdl" }],
  activeCycle: cycle,
  userId
}), /found 0/);
assert.throws(() => resolveTargetId({
  workout,
  targets: [{ ...target, effective_from: "2026-07-01" }],
  activeCycle: cycle,
  userId
}), /found 0/);
assert.throws(() => resolveTargetId({
  workout,
  targets: [{ ...target, user_id: "11111111-1111-4111-8111-111111111111" }],
  activeCycle: cycle,
  userId
}), /found 0/);
assert.throws(() => resolveTargetId({
  workout: { ...workout, target_id: target.id },
  targets: [{ ...target, review_cycle_id: supersededCycle.id, active: false }],
  activeCycles: [cycle],
  userId
}), /Stale|found 0/);
assert.throws(() => resolveTargetId({
  workout,
  targets: [target],
  activeCycles: [cycle, { ...cycle, id: "235a6e4b-955b-4a14-8a3e-9310414821f4" }],
  userId
}), /exactly one.*found 2/i);

const secondTarget = {
  ...target,
  id: "737e0d22-e640-49dd-9ebb-4dd0ccf7afc5",
  exercise_key: "b_rdl"
};
assert.deepEqual(validateWorkoutBatch({
  workouts: [
    { ...workout, target_id: target.id },
    { ...workout, exercise_key: "b_rdl", target_id: secondTarget.id }
  ],
  targets: [target, secondTarget],
  activeCycles: [cycle],
  userId
}), {
  cycleId: cycle.id,
  targetIds: [target.id, secondTarget.id]
});
assert.throws(() => validateWorkoutBatch({
  workouts: [
    { ...workout, target_id: target.id },
    { ...workout, exercise_key: "b_rdl", target_id: secondTarget.id }
  ],
  targets: [target, { ...secondTarget, review_cycle_id: supersededCycle.id, active: false }],
  activeCycles: [cycle],
  userId
}), /Stale|found 0/);

const historicalTargets = [
  { ...target, plan_type: "Plan A", exercise_key: "a_row", sort_order: 10 },
  { ...target, id: "11111111-1111-4111-8111-111111111111", plan_type: "Plan A", exercise_key: "a_pushup", sort_order: 30 },
  { ...target, id: "22222222-2222-4222-8222-222222222222", review_cycle_id: supersededCycle.id, plan_type: "Plan A", exercise_key: "a_row", active: false, sort_order: 10 },
  { ...target, id: "33333333-3333-4333-8333-333333333333", review_cycle_id: supersededCycle.id, plan_type: "Plan A", exercise_key: "a_pushup", active: false, sort_order: 30 }
];
assert.deepEqual(
  selectActiveTargetsForPlan({
    targets: historicalTargets,
    activeCycle: cycle,
    userId,
    plan: "Plan A"
  }).map((item) => item.id),
  [target.id, "11111111-1111-4111-8111-111111111111"]
);
assert.deepEqual(selectActiveTargetsForPlan({
  targets: historicalTargets,
  activeCycle: supersededCycle,
  userId,
  plan: "Plan A"
}), []);
assert.deepEqual(selectActiveTargetsForPlan({
  targets: [...historicalTargets, { ...historicalTargets[0], id: "44444444-4444-4444-8444-444444444444" }],
  activeCycle: cycle,
  userId,
  plan: "Plan A"
}), []);

console.log("fitness target link tests passed");
