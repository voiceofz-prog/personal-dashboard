-- PostgreSQL row-lock clauses require UPDATE privilege on at least one column.
-- The atomic save RPC is SECURITY INVOKER and locks immutable review ids.
-- No UPDATE RLS policy exists, so browser sessions still cannot change rows.

grant update (id) on public.jessica_review_cycles to authenticated;
grant update (id) on public.fitness_exercise_targets to authenticated;

comment on column public.jessica_review_cycles.id is
  'Authenticated UPDATE privilege is granted on this immutable key only so the SECURITY INVOKER atomic save RPC can take a row lock; no UPDATE RLS policy exists.';
comment on column public.fitness_exercise_targets.id is
  'Authenticated UPDATE privilege is granted on this immutable key only so the SECURITY INVOKER atomic save RPC can take a row lock; no UPDATE RLS policy exists.';
