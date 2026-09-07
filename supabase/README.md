# Supabase Migration Layout

`supabase/migrations/` is the production ledger directory. Supabase CLI discovers
only the timestamped SQL files in that directory. Do not add bootstrap files,
legacy numbered migrations, or `schema.sql` to a production deployment.

## Production Deployment Flow

```text
canonical timestamped migrations -> pending timestamped migration
```

For an existing production project, first compare the remote migration ledger
with `supabase/migrations/`. Run only the pending timestamped migration after a
reviewed backup and restore rehearsal. The pre-ledger bootstrap, `schema.sql`,
and `legacy-migrations/001-009` must never be applied to production.

## Blank Environment Rebuild Flow

```text
platform prerequisites -> pre-ledger baseline -> canonical timestamped ledger migrations -> pending hotfix
```

The platform prerequisites are supplied by a disposable Supabase or PostgreSQL
test environment: the `auth` schema and users table, Supabase roles,
`auth.uid()`, and the migration-ledger table. They are not application
migrations.

Next, explicitly execute `bootstrap/pre_ledger_baseline.sql`. It reproduces
only the schema state from before the formal production ledger and is not
recorded in that ledger. Then apply every timestamped file in `migrations/` in
lexical order. Do not execute `legacy-migrations/004-009`; the canonical
timestamped migrations already contain their authoritative SQL.

`legacy-migrations/001-009` is historical reference material. Only `001-003`
are embedded in the pre-ledger bootstrap, and none are CLI-discoverable
migrations.

Before either flow, run:

```text
node scripts/verify-migration-layout.mjs
```

The verifier locks the approved directory layout and SQL checksums. It is a
file-integrity check, not a substitute for PostgreSQL integration tests.
