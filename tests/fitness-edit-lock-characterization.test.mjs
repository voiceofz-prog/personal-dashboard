import assert from "node:assert/strict";
import { loadDashboardHarness } from "./helpers/dashboard-harness.mjs";

const userId = "08dc15cb-aa8e-40fe-bfdf-0ef659292e0e";
const entryId = "22222222-2222-4222-8222-222222222222";

function prepareExistingEntry(harness) {
  const { api } = harness;
  const data = api.emptyDashboard();
  data.fitness._entries = [{
    id: entryId,
    entry_date: "2026-07-29",
    training_status: "rest",
    training_content: "preserved snapshot",
    bodyweight_kg: null,
    protein: "",
    sleep_hours: null,
    energy_score: null,
    recovery_score: null,
    soreness_level: "none",
    soreness_areas: [],
    source: "fitness-review",
    notes: ""
  }];
  Object.assign(api.state, {
    data,
    editingFitnessId: null,
    lastWriteError: null,
    pending: [],
    session: {
      access_token: "access-token",
      demo: false,
      user: { id: userId, email: "vinson@example.com" }
    },
    supabaseReady: true
  });
}

async function verifyLock(harness) {
  const { api, document, setFetch, snapshot } = harness;
  prepareExistingEntry(harness);
  let networkCalls = 0;
  setFetch(async () => {
    networkCalls += 1;
    throw new Error("Blocked edit attempted a network request");
  });

  const renderedForm = document.getElementById("fitnessReportForm");
  renderedForm.elements = { id: { value: "" } };
  renderedForm.dataset.marker = "unchanged";
  const dataBeforeClick = snapshot(api.state.data);
  const formBeforeClick = snapshot(renderedForm);

  api.editLatestFitnessEntry();

  assert.deepEqual(snapshot(api.state.data), dataBeforeClick);
  assert.equal(api.state.editingFitnessId, null);
  assert.deepEqual(snapshot(renderedForm), formBeforeClick);
  assert.equal(document.getElementById("toast").textContent, api.FITNESS_EDIT_LOCK_MESSAGE);

  const hiddenIdForm = {
    dataset: { marker: "unchanged" },
    elements: { id: { value: entryId } }
  };
  const hiddenIdFormBefore = snapshot(hiddenIdForm);
  const stateBeforeSave = snapshot(api.state);
  let prevented = false;

  await api.saveFitnessEntry({
    preventDefault() {
      prevented = true;
    },
    target: hiddenIdForm
  });

  assert.equal(prevented, true);
  assert.deepEqual(snapshot(hiddenIdForm), hiddenIdFormBefore);
  assert.deepEqual(snapshot(api.state), stateBeforeSave);
  assert.equal(networkCalls, 0);
  assert.equal(document.getElementById("toast").textContent, api.FITNESS_EDIT_LOCK_MESSAGE);

  api.state.editingFitnessId = entryId;
  const editingStateForm = {
    dataset: { marker: "unchanged" },
    elements: { id: { value: "" } }
  };
  const editingStateFormBefore = snapshot(editingStateForm);
  const editingStateBeforeSave = snapshot(api.state);

  await api.saveFitnessEntry({
    preventDefault() {},
    target: editingStateForm
  });

  assert.deepEqual(snapshot(editingStateForm), editingStateFormBefore);
  assert.deepEqual(snapshot(api.state), editingStateBeforeSave);
  assert.equal(networkCalls, 0);
  assert.equal(document.getElementById("toast").textContent, api.FITNESS_EDIT_LOCK_MESSAGE);
}

await verifyLock(loadDashboardHarness());
await verifyLock(loadDashboardHarness());

console.log("Fitness edit lock characterization tests passed");
