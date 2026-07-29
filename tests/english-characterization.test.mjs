import assert from "node:assert/strict";
import { loadDashboardHarness } from "./helpers/dashboard-harness.mjs";

const { api, snapshot } = loadDashboardHarness();
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

assert.deepEqual(
  snapshot(api.orderReviewCards(cards, events).map((card) => card.id)),
  ["again", "new", "hard", "old-mastered", "recent-mastered"]
);

const progress = api.englishProgressStats({
  currentFocus: "Practice one answer chain.",
  _reviewEvents: [
    { session_id: "s1", result: "mastered", card_type_snapshot: "commute", reviewed_at: "2026-07-29T09:00:00.000Z" },
    { session_id: "s1", result: "again", card_type_snapshot: "mistake", reviewed_at: "2026-07-28T09:00:00.000Z" },
    { session_id: "s2", result: "hard", card_type_snapshot: "mistake", reviewed_at: "2026-07-27T09:00:00.000Z" },
    { session_id: "s3", result: "mastered", card_type_snapshot: "speaking", reviewed_at: "2026-07-26T09:00:00.000Z" },
    { session_id: "old", result: "again", card_type_snapshot: "commute", reviewed_at: "2026-07-20T09:00:00.000Z" }
  ],
  _selfChecks: []
});

assert.deepEqual(snapshot(progress), {
  reviewed: 4,
  masteredRate: 50,
  again: 1,
  sessions: 3,
  difficultType: "mistake",
  latestCheck: "No self-check yet.",
  nextFocus: "Review mistake cards first."
});

console.log("English characterization tests passed");
