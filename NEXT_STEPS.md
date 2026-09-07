# Next Steps

This file is a compatibility pointer for older handoffs. Current execution state belongs in [task_board.md](task_board.md); project direction and phase authority belong in [project_brief.md](project_brief.md).

For current-system maintenance:

1. Preserve the formal GitHub Pages + Supabase Dashboard and its rollback path.
2. Follow [supabase/README.md](supabase/README.md) for canonical production migrations or a disposable blank rebuild.
3. Use [docs/verification.md](docs/verification.md) before any candidate is merged or deployed.
4. Keep `app/config.json` local or deployment-generated; never commit credentials.
5. Treat physical iPhone acceptance and live Supabase verification as separate evidence lanes.

Do not start Sites migration, production deployment, Supabase retirement, or cross-project changes from this file.
