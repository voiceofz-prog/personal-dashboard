import assert from "node:assert/strict";
import "../app/fitness-target-link.js";

const { resolveTargetId } = globalThis.FitnessTargetLink;
const userId = "08dc15cb-aa8e-40fe-bfdf-0ef659292e0e";
const cycle = {
  id: "fc52ab8c-1622-4bd5-b7eb-1567975107da",
  user_id: userId,
  domain: "fitness",
  status: "active"
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
assert.equal(resolveTargetId({
  workout: { ...workout, target_id: target.id },
  targets: [{ ...target, active: false }],
  activeCycle: null,
  userId
}), target.id);
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

console.log("fitness target link tests passed");
