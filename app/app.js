const VERSION = "2026.06.27.6";
const QUEUE_KEY = "jessica-dashboard-pending-v1";
const TOKEN_KEY = "jessica-dashboard-session-v1";
const DATA_CACHE_KEY = "jessica-dashboard-last-data-v1";

const state = {
  activeView: "home",
  config: null,
  session: null,
  demoData: null,
  data: null,
  pending: loadQueue(),
  supabaseReady: false,
  lastSync: null,
  lastError: null,
  lastSyncError: null
};

const WRITABLE_TABLES = new Set(["english_self_checks", "fitness_daily_entries"]);

const FITNESS_PHRASES = [
  "Small reps still count.",
  "Show up, then adjust.",
  "Steady beats intense.",
  "Good form first.",
  "Keep the baseline.",
  "A quiet set still counts.",
  "Control before speed.",
  "One clean rep matters.",
  "Do the simple work.",
  "Leave room to recover.",
  "Strong starts steady.",
  "Make it repeatable.",
  "Start light, move well.",
  "Progress can be small.",
  "Stay honest with form.",
  "Enough is still useful.",
  "Train, then recover.",
  "Today counts too.",
  "Keep the rhythm.",
  "Clean reps age well.",
  "Build the habit.",
  "Small effort compounds.",
  "Do what fits today.",
  "Smooth beats rushed.",
  "Stop before sloppy.",
  "A short session helps.",
  "Consistency is training.",
  "Move with attention.",
  "Keep showing up.",
  "Adjust and continue."
];

const PLAN_EXERCISES = {
  "Plan A": [
    { id: "a_row", name: "單臂啞鈴划船", load: true, defaultLoad: "5", defaultReps: "每側 20/20/20/20" },
    { id: "a_lateral_raise", name: "啞鈴側平舉", load: true, defaultLoad: "", defaultReps: "15/15/15" },
    { id: "a_pushup", name: "伏地挺身", load: false, defaultReps: "20/20/20" },
    { id: "a_curl", name: "二頭彎舉", load: true, defaultLoad: "", defaultReps: "15/15/15" },
    { id: "a_twist", name: "俄羅斯轉體", load: true, defaultLoad: "", defaultReps: "30/30/30" }
  ],
  "Plan B": [
    { id: "b_goblet_squat", name: "啞鈴高腳杯深蹲", load: true, defaultLoad: "5", defaultReps: "17/17/17/17" },
    { id: "b_rdl", name: "啞鈴羅馬尼亞硬舉", load: true, defaultLoad: "5", defaultReps: "17/17/17" },
    { id: "b_press", name: "啞鈴肩推", load: true, defaultLoad: "5", defaultReps: "16/16/16" },
    { id: "b_dip_pushup", name: "椅上撐體 / 窄距伏地挺身", load: false, defaultReps: "17/17/17" },
    { id: "b_leg_raise", name: "仰臥抬腿 / 死蟲", load: false, defaultReps: "15/15/18" }
  ],
  "自訂": []
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
  bindForms();
  bindNetworkEvents();
  await loadConfig();
  restoreSession();
  if (state.session) {
    adoptLegacyPendingRecords();
    await loadDashboardData();
    if (!state.session.demo) state.data = loadCachedData() || state.data;
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

function bindForms() {
  bindFitnessReportGenerator();

  document.getElementById("englishCheckForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = formToObject(event.target);
    payload.check_date = todayISO();
    await saveRecord("english_self_checks", payload);
    event.target.reset();
  });

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
  document.getElementById("clearLocalButton").addEventListener("click", () => {
    const visiblePending = pendingForCurrentUser();
    if (!visiblePending.length) {
      showToast("No pending records to clear");
      return;
    }
    if (!window.confirm("Clear unsynced local records for this session?")) return;
    const visibleSet = new Set(visiblePending);
    state.pending = state.pending.filter((item) => !visibleSet.has(item));
    saveQueue();
    render();
    showToast("Local pending queue cleared");
  });
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
    const decoded = JSON.parse(atob(normalized));
    return decoded.role !== "service_role";
  } catch (error) {
    return false;
  }
}

async function loadDashboardData() {
  try {
    const response = await fetch("data/demo.json", { cache: "no-store" });
    state.demoData = await response.json();
  } catch (error) {
    state.demoData = fallbackData();
  }

  state.data = clone(state.demoData);
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
    showToast("Add config.json before login");
    return;
  }

  try {
    const result = await supabaseFetch(
      "/auth/v1/token?grant_type=password",
      {
        method: "POST",
        body: JSON.stringify({ email, password })
      },
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
    showToast("Logged in");
    await loadDashboardData();
    await syncPending();
    await refreshDashboardData({ silent: true });
    render();
  } catch (error) {
    showToast(`Login failed: ${friendlyError(error)}`);
  }
}

function logout() {
  if (state.pending.length) {
    const confirmed = window.confirm("Logout will clear unsynced records stored on this device. Continue?");
    if (!confirmed) return;
  }
  state.session = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(DATA_CACHE_KEY);
  state.pending = [];
  saveQueue();
  state.demoData = null;
  state.data = null;
  state.activeView = "home";
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
    const liveRows = await fetchLiveRows();
    state.data = buildDashboardData(liveRows);
    state.lastSync = new Date().toISOString();
    state.lastError = null;
    saveCachedData(state.data);
    if (!options.silent) showToast("Dashboard refreshed");
  } catch (error) {
    state.lastError = friendlyError(error);
    if (!options.silent) showToast(`Refresh failed: ${state.lastError}`);
  }
  render();
}

async function fetchLiveRows() {
  const [
    focus,
    sessions,
    problems,
    reviewCards,
    selfChecks,
    dailyEntries,
    workouts,
    planTargets,
    weeklyReviews
  ] = await Promise.all([
    selectRows("english_focus_cards", "select=*&order=updated_at.desc&limit=1"),
    selectRows("english_sessions", "select=*&order=session_date.desc,created_at.desc&limit=8"),
    selectRows("english_problem_tracker", "select=*&order=updated_at.desc"),
    selectRows("english_review_cards", "select=*&active=eq.true&order=sort_order.asc,updated_at.desc"),
    selectRows("english_self_checks", "select=*&order=created_at.desc&limit=8"),
    selectRows("fitness_daily_entries", "select=*&order=entry_date.desc,created_at.desc&limit=30"),
    selectRows("fitness_workouts", "select=*&order=workout_date.desc,created_at.desc&limit=12"),
    selectRows("fitness_plan_targets", "select=*&order=sort_order.asc,updated_at.desc"),
    selectRows("fitness_weekly_reviews", "select=*&order=week_start.desc&limit=4")
  ]);

  return {
    focus,
    sessions,
    problems,
    reviewCards,
    selfChecks,
    dailyEntries,
    workouts,
    planTargets,
    weeklyReviews
  };
}

async function selectRows(table, query) {
  const userId = encodeURIComponent(state.session.user.id);
  return supabaseFetch(`/rest/v1/${table}?${query}&user_id=eq.${userId}`, { method: "GET" }, true);
}

function buildDashboardData(rows) {
  const data = clone(state.demoData);
  const focus = rows.focus[0];

  if (focus) {
    data.english.cefr = focus.cefr || data.english.cefr;
    data.english.currentFocus = focus.current_focus || data.english.currentFocus;
    data.english.tags = normalizeArray(focus.tags, data.english.tags);
    data.english.reviewSentences = normalizeArray(focus.review_sentences, data.english.reviewSentences);
  }

  if (rows.problems.length) {
    data.english.problems = rows.problems.map((item) => ({
      problem: item.problem,
      status: item.status,
      latestEvidence: item.latest_evidence || "No recent evidence yet.",
      improvementLooksLike: item.improvement_condition || "Define the next observable improvement."
    }));
  }

  if (rows.reviewCards.length) {
    data.english.reviewCards = rows.reviewCards.map(normalizeReviewCard);
  }

  if (rows.sessions.length) {
    data.english.improvementLog = rows.sessions.map((item) => ({
      date: item.session_date || dateOnly(item.created_at),
      title: item.topic || "English practice",
      detail: [item.improvement, item.next_focus].filter(Boolean).join(" Next: ") || item.main_bottleneck || "Curated session summary saved."
    }));
  }

  const entries = rows.dailyEntries.map(normalizeFitnessEntry);
  const workouts = rows.workouts.map(normalizeWorkout);
  const planTargets = rows.planTargets.map((item) => ({
    title: item.title,
    status: item.status || "Target",
    detail: item.detail || "No detail yet."
  }));

  data.fitness._entries = entries;
  data.fitness._workouts = workouts;
  if (planTargets.length) data.fitness.planTargets = planTargets;
  recalculateFitness(data, entries, workouts, rows.weeklyReviews);

  data.home.todayFocus = data.english.currentFocus;
  data.home.todaySummary = buildTodaySummary(data);
  data.home.recentUpdates = buildRecentUpdates(rows, data.home.recentUpdates);
  data._source = "cloud";
  return data;
}

function buildTodaySummary(data) {
  return `English: ${data.english.cefr}. Fitness: ${data.fitness.recoveryStatus}. Next: ${data.fitness.nextTrainingTarget}.`;
}

function buildRecentUpdates(rows, fallbackUpdates) {
  const updates = [];

  rows.selfChecks.forEach((item) => {
    updates.push({
      date: item.check_date || dateOnly(item.created_at),
      title: "English self-check",
      detail: [item.answer_chain, item.future_action, item.note].filter(Boolean).join(" / ") || "Self-check saved."
    });
  });

  rows.dailyEntries.slice(0, 5).forEach((item) => {
    updates.push({
      date: item.entry_date || dateOnly(item.created_at),
      title: item.training_status === "trained" ? "Training logged" : "Recovery day logged",
      detail: item.training_content || item.notes || "Daily fitness entry saved."
    });
  });

  return updates.length ? updates.slice(0, 8) : fallbackUpdates;
}

async function saveRecord(table, payload) {
  const record = {
    table,
    payload,
    owner_user_id: state.session?.user?.id || null,
    queued_at: new Date().toISOString()
  };

  if (!canUseCloud()) {
    state.pending.push(record);
    saveQueue();
    render();
    showToast("Saved to pending queue");
    return;
  }

  try {
    await refreshAccessTokenIfNeeded();
    await insertRecord(record);
    state.lastSyncError = null;
    showToast("Saved to cloud");
    await refreshDashboardData({ silent: true });
  } catch (error) {
    const message = friendlyError(error);
    state.pending.push({
      ...record,
      last_error: message,
      last_attempt_at: new Date().toISOString()
    });
    state.lastSyncError = message;
    saveQueue();
    showToast(`Cloud save failed: ${message}`);
  }
  render();
}

async function syncPending() {
  const visiblePending = pendingForCurrentUser();
  if (!visiblePending.length) {
    render();
    return;
  }

  if (!canUseCloud()) {
    showToast("Cannot sync yet");
    render();
    return;
  }

  const visibleSet = new Set(visiblePending);
  const remaining = state.pending.filter((item) => !visibleSet.has(item));
  let firstError = null;

  try {
    await refreshAccessTokenIfNeeded();
  } catch (error) {
    state.lastSyncError = friendlyError(error);
    showToast(`Sync failed: ${state.lastSyncError}`);
    render();
    return;
  }

  for (const item of visiblePending) {
    try {
      await insertRecord(item);
    } catch (error) {
      const message = friendlyError(error);
      firstError ||= message;
      remaining.push({
        ...item,
        last_error: message,
        last_attempt_at: new Date().toISOString()
      });
    }
  }

  const remainingVisible = remaining.filter((item) => (item.owner_user_id || null) === state.session.user.id).length;
  const synced = visiblePending.length - remainingVisible;
  state.pending = remaining;
  state.lastSyncError = firstError;
  saveQueue();
  showToast(firstError ? `${synced} synced, ${remainingVisible} failed: ${firstError}` : `${synced} synced`);
  render();
}

async function insertRecord(item) {
  if (!item.owner_user_id || item.owner_user_id !== state.session.user.id) {
    throw new Error("Pending record is not owned by this local session");
  }

  const payload = {
    ...item.payload,
    user_id: state.session.user.id
  };

  await supabaseFetch(
    `/rest/v1/${item.table}`,
    {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(payload)
    },
    true
  );
}

async function refreshAccessTokenIfNeeded() {
  if (!state.session?.refresh_token) return;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (state.session.expires_at && state.session.expires_at - nowSeconds > 60) return;

  const result = await supabaseFetch(
    "/auth/v1/token?grant_type=refresh_token",
    {
      method: "POST",
      body: JSON.stringify({ refresh_token: state.session.refresh_token })
    },
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

  if (useAuth && state.session?.access_token) {
    headers.Authorization = `Bearer ${state.session.access_token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  if (!response.ok) {
    const text = await response.text();
    try {
      const details = JSON.parse(text);
      const code = details.code ? `${details.code}: ` : "";
      throw new Error(`${code}${details.message || response.statusText}`);
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error(text || response.statusText);
      throw error;
    }
  }
  if (response.status === 204) return null;
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
  const isAuthenticated = Boolean(state.session);
  document.body.classList.toggle("login-only", !isAuthenticated);
  document.body.classList.toggle("authenticated", isAuthenticated);

  document.getElementById("loginGate").hidden = isAuthenticated;
  document.getElementById("appHeader").hidden = !isAuthenticated;
  document.getElementById("appMain").hidden = !isAuthenticated;
  document.getElementById("bottomNav").hidden = !isAuthenticated;

  const gateStatus = document.getElementById("loginGateStatus");
  const demoButton = document.getElementById("demoModeButton");
  demoButton.hidden = isAuthenticated || state.supabaseReady;
  if (!isAuthenticated) {
    gateStatus.textContent = state.supabaseReady
      ? "Sign in to continue."
      : "Supabase is not configured yet. Use demo preview or add config.json to enable login.";
  }
}

function switchView(view) {
  if (!views[view]) return;
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  state.activeView = view;
  Object.entries(views).forEach(([key, element]) => {
    element.classList.toggle("active", key === view);
  });
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
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
  const pendingCount = pendingForCurrentUser().length;
  document.getElementById("todayFocus").textContent = data.home.todayFocus;
  document.getElementById("todaySummary").textContent = data.home.todaySummary;
  document.getElementById("pendingCount").textContent = `${pendingCount} pending`;
  document.getElementById("dataSource").textContent = dataSourceLabel(data);
  document.getElementById("homeEnglishBadge").textContent = data.english.cefr;
  document.getElementById("homeFitnessBadge").textContent = data.fitness.recoveryStatus;
  document.getElementById("homeMetrics").innerHTML = [
    metric("Today", data.fitness.nextTrainingTarget, "fitness target"),
    metric("English", data.english.cefr, "current level"),
    metric("Recovery", data.fitness.recoveryStatus, "latest state"),
    metric("Sync", pendingCount, "pending records")
  ].join("");
  document.getElementById("homeEnglishStatus").innerHTML = [
    listCard("Today focus", data.english.currentFocus, data.english.cefr),
    listCard("Review sentences", `${data.english.reviewSentences.length} ready to copy`, "English"),
    listCard("Self test", "Use the 30-second cards before or after speaking practice.", "Daily")
  ].join("");
  document.getElementById("homeFitnessStatus").innerHTML = [
    listCard("Next training", data.fitness.nextTrainingTarget, data.fitness.recoveryStatus),
    listCard("Bodyweight", `${data.fitness.latestBodyweight} latest / ${data.fitness.weeklyAverageBodyweight} weekly avg`, "Fitness"),
    listCard("Plan A/B", buildFitnessPlanCards(data.fitness).slice(0, 2).map((item) => `${item.title}: ${item.status}`).join(" / "), "Jessica")
  ].join("");
  document.getElementById("recentUpdates").innerHTML = data.home.recentUpdates
    .map((item) => listCard(item.title, item.detail, item.date))
    .join("");
}

function renderEnglish() {
  const data = currentDashboard().english;
  document.getElementById("cefrBadge").textContent = data.cefr;
  document.getElementById("englishFocus").textContent = data.currentFocus;
  document.getElementById("englishTags").innerHTML = data.tags
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join("");

  const filter = document.getElementById("problemFilter").value;
  const problems = data.problems.filter((item) => filter === "all" || item.status === filter);
  document.getElementById("problemList").innerHTML = problems.map(problemCard).join("");
  document.getElementById("improvementLog").innerHTML = (data.improvementLog || [])
    .map((item) => listCard(item.title, item.detail, item.date))
    .join("");

  document.getElementById("sentenceList").innerHTML = data.reviewSentences
    .map((sentence) => `<button class="sentence-button" type="button">${escapeHtml(sentence)}</button>`)
    .join("");
  document.querySelectorAll(".sentence-button").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.textContent);
        showToast("Copied sentence");
      } catch (error) {
        showToast("Copy unavailable");
      }
    });
  });

  renderReviewCardGroup("commuteCards", data.reviewCards, "commute");
  renderReviewCardGroup("mistakeCards", data.reviewCards, "mistake");
  renderReviewCardGroup("warmupCards", data.reviewCards, "warmup");
  renderReviewCardGroup("selfTestCards", data.reviewCards, "self_test");
}

function renderFitness() {
  const data = currentDashboard().fitness;
  const recoveryBadge = document.getElementById("recoveryBadge");
  recoveryBadge.textContent = data.recoveryStatus;
  recoveryBadge.classList.toggle("warning", data.recoveryLevel === "warning");
  document.getElementById("fitnessMetrics").innerHTML = [
    metric("Bodyweight", data.latestBodyweight, "latest"),
    metric("Weekly avg", data.weeklyAverageBodyweight, "bodyweight"),
    metric("Training", data.trainingDaysThisWeek, "days this week"),
    metric("Next", data.nextTrainingTarget, "training target")
  ].join("");
  document.getElementById("planList").innerHTML = buildFitnessPlanCards(data)
    .map((item) => listCard(item.title, item.detail, item.status))
    .join("");
}

function buildFitnessPlanCards(data) {
  const entries = data._entries || data.fitness?._entries || [];
  const targets = data.planTargets || data.fitness?.planTargets || [];
  const nextPlan = inferNextPlan([...entries].sort((a, b) => compareDateDesc(a.entry_date, b.entry_date)));
  const latestEntry = latestFitnessEntry(entries);
  const cards = ["Plan A", "Plan B"].map((planName) => {
    const latest = latestEntryForPlan(entries, planName);
    const fallback = targets.find((item) => item.title === planName);
    return buildJessicaPlanTarget(planName, latest, fallback, nextPlan === planName, latestEntry);
  });

  cards.push({
    title: "Recovery gate",
    status: latestEntry ? `Last ${latestEntry.entry_date}` : "No log yet",
    detail: latestEntry ? buildRecoveryTarget(latestEntry) : "先記錄睡眠與精神，Jessica 才能判斷下次要進步、重複或保守維持。"
  });

  return cards;
}

function buildJessicaPlanTarget(planName, latest, fallback, isNext, recoveryEntry) {
  const baseTitle = `${planName} - Jessica 目標`;

  if (!latest) {
    return {
      title: baseTitle,
      status: isNext ? "Next target" : fallback?.status || "Baseline needed",
      detail: fallback?.detail
        ? `第一次可執行目標：${fallback.detail}`
        : `先完成一次乾淨的 ${planName} 基準訓練，並記錄體重、睡眠、精神與恢復註記。`
    };
  }

  const recoveryContext = recoveryEntry && recoveryEntry !== latest
    ? `；恢復依據：${summarizeRecoveryEntry(recoveryEntry)}`
    : "";

  return {
    title: baseTitle,
    status: latest._pending ? `Pending ${latest.entry_date}` : isNext ? `Next target, last ${latest.entry_date}` : `Last ${latest.entry_date}`,
    detail: `訓練依據：${summarizeTrainingEntry(latest)}${recoveryContext}。Jessica 下次目標：${nextPlanAction(planName, recoveryEntry || latest)}`
  };
}

function latestEntryForPlan(entries, planName) {
  return [...entries]
    .sort((a, b) => compareDateDesc(a.entry_date, b.entry_date))
    .find((item) => item.training_status === "trained" && item.training_content.includes(planName));
}

function latestFitnessEntry(entries) {
  return [...entries].sort((a, b) => compareDateDesc(a.entry_date, b.entry_date))[0];
}

function nextPlanAction(planName, entry) {
  const recovery = recoverySignal(entry);
  const planFocus = compactPlanFocus(planName);

  if (recovery === "hold") {
    return `維持 ${planFocus}；不加重量、不加次數，動作品質開始掉以前保留 2 下。`;
  }

  if (recovery === "progress") {
    return `重量不變，主動作最後一組加 1-2 下；如果動作變形，就維持上次總量。`;
  }

  return `重複 ${planFocus}；目標是同樣總次數但節奏更乾淨，並補一句哪一組最吃力。`;
}

function buildRecoveryTarget(entry) {
  const recovery = recoverySignal(entry);
  const summary = summarizeRecoveryEntry(entry);

  if (recovery === "hold") {
    return `${summary}。下次先保守維持，等睡眠或精神恢復再推進。`;
  }

  if (recovery === "progress") {
    return `${summary}。恢復狀態允許小幅進步，但前提是動作品質乾淨。`;
  }

  return `${summary}。恢復可用，但先重複目標，再決定是否增加難度。`;
}

function recoverySignal(entry) {
  const sleep = entry.sleep_hours;
  const energy = entry.energy_score;
  if ((sleep !== null && sleep < 6) || (energy !== null && energy <= 2)) return "hold";
  if ((sleep === null || sleep >= 7) && (energy === null || energy >= 4)) return "progress";
  return "repeat";
}

function compactPlanFocus(planName) {
  const exercises = PLAN_EXERCISES[planName] || [];
  const primary = exercises.slice(0, 2).map((exercise) => {
    const load = exercise.defaultLoad ? `${formatNumber(exercise.defaultLoad)}kg ` : "";
    return `${exercise.name} ${load}${exercise.defaultReps}`.trim();
  });
  return primary.length ? primary.join("、") : planName;
}

function summarizeTrainingEntry(entry) {
  const lines = entry.training_content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const plan = lines[1] || lines[0] || "Training logged";
  const bodyweight = entry.bodyweight_kg !== null ? `BW ${formatNumber(entry.bodyweight_kg)} kg` : "";
  const recovery = summarizeRecoveryEntry(entry);
  return [plan, bodyweight, recovery].filter(Boolean).join(" / ");
}

function summarizeRecoveryEntry(entry) {
  const parts = [];
  if (entry.sleep_hours !== null) parts.push(`Sleep ${formatNumber(entry.sleep_hours)}h`);
  if (entry.energy_score !== null) parts.push(`Energy ${entry.energy_score}/5`);
  if (entry.notes) parts.push(entry.notes);
  return parts.length ? parts.join(" / ") : "No recovery note yet.";
}

function bindFitnessReportGenerator() {
  const form = document.getElementById("fitnessReportForm");
  if (!form) return;
  const planSelect = form.elements.plan_template;
  const dayTypeControls = form.querySelectorAll('input[name="day_type"]');

  document.getElementById("fitnessDailyPhrase").textContent = dailyFitnessPhrase();
  renderExerciseInputs(planSelect.value);
  updateFitnessReport();

  form.addEventListener("input", updateFitnessReport);
  form.addEventListener("change", (event) => {
    if (event.target.name === "plan_template") renderExerciseInputs(planSelect.value);
    updateFitnessReport();
  });

  dayTypeControls.forEach((control) => {
    control.addEventListener("change", updateFitnessReportVisibility);
  });

  document.getElementById("generateFitnessReport").addEventListener("click", () => {
    updateFitnessReport();
    showToast("內容已產生");
  });

  document.getElementById("copyFitnessReport").addEventListener("click", copyFitnessReport);
  document.getElementById("saveFitnessEntry").addEventListener("click", saveFitnessEntry);
  updateFitnessReportVisibility();
}

function renderExerciseInputs(planName) {
  const picker = document.getElementById("exercisePicker");
  if (!picker) return;
  const exercises = PLAN_EXERCISES[planName] || [];
  if (!exercises.length) {
    picker.innerHTML = `
      <label>自訂訓練內容
        <textarea name="custom_training" rows="4" placeholder="例如：深蹲 15/15/15&#10;伏地挺身 20/20/20"></textarea>
      </label>`;
    return;
  }

  picker.innerHTML = `
    <div class="exercise-list">
      ${exercises.map(exerciseInput).join("")}
    </div>`;
}

function exerciseInput(item) {
  return `
    <article class="exercise-row">
      <label class="switch-line">
        <input type="checkbox" name="exercise_done" value="${escapeHtml(item.id)}" checked>
        <span>${escapeHtml(item.name)}</span>
      </label>
      <div class="${item.load ? "exercise-fields" : "exercise-fields single"}">
        ${
          item.load
            ? `<label>重量 <input name="${escapeHtml(item.id)}_load" type="text" inputmode="decimal" value="${escapeHtml(item.defaultLoad || "")}" placeholder="5"></label>`
            : ""
        }
        <label>次數 <input name="${escapeHtml(item.id)}_reps" type="text" value="${escapeHtml(item.defaultReps || "")}" placeholder="15/15/15"></label>
      </div>
    </article>`;
}

function updateFitnessReportVisibility() {
  const form = document.getElementById("fitnessReportForm");
  const isRest = getRadioValue(form, "day_type") === "rest";
  document.getElementById("planTemplateLabel").hidden = isRest;
  document.getElementById("exercisePicker").hidden = isRest;
  updateFitnessReport();
}

function updateFitnessReport() {
  const output = document.getElementById("fitnessReportOutput");
  if (!output) return;
  output.textContent = buildFitnessReport();
}

function buildFitnessReport() {
  const form = document.getElementById("fitnessReportForm");
  const dayType = getRadioValue(form, "day_type");
  const lines = [];
  const date = form.elements.entry_date.value || todayISO();
  const bodyweight = form.elements.bodyweight.value.trim();
  const sleepHours = form.elements.sleep_hours.value.trim();
  const energyScore = form.elements.energy_score.value;
  const supplements = formatSupplements(selectedValues(form, "supplements"), form.elements.custom_supplement.value.trim());
  const recoveryNote = form.elements.recovery_note.value.trim();

  lines.push(formatReportDate(date));

  if (dayType === "rest") {
    lines.push("休息");
  } else {
    const planName = form.elements.plan_template.value || "自訂";
    lines.push(planName);
    lines.push(...selectedExerciseLines(form, planName));
  }

  if (bodyweight) lines.push(`早上空腹${bodyweight}`);
  if (sleepHours) lines.push(`睡眠${sleepHours}小時`);
  if (energyScore) lines.push(`精神${energyScore}/5`);
  if (supplements) lines.push(dayType === "trained" ? `運動後補充${supplements}` : `今日補給${supplements}`);
  if (recoveryNote) lines.push(`睡眠/疲勞：${recoveryNote}`);

  return lines.filter(Boolean).join("\n");
}

function selectedExerciseLines(form, planName) {
  if (planName === "自訂") {
    return form.elements.custom_training.value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return (PLAN_EXERCISES[planName] || [])
    .filter((item) => form.querySelector(`input[name="exercise_done"][value="${item.id}"]`)?.checked)
    .map((item) => {
      const load = form.elements[`${item.id}_load`]?.value.trim() || "";
      const reps = form.elements[`${item.id}_reps`]?.value.trim() || "";
      if (load && reps) return `${item.name}\n${formatLoad(load)}，${reps}`;
      if (load) return `${item.name}\n${formatLoad(load)}`;
      if (reps) return `${item.name} ${reps}`;
      return item.name;
    });
}

function formatSupplements(values, custom) {
  const items = [...values];
  if (custom) items.push(custom);
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]}+${items[1]}`;
  return `${items[0]}+${items.slice(1).join("、")}`;
}

function formatLoad(value) {
  return /kg$/i.test(value.trim()) ? value.trim() : `${value.trim()}kg`;
}

function formatReportDate(value) {
  const [year, month, day] = dateOnly(value).split("-");
  return `${Number(month)}/${Number(day)}`;
}

function dailyFitnessPhrase() {
  const [year, month, day] = todayISO().split("-").map(Number);
  const dateIndex = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  return FITNESS_PHRASES[dateIndex % FITNESS_PHRASES.length];
}

async function copyFitnessReport() {
  const text = document.getElementById("fitnessReportOutput").textContent.trim();
  if (!text) {
    showToast("沒有可複製內容");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast("已複製");
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
    showToast(copied ? "已複製" : "複製不可用");
  }
}

async function saveFitnessEntry() {
  const form = document.getElementById("fitnessReportForm");
  updateFitnessReport();

  const dayType = getRadioValue(form, "day_type") || "rest";
  const report = document.getElementById("fitnessReportOutput").textContent.trim();
  const supplements = formatSupplements(
    selectedValues(form, "supplements"),
    form.elements.custom_supplement.value.trim()
  );

  const payload = {
    entry_date: form.elements.entry_date.value || todayISO(),
    bodyweight_kg: numberOrNull(form.elements.bodyweight.value.trim()),
    training_status: dayType,
    training_content: dayType === "trained" ? report : "",
    protein: supplements,
    sleep_hours: numberOrNull(form.elements.sleep_hours.value.trim()),
    energy_score: numberOrNull(form.elements.energy_score.value),
    notes: form.elements.recovery_note.value.trim()
  };

  await saveRecord("fitness_daily_entries", payload);
}

function renderSettings() {
  const pendingCount = pendingForCurrentUser().length;
  document.getElementById("authStatus").textContent = state.session
    ? state.session.demo
      ? "Demo preview session. No cloud account is connected."
      : `Logged in as ${state.session.user.email}`
    : state.supabaseReady
      ? "Supabase configured. Please log in."
      : "Demo mode. Add config.json to enable Supabase login.";

  const syncParts = [`${pendingCount} pending records`];
  if (state.lastSync) syncParts.push(`Last cloud refresh ${formatDateTime(state.lastSync)}`);
  if (state.lastError) syncParts.push(`Last read error: ${state.lastError}`);
  if (state.lastSyncError) syncParts.push(`Last write error: ${state.lastSyncError}`);
  document.getElementById("syncStatus").textContent = `${syncParts.join(". ")}.`;
  document.getElementById("offlineBadge").textContent = navigator.onLine ? "Online" : "Offline";
  document.getElementById("versionBadge").textContent = VERSION;
  document.getElementById("offlineState").innerHTML = [
    listCard("Pending queue", `${pendingCount} unsynced records for this session`, pendingCount ? "Needs sync" : "Clear"),
    listCard("Cached dashboard", loadCachedData() ? "Last successful cloud data is available for offline reading" : "No cloud cache saved yet", "Local"),
    listCard("App shell", "Core PWA files are cached by the service worker after installation", "Offline")
  ].join("");

  document.getElementById("setupState").innerHTML = [
    listCard("Supabase config", state.supabaseReady ? "config.json loaded" : "config.json missing; demo mode active", state.supabaseReady ? "Ready" : "Demo"),
    listCard("Cloud read", state.lastSync ? `Verified ${formatDateTime(state.lastSync)}` : "No successful cloud read in this session", state.lastSync ? "Verified" : "Unverified"),
    listCard("Access policy", "Supabase Auth, user ownership, and RLS allowlist; verify isolation with a separate negative test", "Configured"),
    listCard("Auth session", state.session?.demo ? "Demo preview; cloud is disabled" : state.session ? "Active browser session" : "Not logged in", state.session?.demo ? "Demo" : state.session ? "Ready" : "Waiting"),
    listCard("App version", VERSION, "Build")
  ].join("");
}

function currentDashboard() {
  const data = clone(state.data || state.demoData || fallbackData());
  applyPendingRecords(data);
  return data;
}

function applyPendingRecords(data) {
  if (!state.pending.length) return;

  const visiblePending = pendingForCurrentUser();

  const pendingFitness = visiblePending
    .filter((item) => item.table === "fitness_daily_entries")
    .map((item) => normalizeFitnessEntry({ ...item.payload, created_at: item.queued_at, _pending: true }));
  const fitnessEntries = [...pendingFitness, ...(data.fitness._entries || [])];
  if (fitnessEntries.length) {
    data.fitness._entries = fitnessEntries;
    recalculateFitness(data, fitnessEntries, data.fitness._workouts || [], []);
  }

  const pendingUpdates = visiblePending.map((item) => {
    if (item.table === "fitness_daily_entries") {
      return {
        date: item.payload.entry_date || dateOnly(item.queued_at),
        title: "Pending fitness entry",
        detail: item.payload.training_content || item.payload.notes || "Waiting for cloud sync."
      };
    }
    return {
      date: item.payload.check_date || dateOnly(item.queued_at),
      title: "Pending English self-check",
      detail: item.payload.note || "Waiting for cloud sync."
    };
  });

  data.home.recentUpdates = [...pendingUpdates, ...(data.home.recentUpdates || [])].slice(0, 8);
  data._source = data._source || "demo";
}

function recalculateFitness(data, entries, workouts, weeklyReviews) {
  const sortedEntries = [...entries].sort((a, b) => compareDateDesc(a.entry_date, b.entry_date));
  const latestWeight = sortedEntries.find((item) => item.bodyweight_kg !== null);
  if (latestWeight) data.fitness.latestBodyweight = `${formatNumber(latestWeight.bodyweight_kg)} kg`;

  const recentWeights = sortedEntries
    .filter((item) => item.bodyweight_kg !== null)
    .slice(0, 7)
    .map((item) => item.bodyweight_kg);
  if (recentWeights.length) data.fitness.weeklyAverageBodyweight = `${formatNumber(avg(recentWeights))} kg`;

  const weekStart = startOfWeek(new Date());
  const trainedThisWeek = sortedEntries.filter((item) => {
    return item.training_status === "trained" && new Date(item.entry_date) >= weekStart;
  }).length;
  data.fitness.trainingDaysThisWeek = String(trainedThisWeek);

  const latestEntry = sortedEntries[0];
  if (latestEntry) {
    const sleepPoor = latestEntry.sleep_hours !== null && latestEntry.sleep_hours < 6;
    const energyPoor = latestEntry.energy_score !== null && latestEntry.energy_score <= 2;
    if (sleepPoor || energyPoor) {
      data.fitness.recoveryStatus = "Recovery warning";
      data.fitness.recoveryLevel = "warning";
    } else if (latestEntry.sleep_hours !== null || latestEntry.energy_score !== null) {
      data.fitness.recoveryStatus = "Recovery acceptable";
      data.fitness.recoveryLevel = "ok";
    }
  }

  const nextWorkout = workouts.find((item) => item.next_target);
  const latestReview = weeklyReviews[0];
  data.fitness.nextTrainingTarget =
    nextWorkout?.next_target ||
    latestReview?.next_adjustment ||
    inferNextPlan(sortedEntries) ||
    data.fitness.nextTrainingTarget;

  if (workouts.length) {
    data.fitness.planTargets = workouts.slice(0, 4).map((item) => ({
      title: item.plan_type ? `${item.plan_type}: ${item.exercise}` : item.exercise,
      status: item.workout_date,
      detail: [item.reps, item.sets, item.weight, item.rpe, item.next_target].filter(Boolean).join(" / ")
    }));
  }
}

function inferNextPlan(entries) {
  const latestTraining = entries.find((item) => item.training_status === "trained");
  if (!latestTraining?.training_content) return "";
  if (latestTraining.training_content.includes("Plan A")) return "Plan B";
  if (latestTraining.training_content.includes("Plan B")) return "Plan A";
  return "Repeat or adjust";
}

function normalizeFitnessEntry(item) {
  return {
    entry_date: item.entry_date || todayISO(),
    bodyweight_kg: numberOrNull(item.bodyweight_kg),
    training_status: item.training_status || "rest",
    training_content: item.training_content || "",
    sleep_hours: numberOrNull(item.sleep_hours),
    energy_score: numberOrNull(item.energy_score),
    notes: item.notes || "",
    created_at: item.created_at || new Date().toISOString(),
    _pending: Boolean(item._pending)
  };
}

function normalizeWorkout(item) {
  return {
    workout_date: item.workout_date || dateOnly(item.created_at),
    plan_type: item.plan_type || "",
    exercise: item.exercise || "Workout",
    weight: item.weight || "",
    reps: item.reps || "",
    sets: item.sets || "",
    rpe: item.rpe || "",
    next_target: item.next_target || ""
  };
}

function normalizeReviewCard(item) {
  return {
    type: item.card_type || item.type || "commute",
    title: item.title || "Review card",
    prompt: item.prompt || "",
    answerHint: item.answer_hint || item.answerHint || "",
    tags: normalizeArray(item.tags, [])
  };
}

function renderReviewCardGroup(elementId, cards, type) {
  const group = (cards || []).filter((item) => item.type === type);
  document.getElementById(elementId).innerHTML = group.length
    ? group.map(reviewCard).join("")
    : listCard("No cards yet", "Jessica can add curated cards after the next review.", "empty");
}

function reviewCard(item) {
  const hint = item.answerHint ? `Hint: ${item.answerHint}` : "Say your answer out loud before checking notes.";
  const tags = item.tags.length ? ` ${item.tags.join(" / ")}` : "";
  return listCard(item.title, `${item.prompt} ${hint}`, tags.trim());
}

function metric(label, value, hint) {
  return `<div class="metric-card"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(String(value))}</div><div class="hint">${escapeHtml(hint || "")}</div></div>`;
}

function listCard(title, detail, meta) {
  return `<article class="list-card"><div class="card-topline"><h3>${escapeHtml(title)}</h3><span class="mini-status">${escapeHtml(meta || "")}</span></div><p class="card-text">${escapeHtml(detail)}</p></article>`;
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
  if (state.session && data._source === "cloud") return "Cloud data";
  if (state.session && loadCachedData()) return "Cached local data";
  return "Demo data";
}

function pendingForCurrentUser() {
  const userId = state.session?.user?.id || null;
  return state.pending.filter((item) => (item.owner_user_id || null) === userId);
}

function adoptLegacyPendingRecords() {
  const userId = state.session?.demo ? null : state.session?.user?.id;
  if (!userId) return 0;

  let adopted = 0;
  state.pending = state.pending.map((item) => {
    if (item?.owner_user_id || !WRITABLE_TABLES.has(item?.table) || !item?.payload) return item;
    adopted += 1;
    return {
      ...item,
      owner_user_id: userId,
      migrated_at: new Date().toISOString()
    };
  });

  if (adopted) saveQueue();
  return adopted;
}

function normalizeArray(value, fallback) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim());
  return fallback || [];
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function getRadioValue(form, name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function selectedValues(form, name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((item) => item.value);
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function loadQueue() {
  try {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    return Array.isArray(queue) ? queue : [];
  } catch (error) {
    return [];
  }
}

function saveQueue() {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(state.pending));
}

function loadCachedData() {
  try {
    return JSON.parse(localStorage.getItem(DATA_CACHE_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function saveCachedData(data) {
  localStorage.setItem(DATA_CACHE_KEY, JSON.stringify(data));
}

function setDefaultDates() {
  const dateInput = document.querySelector('input[name="entry_date"]');
  if (dateInput && !dateInput.value) dateInput.value = todayISO();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}

function friendlyError(error) {
  const message = String(error?.message || error || "Unknown error");
  if (message.length > 150) return `${message.slice(0, 147)}...`;
  return message;
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

function avg(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatNumber(value) {
  return Number(value).toFixed(1);
}

function formatDateTime(value) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function fallbackData() {
  return {
    home: {
      todayFocus: "Demo data unavailable",
      todaySummary: "Check app/data/demo.json",
      recentUpdates: []
    },
    english: {
      cefr: "B1",
      currentFocus: "No data",
      tags: [],
      problems: [],
      improvementLog: [],
      reviewSentences: [],
      reviewCards: []
    },
    fitness: {
      latestBodyweight: "--",
      weeklyAverageBodyweight: "--",
      trainingDaysThisWeek: "--",
      recoveryStatus: "Unknown",
      recoveryLevel: "ok",
      nextTrainingTarget: "--",
      planTargets: [],
      _entries: [],
      _workouts: []
    }
  };
}
