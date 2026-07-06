-- Preserve target-linked workout provenance even when a client attempts to
-- convert a completed training entry into a recovery entry or rebind its target.

create or replace function public.protect_fitness_workout_provenance()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.target_id is not null then
      raise exception using
        errcode = 'P0001',
        message = 'Fitness workout provenance is immutable: a target-linked workout cannot be deleted by the Dashboard save path.';
    end if;
    return old;
  end if;

  if old.target_id is not null and (
    new.user_id is distinct from old.user_id or
    new.daily_entry_id is distinct from old.daily_entry_id or
    new.workout_date is distinct from old.workout_date or
    new.plan_type is distinct from old.plan_type or
    new.exercise_key is distinct from old.exercise_key or
    new.target_id is distinct from old.target_id
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'Fitness workout provenance is immutable: owner, daily entry, date, Plan, exercise key, and target_id cannot be changed after linkage.';
  end if;

  return new;
end;
$$;

revoke execute on function public.protect_fitness_workout_provenance() from public, anon, authenticated;

drop trigger if exists fitness_workouts_protect_provenance on public.fitness_workouts;
create trigger fitness_workouts_protect_provenance
before delete or update of user_id, daily_entry_id, workout_date, plan_type, exercise_key, target_id
on public.fitness_workouts
for each row execute function public.protect_fitness_workout_provenance();
