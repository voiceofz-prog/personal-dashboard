const VERSION = "2026.06.30.10";
const QUEUE_KEY = "jessica-dashboard-pending-v2";
const LEGACY_QUEUE_KEY = "jessica-dashboard-pending-v1";
const TOKEN_KEY = "jessica-dashboard-session-v1";
const DATA_CACHE_KEY = "jessica-dashboard-last-data-v2";
const REVIEW_DURATION_MS = 5 * 60 * 1000;
const WRITABLE_TABLES = new Set([
  "english_review_events",
  "english_self_checks",
  "fitness_daily_entries",
  "fitness_workouts"
]);

const state = {
  activeView: "home",
  config: null,
  session: null,
  demoData: null,
  data: null,
  pending: loadQueue(),
  supabaseReady: false,
  lastSync: null,
  lastReadError: null,
  lastWriteError: null,
  moduleStatus: {
    english: { ok: false, error: null, updatedAt: null },
    fitness: { ok: false, error: null, updatedAt: null }
  },
  reviewSession: null,
  reviewTimerId: null,
  editingFitnessId: null,
  lastSavedReport: ""
};

const views = {
  home: document.getElementById("homeView"),
  english: document.getElementById("englishView"),
  fitness: document.getElementById("fitnessView"),
  settings: document.getElementById("settingsView")
};

const pageTitle = document.getElementById("pageTitle");
const toast = document.getElementById("toast");

init();

async function init() {
  setDefaultDates();
  bindNavigation();
  bindAuthAndSettings();
  bindEnglishReview();
  bindFitnessForm();
  bindNetworkEvents();
  await loadConfig();
  restoreSession();

  if (state.session) {
    adoptLegacyPendingRecords();
    await loadDashboardData();
    await refreshDashboardData({ silent: true });
  }

  render();
  registerServiceWorker();
}

function bindNavigation() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });
  document.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.jump));
  });
}

function bindAuthAndSettings() {
  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = formToObject(event.target);
    await login(values.email, values.password);
  });
  document.getElementById("demoModeButton").addEventListener("click", enterDemoPreview);
  document.getElementById("logoutButton").addEventListener("click", logout);
  document.getElementById("syncButton").addEventListener("click", async () => {
    await syncPending();
    await refreshDashboardData();
  });
  document.getElementById("refreshButton").addEventListener("click", () => refreshDashboardData());
  document.getElementById("clearLocalButton").addEventListener("click", clearLocalQueue);
  document.getElementById("problemFilter").addEventListener("change", renderEnglish);
}

function bindNetworkEvents() {
  window.addEventListener("online", async () => {
    renderNetwork();
    await syncPending();
    await refreshDashboardData({ silent: true });
  });
  window.addEventListener("offline", renderNetwork);
}

async function loadConfig() {
  try {
    const response = await fetch("config.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No config.json");
    state.config = await response.json();
    state.supabaseReady = isValidRuntimeConfig(state.config);
  } catch (error) {
    state.config = null;
    state.supabaseReady = false;
  }
}

function isValidRuntimeConfig(config) {
  if (!config?.supabaseUrl || !config?.supabaseAnonKey) return false;
  if (config.supabaseUrl.includes("YOUR_PROJECT_REF") || config.supabaseAnonKey.includes("YOUR_")) return false;

  try {
    const url = new URL(config.supabaseUrl);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co")) return false;
  } catch (error) {
    return false;
  }

  const [, payload] = String(config.supabaseAnonKey).split(".");
  if (!payload) return true;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(atob(normalized)).role !== "service_role";
  } catch (error) {
    return false;
  }
}

async function loadDashboardData() {
  try {
    const response = await fetch("data/demo.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Demo data unavailable");
    state.demoData = normalizeDemoData(await response.json());
  } catch (error) {
    state.demoData = emptyDashboard();
  }

  if (state.session?.demo) {
    state.data = clone(state.demoData);
    state.moduleStatus.english = { ok: true, error: null, updatedAt: new Date().toISOString() };
    state.moduleStatus.fitness = { ok: true, error: null, updatedAt: new Date().toISOString() };
    return;
  }

  state.data = loadCachedData() || emptyDashboard();
}

function restoreSession() {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return;
  try {
    state.session = JSON.parse(raw);
    if (state.session?.demo && state.supabaseReady) {
      state.session = null;
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function enterDemoPreview() {
  state.session = {
    access_token: "demo-preview",
    refresh_token: "",
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    user: { id: "demo-preview", email: "demo-preview.local" },
    demo: true
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(state.session));
  await loadDashboardData();
  state.activeView = "home";
  render();
  showToast("Demo preview opened");
}

async function login(email, password) {
  if (!state.supabaseReady) {
    showToast("Configuration unavailable");
    return;
  }

  try {
    const result = await supabaseFetch(
      "/auth/v1/token?grant_type=password",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false
    );
    state.session = {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + Number(result.expires_in || 3600),
      user: result.user
    };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(state.session));
    adoptLegacyPendingRecords();
    await loadDashboardData();
    await syncPending();
    await refreshDashboardData({ silent: true });
    showToast("Logged in");
  } catch (error) {
    showToast(`Login failed: ${friendlyError(error)}`);
  }
  render();
}

function logout() {
  if (pendingForCurrentUser().length && !window.confirm("Logout will clear this session's unsynced records. Continue?")) return;
  stopReviewTimer();
  state.session = null;
  state.data = null;
  state.demoData = null;
  state.pending = [];
  state.reviewSession = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(DATA_CACHE_KEY);
  saveQueue();
  render();
  showToast("Logged out");
}

async function refreshDashboardData(options = {}) {
  if (!canUseCloud()) {
    render();
    return;
  }

  try {
    await refreshAccessTokenIfNeeded();
  } catch (error) {
    state.lastReadError = friendlyError(error);
    render();
    return;
  }

  const [englishResult, fitnessResult] = await Promise.allSettled([
    fetchEnglishRows(),
    fetchFitnessRows()
  ]);
  const next = clone(state.data || emptyDashboard());
  const now = new Date().toISOString();

  if (englishResult.status === "fulfilled") {
    next.english = buildEnglishData(englishResult.value);
    state.moduleStatus.english = { ok: true, error: null, updatedAt: now };
  } else {
    const message = friendlyError(englishResult.reason);
    state.moduleStatus.english = { ...state.moduleStatus.english, ok: false, error: message };
  }

  if (fitnessResult.status === "fulfilled") {
    next.fitness = buildFitnessData(fitnessResult.value);
    state.moduleStatus.fitness = { ok: true, error: null, updatedAt: now };
  } else {
    const message = friendlyError(fitnessResult.reason);
    state.moduleStatus.fitness = { ...state.moduleStatus.fitness, ok: false, error: message };
  }

  next._source = "cloud";
  state.data = composeDashboard(next);
  if (englishResult.status === "fulfilled" || fitnessResult.status === "fulfilled") {
    state.lastSync = now;
  }
  state.lastReadError = [state.moduleStatus.english.error, state.moduleStatus.fitness.error].filter(Boolean).join(" | ") || null;
  saveCachedData(state.data);
  if (!options.silent) showToast(state.lastReadError ? "Refresh completed with a module warning" : "Dashboard refreshed");
  render();
}

async function fetchEnglishRows() {
  const [focus, sessions, problems, reviewCards, reviewEvents, selfChecks, reviewCycles] = await Promise.all([
    selectRows("english_focus_cards", "select=*&order=updated_at.desc&limit=1"),
    selectRows("english_sessions", "select=*&order=session_date.desc,created_at.desc&limit=8"),
    selectRows("english_problem_tracker", "select=*&order=updated_at.desc"),
    selectRows("english_review_cards", "select=*&active=eq.true&order=sort_order.asc,updated_at.desc"),
    selectRows("english_review_events", "select=*&order=reviewed_at.desc&limit=200"),
    selectRows("english_self_checks", "select=*&order=updated_at.desc,created_at.desc&limit=30"),
    selectRows("jessica_review_cycles", "select=*&domain=eq.english&status=eq.active&order=reviewed_at.desc&limit=1")
  ]);
  return { focus, sessions, problems, reviewCards, reviewEvents, selfChecks, reviewCycles };
}

async function fetchFitnessRows() {
  const [dailyEntries, workouts, planTargets, weeklyReviews, exerciseTargets, reviewCycles] = await Promise.all([
    selectRows("fitness_daily_entries", "select=*&order=entry_date.desc,created_at.desc&limit=60"),
    selectRows("fitness_workouts", "select=*&order=workout_date.desc,created_at.desc&limit=200"),
    selectRows("fitness_plan_targets", "select=*&order=sort_order.asc,updated_at.desc"),
    selectRows("fitness_weekly_reviews", "select=*&order=week_start.desc&limit=8"),
    selectRows("fitness_exercise_targets", "select=*&order=plan_type.asc,sort_order.asc"),
    selectRows("jessica_review_cycles", "select=*&domain=eq.fitness&status=eq.active&order=reviewed_at.desc&limit=1")
  ]);
  return { dailyEntries, workouts, planTargets, weeklyReviews, exerciseTargets, reviewCycles };
}

async function selectRows(table, query) {
  const userId = encodeURIComponent(state.session.user.id);
  return supabaseFetch(`/rest/v1/${table}?${query}&user_id=eq.${userId}`, { method: "GET" }, true);
}

function buildEnglishData(rows) {
  const focus = rows.focus[0] || {};
  return {
    cefr: focus.cefr || "No level yet",
    currentFocus: focus.current_focus || "Add a speaking focus for the next commute review.",
    tags: normalizeArray(focus.tags, []),
    reviewSentences: normalizeArray(focus.review_sentences, []),
    problems: rows.problems.map((item) => ({
      problem: item.problem,
      status: item.status,
      latestEvidence: item.latest_evidence || "No recent evidence yet.",
      improvementLooksLike: item.improvement_condition || "Define an observable improvement."
    })),
    improvementLog: rows.sessions.map((item) => ({
      date: item.session_date || dateOnly(item.created_at),
      title: item.topic || "English practice",
      detail: [item.improvement, item.next_focus].filter(Boolean).join(" Next: ") || item.main_bottleneck || "Session summary saved."
    })),
    reviewCards: rows.reviewCards.map(normalizeReviewCard),
    _reviewEvents: rows.reviewEvents.map(normalizeReviewEvent),
    _selfChecks: rows.selfChecks.map(normalizeSelfCheck),
    jessicaReview: rows.reviewCycles[0] ? normalizeJessicaReview(rows.reviewCycles[0]) : null
  };
}

function buildFitnessData(rows) {
  const fitness = emptyFitness();
  fitness._entries = rows.dailyEntries.map(normalizeFitnessEntry);
  fitness._workouts = rows.workouts.map(normalizeWorkout);
  fitness.planTargets = rows.planTargets.map((item) => ({
    title: item.title,
    status: item.status || "Baseline",
    detail: item.detail || "No detail yet."
  }));
  fitness._weeklyReviews = rows.weeklyReviews;
  fitness.exerciseTargets = rows.exerciseTargets.map(normalizeExerciseTarget);
  fitness.jessicaReview = rows.reviewCycles[0] ? normalizeJessicaReview(rows.reviewCycles[0]) : null;
  return recalculateFitness(fitness);
}

function composeDashboard(data) {
  const result = clone(data);
  const progress = englishProgressStats(result.english);
  const recommendation = computeFitnessRecommendation(result.fitness);
  const updates = buildRecentUpdates(result);
  result.home = {
    todayFocus: progress.nextFocus || recommendation.title || "Choose one useful action for today.",
    todaySummary: `English: ${progress.reviewed} cards in 7 days. Fitness: ${recommendation.summary}.`,
    recentUpdates: updates
  };
  return result;
}

function buildRecentUpdates(data) {
  const updates = [];
  const sessions = groupReviewEventsBySession(data.english._reviewEvents || []);
  sessions.slice(0, 3).forEach((session) => {
    updates.push({
      date: dateOnly(session.reviewedAt),
      title: "Commute review",
      detail: `${session.count} cards: ${session.mastered} mastered, ${session.again} to review again.`
    });
  });
  sortedSelfChecks(data.english._selfChecks).slice(0, 2).forEach((item) => {
    updates.push({
      date: item.check_date,
      title: "English review summary",
      detail: [item.answer_chain, item.future_action, item.note].filter(Boolean).join(" / ") || "Summary saved."
    });
  });
  (data.fitness._entries || []).slice(0, 5).forEach((item) => {
    updates.push({
      date: item.entry_date,
      title: item.training_status === "trained" ? "Training logged" : "Recovery logged",
      detail: fitnessEntrySummary(item)
    });
  });
  return updates.sort((a, b) => compareDateDesc(a.date, b.date)).slice(0, 8);
}

async function saveOperation(table, payload, options = {}) {
  const operation = options.operation || "insert";
  const rowId = options.rowId || payload.id || crypto.randomUUID();
  const item = {
    id: options.queueId || crypto.randomUUID(),
    operation,
    table,
    row_id: rowId,
    payload: operation === "delete" ? {} : { ...payload, id: rowId },
    owner_user_id: state.session?.user?.id || null,
    queued_at: new Date().toISOString()
  };

  if (state.session?.demo) return item;

  if (!canUseCloud()) {
    upsertPendingOperation(item);
    saveQueue();
    state.lastWriteError = "Waiting for connection";
    render();
    return item;
  }

  try {
    await refreshAccessTokenIfNeeded();
    await executeOperation(item);
    state.lastWriteError = null;
  } catch (error) {
    const message = friendlyError(error);
    upsertPendingOperation({ ...item, last_error: message, last_attempt_at: new Date().toISOString() });
    saveQueue();
    state.lastWriteError = message;
  }
  return item;
}

function upsertPendingOperation(item) {
  const index = state.pending.findIndex((queued) =>
    queued.owner_user_id === item.owner_user_id &&
    queued.table === item.table &&
    queued.row_id === item.row_id
  );
  if (index < 0) {
    state.pending.push(item);
    return;
  }

  const existing = state.pending[index];
  if (existing.operation === "insert" && item.operation === "delete") {
    state.pending.splice(index, 1);
    return;
  }
  if (existing.operation === "insert" && item.operation === "update") {
    state.pending[index] = {
      ...item,
      operation: "insert",
      payload: { ...existing.payload, ...item.payload }
    };
    return;
  }
  state.pending[index] = item;
}

async function executeOperation(item) {
  if (!item.owner_user_id || item.owner_user_id !== state.session.user.id) {
    throw new Error("Pending operation is not owned by this session");
  }
  const userId = encodeURIComponent(state.session.user.id);
  const rowId = encodeURIComponent(item.row_id);

  if (item.operation === "delete") {
    return supabaseFetch(`/rest/v1/${item.table}?id=eq.${rowId}&user_id=eq.${userId}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" }
    });
  }

  const payload = prepareOperationPayload(item);
  if (item.operation === "update") {
    delete payload.id;
    return supabaseFetch(`/rest/v1/${item.table}?id=eq.${rowId}&user_id=eq.${userId}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(payload)
    });
  }

  return supabaseFetch(`/rest/v1/${item.table}?on_conflict=id`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(payload)
  });
}

function prepareOperationPayload(item) {
  const payload = { ...item.payload, user_id: state.session.user.id };
  if (item.table !== "fitness_workouts" || item.operation === "delete") return payload;
  payload.target_id = resolveWorkoutTargetId(payload);
  return payload;
}

async function syncPending() {
  const visible = pendingForCurrentUser();
  if (!visible.length) {
    render();
    return;
  }
  if (!canUseCloud()) {
    showToast("Cannot sync yet");
    return;
  }

  try {
    await refreshAccessTokenIfNeeded();
  } catch (error) {
    state.lastWriteError = friendlyError(error);
    render();
    return;
  }

  const visibleSet = new Set(visible);
  const remaining = state.pending.filter((item) => !visibleSet.has(item));
  let synced = 0;
  let firstError = null;

  for (const item of visible) {
    try {
      await executeOperation(item);
      synced += 1;
    } catch (error) {
      const message = friendlyError(error);
      firstError ||= message;
      remaining.push({ ...item, last_error: message, last_attempt_at: new Date().toISOString() });
    }
  }

  state.pending = remaining;
  state.lastWriteError = firstError;
  saveQueue();
  showToast(firstError ? `${synced} synced; ${visible.length - synced} still pending` : `${synced} synced`);
  render();
}

async function refreshAccessTokenIfNeeded() {
  if (!state.session?.refresh_token) return;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (state.session.expires_at && state.session.expires_at - nowSeconds > 60) return;
  const result = await supabaseFetch(
    "/auth/v1/token?grant_type=refresh_token",
    { method: "POST", body: JSON.stringify({ refresh_token: state.session.refresh_token }) },
    false
  );
  state.session = {
    access_token: result.access_token,
    refresh_token: result.refresh_token || state.session.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + Number(result.expires_in || 3600),
    user: result.user || state.session.user
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(state.session));
}

async function supabaseFetch(path, options = {}, useAuth = true) {
  const baseUrl = state.config.supabaseUrl.replace(/\/$/, "");
  const headers = {
    apikey: state.config.supabaseAnonKey,
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (useAuth && state.session?.access_token) headers.Authorization = `Bearer ${state.session.access_token}`;
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  if (!response.ok) {
    const text = await response.text();
    try {
      const details = JSON.parse(text);
      throw new Error(`${details.code ? `${details.code}: ` : ""}${details.message || response.statusText}`);
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error(text || response.statusText);
      throw error;
    }
  }
  if (response.status === 204 || response.headers.get("content-length") === "0") return null;
  return response.json();
}

function render() {
  renderNetwork();
  renderAuthGate();
  if (!state.session) return;
  renderHome();
  renderEnglish();
  renderFitness();
  renderSettings();
}

function renderAuthGate() {
  const authenticated = Boolean(state.session);
  document.body.classList.toggle("login-only", !authenticated);
  document.body.classList.toggle("authenticated", authenticated);
  document.getElementById("loginGate").hidden = authenticated;
  document.getElementById("appHeader").hidden = !authenticated;
  document.getElementById("appMain").hidden = !authenticated;
  document.getElementById("bottomNav").hidden = !authenticated;
  const demoButton = document.getElementById("demoModeButton");
  demoButton.hidden = authenticated || state.supabaseReady;
  if (!authenticated) {
    document.getElementById("loginGateStatus").textContent = state.supabaseReady
      ? "Sign in to continue."
      : "Supabase is unavailable. Use Demo Preview for low-risk sample data.";
  }
}

function switchView(view) {
  if (!views[view]) return;
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  state.activeView = view;
  Object.entries(views).forEach(([key, element]) => element.classList.toggle("active", key === view));
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  pageTitle.textContent = view[0].toUpperCase() + view.slice(1);
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function renderNetwork() {
  const status = document.getElementById("networkStatus");
  const online = navigator.onLine;
  status.textContent = online ? "Online" : "Offline";
  status.classList.toggle("offline", !online);
}

function renderHome() {
  const data = currentDashboard();
  const progress = englishProgressStats(data.english);
  const recommendation = computeFitnessRecommendation(data.fitness);
  const pendingCount = pendingForCurrentUser().length;
  const todayFocus = progress.nextFocus || recommendation.title || "Choose one useful action for today.";

  document.getElementById("todayFocus").textContent = todayFocus;
  document.getElementById("todaySummary").textContent =
    `English: ${progress.reviewed} cards reviewed in 7 days. Fitness: ${recommendation.summary}.`;
  document.getElementById("dataSource").textContent = dataSourceLabel(data);
  document.getElementById("homeEnglishBadge").textContent = progress.reviewed ? `${progress.reviewed} reviewed` : "Start review";
  document.getElementById("homeFitnessBadge").textContent = recommendation.modeLabel;
  document.getElementById("recentStatus").textContent = data.home.recentUpdates.length ? "Latest" : "Empty";

  const alerts = [];
  if (pendingCount) alerts.push(listCard("Sync needed", `${pendingCount} local operation${pendingCount === 1 ? "" : "s"} waiting.`, "Pending"));
  if (state.moduleStatus.english.error) alerts.push(listCard("English unavailable", state.moduleStatus.english.error, "Module"));
  if (state.moduleStatus.fitness.error) alerts.push(listCard("Fitness unavailable", state.moduleStatus.fitness.error, "Module"));
  document.getElementById("homeAlerts").hidden = !alerts.length;
  document.getElementById("homeAlertList").innerHTML = alerts.join("");

  const metrics = [
    metric("English", progress.reviewed, "cards / 7 days"),
    metric("Recovery", data.fitness.latestRecoveryScore || "--", "latest / 5"),
    metric("Next", recommendation.plan, recommendation.modeLabel)
  ];
  if (pendingCount) metrics.push(metric("Sync", pendingCount, "pending"));
  document.getElementById("homeMetrics").innerHTML = metrics.join("");

  document.getElementById("homeEnglishStatus").innerHTML = [
    listCard("Current", data.english.currentFocus, data.english.cefr),
    listCard("Evidence", progress.reviewed ? `${progress.masteredRate}% mastered; ${progress.again} marked again.` : "No review evidence in the last 7 days.", "7 days"),
    listCard("Next", progress.nextFocus, "Commute")
  ].join("");
  document.getElementById("homeFitnessStatus").innerHTML = [
    listCard("Current", latestBodyState(data.fitness), data.fitness.recoveryStatus),
    listCard("Evidence", latestTrainingEvidence(data.fitness), "Latest"),
    listCard("Next", recommendation.detail, recommendation.plan)
  ].join("");
  document.getElementById("recentUpdates").innerHTML = data.home.recentUpdates.length
    ? data.home.recentUpdates.map((item) => listCard(item.title, item.detail, item.date)).join("")
    : emptyState("No personal records yet", "Complete an English review or save a fitness record.");
}

function bindEnglishReview() {
  document.getElementById("startReviewSession").addEventListener("click", startReviewSession);
  document.getElementById("revealReviewAnswer").addEventListener("click", revealReviewAnswer);
  document.getElementById("finishReviewSession").addEventListener("click", finishReviewSession);
  document.querySelectorAll("[data-review-result]").forEach((button) => {
    button.addEventListener("click", () => rateReviewCard(button.dataset.reviewResult));
  });
  document.getElementById("englishCheckForm").addEventListener("submit", saveEnglishSummary);
  document.getElementById("editEnglishSummary").addEventListener("click", editLatestEnglishSummary);
  document.getElementById("cancelEnglishEdit").addEventListener("click", resetEnglishSummaryEditor);
}

function renderEnglish() {
  const data = currentDashboard().english;
  const progress = englishProgressStats(data);
  document.getElementById("cefrBadge").textContent = data.cefr;
  document.getElementById("englishFocus").textContent = data.currentFocus;
  document.getElementById("englishJessicaReview").textContent = data.jessicaReview
    ? `Jessica reviewed ${formatDateTime(data.jessicaReview.reviewed_at)} · ${data.jessicaReview.next_focus}`
    : "Awaiting the first Jessica evidence review.";
  document.getElementById("englishTags").innerHTML = data.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  document.getElementById("englishProgressBadge").textContent = progress.reviewed ? `${progress.reviewed} reviews` : "No evidence";
  document.getElementById("englishProgress").innerHTML = [
    metric("Reviewed", progress.reviewed, "cards"),
    metric("Mastered", `${progress.masteredRate}%`, "self-rated"),
    metric("Again", progress.again, "needs review"),
    metric("Sessions", progress.sessions, "last 7 days")
  ].join("");
  document.getElementById("englishProgressDetail").innerHTML = [
    listCard("Most difficult", progress.difficultType, "7 days"),
    listCard("Latest self-check", progress.latestCheck, "Evidence"),
    listCard("Next focus", progress.nextFocus, "Commute")
  ].join("");
  document.getElementById("editEnglishSummary").hidden = !data._selfChecks.length;

  document.getElementById("sentenceList").innerHTML = data.reviewSentences.length
    ? data.reviewSentences.map((sentence) => `<button class="sentence-button" type="button">${escapeHtml(sentence)}</button>`).join("")
    : emptyState("No review sentences", "Jessica can publish the next commute pack.");
  document.querySelectorAll(".sentence-button").forEach((button) => {
    button.addEventListener("click", () => copyText(button.textContent, "Copied sentence"));
  });

  const filter = document.getElementById("problemFilter").value;
  const problems = data.problems.filter((item) => filter === "all" || item.status === filter);
  document.getElementById("problemList").innerHTML = problems.length ? problems.map(problemCard).join("") : emptyState("No matching problems", "Try another filter.");
  document.getElementById("improvementLog").innerHTML = data.improvementLog.length
    ? data.improvementLog.map((item) => listCard(item.title, item.detail, item.date)).join("")
    : emptyState("No improvement log", "Jessica can add a curated session summary.");
  renderReviewCardGroup("commuteCards", data.reviewCards, "commute");
  renderReviewCardGroup("mistakeCards", data.reviewCards, "mistake");
  renderReviewCardGroup("warmupCards", data.reviewCards, "warmup");
  renderReviewCardGroup("selfTestCards", data.reviewCards, "self_test");
  renderReviewWorkspace(data);
}

function startReviewSession() {
  const data = currentDashboard().english;
  const cards = orderReviewCards(data.reviewCards, data._reviewEvents);
  if (!cards.length) {
    showToast("No active review cards");
    return;
  }
  const summaryForm = document.getElementById("englishCheckForm");
  summaryForm.reset();
  summaryForm.elements.id.value = "";
  summaryForm.elements.session_id.value = "";
  document.getElementById("cancelEnglishEdit").hidden = true;
  state.reviewSession = {
    id: crypto.randomUUID(),
    startedAt: Date.now(),
    deadline: Date.now() + REVIEW_DURATION_MS,
    cards,
    index: 0,
    ratings: { again: 0, hard: 0, mastered: 0 },
    completed: false
  };
  stopReviewTimer();
  state.reviewTimerId = window.setInterval(updateReviewTimer, 1000);
  renderEnglish();
}

function orderReviewCards(cards, events) {
  const latest = new Map();
  [...events].sort((a, b) => new Date(b.reviewed_at) - new Date(a.reviewed_at)).forEach((event) => {
    const key = event.review_card_id || event.card_title_snapshot;
    if (!latest.has(key)) latest.set(key, event);
  });
  const now = Date.now();
  return [...cards].sort((a, b) => {
    const aEvent = latest.get(a.id || a.title);
    const bEvent = latest.get(b.id || b.title);
    const score = (event) => {
      if (!event) return 1;
      if (event.result === "again") return 0;
      if (event.result === "hard") return 2;
      const ageDays = (now - new Date(event.reviewed_at).getTime()) / 86400000;
      return ageDays >= 3 ? 3 : 4;
    };
    return score(aEvent) - score(bEvent) || a.sortOrder - b.sortOrder;
  });
}

function renderReviewWorkspace(data) {
  const session = state.reviewSession;
  document.getElementById("reviewIdle").hidden = Boolean(session);
  document.getElementById("reviewActive").hidden = !session || session.completed;
  document.getElementById("reviewComplete").hidden = !session?.completed;

  if (!session) {
    document.getElementById("reviewTimer").textContent = "05:00";
    return;
  }
  updateReviewTimer();
  if (session.completed) {
    document.getElementById("reviewTimer").textContent = "Complete";
    const total = session.ratings.again + session.ratings.hard + session.ratings.mastered;
    document.getElementById("reviewSessionSummary").innerHTML = [
      metric("Reviewed", total, "cards"),
      metric("Mastered", session.ratings.mastered, "cards"),
      metric("Hard", session.ratings.hard, "cards"),
      metric("Again", session.ratings.again, "cards")
    ].join("");
    const form = document.getElementById("englishCheckForm");
    if (!form.elements.session_id.value) form.elements.session_id.value = session.id;
    return;
  }

  const card = session.cards[session.index % session.cards.length];
  document.getElementById("reviewProgress").textContent = `Card ${session.index + 1} · ${session.ratings.mastered + session.ratings.hard + session.ratings.again} reviewed`;
  document.getElementById("reviewCardType").textContent = card.type.replace("_", " ");
  document.getElementById("reviewCardTitle").textContent = card.title;
  document.getElementById("reviewPrompt").textContent = card.prompt;
  document.getElementById("reviewAnswer").textContent = card.answerHint || "Say one complete answer before moving on.";
  document.getElementById("reviewAnswer").hidden = true;
  document.getElementById("reviewRating").hidden = true;
  document.getElementById("revealReviewAnswer").hidden = false;
}

function revealReviewAnswer() {
  document.getElementById("reviewAnswer").hidden = false;
  document.getElementById("reviewRating").hidden = false;
  document.getElementById("revealReviewAnswer").hidden = true;
}

async function rateReviewCard(result) {
  const session = state.reviewSession;
  if (!session || session.completed) return;
  const card = session.cards[session.index % session.cards.length];
  const event = {
    id: crypto.randomUUID(),
    review_card_id: isUuid(card.id) ? card.id : null,
    session_id: session.id,
    result,
    card_type_snapshot: card.type,
    card_title_snapshot: card.title,
    tags_snapshot: card.tags,
    reviewed_at: new Date().toISOString()
  };
  session.ratings[result] += 1;
  upsertLocalRow("english_review_events", event);
  await saveOperation("english_review_events", event);
  session.index += 1;
  if (Date.now() >= session.deadline) finishReviewSession();
  else renderEnglish();
}

function finishReviewSession() {
  if (!state.reviewSession) return;
  state.reviewSession.completed = true;
  stopReviewTimer();
  renderEnglish();
}

function updateReviewTimer() {
  const session = state.reviewSession;
  if (!session || session.completed) return;
  const remaining = Math.max(0, session.deadline - Date.now());
  document.getElementById("reviewTimer").textContent = formatCountdown(remaining);
  if (!remaining) finishReviewSession();
}

function stopReviewTimer() {
  if (state.reviewTimerId) window.clearInterval(state.reviewTimerId);
  state.reviewTimerId = null;
}

async function saveEnglishSummary(event) {
  event.preventDefault();
  const form = event.target;
  if (!form.reportValidity()) return;
  const values = formToObject(form);
  const id = values.id || crypto.randomUUID();
  const existing = currentDashboard().english._selfChecks.find((item) => item.id === id);
  const payload = {
    id,
    session_id: values.session_id || state.reviewSession?.id || crypto.randomUUID(),
    check_date: todayISO(),
    answer_chain: values.answer_chain,
    future_action: values.future_action,
    note: values.note.trim()
  };
  await saveOperation("english_self_checks", payload, { operation: existing ? "update" : "insert", rowId: id });
  upsertLocalRow("english_self_checks", { ...payload, updated_at: new Date().toISOString(), created_at: existing?.created_at || new Date().toISOString() });
  showToast("Review summary saved");
  state.reviewSession = null;
  resetEnglishSummaryEditor();
  render();
}

function editLatestEnglishSummary() {
  const latest = sortedSelfChecks(currentDashboard().english._selfChecks)[0];
  if (!latest) return;
  stopReviewTimer();
  state.reviewSession = {
    id: latest.session_id || crypto.randomUUID(),
    startedAt: Date.now(),
    deadline: Date.now(),
    cards: [],
    index: 0,
    ratings: { again: 0, hard: 0, mastered: 0 },
    completed: true
  };
  const form = document.getElementById("englishCheckForm");
  form.elements.id.value = latest.id;
  form.elements.session_id.value = latest.session_id || "";
  form.elements.answer_chain.value = latest.answer_chain || "";
  form.elements.future_action.value = latest.future_action || "";
  form.elements.note.value = latest.note || "";
  document.getElementById("cancelEnglishEdit").hidden = false;
  renderEnglish();
  document.getElementById("reviewComplete").scrollIntoView({ block: "start" });
}

function resetEnglishSummaryEditor() {
  const form = document.getElementById("englishCheckForm");
  form.reset();
  form.elements.id.value = "";
  form.elements.session_id.value = "";
  document.getElementById("cancelEnglishEdit").hidden = true;
  if (state.reviewSession?.completed && !state.reviewSession.cards.length) state.reviewSession = null;
  renderEnglish();
}

function englishProgressStats(english) {
  const cutoff = Date.now() - 7 * 86400000;
  const events = (english._reviewEvents || []).filter((item) => new Date(item.reviewed_at).getTime() >= cutoff);
  const mastered = events.filter((item) => item.result === "mastered").length;
  const again = events.filter((item) => item.result === "again").length;
  const difficult = new Map();
  events.filter((item) => item.result !== "mastered").forEach((item) => {
    difficult.set(item.card_type_snapshot, (difficult.get(item.card_type_snapshot) || 0) + 1);
  });
  const difficultType = [...difficult.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]?.replace("_", " ") || "No difficult type yet";
  const latestCheck = sortedSelfChecks(english._selfChecks)[0];
  return {
    reviewed: events.length,
    masteredRate: events.length ? Math.round((mastered / events.length) * 100) : 0,
    again,
    sessions: new Set(events.map((item) => item.session_id)).size,
    difficultType,
    latestCheck: latestCheck
      ? `${latestCheck.check_date}: answer chain ${latestCheck.answer_chain || "not rated"}, future action ${latestCheck.future_action || "not rated"}.`
      : "No self-check yet.",
    nextFocus: events.length && difficultType !== "No difficult type yet"
      ? `Review ${difficultType} cards first.`
      : english.currentFocus
  };
}

function bindFitnessForm() {
  const form = document.getElementById("fitnessReportForm");
  form.addEventListener("submit", saveFitnessEntry);
  form.addEventListener("change", (event) => {
    if (event.target.name === "day_type") updateFitnessFormVisibility();
    if (event.target.name === "plan_template") {
      const fitness = currentDashboard().fitness;
      renderExerciseInputs(event.target.value, recommendedExercises(event.target.value, fitness._workouts, "maintain", targetsForPlan(fitness, event.target.value)));
    }
    if (event.target.name === "soreness_level" && event.target.value === "none") {
      setCheckedValues(form, "soreness_areas", []);
    }
    if (event.target.name === "soreness_areas" && event.target.checked && form.elements.soreness_level.value === "none") {
      form.elements.soreness_level.value = "mild";
    }
  });
  document.getElementById("copyFitnessReport").addEventListener("click", () => copyText(state.lastSavedReport, "Copied report"));
  document.getElementById("editFitnessEntry").addEventListener("click", editLatestFitnessEntry);
  document.getElementById("cancelFitnessEdit").addEventListener("click", resetFitnessForm);
  renderExerciseInputs(form.elements.plan_template.value);
  updateFitnessFormVisibility();
}

function renderFitness() {
  const fitness = currentDashboard().fitness;
  const recommendation = computeFitnessRecommendation(fitness);
  const latest = latestFitnessEntry(fitness._entries);
  document.getElementById("recoveryBadge").textContent = fitness.recoveryStatus;
  document.getElementById("recoveryBadge").classList.toggle("warning", fitness.recoveryLevel === "warning");
  document.getElementById("fitnessMetrics").innerHTML = [
    metric("Bodyweight", fitness.latestBodyweight, "latest"),
    metric("7-day avg", fitness.weeklyAverageBodyweight, "bodyweight"),
    metric("Training", fitness.trainingDaysThisWeek, "days this week"),
    metric("Recovery", fitness.latestRecoveryScore || "--", "latest / 5")
  ].join("");
  document.getElementById("recommendationMode").textContent = recommendation.modeLabel;
  document.getElementById("fitnessRecommendation").innerHTML = [
    listCard(recommendation.title, recommendation.detail, recommendation.plan),
    listCard("Reason", recommendation.reason, recommendation.modeLabel),
    fitness.jessicaReview
      ? listCard("Jessica review", fitness.jessicaReview.summary, formatDateTime(fitness.jessicaReview.reviewed_at))
      : listCard("Jessica review", "No reviewed target yet. Publish it from the Fitness project before training.", "Awaiting review")
  ].join("");
  document.getElementById("planList").innerHTML = buildStructuredPlanCards(fitness).map((item) => listCard(item.title, item.detail, item.status)).join("");
  document.getElementById("fitnessHistory").innerHTML = latest
    ? listCard(latest.training_status === "trained" ? "Training day" : "Recovery day", fitnessEntrySummary(latest), latest.entry_date)
    : emptyState("No fitness record yet", "Save body and recovery status to prepare the next session.");
  document.getElementById("editFitnessEntry").hidden = !latest;
  document.getElementById("savedFitnessReport").hidden = !state.lastSavedReport;
  document.getElementById("fitnessReportOutput").textContent = state.lastSavedReport;

  const form = document.getElementById("fitnessReportForm");
  if (!state.editingFitnessId && !form.dataset.touched) {
    form.elements.plan_template.value = recommendation.plan === "Recovery" ? inferNextPlanFromFitness(fitness) : recommendation.plan;
    renderExerciseInputs(form.elements.plan_template.value, recommendation.exercises);
    form.dataset.touched = "true";
  }
}

function computeFitnessRecommendation(fitness) {
  const entries = fitness._entries || [];
  const workouts = fitness._workouts || [];
  const latest = latestFitnessEntry(entries);
  const plan = inferNextPlanFromFitness(fitness);
  const relevantAreas = plan === "Plan A" ? ["肩", "胸", "背", "手臂"] : ["腿", "臀", "下背", "核心"];
  const sorenessAreas = latest?.soreness_areas || [];
  const relevantSoreness = sorenessAreas.some((area) => relevantAreas.includes(area));
  const lowSleep = latest?.sleep_hours !== null && latest?.sleep_hours < 6;
  const lowRecovery = latest?.recovery_score !== null && latest?.recovery_score <= 2;
  const severe = latest?.soreness_level === "severe";
  const moderateRelevant = latest?.soreness_level === "moderate" && relevantSoreness;
  const latestPlanWorkouts = latestWorkoutsForPlan(workouts, oppositePlan(plan));
  const completedLastPlan = latestPlanWorkouts.length > 0 && latestPlanWorkouts.every((item) => item.completed);

  let mode = "maintain";
  if (lowSleep || lowRecovery || severe) mode = "recovery";
  else if (
    latest?.recovery_score >= 4 &&
    latest?.energy_score >= 4 &&
    ["none", "mild"].includes(latest?.soreness_level || "none") &&
    completedLastPlan
  ) mode = "progress";
  else if (moderateRelevant || latest?.recovery_score === 3) mode = "maintain";

  const jessicaTargets = (fitness.exerciseTargets || []).filter((item) => item.plan_type === plan);
  const hasJessicaTargets = jessicaTargets.length > 0;
  const exercises = recommendedExercises(plan, workouts, mode, jessicaTargets);
  const modeLabel = mode === "recovery" ? "Recovery" : hasJessicaTargets ? "Jessica target" : mode === "progress" ? "Progress" : "Maintain";
  const reason = !latest
    ? "No body-status record yet; start with the baseline and confirm actual completion."
    : [
      latest.sleep_hours !== null ? `sleep ${formatNumber(latest.sleep_hours)}h` : null,
      latest.energy_score !== null ? `energy ${latest.energy_score}/5` : null,
      latest.recovery_score !== null ? `recovery ${latest.recovery_score}/5` : null,
      latest.soreness_level !== "none" ? `${latest.soreness_level} soreness${sorenessAreas.length ? `: ${sorenessAreas.join(", ")}` : ""}` : "no soreness"
    ].filter(Boolean).join(" · ");

  if (mode === "recovery") {
    return {
      plan: "Recovery",
      mode,
      modeLabel,
      title: "Recovery day recommended",
      summary: "recover before the next plan",
      detail: "Do not add load or reps. Record sleep, energy, recovery and soreness again before training.",
      reason,
      exercises,
      reviewed: hasJessicaTargets
    };
  }

  if (!hasJessicaTargets) {
    return {
      plan,
      mode: "pending",
      modeLabel: "Awaiting Jessica",
      title: `${plan} · target pending`,
      summary: `${plan} awaiting reviewed target`,
      detail: "The Fitness project has not published an executable target for this plan yet.",
      reason,
      exercises: [],
      reviewed: false
    };
  }

  return {
    plan,
    mode,
    modeLabel,
    title: `${plan} · ${modeLabel}`,
    summary: `${plan} ${modeLabel.toLowerCase()}`,
    detail: hasJessicaTargets
      ? "Follow Jessica's reviewed target exactly; record actual reps and do not exceed the reviewed ceiling."
      : mode === "progress"
        ? "Keep the same load and add 1–2 reps to the final set of the main exercise only if form stays clean."
      : "Repeat the previous target with cleaner tempo; do not add load.",
    reason,
    exercises,
    reviewed: hasJessicaTargets
  };
}

function recommendedExercises(plan, workouts, mode, reviewedTargets = []) {
  const baseline = reviewedTargets.length
    ? reviewedTargets.map((item) => ({
      key: item.exercise_key,
      name: item.exercise_name,
      load: item.weight_kg,
      reps: item.reps_by_set,
      instructions: item.instructions,
      targetId: item.id
    }))
    : [];
  return baseline.map((item, index) => {
    const latest = [...workouts]
      .filter((workout) => workout.exercise_key === item.key && workout.completed)
      .sort((a, b) => compareDateDesc(a.workout_date, b.workout_date))[0];
    const reps = reviewedTargets.length
      ? [...item.reps]
      : latest?.reps_by_set?.length ? [...latest.reps_by_set] : [...item.reps];
    if (!reviewedTargets.length && mode === "progress" && index === 0 && reps.length) reps[reps.length - 1] += 1;
    return {
      ...item,
      load: reviewedTargets.length ? item.load : latest?.weight_kg ?? item.load,
      reps,
      prefix: item.prefix || "",
      targetId: item.targetId || null,
      instructions: item.instructions || ""
    };
  });
}

function targetsForPlan(fitness, plan) {
  return (fitness.exerciseTargets || [])
    .filter((item) => item.active && item.plan_type === plan)
    .sort((a, b) => a.sort_order - b.sort_order);
}

function renderExerciseInputs(planName, recommendations = null, completedRows = []) {
  const picker = document.getElementById("exercisePicker");
  const fitness = currentDashboard()?.fitness || emptyFitness();
  const items = recommendations || recommendedExercises(planName, fitness._workouts, "maintain", targetsForPlan(fitness, planName));
  const completedMap = new Map(completedRows.map((item) => [item.exercise_key, item]));
  picker.innerHTML = items.length
    ? items.map((item) => exerciseInput(item, completedMap.get(item.key))).join("")
    : emptyState("Awaiting Jessica target", "Record recovery status first. Training targets are published from the Fitness project.");
}

function exerciseInput(item, completed) {
  const weight = completed?.weight_kg ?? item.load ?? "";
  const reps = completed?.reps_by_set?.length ? completed.reps_by_set.join("/") : item.reps.join("/");
  const targetId = completed?.target_id || item.targetId || "";
  return `<article class="exercise-row" data-exercise-key="${escapeHtml(item.key)}" data-exercise-name="${escapeHtml(item.name)}" data-target-id="${escapeHtml(targetId)}"><label class="switch-line"><input type="checkbox" name="exercise_completed" ${completed ? "checked" : ""}><span>${escapeHtml(item.name)}</span></label>${item.instructions ? `<p class="card-text">${escapeHtml(item.instructions)}</p>` : ""}<div class="exercise-fields ${item.load === null && weight === "" ? "single" : ""}">${item.load !== null || weight !== "" ? `<label>重量 kg<input name="exercise_weight" type="text" inputmode="decimal" value="${escapeHtml(weight)}"></label>` : ""}<label>各組次數<input name="exercise_reps" type="text" inputmode="numeric" value="${escapeHtml(`${item.prefix || ""}${reps}`)}"></label></div></article>`;
}

function updateFitnessFormVisibility() {
  const form = document.getElementById("fitnessReportForm");
  const trained = getRadioValue(form, "day_type") === "trained";
  document.getElementById("planTemplateLabel").hidden = !trained;
  document.getElementById("exercisePicker").hidden = !trained;
}

function normalizeFitnessDraft(form) {
  if (!form.reportValidity()) return null;
  const dayType = getRadioValue(form, "day_type") || "rest";
  const entryId = form.elements.id.value || crypto.randomUUID();
  const plan = form.elements.plan_template.value;
  const exercises = dayType === "trained" ? collectCompletedExercises(form, plan, entryId) : [];
  if (dayType === "trained" && !exercises.length) {
    showToast("Check at least one completed exercise");
    return null;
  }
  const supplements = formatSupplements(selectedValues(form, "supplements"), form.elements.custom_supplement.value.trim());
  const sorenessLevel = form.elements.soreness_level.value;
  const daily = {
    id: entryId,
    entry_date: form.elements.entry_date.value || todayISO(),
    bodyweight_kg: numberOrNull(form.elements.bodyweight.value.trim()),
    training_status: dayType,
    training_content: "",
    protein: supplements,
    sleep_hours: numberOrNull(form.elements.sleep_hours.value.trim()),
    energy_score: numberOrNull(form.elements.energy_score.value),
    recovery_score: numberOrNull(form.elements.recovery_score.value),
    soreness_level: sorenessLevel,
    soreness_areas: sorenessLevel === "none" ? [] : selectedValues(form, "soreness_areas"),
    source: "manual",
    notes: form.elements.recovery_note.value.trim()
  };
  daily.training_content = buildFitnessReportFromDraft({
    entry_date: daily.entry_date,
    dayType,
    plan,
    exercises,
    supplements,
    bodyweight_kg: daily.bodyweight_kg,
    sleep_hours: daily.sleep_hours,
    energy_score: daily.energy_score,
    recovery_score: daily.recovery_score,
    soreness_level: daily.soreness_level,
    soreness_areas: daily.soreness_areas,
    notes: daily.notes
  });
  return { daily, exercises, report: daily.training_content };
}

function collectCompletedExercises(form, plan, entryId) {
  return Array.from(form.querySelectorAll(".exercise-row")).flatMap((row) => {
    if (!row.querySelector('input[name="exercise_completed"]').checked) return [];
    const repsText = row.querySelector('input[name="exercise_reps"]')?.value || "";
    const weight = row.querySelector('input[name="exercise_weight"]')?.value || "";
    const key = row.dataset.exerciseKey;
    const existing = currentDashboard().fitness._workouts.find((item) =>
      item.daily_entry_id === entryId && item.exercise_key === key
    );
    const repsBySet = parseReps(repsText);
    const workout = {
      id: existing?.id || crypto.randomUUID(),
      daily_entry_id: entryId,
      workout_date: form.elements.entry_date.value || todayISO(),
      plan_type: plan,
      exercise_key: key,
      exercise: row.dataset.exerciseName,
      target_id: existing?.target_id || (isUuid(row.dataset.targetId) ? row.dataset.targetId : null),
      weight_kg: numberOrNull(weight),
      weight: weight ? `${weight} kg` : "",
      reps_by_set: repsBySet,
      reps: repsBySet.join("/"),
      sets: String(repsBySet.length),
      completed: true,
      source: "manual",
      next_target: ""
    };
    workout.target_id = resolveWorkoutTargetId(workout);
    return [workout];
  });
}

function resolveWorkoutTargetId(workout) {
  const fitness = currentDashboard().fitness;
  return FitnessTargetLink.resolveTargetId({
    workout,
    targets: fitness.exerciseTargets,
    activeCycle: fitness.jessicaReview,
    userId: state.session?.user?.id
  });
}

async function saveFitnessEntry(event) {
  event.preventDefault();
  let draft;
  try {
    draft = normalizeFitnessDraft(event.target);
  } catch (error) {
    state.lastWriteError = friendlyError(error);
    showToast(state.lastWriteError);
    render();
    return;
  }
  if (!draft) return;
  const existing = currentDashboard().fitness._entries.find((item) => item.id === draft.daily.id);
  await saveOperation("fitness_daily_entries", draft.daily, {
    operation: existing ? "update" : "insert",
    rowId: draft.daily.id
  });
  upsertLocalRow("fitness_daily_entries", { ...draft.daily, created_at: existing?.created_at || new Date().toISOString() });

  const oldRows = currentDashboard().fitness._workouts.filter((item) => item.daily_entry_id === draft.daily.id);
  const nextKeys = new Set(draft.exercises.map((item) => item.exercise_key));
  for (const old of oldRows) {
    if (!nextKeys.has(old.exercise_key)) {
      await saveOperation("fitness_workouts", {}, { operation: "delete", rowId: old.id });
      removeLocalRow("fitness_workouts", old.id);
    }
  }
  for (const workout of draft.exercises) {
    const old = oldRows.find((item) => item.exercise_key === workout.exercise_key);
    await saveOperation("fitness_workouts", workout, { operation: old ? "update" : "insert", rowId: workout.id });
    upsertLocalRow("fitness_workouts", workout);
  }

  state.lastSavedReport = draft.report;
  state.editingFitnessId = null;
  showToast(existing ? "Fitness record updated" : "Fitness record saved");
  resetFitnessForm({ keepReport: true });
  if (canUseCloud()) await refreshDashboardData({ silent: true });
  else render();
}

function editLatestFitnessEntry() {
  const data = currentDashboard().fitness;
  const latest = latestFitnessEntry(data._entries);
  if (!latest) return;
  const form = document.getElementById("fitnessReportForm");
  state.editingFitnessId = latest.id;
  form.elements.id.value = latest.id;
  form.elements.entry_date.value = latest.entry_date;
  form.elements.bodyweight.value = latest.bodyweight_kg ?? "";
  form.elements.sleep_hours.value = latest.sleep_hours ?? "";
  form.elements.energy_score.value = latest.energy_score ?? "";
  form.elements.recovery_score.value = latest.recovery_score ?? "";
  form.elements.soreness_level.value = latest.soreness_level || "none";
  form.elements.recovery_note.value = latest.notes || "";
  setRadioValue(form, "day_type", latest.training_status);
  setCheckedValues(form, "soreness_areas", latest.soreness_areas);
  const supplements = splitSupplements(latest.protein);
  const knownSupplements = Array.from(form.querySelectorAll('input[name="supplements"]')).map((input) => input.value);
  setCheckedValues(form, "supplements", supplements);
  form.elements.custom_supplement.value = supplements.filter((item) => !knownSupplements.includes(item)).join("、");
  const rows = data._workouts.filter((item) => item.daily_entry_id === latest.id);
  const plan = rows[0]?.plan_type || inferPlanFromText(latest.training_content) || inferNextPlanFromFitness(data);
  form.elements.plan_template.value = plan;
  renderExerciseInputs(plan, recommendedExercises(plan, data._workouts, "maintain", targetsForPlan(data, plan)), rows);
  updateFitnessFormVisibility();
  document.getElementById("saveFitnessEntry").textContent = "Update Record";
  document.getElementById("cancelFitnessEdit").hidden = false;
  form.dataset.touched = "true";
  document.querySelector(".fitness-generator").scrollIntoView({ block: "start" });
}

function resetFitnessForm(options = {}) {
  const form = document.getElementById("fitnessReportForm");
  form.reset();
  form.elements.id.value = "";
  form.elements.entry_date.value = todayISO();
  state.editingFitnessId = null;
  document.getElementById("saveFitnessEntry").textContent = "Save Today";
  document.getElementById("cancelFitnessEdit").hidden = true;
  const recommendation = computeFitnessRecommendation(currentDashboard().fitness);
  const plan = recommendation.plan === "Recovery" ? inferNextPlanFromFitness(currentDashboard().fitness) : recommendation.plan;
  form.elements.plan_template.value = plan;
  renderExerciseInputs(plan, recommendation.exercises);
  updateFitnessFormVisibility();
  form.dataset.touched = "true";
  if (!options.keepReport) state.lastSavedReport = "";
  render();
}

function buildFitnessReportFromDraft(draft) {
  const date = formatReportDate(draft.entry_date);
  const status = [
    draft.bodyweight_kg !== null ? `體重 ${formatNumber(draft.bodyweight_kg)}kg` : null,
    draft.sleep_hours !== null ? `睡眠 ${formatNumber(draft.sleep_hours)}h` : null,
    draft.energy_score !== null ? `精神 ${draft.energy_score}/5` : null,
    draft.recovery_score !== null ? `恢復 ${draft.recovery_score}/5` : null,
    draft.soreness_level !== "none"
      ? `痠痛 ${draft.soreness_level}${draft.soreness_areas.length ? `（${draft.soreness_areas.join("、")}）` : ""}`
      : "痠痛 無"
  ].filter(Boolean);
  if (draft.dayType !== "trained") {
    return [date, "恢復日", ...status, draft.supplements ? `今日補給 ${draft.supplements}` : null, draft.notes || null].filter(Boolean).join("\n");
  }
  const lines = draft.exercises.map((item) => {
    const load = item.weight_kg !== null ? ` ${formatNumber(item.weight_kg)}kg` : "";
    return `${item.exercise}${load}，${item.reps_by_set.join("/")}`;
  });
  return [date, draft.plan, ...status, ...lines, draft.supplements ? `今日補給 ${draft.supplements}` : null, draft.notes || null].filter(Boolean).join("\n");
}

function buildStructuredPlanCards(fitness) {
  return ["Plan A", "Plan B"].map((plan) => {
    const rows = latestWorkoutsForPlan(fitness._workouts, plan);
    if (!rows.length) {
      const baseline = fitness.planTargets.find((item) => item.title === plan);
      return {
        title: plan,
        status: "Baseline needed",
        detail: baseline?.detail || `Complete one ${plan} session to start structured tracking.`
      };
    }
    const date = rows[0].workout_date;
    const details = rows.slice(0, 3).map((item) => {
      const load = item.weight_kg !== null ? `${formatNumber(item.weight_kg)}kg ` : "";
      return `${item.exercise}: ${load}${item.reps_by_set.join("/") || item.reps}`;
    });
    return { title: plan, status: `Last ${date}`, detail: details.join(" · ") };
  });
}

function latestWorkoutsForPlan(workouts, plan) {
  const relevant = workouts.filter((item) => item.plan_type === plan && item.completed);
  const latestDate = relevant.sort((a, b) => compareDateDesc(a.workout_date, b.workout_date))[0]?.workout_date;
  return latestDate ? relevant.filter((item) => item.workout_date === latestDate) : [];
}

function inferNextPlanFromFitness(fitness) {
  const latestWorkout = [...(fitness._workouts || [])]
    .filter((item) => item.completed && ["Plan A", "Plan B"].includes(item.plan_type))
    .sort((a, b) => compareDateDesc(a.workout_date, b.workout_date))[0];
  if (latestWorkout) return oppositePlan(latestWorkout.plan_type);
  const latestTraining = [...(fitness._entries || [])]
    .filter((item) => item.training_status === "trained")
    .sort((a, b) => compareDateDesc(a.entry_date, b.entry_date))[0];
  return oppositePlan(inferPlanFromText(latestTraining?.training_content)) || "Plan A";
}

function oppositePlan(plan) {
  if (plan === "Plan A") return "Plan B";
  if (plan === "Plan B") return "Plan A";
  return "Plan A";
}

function recalculateFitness(fitness) {
  const entries = [...fitness._entries].sort((a, b) => compareDateDesc(a.entry_date, b.entry_date));
  const latest = entries[0];
  const latestWeight = entries.find((item) => item.bodyweight_kg !== null);
  fitness.latestBodyweight = latestWeight ? `${formatNumber(latestWeight.bodyweight_kg)} kg` : "--";
  const cutoff = startOfDayOffset(-6);
  const recentWeights = entries.filter((item) => item.bodyweight_kg !== null && new Date(`${item.entry_date}T00:00:00`) >= cutoff).map((item) => item.bodyweight_kg);
  fitness.weeklyAverageBodyweight = recentWeights.length ? `${formatNumber(avg(recentWeights))} kg` : "--";
  const weekStart = startOfWeek(new Date());
  fitness.trainingDaysThisWeek = String(new Set(entries.filter((item) =>
    item.training_status === "trained" && new Date(`${item.entry_date}T00:00:00`) >= weekStart
  ).map((item) => item.entry_date)).size);
  fitness.latestRecoveryScore = latest?.recovery_score ?? null;
  if (!latest) {
    fitness.recoveryStatus = "No status yet";
    fitness.recoveryLevel = "ok";
  } else if (
    latest.recovery_score !== null && latest.recovery_score <= 2 ||
    latest.sleep_hours !== null && latest.sleep_hours < 6 ||
    latest.soreness_level === "severe"
  ) {
    fitness.recoveryStatus = "Recovery warning";
    fitness.recoveryLevel = "warning";
  } else {
    fitness.recoveryStatus = latest.recovery_score ? "Recovery recorded" : "Recovery incomplete";
    fitness.recoveryLevel = "ok";
  }
  return fitness;
}

function renderSettings() {
  const pendingCount = pendingForCurrentUser().length;
  document.getElementById("authStatus").textContent = state.session.demo
    ? "Demo preview. Cloud sync is disabled."
    : `Logged in as ${state.session.user.email}`;
  const syncParts = [pendingCount ? `${pendingCount} pending` : "All local operations synced"];
  if (state.lastSync) syncParts.push(`last refresh ${formatDateTime(state.lastSync)}`);
  if (state.lastReadError) syncParts.push(`read warning: ${state.lastReadError}`);
  if (state.lastWriteError) syncParts.push(`write warning: ${state.lastWriteError}`);
  document.getElementById("syncStatus").textContent = `${syncParts.join(" · ")}.`;
  document.getElementById("syncButton").hidden = !pendingCount;
  document.getElementById("clearLocalButton").hidden = !pendingCount;
  document.getElementById("offlineBadge").textContent = navigator.onLine ? "Online" : "Offline";
  document.getElementById("offlineState").innerHTML = [
    listCard("Pending changes", `${pendingCount} for this account`, pendingCount ? "Needs sync" : "Clear"),
    listCard("English cache", state.moduleStatus.english.updatedAt ? `Updated ${formatDateTime(state.moduleStatus.english.updatedAt)}` : "No cloud cache yet", state.moduleStatus.english.error ? "Warning" : "Local"),
    listCard("Fitness cache", state.moduleStatus.fitness.updatedAt ? `Updated ${formatDateTime(state.moduleStatus.fitness.updatedAt)}` : "No cloud cache yet", state.moduleStatus.fitness.error ? "Warning" : "Local")
  ].join("");
  document.getElementById("versionBadge").textContent = VERSION;
  document.getElementById("versionText").textContent = `Jessica Dashboard build ${VERSION}`;
  document.getElementById("setupState").innerHTML = [
    listCard("Supabase config", state.supabaseReady ? "Runtime configuration loaded" : "Demo-only configuration", state.supabaseReady ? "Ready" : "Demo"),
    listCard("English module", state.moduleStatus.english.error || "Module available", state.moduleStatus.english.ok ? "Ready" : "Check"),
    listCard("Fitness module", state.moduleStatus.fitness.error || "Module available", state.moduleStatus.fitness.ok ? "Ready" : "Check"),
    listCard("Access control", "Authenticated owner rows plus dashboard allowlist", "RLS")
  ].join("");
}

function clearLocalQueue() {
  const visible = pendingForCurrentUser();
  if (!visible.length) return;
  if (!window.confirm("Clear unsynced changes for this account?")) return;
  const visibleSet = new Set(visible);
  state.pending = state.pending.filter((item) => !visibleSet.has(item));
  saveQueue();
  state.data = loadCachedData() || emptyDashboard();
  state.lastWriteError = null;
  render();
  showToast("Local queue cleared");
}

function currentDashboard() {
  const data = clone(state.data || emptyDashboard());
  if (!state.session?.demo) applyPendingOperations(data);
  return composeDashboard(data);
}

function applyPendingOperations(data) {
  const visible = pendingForCurrentUser();
  const mappings = {
    english_review_events: data.english._reviewEvents,
    english_self_checks: data.english._selfChecks,
    fitness_daily_entries: data.fitness._entries,
    fitness_workouts: data.fitness._workouts
  };
  visible.forEach((item) => {
    const rows = mappings[item.table];
    if (!rows) return;
    const index = rows.findIndex((row) => row.id === item.row_id);
    if (item.operation === "delete") {
      if (index >= 0) rows.splice(index, 1);
    } else if (index >= 0) {
      rows[index] = { ...rows[index], ...item.payload, _pending: true };
    } else {
      rows.push({ ...item.payload, _pending: true });
    }
  });
  data.fitness = recalculateFitness(data.fitness);
}

function upsertLocalRow(table, row) {
  if (!state.data) state.data = emptyDashboard();
  const mappings = {
    english_review_events: state.data.english._reviewEvents,
    english_self_checks: state.data.english._selfChecks,
    fitness_daily_entries: state.data.fitness._entries,
    fitness_workouts: state.data.fitness._workouts
  };
  const rows = mappings[table];
  if (!rows) return;
  const index = rows.findIndex((item) => item.id === row.id);
  if (index >= 0) rows[index] = { ...rows[index], ...row };
  else rows.unshift(row);
  if (table.startsWith("fitness_")) state.data.fitness = recalculateFitness(state.data.fitness);
}

function removeLocalRow(table, id) {
  const rows = table === "fitness_workouts" ? state.data?.fitness?._workouts : null;
  if (!rows) return;
  const index = rows.findIndex((item) => item.id === id);
  if (index >= 0) rows.splice(index, 1);
}

function normalizeDemoData(raw) {
  const data = emptyDashboard();
  data.english = {
    ...data.english,
    ...(raw.english || {}),
    reviewCards: (raw.english?.reviewCards || []).map((card, index) => normalizeReviewCard({ ...card, sort_order: index + 1 })),
    _reviewEvents: (raw.english?._reviewEvents || []).map(normalizeReviewEvent),
    _selfChecks: (raw.english?._selfChecks || []).map(normalizeSelfCheck),
    jessicaReview: raw.english?.jessicaReview ? normalizeJessicaReview({ ...raw.english.jessicaReview, user_id: "demo-preview" }) : null
  };
  data.fitness = recalculateFitness({
    ...data.fitness,
    ...(raw.fitness || {}),
    _entries: (raw.fitness?._entries || []).map(normalizeFitnessEntry),
    _workouts: (raw.fitness?._workouts || []).map(normalizeWorkout),
    planTargets: raw.fitness?.planTargets || [],
    exerciseTargets: (raw.fitness?.exerciseTargets || []).map((item) => normalizeExerciseTarget({ ...item, user_id: "demo-preview" })),
    jessicaReview: raw.fitness?.jessicaReview ? normalizeJessicaReview({ ...raw.fitness.jessicaReview, user_id: "demo-preview" }) : null
  });
  data._source = "demo";
  return composeDashboard(data);
}

function emptyDashboard() {
  return {
    home: { todayFocus: "No focus yet", todaySummary: "", recentUpdates: [] },
    english: {
      cefr: "No level yet",
      currentFocus: "Add a speaking focus for the next commute review.",
      tags: [],
      problems: [],
      improvementLog: [],
      reviewSentences: [],
      reviewCards: [],
      _reviewEvents: [],
      _selfChecks: [],
      jessicaReview: null
    },
    fitness: emptyFitness(),
    _source: "empty"
  };
}

function emptyFitness() {
  return {
    latestBodyweight: "--",
    weeklyAverageBodyweight: "--",
    trainingDaysThisWeek: "0",
    latestRecoveryScore: null,
    recoveryStatus: "No status yet",
    recoveryLevel: "ok",
    planTargets: [],
    exerciseTargets: [],
    jessicaReview: null,
    _entries: [],
    _workouts: [],
    _weeklyReviews: []
  };
}

function normalizeFitnessEntry(item) {
  return {
    id: item.id || crypto.randomUUID(),
    entry_date: item.entry_date || todayISO(),
    bodyweight_kg: numberOrNull(item.bodyweight_kg),
    training_status: item.training_status || "rest",
    training_content: item.training_content || "",
    protein: item.protein || "",
    sleep_hours: numberOrNull(item.sleep_hours),
    energy_score: numberOrNull(item.energy_score),
    recovery_score: numberOrNull(item.recovery_score),
    soreness_level: item.soreness_level || "none",
    soreness_areas: normalizeArray(item.soreness_areas, []),
    source: item.source || "manual",
    notes: item.notes || "",
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || item.created_at || new Date().toISOString(),
    _pending: Boolean(item._pending)
  };
}

function normalizeWorkout(item) {
  return {
    id: item.id || crypto.randomUUID(),
    daily_entry_id: item.daily_entry_id || null,
    workout_date: item.workout_date || dateOnly(item.created_at),
    plan_type: item.plan_type || inferPlanFromText(item.exercise) || "",
    exercise_key: item.exercise_key || slugify(item.exercise || "workout"),
    exercise: item.exercise || "Workout",
    weight_kg: numberOrNull(item.weight_kg ?? String(item.weight || "").replace(/[^\d.]/g, "")),
    weight: item.weight || "",
    reps_by_set: normalizeIntegerArray(item.reps_by_set, parseReps(item.reps)),
    reps: item.reps || "",
    sets: item.sets || "",
    rpe: item.rpe || "",
    completed: item.completed !== false,
    source: item.source || "manual",
    target_id: item.target_id || null,
    next_target: item.next_target || "",
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || item.created_at || new Date().toISOString()
  };
}

function normalizeReviewCard(item) {
  return {
    id: item.id || null,
    type: item.card_type || item.type || "commute",
    title: item.title || "Review card",
    prompt: item.prompt || "",
    answerHint: item.answer_hint || item.answerHint || "",
    tags: normalizeArray(item.tags, []),
    sortOrder: Number(item.sort_order || item.sortOrder || 100)
  };
}

function normalizeJessicaReview(item) {
  return {
    id: item.id,
    user_id: item.user_id,
    domain: item.domain,
    status: item.status,
    evidence: item.evidence || {},
    summary: item.summary || "",
    next_focus: item.next_focus || "",
    reviewed_at: item.reviewed_at || item.created_at,
    next_review_after: item.next_review_after || null
  };
}

function normalizeExerciseTarget(item) {
  return {
    id: item.id,
    user_id: item.user_id,
    review_cycle_id: item.review_cycle_id,
    plan_type: item.plan_type,
    exercise_key: item.exercise_key,
    exercise_name: item.exercise_name,
    weight_kg: numberOrNull(item.weight_kg),
    reps_by_set: normalizeIntegerArray(item.reps_by_set, []),
    instructions: item.instructions || "",
    sort_order: Number(item.sort_order || 100),
    active: item.active !== false,
    effective_from: item.effective_from || todayISO()
  };
}

function normalizeReviewEvent(item) {
  return {
    id: item.id,
    review_card_id: item.review_card_id || null,
    session_id: item.session_id,
    result: item.result,
    card_type_snapshot: item.card_type_snapshot || "commute",
    card_title_snapshot: item.card_title_snapshot || "Review card",
    tags_snapshot: normalizeArray(item.tags_snapshot, []),
    reviewed_at: item.reviewed_at || item.created_at || new Date().toISOString()
  };
}

function normalizeSelfCheck(item) {
  return {
    id: item.id,
    session_id: item.session_id || null,
    check_date: item.check_date || dateOnly(item.created_at),
    answer_chain: item.answer_chain || "",
    future_action: item.future_action || "",
    note: item.note || "",
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || item.created_at || new Date().toISOString()
  };
}

function renderReviewCardGroup(elementId, cards, type) {
  const group = cards.filter((item) => item.type === type);
  document.getElementById(elementId).innerHTML = group.length
    ? group.map((item) => listCard(item.title, `${item.prompt}${item.answerHint ? ` Hint: ${item.answerHint}` : ""}`, item.tags.join(" / "))).join("")
    : emptyState("No cards yet", "Jessica can publish the next curated card.");
}

function groupReviewEventsBySession(events) {
  const sessions = new Map();
  events.forEach((event) => {
    const session = sessions.get(event.session_id) || {
      sessionId: event.session_id,
      reviewedAt: event.reviewed_at,
      count: 0,
      mastered: 0,
      hard: 0,
      again: 0
    };
    session.count += 1;
    session[event.result] += 1;
    if (new Date(event.reviewed_at) > new Date(session.reviewedAt)) session.reviewedAt = event.reviewed_at;
    sessions.set(event.session_id, session);
  });
  return [...sessions.values()].sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt));
}

function sortedSelfChecks(checks = []) {
  return [...checks].sort((a, b) =>
    new Date(b.updated_at || b.created_at || b.check_date) -
    new Date(a.updated_at || a.created_at || a.check_date)
  );
}

function latestFitnessEntry(entries) {
  return [...(entries || [])].sort((a, b) => compareDateDesc(a.entry_date, b.entry_date))[0] || null;
}

function latestBodyState(fitness) {
  const latest = latestFitnessEntry(fitness._entries);
  if (!latest) return "No body-status record yet.";
  return [
    latest.bodyweight_kg !== null ? `${formatNumber(latest.bodyweight_kg)} kg` : null,
    latest.sleep_hours !== null ? `${formatNumber(latest.sleep_hours)}h sleep` : null,
    latest.energy_score !== null ? `energy ${latest.energy_score}/5` : null,
    latest.recovery_score !== null ? `recovery ${latest.recovery_score}/5` : null
  ].filter(Boolean).join(" · ") || "Status saved without numeric measures.";
}

function latestTrainingEvidence(fitness) {
  const latest = [...fitness._workouts].filter((item) => item.completed).sort((a, b) => compareDateDesc(a.workout_date, b.workout_date))[0];
  if (latest) return `${latest.workout_date}: ${latest.plan_type}, ${latest.exercise}.`;
  const legacy = [...fitness._entries].filter((item) => item.training_status === "trained").sort((a, b) => compareDateDesc(a.entry_date, b.entry_date))[0];
  return legacy ? `${legacy.entry_date}: ${inferPlanFromText(legacy.training_content) || "training"} recorded.` : "No completed training evidence yet.";
}

function fitnessEntrySummary(item) {
  return [
    item.bodyweight_kg !== null ? `${formatNumber(item.bodyweight_kg)} kg` : null,
    item.sleep_hours !== null ? `sleep ${formatNumber(item.sleep_hours)}h` : null,
    item.energy_score !== null ? `energy ${item.energy_score}/5` : null,
    item.recovery_score !== null ? `recovery ${item.recovery_score}/5` : null,
    item.soreness_level !== "none" ? `${item.soreness_level} soreness${item.soreness_areas.length ? `: ${item.soreness_areas.join(", ")}` : ""}` : null,
    item.notes || null
  ].filter(Boolean).join(" · ") || "Status recorded.";
}

function metric(label, value, hint) {
  return `<div class="metric-card"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(String(value))}</div><div class="hint">${escapeHtml(hint || "")}</div></div>`;
}

function listCard(title, detail, meta) {
  return `<article class="list-card"><div class="card-topline"><h3>${escapeHtml(title)}</h3><span class="mini-status">${escapeHtml(meta || "")}</span></div><p class="card-text">${escapeHtml(detail)}</p></article>`;
}

function emptyState(title, detail) {
  return `<div class="empty-state"><h3>${escapeHtml(title)}</h3><p class="card-text">${escapeHtml(detail)}</p></div>`;
}

function problemCard(item) {
  const className = item.status === "Active" ? "active" : item.status === "Stable" ? "stable" : "";
  return `<article class="problem-card"><div class="card-topline"><h3>${escapeHtml(item.problem)}</h3><span class="tag ${className}">${escapeHtml(item.status)}</span></div><p class="card-text">Latest: ${escapeHtml(item.latestEvidence)}</p><p class="card-text">Improvement: ${escapeHtml(item.improvementLooksLike)}</p></article>`;
}

function canUseCloud() {
  return Boolean(navigator.onLine && state.supabaseReady && state.session && !state.session.demo);
}

function dataSourceLabel(data) {
  if (state.session?.demo) return "Demo data";
  if (data._source === "cloud") return "Cloud data";
  if (loadCachedData()) return "Cached data";
  return "No cloud data";
}

function pendingForCurrentUser() {
  const userId = state.session?.user?.id || null;
  return state.pending.filter((item) => (item.owner_user_id || null) === userId);
}

function adoptLegacyPendingRecords() {
  const userId = state.session?.demo ? null : state.session?.user?.id;
  if (!userId) return;
  const legacy = loadJson(LEGACY_QUEUE_KEY, []);
  if (Array.isArray(legacy) && legacy.length) {
    legacy.forEach((item) => {
      if (!WRITABLE_TABLES.has(item?.table) || !item?.payload) return;
      const rowId = item.payload.id || crypto.randomUUID();
      upsertPendingOperation({
        id: crypto.randomUUID(),
        operation: "insert",
        table: item.table,
        row_id: rowId,
        payload: { ...item.payload, id: rowId },
        owner_user_id: item.owner_user_id || userId,
        queued_at: item.queued_at || new Date().toISOString(),
        migrated_at: new Date().toISOString()
      });
    });
    localStorage.removeItem(LEGACY_QUEUE_KEY);
    saveQueue();
  }
}

function loadQueue() {
  const queue = loadJson(QUEUE_KEY, []);
  return Array.isArray(queue) ? queue : [];
}

function saveQueue() {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(state.pending));
}

function loadCachedData() {
  return loadJson(DATA_CACHE_KEY, null);
}

function saveCachedData(data) {
  localStorage.setItem(DATA_CACHE_KEY, JSON.stringify(data));
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

function setDefaultDates() {
  const input = document.querySelector('input[name="entry_date"]');
  if (input && !input.value) input.value = todayISO();
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function getRadioValue(form, name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function setRadioValue(form, name, value) {
  form.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = input.value === value;
  });
}

function selectedValues(form, name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function setCheckedValues(form, name, values) {
  const selected = new Set(values || []);
  form.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = selected.has(input.value);
  });
}

function formatSupplements(values, custom) {
  return [...values, custom].filter(Boolean).join("、");
}

function splitSupplements(value) {
  return String(value || "").split(/[、+,]/).map((item) => item.trim()).filter(Boolean);
}

function parseReps(value) {
  return String(value || "").match(/\d+/g)?.map(Number).filter((item) => Number.isFinite(item)) || [];
}

function normalizeIntegerArray(value, fallback = []) {
  if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
  return fallback;
}

function normalizeArray(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim());
  return fallback;
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function inferPlanFromText(value) {
  const text = String(value || "");
  if (text.includes("Plan A")) return "Plan A";
  if (text.includes("Plan B")) return "Plan B";
  return "";
}

function slugify(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "_").replace(/^_|_$/g, "");
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function formatCountdown(milliseconds) {
  const total = Math.ceil(milliseconds / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function formatReportDate(value) {
  const [year, month, day] = String(value).split("-");
  return year && month && day ? `${Number(month)}/${Number(day)}` : value;
}

function formatNumber(value) {
  return Number(value).toFixed(1);
}

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function dateOnly(value) {
  return String(value || todayISO()).slice(0, 10);
}

function compareDateDesc(a, b) {
  return new Date(b || 0) - new Date(a || 0);
}

function startOfWeek(date) {
  const value = new Date(date);
  const day = value.getDay() || 7;
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - day + 1);
  return value;
}

function startOfDayOffset(days) {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() + days);
  return value;
}

function avg(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDateTime(value) {
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

async function copyText(text, successMessage) {
  if (!text) {
    showToast("Nothing to copy");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch (error) {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();
    showToast(copied ? successMessage : "Copy unavailable");
  }
}

function friendlyError(error) {
  const message = String(error?.message || error || "Unknown error");
  return message.length > 180 ? `${message.slice(0, 177)}...` : message;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(() => {});
}
