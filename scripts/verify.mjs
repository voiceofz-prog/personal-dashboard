import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const failures = [];

function displayPath(path) {
  return relative(root, path).replaceAll("\\", "/");
}

function check(label, callback) {
  try {
    callback();
    console.log(`PASS ${label}`);
  } catch (error) {
    failures.push({ label, error });
    console.error(`FAIL ${label}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: false
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error([result.stdout, result.stderr].filter(Boolean).join("\n").trim());
  }
}

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

const appJavaScript = readdirSync(join(root, "app"), { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
  .map((entry) => join(root, "app", entry.name))
  .sort();

for (const file of appJavaScript) {
  check(`syntax ${displayPath(file)}`, () => run(process.execPath, ["--check", file]));
}

for (const path of ["app/data/demo.json", "app/manifest.webmanifest"]) {
  check(`JSON ${path}`, () => JSON.parse(read(path)));
}

const testFiles = readdirSync(join(root, "tests"), { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".test.mjs"))
  .map((entry) => join(root, "tests", entry.name))
  .sort();

check("test discovery", () => assert(testFiles.length > 0, "No Node test files were found"));
for (const file of testFiles) {
  check(`test ${displayPath(file)}`, () => run(process.execPath, [file]));
}

check("dashboard and Service Worker versions", () => {
  const dashboardVersion = read("app/dashboard.js").match(/const VERSION = "([^"]+)";/)?.[1];
  const cacheVersion = read("app/service-worker.js").match(/const CACHE_NAME = "jessica-dashboard-v([^"]+)";/)?.[1];
  assert(dashboardVersion, "app/dashboard.js VERSION was not found");
  assert(cacheVersion, "app/service-worker.js CACHE_NAME version was not found");
  const dashboardParts = dashboardVersion.split(/[.-]/);
  const cacheParts = cacheVersion.split(/[.-]/);
  assert(JSON.stringify(dashboardParts) === JSON.stringify(cacheParts), `dashboard ${dashboardVersion} != Service Worker ${cacheVersion}`);
});

const requiredFiles = [
  "app/index.html",
  "app/styles.css",
  "app/ios-fixes.css",
  "app/product.css",
  "app/app.js",
  "app/session-security.js",
  "app/fitness-target-link.js",
  "app/dashboard.js",
  "app/manifest.webmanifest",
  "app/service-worker.js",
  "app/data/demo.json",
  "app/icons/icon.svg",
  "app/icons/icon-180.png",
  "app/icons/icon-192.png",
  "app/icons/icon-512.png"
];

check("required PWA files", () => {
  const missing = requiredFiles.filter((path) => !existsSync(join(root, path)));
  assert(missing.length === 0, `Missing: ${missing.join(", ")}`);
});

check("manifest and iPhone icon contract", () => {
  const manifest = JSON.parse(read("app/manifest.webmanifest"));
  const icons = new Map((manifest.icons || []).map((icon) => [icon.sizes, icon.src]));
  assert(icons.get("192x192") === "icons/icon-192.png", "Manifest 192x192 icon is missing or changed");
  assert(icons.get("512x512") === "icons/icon-512.png", "Manifest 512x512 icon is missing or changed");
  assert(read("app/index.html").includes('rel="apple-touch-icon" href="icons/icon-180.png"'), "Apple touch icon link is missing");
});

check("Service Worker app-shell coverage", () => {
  const serviceWorker = read("app/service-worker.js");
  const cachedPaths = new Set([...serviceWorker.matchAll(/"(\.\/[^\"]*)"/g)].map((match) => match[1]));
  const requiredCachedPaths = [
    "./",
    "./index.html",
    "./styles.css",
    "./ios-fixes.css",
    "./product.css",
    "./app.js",
    "./session-security.js",
    "./fitness-target-link.js",
    "./dashboard.js",
    "./manifest.webmanifest",
    "./data/demo.json",
    "./icons/icon.svg",
    "./icons/icon-180.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
  ];
  const missing = requiredCachedPaths.filter((path) => !cachedPaths.has(path));
  assert(missing.length === 0, `Not cached: ${missing.join(", ")}`);
});

check("Git whitespace", () => run("git", ["diff", "--check"]));

if (failures.length > 0) {
  console.error(`\nVerification failed with ${failures.length} check(s).`);
  process.exitCode = 1;
} else {
  console.log(`\nVerification passed: ${appJavaScript.length} scripts, ${testFiles.length} tests.`);
}
