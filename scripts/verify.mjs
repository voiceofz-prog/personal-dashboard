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
  return result.stdout;
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

check("Supabase migration layout", () => run(process.execPath, ["scripts/verify-migration-layout.mjs"]));

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

check("Pages deployment gate order", () => {
  const workflow = read(".github/workflows/deploy-pages.yml");
  const verifyIndex = workflow.indexOf("node scripts/verify.mjs");
  const configIndex = workflow.indexOf("- name: Create runtime config");
  const uploadIndex = workflow.indexOf("- name: Upload app folder");
  const deployIndex = workflow.indexOf("- name: Deploy to GitHub Pages");
  assert(verifyIndex >= 0, "Verification command is missing from the Pages workflow");
  assert(verifyIndex < configIndex, "Verification must run before runtime config generation");
  assert(verifyIndex < uploadIndex, "Verification must run before artifact upload");
  assert(verifyIndex < deployIndex, "Verification must run before Pages deployment");
});

const p0EvidenceFiles = [
  "docs/iphone-acceptance.md",
  "docs/p0-gate-report.md",
  "docs/visual-baselines/p0/README.md",
  "docs/visual-baselines/p0/phone-width-login.jpg",
  "docs/visual-baselines/p0/phone-width-home.jpg",
  "docs/visual-baselines/p0/phone-width-english.jpg",
  "docs/visual-baselines/p0/phone-width-fitness.jpg"
];

check("P0 acceptance evidence files", () => {
  const missing = p0EvidenceFiles.filter((path) => !existsSync(join(root, path)));
  assert(missing.length === 0, `Missing: ${missing.join(", ")}`);
});

check("phone-width visual baseline JPEGs", () => {
  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  for (const path of p0EvidenceFiles.filter((item) => item.endsWith(".jpg"))) {
    const image = readFileSync(join(root, path));
    assert(image[0] === 0xff && image[1] === 0xd8, `${path} is not a JPEG`);
    let offset = 2;
    let width = 0;
    let height = 0;
    while (offset + 8 < image.length) {
      if (image[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = image[offset + 1];
      offset += 2;
      if (marker === 0xd8 || marker === 0xd9) continue;
      const segmentLength = image.readUInt16BE(offset);
      if (startOfFrameMarkers.has(marker)) {
        height = image.readUInt16BE(offset + 3);
        width = image.readUInt16BE(offset + 5);
        break;
      }
      offset += segmentLength;
    }
    assert(width && height, `${path} dimensions could not be read`);
    assert(width >= 360 && width <= 430, `${path} width ${width} is outside the phone-width baseline range`);
    assert(height >= 320, `${path} height ${height} is too small for a viewport reference`);
  }
});

check("Working-tree Git whitespace", () => run("git", ["diff", "--check"]));
check("Committed-tree Git whitespace", () => {
  const roots = run("git", ["rev-list", "--max-parents=0", "HEAD"]).trim().split(/\s+/).filter(Boolean);
  assert(roots.length === 1, `expected one repository root commit, found ${roots.length}`);
  run("git", ["diff", "--check", roots[0], "HEAD"]);
});

if (failures.length > 0) {
  console.error(`\nVerification failed with ${failures.length} check(s).`);
  process.exitCode = 1;
} else {
  console.log(`\nVerification passed: ${appJavaScript.length} scripts, ${testFiles.length} tests.`);
}
