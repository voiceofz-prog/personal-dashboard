import assert from "node:assert/strict";
import { loadDashboardHarness } from "./helpers/dashboard-harness.mjs";

const { api, snapshot } = loadDashboardHarness();
const userId = "08dc15cb-aa8e-40fe-bfdf-0ef659292e0e";
const otherUserId = "11111111-1111-4111-8111-111111111111";
const cycleId = "9ce08ae2-c5b9-495d-a8c8-4eb91cb8b209";
const staleCycleId = "fc52ab8c-1622-4bd5-b7eb-1567975107da";

const activeCycle = {
  id: cycleId,
  user_id: userId,
  domain: "fitness",
  status: "active"
};

const targetA = {
  id: "c5bfceb5-73be-44bb-b1d5-53c01d96e044",
  user_id: userId,
  review_cycle_id: cycleId,
  plan_type: "Plan A",
  exercise_key: "a_pushup",
  exercise_name: "Push-up",
  weight_kg: 12.5,
  reps_by_set: [8, 8, 8],
  instructions: "Stop before form breaks.",
  effective_from: "2026-07-01",
  active: true,
  sort_order: 20
};

const targetB = {
  id: "737e0d22-e640-49dd-9ebb-4dd0ccf7afc5",
  user_id: userId,
  review_cycle_id: cycleId,
  plan_type: "Plan A",
  exercise_key: "a_row",
  exercise_name: "Row",
  weight_kg: null,
  reps_by_set: [10, 10, 10],
  instructions: "Keep the ribs quiet.",
  effective_from: "2026-07-01",
  active: true,
  sort_order: 10
};

const targetPlanB = {
  ...targetA,
  id: "22222222-2222-4222-8222-222222222222",
  plan_type: "Plan B",
  exercise_key: "b_squat",
  exercise_name: "Goblet squat",
  sort_order: 10
};

// Published target projection owns plan filtering, stable display mapping, and safe empty states.
const targets = [targetA, targetPlanB, targetB];
const targetsBefore = snapshot(targets);
const selectedTargets = api.targetsForPlan({
  exerciseTargets: targets,
  jessicaReview: activeCycle
}, "Plan A");
assert.deepEqual(snapshot(selectedTargets.map((item) => item.id)), [targetB.id, targetA.id]);
assert.deepEqual(snapshot(targets), targetsBefore);

const workouts = [];
const projectedBefore = snapshot(selectedTargets);
assert.deepEqual(snapshot(api.recommendedExercises("Plan A", workouts, "maintain", selectedTargets)), [
  {
    key: "a_row",
    name: "Row",
    load: null,
    reps: [10, 10, 10],
    instructions: "Keep the ribs quiet.",
    targetId: targetB.id,
    prefix: ""
  },
  {
    key: "a_pushup",
    name: "Push-up",
    load: 12.5,
    reps: [8, 8, 8],
    instructions: "Stop before form breaks.",
    targetId: targetA.id,
    prefix: ""
  }
]);
assert.deepEqual(snapshot(selectedTargets), projectedBefore);
assert.deepEqual(snapshot(workouts), []);

assert.deepEqual(snapshot(api.targetsForPlan({ exerciseTargets: targets, jessicaReview: null }, "Plan A")), []);
assert.deepEqual(snapshot(api.targetsForPlan({
  exerciseTargets: [{ ...targetA, user_id: otherUserId }],
  jessicaReview: activeCycle
}, "Plan A")), []);
assert.deepEqual(snapshot(api.targetsForPlan({
  exerciseTargets: [{ ...targetA, review_cycle_id: staleCycleId }],
  jessicaReview: activeCycle
}, "Plan A")), []);
assert.deepEqual(snapshot(api.targetsForPlan({ exerciseTargets: [], jessicaReview: activeCycle }, "Plan A")), []);

// Latest workout selection is display projection, not a training completion or Plan decision.
const workoutRows = [
  { id: "33333333-3333-4333-8333-333333333333", workout_date: "2026-07-27", plan_type: "Plan A", completed: true, exercise: "Old" },
  { id: "44444444-4444-4444-8444-444444444444", workout_date: "2026-07-28", plan_type: "Plan A", completed: true, exercise: "Push-up" },
  { id: "55555555-5555-4555-8555-555555555555", workout_date: "2026-07-28", plan_type: "Plan A", completed: true, exercise: "Row" },
  { id: "66666666-6666-4666-8666-666666666666", workout_date: "2026-07-29", plan_type: "Plan A", completed: false, exercise: "Skipped" },
  { id: "77777777-7777-4777-8777-777777777777", workout_date: "2026-07-29", plan_type: "Plan B", completed: true, exercise: "Squat" }
];
const workoutRowsBefore = snapshot(workoutRows);
const latestPlanRows = api.latestWorkoutsForPlan(workoutRows, "Plan A");
assert.equal(new Set(latestPlanRows.map((item) => item.workout_date)).size, 1);
assert.equal(latestPlanRows[0].workout_date, "2026-07-28");
assert.deepEqual(snapshot(latestPlanRows.map((item) => item.id).sort()), [
  "44444444-4444-4444-8444-444444444444",
  "55555555-5555-4555-8555-555555555555"
].sort());
assert.deepEqual(snapshot(workoutRows), workoutRowsBefore);
assert.deepEqual(snapshot(api.latestWorkoutsForPlan([], "Plan A")), []);

// Latest entry and structured cards provide display fallbacks without deciding the next Plan.
const entries = [
  { id: "88888888-8888-4888-8888-888888888888", entry_date: "2026-07-27" },
  { id: "99999999-9999-4999-8999-999999999999", entry_date: "2026-07-29" }
];
const entriesBefore = snapshot(entries);
assert.equal(api.latestFitnessEntry(entries).id, entries[1].id);
assert.equal(api.latestFitnessEntry([]), null);
assert.deepEqual(snapshot(entries), entriesBefore);

const structuredFitness = {
  _workouts: [],
  planTargets: [{ title: "Plan A", detail: "Published Plan A target." }]
};
const structuredBefore = snapshot(structuredFitness);
assert.deepEqual(snapshot(api.buildStructuredPlanCards(structuredFitness)), [
  { title: "Plan A", status: "Baseline needed", detail: "Published Plan A target." },
  { title: "Plan B", status: "Baseline needed", detail: "Complete one Plan B session to start structured tracking." }
]);
assert.deepEqual(snapshot(structuredFitness), structuredBefore);

// Report formatting is Dashboard display projection over an already normalized draft.
const reportDraft = {
  entry_date: "2026-07-29",
  dayType: "rest",
  plan: "Plan A",
  exercises: [],
  supplements: "creatine",
  bodyweight_kg: 72.5,
  sleep_hours: null,
  energy_score: 3,
  recovery_score: null,
  soreness_level: "none",
  soreness_areas: [],
  notes: "Easy walk"
};
const reportBefore = snapshot(reportDraft);
assert.equal(api.buildFitnessReportFromDraft(reportDraft), [
  "7/29",
  "恢復日",
  "體重 72.5kg",
  "精神 3/5",
  "痠痛 無",
  "今日補給 creatine",
  "Easy walk"
].join("\n"));
assert.deepEqual(snapshot(reportDraft), reportBefore);

const emptyFitness = { _entries: [], _workouts: [] };
const emptyFitnessBefore = snapshot(emptyFitness);
assert.equal(api.latestBodyState(emptyFitness), "No body-status record yet.");
assert.equal(api.latestTrainingEvidence(emptyFitness), "No completed training evidence yet.");
const emptySummary = {
  bodyweight_kg: null,
  sleep_hours: null,
  energy_score: null,
  recovery_score: null,
  soreness_level: "none",
  soreness_areas: [],
  notes: ""
};
const emptySummaryBefore = snapshot(emptySummary);
assert.equal(api.fitnessEntrySummary(emptySummary), "Status recorded.");
assert.deepEqual(snapshot(emptyFitness), emptyFitnessBefore);
assert.deepEqual(snapshot(emptySummary), emptySummaryBefore);

// Partial and completed display fallbacks remain non-mutating and data-shaped.
const partialEntry = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  entry_date: "2026-07-28",
  bodyweight_kg: null,
  sleep_hours: null,
  energy_score: null,
  recovery_score: null,
  soreness_level: "none",
  soreness_areas: [],
  notes: ""
};
const partialFitness = { _entries: [partialEntry], _workouts: [] };
const partialBefore = snapshot(partialFitness);
assert.equal(api.latestBodyState(partialFitness), "Status saved without numeric measures.");
const partialTraining = {
  _entries: [{ ...partialEntry, training_status: "trained", training_content: "Plan B session" }],
  _workouts: []
};
const partialTrainingBefore = snapshot(partialTraining);
assert.equal(api.latestTrainingEvidence(partialTraining), "2026-07-28: Plan B recorded.");
assert.deepEqual(snapshot(partialFitness), partialBefore);
assert.deepEqual(snapshot(partialTraining), partialTrainingBefore);

const completedEntry = {
  ...partialEntry,
  bodyweight_kg: 72.5,
  sleep_hours: 7,
  energy_score: 3,
  recovery_score: 2,
  soreness_level: "mild",
  soreness_areas: ["legs"],
  notes: "Easy walk"
};
const completedWorkout = {
  workout_date: "2026-07-29",
  plan_type: "Plan A",
  exercise: "Push-up",
  completed: true
};
const completedFitness = { _entries: [completedEntry], _workouts: [completedWorkout] };
const completedBefore = snapshot(completedFitness);
assert.equal(api.latestBodyState(completedFitness), "72.5 kg · 7.0h sleep · energy 3/5 · recovery 2/5");
assert.equal(api.latestTrainingEvidence(completedFitness), "2026-07-29: Plan A, Push-up.");
assert.equal(api.fitnessEntrySummary(completedEntry), "72.5 kg · sleep 7.0h · energy 3/5 · recovery 2/5 · mild soreness: legs · Easy walk");
assert.deepEqual(snapshot(completedFitness), completedBefore);

console.log("Fitness projection characterization tests passed");
