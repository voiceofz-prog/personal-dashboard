import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const migrationsDir = join(root, "supabase", "migrations");
const bootstrapPath = join(root, "supabase", "bootstrap", "pre_ledger_baseline.sql");
const legacyDir = join(root, "supabase", "legacy-migrations");

const expectedMigrations = {
  "20260627080424_commute_review_and_fitness_tracking.sql": "E7DE5DF5924D5236EB5BCE505A7BFFC2CB6769E04BFAF2BBDB4ACBDD7A6DFFE1",
  "20260627080900_function_security_hardening.sql": "37DE4C866BF1A324DC544A80C5BE34871A04660150E9E384E8571AD585D4AEE2",
  "20260629150508_jessica_review_loop.sql": "A227E5A4B101A7B77209B71A97549F1ECEBBF98815B2F29370A1B0A80C7A8FD2",
  "20260629223948_review_loop_grant_hardening.sql": "7B803C428EFA593FEB8B2A3F57F3A05BCE5C809745587114E68AF0F20188DF68",
  "20260629224132_review_loop_indexes.sql": "00D8886AA59FA8F8E765350C7A2A512FEFD2062CDC02FB96C87A10486125B31F",
  "20260701232908_atomic_fitness_workout_save.sql": "55F6CE4CB50D0661E5AEFDFE49735E9775AF95C01A265A63FACDE6C66EF0CA67",
  "20260705031641_review_archive_hardening.sql": "AA4F8944B770F0236187141CB0E9BD303FD5E0D3A4E85D3C9FA8506F5050E223",
  "20260705032043_atomic_review_lock_privilege.sql": "D860864693BC1F7FED6371B2098EAE9D224A5F105E5448723CBA1AF37FB0E3AF",
  "20260706125725_protect_fitness_workout_provenance.sql": "DFF7304696A933E868C7DA45B13C00CACA84D83E29F3C671A8792932733E2106",
  "20260710085448_student_learning_map_v1.sql": "26029EC3837FDBF5D3BA61F092A497F396529B62491E5F32D4AB6C887208252E",
  "20260801014145_fitness_v1_existing_edit_guard.sql": "D7A98F56AB99F6545304D4CC7A7C8AA6FB03EDB2C020B7AA07F4A75EC1E52F46"
};

const expectedBaselineHash = "B812F1D71FDF63C008AFF657D3377CA4D6EE6C9FCAEC1E5ABB5790E68D9AFAF3";
const legacyBaselineFiles = [
  "001_initial_schema.sql",
  "002_english_review_cards.sql",
  "003_security_hardening.sql"
];
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
}

function normalizedText(path) {
  return readFileSync(path, "utf8").replace(/\r\n?/g, "\n");
}

function normalizedTextSha256(path) {
  return createHash("sha256").update(normalizedText(path), "utf8").digest("hex").toUpperCase();
}

const migrationFiles = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
  .map((entry) => entry.name)
  .sort();
const expectedNames = Object.keys(expectedMigrations).sort();

check(
  JSON.stringify(migrationFiles) === JSON.stringify(expectedNames),
  `supabase/migrations must contain only the canonical timestamped files. Found: ${migrationFiles.join(", ")}`
);

for (const name of migrationFiles) {
  check(/^\d{14}_[a-z0-9_]+\.sql$/.test(name), `Noncanonical migration filename: ${name}`);
}

for (const [name, expectedHash] of Object.entries(expectedMigrations)) {
  const path = join(migrationsDir, name);
  check(existsSync(path), `Missing canonical migration: ${name}`);
  if (existsSync(path)) {
    check(normalizedTextSha256(path) === expectedHash, `Checksum mismatch for canonical migration: ${name}`);
  }
}

check(existsSync(bootstrapPath), "Missing pre-ledger bootstrap outside CLI discovery");
if (existsSync(bootstrapPath)) {
  check(sha256(bootstrapPath) === expectedBaselineHash, "Checksum mismatch for pre-ledger bootstrap");
  const baseline = normalizedText(bootstrapPath);
  const expectedSections = legacyBaselineFiles.map((name) => {
    const legacyPath = join(legacyDir, name);
    check(existsSync(legacyPath), `Missing baseline source: legacy-migrations/${name}`);
    const body = existsSync(legacyPath) ? normalizedText(legacyPath) : "";
    return `-- BEGIN LEGACY ${name}\n${body}-- END LEGACY ${name}\n`;
  });
  const actualSections = [...baseline.matchAll(/^-- BEGIN LEGACY ([^\n]+)\n([\s\S]*?)^-- END LEGACY \1\n/gm)]
    .map((match) => `-- BEGIN LEGACY ${match[1]}\n${match[2]}-- END LEGACY ${match[1]}\n`);
  check(
    JSON.stringify(actualSections) === JSON.stringify(expectedSections),
    "Pre-ledger bootstrap does not exactly embed legacy 001-003 after EOL normalization"
  );
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`PASS migration layout: ${migrationFiles.length} canonical timestamped migrations`);
  console.log(`PASS pre-ledger bootstrap: ${basename(bootstrapPath)} matches legacy 001-003 after EOL normalization`);
}
