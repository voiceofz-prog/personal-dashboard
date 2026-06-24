const VERSION = "2026.06.25.1";
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
  lastError: null
};

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
    await loadDashboardData();
    state.data = loadCachedData() || state.data;
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

  document.getElementById("logoutButton").addEventListener("click", logout);
  document.getElementById("syncButton").addEventListener("click", async () => {
    await syncPending();
    await refreshDashboardData();
  });
  document.getElementById("refreshButton").addEventListener("click", () => refreshDashboardData());
  document.getElementById("clearLocalButton").addEventListener("click", () => {
    if (!state.pending.length) {
      showToast("No pending records to clear");
      return;
    }
    if (!window.confirm("Clear unsynced local records from this browser?")) return;
    state.pending = [];
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
    state.supabaseReady = Boolean(
      state.config.supabaseUrl &&
      state.config.supabaseAnonKey &&
      !state.config.supabaseUrl.includes("YOUR_PROJECT_REF")
    );
  } catch (error) {
    state.config = null;
    state.supabaseReady = false;
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
  } catch (error) {
    localStorage.removeItem(TOKEN_KEY);
  }
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
  state.session = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(DATA_CACHE_KEY);
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
  return supabaseFetch(`/rest/v1/${table}?${query}`, { method: "GET" }, true);
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
    showToast("Saved to cloud");
    await refreshDashboardData({ silent: true });
  } catch (error) {
    state.pending.push(record);
    saveQueue();
    showToast("Cloud save failed. Queued locally.");
  }
  render();
}

async function syncPending() {
  if (!state.pending.length) {
    render();
    return;
  }

  if (!canUseCloud()) {
    showToast("Cannot sync yet");
    render();
    return;
  }

  const remaining = [];
  await refreshAccessTokenIfNeeded();
  for (const item of state.pending) {
    try {
      await insertRecord(item);
    } catch (error) {
      remaining.push(item);
    }
  }

  const synced = state.pending.length - remaining.length;
  state.pending = remaining;
  saveQueue();
  showToast(`${synced} synced, ${remaining.length} pending`);
  render();
}

async function insertRecord(item) {
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
    throw new Error(text || response.statusText);
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
  if (!isAuthenticated) {
    gateStatus.textContent = state.supabaseReady
      ? "Sign in to continue."
      : "Configuration is unavailable. Please try again later.";
  }
}

function switchView(view) {
  state.activeView = view;
  Object.entries(views).forEach(([key, element]) => {
    element.classList.toggle("active", key === view);
  });
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  pageTitle.textContent = view[0].toUpperCase() + view.slice(1);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderNetwork() {
  const status = document.getElementById("networkStatus");
  const online = navigator.onLine;
  status.textContent = online ? "Online" : "Offline";
  status.classList.toggle("offline", !online);
}

function renderHome() {
  const data = currentDashboard();
  document.getElementById("todayFocus").textContent = data.home.todayFocus;
  document.getElementById("todaySummary").textContent = data.home.todaySummary;
  document.getElementById("pendingCount").textContent = `${state.pending.length} pending`;
  document.getElementById("dataSource").textContent = dataSourceLabel(data);
  document.getElementById("homeMetrics").innerHTML = [
    metric("English", data.english.cefr, data.english.currentFocus),
    metric("Bodyweight", data.fitness.latestBodyweight, "latest"),
    metric("Training", data.fitness.trainingDaysThisWeek, "days this week"),
    metric("Sync", state.pending.length, "pending records")
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
  document.getElementById("planList").innerHTML = data.planTargets
    .map((item) => listCard(item.title, item.detail, item.status))
    .join("");
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
  if (supplements) lines.push(`運動後補充${supplements}`);
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

function renderSettings() {
  document.getElementById("authStatus").textContent = state.session
    ? `Logged in as ${state.session.user.email}`
    : state.supabaseReady
      ? "Supabase configured. Please log in."
      : "Demo mode. Add config.json to enable Supabase login.";

  const syncParts = [`${state.pending.length} pending records`, `App version ${VERSION}`];
  if (state.lastSync) syncParts.push(`Last cloud refresh ${formatDateTime(state.lastSync)}`);
  if (state.lastError) syncParts.push(`Last error: ${state.lastError}`);
  document.getElementById("syncStatus").textContent = `${syncParts.join(". ")}.`;

  document.getElementById("setupState").innerHTML = [
    listCard("Supabase config", state.supabaseReady ? "config.json loaded" : "config.json missing; demo mode active", state.supabaseReady ? "Ready" : "Demo"),
    listCard("Access control", "Supabase Auth plus RLS allowlist", "Private"),
    listCard("Auth session", state.session ? "Active browser session" : "Not logged in", state.session ? "Ready" : "Waiting"),
    listCard("Offline cache", "Service worker app shell plus last successful dashboard data", "PWA")
  ].join("");
}

function currentDashboard() {
  const data = clone(state.data || state.demoData || fallbackData());
  applyPendingRecords(data);
  return data;
}

function applyPendingRecords(data) {
  if (!state.pending.length) return;

  const pendingFitness = state.pending
    .filter((item) => item.table === "fitness_daily_entries")
    .map((item) => normalizeFitnessEntry({ ...item.payload, created_at: item.queued_at, _pending: true }));
  const fitnessEntries = [...pendingFitness, ...(data.fitness._entries || [])];
  if (fitnessEntries.length) {
    data.fitness._entries = fitnessEntries;
    recalculateFitness(data, fitnessEntries, data.fitness._workouts || [], []);
  }

  const pendingUpdates = state.pending.map((item) => {
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
    data.fitness.nextTrainingTarget;

  if (workouts.length) {
    data.fitness.planTargets = workouts.slice(0, 4).map((item) => ({
      title: item.plan_type ? `${item.plan_type}: ${item.exercise}` : item.exercise,
      status: item.workout_date,
      detail: [item.reps, item.sets, item.weight, item.rpe, item.next_target].filter(Boolean).join(" / ")
    }));
  }
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
  return Boolean(navigator.onLine && state.supabaseReady && state.session);
}

function dataSourceLabel(data) {
  if (state.session && data._source === "cloud") return "Cloud data";
  if (state.session && loadCachedData()) return "Cached local data";
  return "Demo data";
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
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
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
