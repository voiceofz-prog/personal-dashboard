# Next Steps

1. Create a Supabase project.
2. Create Vinson's Supabase Auth user.
3. Follow `supabase/README.md`: use canonical timestamped migrations for an existing or production project; use the separate bootstrap flow only for a disposable blank rebuild.
4. Insert Vinson's Auth user UUID into `dashboard_allowed_users`.
5. Optional: run `supabase/seed_demo.sql` after replacing `VINSON_AUTH_USER_UUID`.
6. Add `app/config.json` locally from `app/config.sample.json`.
7. Test local login, live reads, online insert, offline queue, and pending sync.
8. Publish the dashboard from an independent repo root, or copy the Pages workflow to the hosting repo root.
9. Test iPhone Safari Add to Home Screen and offline behavior.
