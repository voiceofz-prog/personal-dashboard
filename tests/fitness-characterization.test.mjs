import assert from "node:assert/strict";
import { loadDashboardHarness } from "./helpers/dashboard-harness.mjs";

const { api, snapshot } = loadDashboardHarness();
const userId = "08dc15cb-aa8e-40fe-bfdf-0ef659292e0e";
const cycleId = "9ce08ae2-c5b9-495d-a8c8-4eb91cb8b209";
const cycle = {
  id: cycleId,
  user_id: userId,
  domain: "fitness",
  status: "active",
  evidence: { decision: { training_lock: false } }
};
const planATarget = {
  id: "c5bfceb5-73be-44bb-b1d5-53c01d96e044",
  user_id: userId,
  review_cycle_id: cycleId,
  plan_type: "Plan A",
  exercise_key: "a_pushup",
  exercise_name: "Push-up",
  weight_kg: null,
  reps_by_set: [8, 8, 8],
  instructions: "Stop before form breaks.",
  effective_from: "2026-07-01",
  active: true,
  sort_order: 10
};

function entry(overrides = {}) {
  return {
    id: overrides.id || "11111111-1111-4111-8111-111111111111",
    entry_date: "2026-07-29",
    bodyweight_kg: 72,
    training_status: "rest",
    training_content: "",
    protein: "",
    sleep_hours: 7,
    energy_score: 3,
    recovery_score: 3,
    soreness_level: "none",
    soreness_areas: [],
    source: "manual",
    notes: "",
    ...overrides
  };
}

function fitness(overrides = {}) {
  return {
    ...api.emptyFitness(),
    jessicaReview: cycle,
    jessicaReviews: [cycle],
    exerciseTargets: [planATarget],
    ...overrides
  };
}

const pending = api.computeFitnessRecommendation(api.emptyFitness());
assert.equal(pending.mode, "pending");
assert.equal(pending.plan, "Plan A");
assert.equal(pending.reviewed, false);

const maintain = api.computeFitnessRecommendation(fitness({ _entries: [entry()] }));
assert.equal(maintain.mode, "maintain");
assert.equal(maintain.modeLabel, "Jessica target");
assert.equal(maintain.reviewed, true);

const conservative = api.computeFitnessRecommendation(fitness({
  _entries: [entry({ recovery_score: 2 })]
}));
assert.equal(conservative.mode, "caution");
assert.equal(conservative.modeLabel, "Conservative");
assert.match(conservative.detail, /reduced target/);

const recovery = api.computeFitnessRecommendation(fitness({
  _entries: [entry({ recovery_score: 1 })]
}));
assert.equal(recovery.mode, "recovery");
assert.equal(recovery.plan, "Recovery");

const progress = api.computeFitnessRecommendation(fitness({
  _entries: [entry({ recovery_score: 4, energy_score: 4 })],
  _workouts: [{
    id: "22222222-2222-4222-8222-222222222222",
    workout_date: "2026-07-28",
    plan_type: "Plan B",
    exercise_key: "b_squat",
    completed: true
  }]
}));
assert.equal(progress.mode, "progress");
assert.equal(progress.plan, "Plan A");
assert.equal(progress.reviewed, true);

const lockedCycle = {
  ...cycle,
  evidence: {
    decision: {
      recovery_tier: "recovery_day",
      published_target_count: 0,
      training_lock: true
    }
  }
};
const explicitLock = api.computeFitnessRecommendation(fitness({
  jessicaReview: lockedCycle,
  jessicaReviews: [lockedCycle],
  exerciseTargets: []
}));
assert.equal(explicitLock.mode, "recovery");
assert.equal(explicitLock.plan, "Recovery");
assert.equal(explicitLock.reviewed, false);

assert.equal(api.buildFitnessReportFromDraft({
  entry_date: "2026-07-29",
  dayType: "rest",
  plan: "Plan A",
  exercises: [],
  supplements: "肌酸",
  bodyweight_kg: 72.5,
  sleep_hours: 7,
  energy_score: 3,
  recovery_score: 2,
  soreness_level: "mild",
  soreness_areas: ["腿"],
  notes: "Easy walk"
}), [
  "7/29",
  "恢復日",
  "體重 72.5kg",
  "睡眠 7.0h",
  "精神 3/5",
  "恢復 2/5",
  "痠痛 mild（腿）",
  "今日補給 肌酸",
  "Easy walk"
].join("\n"));

assert.equal(api.buildFitnessReportFromDraft({
  entry_date: "2026-07-29",
  dayType: "trained",
  plan: "Plan A",
  exercises: [{ exercise: "Push-up", weight_kg: null, reps_by_set: [8, 8, 8] }],
  supplements: "",
  bodyweight_kg: null,
  sleep_hours: null,
  energy_score: null,
  recovery_score: null,
  soreness_level: "none",
  soreness_areas: [],
  notes: ""
}), "7/29\nPlan A\n痠痛 無\nPush-up，8/8/8");

function createRestForm(overrides = {}) {
  const values = {
    id: "33333333-3333-4333-8333-333333333333",
    entry_date: "2026-07-29",
    plan_template: "Plan A",
    custom_supplement: "creatine",
    soreness_level: "none",
    bodyweight: "72.5",
    sleep_hours: "7",
    energy_score: "3",
    recovery_score: "2",
    recovery_note: "Walk and sleep early",
    ...overrides
  };
  const elements = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { value }]));
  return {
    elements,
    reportValidity() {
      return true;
    },
    querySelector(selector) {
      if (selector === 'input[name="day_type"]:checked') return { value: "rest" };
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };
}

api.state.session = { demo: true, user: { id: userId } };
api.state.data = api.emptyDashboard();
api.state.pending = [];
const draft = api.normalizeFitnessDraft(createRestForm());

assert.deepEqual(snapshot(draft.daily), {
  id: "33333333-3333-4333-8333-333333333333",
  entry_date: "2026-07-29",
  bodyweight_kg: 72.5,
  training_status: "rest",
  training_content: "7/29\n恢復日\n體重 72.5kg\n睡眠 7.0h\n精神 3/5\n恢復 2/5\n痠痛 無\n今日補給 creatine\nWalk and sleep early",
  protein: "creatine",
  sleep_hours: 7,
  energy_score: 3,
  recovery_score: 2,
  soreness_level: "none",
  soreness_areas: [],
  source: "manual",
  notes: "Walk and sleep early"
});
assert.deepEqual(snapshot(draft.exercises), []);
assert.equal(draft.report, draft.daily.training_content);

api.state.data.fitness._entries = [entry({
  id: "33333333-3333-4333-8333-333333333333",
  training_status: "trained"
})];
api.state.data.fitness._workouts = [{
  id: "44444444-4444-4444-8444-444444444444",
  daily_entry_id: "33333333-3333-4333-8333-333333333333",
  workout_date: "2026-07-29",
  plan_type: "Plan A",
  exercise_key: "a_pushup",
  completed: true
}];
assert.equal(api.normalizeFitnessDraft(createRestForm()), null);

console.log("Fitness characterization tests passed");
