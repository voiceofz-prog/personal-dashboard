-- Keep Jessica-published review provenance read-only to the authenticated browser.
-- Historical workout links must survive archive maintenance.

drop policy if exists "jessica_review_cycles_owner_insert" on public.jessica_review_cycles;
drop policy if exists "jessica_review_cycles_owner_update" on public.jessica_review_cycles;
drop policy if exists "jessica_review_cycles_owner_delete" on public.jessica_review_cycles;
drop policy if exists "fitness_exercise_targets_owner_insert" on public.fitness_exercise_targets;
drop policy if exists "fitness_exercise_targets_owner_update" on public.fitness_exercise_targets;
drop policy if exists "fitness_exercise_targets_owner_delete" on public.fitness_exercise_targets;

revoke insert, update, delete on public.jessica_review_cycles from authenticated;
revoke insert, update, delete on public.fitness_exercise_targets from authenticated;
grant select on public.jessica_review_cycles, public.fitness_exercise_targets to authenticated;

alter table public.fitness_workouts
  drop constraint if exists fitness_workouts_target_id_fkey;
alter table public.fitness_workouts
  add constraint fitness_workouts_target_id_fkey
  foreign key (target_id)
  references public.fitness_exercise_targets(id)
  on delete restrict;
