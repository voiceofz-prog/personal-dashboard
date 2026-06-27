# Next Steps

1. Create a Supabase project.
2. Create Vinson's Supabase Auth user.
3. Run `supabase/schema.sql` in Supabase SQL Editor for a fresh setup, or run migrations through `003_security_hardening.sql` for an existing setup.
4. Insert Vinson's Auth user UUID into `dashboard_allowed_users`.
5. Optional: run `supabase/seed_demo.sql` after replacing `VINSON_AUTH_USER_UUID`.
6. Add `app/config.json` locally from `app/config.sample.json`.
7. Test local login, live reads, online insert, offline queue, and pending sync.
8. Publish the dashboard from an independent repo root, or copy the Pages workflow to the hosting repo root.
9. Test iPhone Safari Add to Home Screen and offline behavior.
