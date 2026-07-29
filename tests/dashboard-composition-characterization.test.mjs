import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDashboardHarness } from "./helpers/dashboard-harness.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { api, snapshot } = loadDashboardHarness();
const actualDemo = JSON.parse(readFileSync(join(root, "app", "data", "demo.json"), "utf8"));
const normalizedDemo = api.normalizeDemoData(actualDemo);

assert.equal(normalizedDemo._source, "demo");
assert.ok(normalizedDemo.home.todayFocus);
assert.match(normalizedDemo.home.todaySummary, /^English: \d+ cards in 7 days\. Fitness: .+\.$/);
assert.ok(Array.isArray(normalizedDemo.english.reviewCards));
assert.ok(Array.isArray(normalizedDemo.fitness._entries));

const data = api.emptyDashboard();
data.english.currentFocus = "Practice one answer chain.";
const before = JSON.stringify(data);
const composed = api.composeDashboard(data);

assert.equal(JSON.stringify(data), before);
assert.equal(composed.home.todayFocus, "Practice one answer chain.");
assert.equal(composed.home.todaySummary, "English: 0 cards in 7 days. Fitness: Plan A awaiting reviewed target.");
assert.deepEqual(snapshot(composed.home.recentUpdates), []);

console.log("Dashboard composition characterization tests passed");
