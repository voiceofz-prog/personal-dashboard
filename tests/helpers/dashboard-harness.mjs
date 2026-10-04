import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    }
  };
}

function createElement() {
  const classes = new Set();
  return {
    hidden: false,
    textContent: "",
    innerHTML: "",
    value: "",
    dataset: {},
    style: {},
    elements: {},
    classList: {
      add(name) {
        classes.add(name);
      },
      remove(name) {
        classes.delete(name);
      },
      toggle(name, force) {
        const enabled = force ?? !classes.has(name);
        if (enabled) classes.add(name);
        else classes.delete(name);
        return enabled;
      },
      contains(name) {
        return classes.has(name);
      }
    },
    addEventListener() {},
    appendChild() {},
    closest() {
      return null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    remove() {},
    reportValidity() {
      return true;
    },
    reset() {},
    scrollIntoView() {},
    select() {}
  };
}

function createDocument() {
  const elements = new Map();
  const getElement = (id) => {
    if (!elements.has(id)) elements.set(id, createElement());
    return elements.get(id);
  };
  return {
    body: createElement(),
    addEventListener() {},
    createElement,
    execCommand() {
      return false;
    },
    getElementById: getElement,
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };
}

function createFixedDate(instant) {
  const RealDate = Date;
  return class FixedDate extends RealDate {
    constructor(...args) {
      super(...(args.length ? args : [instant]));
    }

    static now() {
      return new RealDate(instant).getTime();
    }
  };
}

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

export function loadDashboardHarness(options = {}) {
  const instant = options.now || "2026-07-29T12:00:00.000Z";
  let uuidCounter = 0;
  const localStorage = createStorage(options.storage);
  const document = createDocument();
  const navigator = { onLine: true };
  const context = vm.createContext({
    console,
    crypto: {
      randomUUID() {
        uuidCounter += 1;
        return `00000000-0000-4000-8000-${String(uuidCounter).padStart(12, "0")}`;
      }
    },
    Date: createFixedDate(instant),
    document,
    fetch: async () => {
      throw new Error("Unexpected network request in dashboard characterization test");
    },
    localStorage,
    navigator,
    setInterval() {
      return 1;
    },
    clearInterval() {},
    setTimeout(callback) {
      callback();
      return 1;
    },
    clearTimeout() {},
    URL
  });
  context.window = context;

  vm.runInContext(read("app/session-security.js"), context, { filename: "app/session-security.js" });
  vm.runInContext(read("app/fitness-target-link.js"), context, { filename: "app/fitness-target-link.js" });

  const dashboardSource = read("app/dashboard.js");
  const initCalls = dashboardSource.match(/^init\(\);\r?$/gm) || [];
  if (initCalls.length !== 1) throw new Error(`Expected one dashboard init call, found ${initCalls.length}`);
  const withoutInit = dashboardSource.replace(/^init\(\);\r?$/m, "");
  const exports = `
globalThis.DashboardCharacterization = {
  state,
  adoptLegacyPendingRecords,
  applyPendingOperations,
  buildFitnessReportFromDraft,
  buildFitnessData,
  buildStructuredPlanCards,
  composeDashboard,
  emptyDashboard,
  emptyFitness,
  editLatestFitnessEntry,
  EnglishDomain,
  executeOperation,
  FITNESS_CREATE_INTENT,
  FITNESS_EDIT_LOCK_MESSAGE,
  FITNESS_QUEUE_REVIEW_MESSAGE,
  fitnessEntrySummary,
  fetchFitnessRows,
  isFitnessCreateOperation,
  latestBodyState,
  latestFitnessEntry,
  latestTrainingEvidence,
  normalizeDemoData,
  normalizeFitnessDraft,
  pendingForCurrentUser,
  recommendedExercises,
  renderFitness,
  renderSettings,
  saveFitnessEntry,
  saveFitnessBundle,
  syncPending,
  targetsForPlan,
  latestWorkoutsForPlan,
  upsertPendingOperation
};`;
  vm.runInContext(`${withoutInit}\n${exports}`, context, { filename: "app/dashboard.js" });

  return {
    api: context.DashboardCharacterization,
    context,
    document,
    localStorage,
    navigator,
    setFetch(implementation) {
      context.fetch = implementation;
    },
    snapshot(value) {
      return JSON.parse(JSON.stringify(value));
    }
  };
}
