import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDashboardHarness } from "./helpers/dashboard-harness.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dashboardSource = readFileSync(join(root, "app", "dashboard.js"), "utf8");
const initCalls = dashboardSource.match(/^init\(\);\r?$/gm) || [];
assert.equal(initCalls.length, 1);
assert.ok(dashboardSource.indexOf("const EnglishDomain =") < dashboardSource.indexOf(initCalls[0]));

const { api, snapshot } = loadDashboardHarness();
const now = Date.parse("2026-07-29T12:00:00.000Z");
const cards = [
  { id: "again", title: "Again", sortOrder: 5 },
  { id: "new", title: "New", sortOrder: 2 },
  { id: "hard", title: "Hard", sortOrder: 4 },
  { id: "old-mastered", title: "Old mastered", sortOrder: 3 },
  { id: "recent-mastered", title: "Recent mastered", sortOrder: 1 }
];
const events = [
  { review_card_id: "again", result: "again", reviewed_at: "2026-07-29T08:00:00.000Z" },
  { review_card_id: "hard", result: "hard", reviewed_at: "2026-07-28T08:00:00.000Z" },
  { review_card_id: "old-mastered", result: "mastered", reviewed_at: "2026-07-24T08:00:00.000Z" },
  { review_card_id: "recent-mastered", result: "again", reviewed_at: "2026-07-20T08:00:00.000Z" },
  { review_card_id: "recent-mastered", result: "mastered", reviewed_at: "2026-07-29T09:00:00.000Z" }
];

const cardsBefore = snapshot(cards);
const eventsBefore = snapshot(events);

assert.deepEqual(
  snapshot(api.EnglishDomain.orderReviewCards(cards, events, now).map((card) => card.id)),
  ["again", "new", "hard", "old-mastered", "recent-mastered"]
);
assert.deepEqual(snapshot(cards), cardsBefore);
assert.deepEqual(snapshot(events), eventsBefore);

const english = {
  currentFocus: "Practice one answer chain.",
  _reviewEvents: [
    { session_id: "s1", result: "mastered", card_type_snapshot: "commute", reviewed_at: "2026-07-29T09:00:00.000Z" },
    { session_id: "s1", result: "again", card_type_snapshot: "mistake", reviewed_at: "2026-07-28T09:00:00.000Z" },
    { session_id: "s2", result: "hard", card_type_snapshot: "mistake", reviewed_at: "2026-07-27T09:00:00.000Z" },
    { session_id: "s3", result: "mastered", card_type_snapshot: "speaking", reviewed_at: "2026-07-26T09:00:00.000Z" },
    { session_id: "old", result: "again", card_type_snapshot: "commute", reviewed_at: "2026-07-20T09:00:00.000Z" }
  ],
  _selfChecks: []
};
const englishBefore = snapshot(english);
const progress = api.EnglishDomain.progressStats(english, now);

assert.deepEqual(snapshot(progress), {
  reviewed: 4,
  masteredRate: 50,
  again: 1,
  sessions: 3,
  difficultType: "mistake",
  latestCheck: "No self-check yet.",
  nextFocus: "Review mistake cards first."
});
assert.deepEqual(snapshot(english), englishBefore);

const groupingEvents = [
  { session_id: undefined, result: "again", reviewed_at: "2026-07-28T08:00:00.000Z" },
  { session_id: undefined, result: "mastered", reviewed_at: "2026-07-29T08:00:00.000Z" },
  { session_id: "s1", result: "hard", reviewed_at: "2026-07-29T07:00:00.000Z" },
  { session_id: "s1", result: "mastered", reviewed_at: "2026-07-29T09:00:00.000Z" }
];
const groupingBefore = snapshot(groupingEvents);
const groupedSessions = api.EnglishDomain.groupReviewEventsBySession(groupingEvents);
assert.deepEqual(snapshot(groupedSessions), [
  { sessionId: "s1", reviewedAt: "2026-07-29T09:00:00.000Z", count: 2, mastered: 1, hard: 1, again: 0 },
  { reviewedAt: "2026-07-29T08:00:00.000Z", count: 2, mastered: 1, hard: 0, again: 1 }
]);
assert.equal(groupedSessions[1].sessionId, undefined);
assert.deepEqual(snapshot(groupingEvents), groupingBefore);

const cutoffEvent = {
  session_id: "cutoff-session",
  result: "again",
  card_type_snapshot: "cutoff",
  reviewed_at: new Date(now - 7 * 86400000).toISOString()
};
const cutoffSelfChecks = [
  { check_date: "2026-07-28", answer_chain: "Older", future_action: "Older", updated_at: "2026-07-28T12:00:00.000Z" },
  { check_date: "2026-07-29", answer_chain: "Latest", future_action: "Latest", created_at: "2026-07-29T13:00:00.000Z" }
];
const cutoffEventsBefore = snapshot([cutoffEvent]);
const cutoffSelfChecksBefore = snapshot(cutoffSelfChecks);
const cutoffProgress = api.EnglishDomain.progressStats({
  currentFocus: "Practice one answer chain.",
  _reviewEvents: [cutoffEvent],
  _selfChecks: cutoffSelfChecks
}, now);
assert.equal(cutoffProgress.reviewed, 1);
assert.equal(cutoffProgress.latestCheck, "2026-07-29: answer chain Latest, future action Latest.");
assert.deepEqual(snapshot([cutoffEvent]), cutoffEventsBefore);
assert.deepEqual(snapshot(cutoffSelfChecks), cutoffSelfChecksBefore);
const sortedChecks = api.EnglishDomain.sortedSelfChecks(cutoffSelfChecks);
assert.deepEqual(snapshot(sortedChecks), [cutoffSelfChecks[1], cutoffSelfChecks[0]]);
assert.deepEqual(snapshot(cutoffSelfChecks), cutoffSelfChecksBefore);

const cardInput = {
  id: "card-1",
  card_type: "mistake",
  title: "Timestamped card",
  prompt: "Use it.",
  answer_hint: "Hint",
  tags: ["grammar"],
  sort_order: 7
};
const eventInput = {
  id: "event-1",
  review_card_id: "card-1",
  session_id: "session-1",
  result: "mastered",
  card_type_snapshot: "mistake",
  card_title_snapshot: "Timestamped card",
  tags_snapshot: ["grammar"],
  reviewed_at: "2026-07-29T10:00:00.000Z"
};
const selfCheckInput = {
  id: "check-1",
  session_id: "session-1",
  check_date: "2026-07-29",
  answer_chain: "Clear answer",
  future_action: "Add detail",
  note: "Keep going",
  created_at: "2026-07-29T10:30:00.000Z",
  updated_at: "2026-07-29T11:00:00.000Z"
};
const normalizationInputsBefore = snapshot([cardInput, eventInput, selfCheckInput]);
assert.deepEqual(snapshot(api.EnglishDomain.normalizeReviewCard(cardInput)), {
  id: "card-1",
  type: "mistake",
  title: "Timestamped card",
  prompt: "Use it.",
  answerHint: "Hint",
  tags: ["grammar"],
  sortOrder: 7
});
assert.deepEqual(snapshot(api.EnglishDomain.normalizeReviewEvent(eventInput, "2026-07-30T00:00:00.000Z")), {
  id: "event-1",
  review_card_id: "card-1",
  session_id: "session-1",
  result: "mastered",
  card_type_snapshot: "mistake",
  card_title_snapshot: "Timestamped card",
  tags_snapshot: ["grammar"],
  reviewed_at: "2026-07-29T10:00:00.000Z"
});
assert.deepEqual(snapshot(api.EnglishDomain.normalizeSelfCheck(selfCheckInput, "2026-07-30T00:00:00.000Z")), {
  id: "check-1",
  session_id: "session-1",
  check_date: "2026-07-29",
  answer_chain: "Clear answer",
  future_action: "Add detail",
  note: "Keep going",
  created_at: "2026-07-29T10:30:00.000Z",
  updated_at: "2026-07-29T11:00:00.000Z"
});
assert.equal(
  api.EnglishDomain.normalizeReviewEvent({ id: "event-fallback", session_id: "session-1", result: "again" }, "2026-07-30T00:00:00.000Z").reviewed_at,
  "2026-07-30T00:00:00.000Z"
);
const fallbackSelfCheck = api.EnglishDomain.normalizeSelfCheck({ id: "check-fallback" }, "2026-07-30T00:00:00.000Z");
assert.equal(fallbackSelfCheck.created_at, "2026-07-30T00:00:00.000Z");
assert.equal(fallbackSelfCheck.updated_at, "2026-07-30T00:00:00.000Z");
assert.deepEqual(snapshot([cardInput, eventInput, selfCheckInput]), normalizationInputsBefore);

console.log("English characterization tests passed");
