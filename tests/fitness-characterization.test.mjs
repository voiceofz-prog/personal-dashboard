import assert from "node:assert/strict";
import { loadDashboardHarness } from "./helpers/dashboard-harness.mjs";

const { api, snapshot } = loadDashboardHarness();
const userId = "08dc15cb-aa8e-40fe-bfdf-0ef659292e0e";

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

assert.deepEqual(snapshot({
  id: draft.daily.id,
  entry_date: draft.daily.entry_date,
  bodyweight_kg: draft.daily.bodyweight_kg,
  training_status: draft.daily.training_status,
  training_content: draft.daily.training_content,
  protein: draft.daily.protein,
  sleep_hours: draft.daily.sleep_hours,
  energy_score: draft.daily.energy_score,
  recovery_score: draft.daily.recovery_score,
  soreness_level: draft.daily.soreness_level,
  soreness_areas: draft.daily.soreness_areas,
  notes: draft.daily.notes
}), {
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

// Missing published targets must not hide a measured recovery warning.
const warningHarness = loadDashboardHarness();
const warningFitness = warningHarness.api.buildFitnessData({dailyEntries:[entry({sleep_hours:5.5,recovery_score:2})],workouts:[],planTargets:[],weeklyReviews:[],exerciseTargets:[],reviewCycles:[]});
warningHarness.api.state.session = {demo:true,user:{id:userId}};
warningHarness.api.state.data = warningHarness.api.emptyDashboard();
warningHarness.api.state.data.fitness = warningFitness;
const warningForm = warningHarness.document.getElementById('fitnessReportForm');
warningForm.dataset.touched = 'true';
warningForm.elements.plan_template = {value:'Plan A'};
warningHarness.api.renderFitness(warningFitness);
const warningHtml = warningHarness.document.getElementById('fitnessRecommendation').innerHTML;
assert.match(warningHtml.slice(0,warningHtml.indexOf('<details>')), /恢復提醒.*sleep 5.5h.*recovery 2\/5/);
console.log("Fitness characterization tests passed");
