-- Save one Fitness daily entry and its complete workout set in one transaction.
-- The database revalidates the sole active Fitness review cycle at write time.

create or replace function public.validate_fitness_workout_target()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_cycle_count integer;
  v_workout_count integer;
  v_linked_count integer;
begin
  -- A deferred trigger can still fire after the row was removed later in the transaction.
  if not exists (
    select 1
    from public.fitness_workouts w
    where w.id = new.id
  ) then
    return null;
  end if;

  if new.target_id is null or not exists (
    select 1
    from public.fitness_exercise_targets t
    join public.jessica_review_cycles c
      on c.id = t.review_cycle_id
     and c.user_id = t.user_id
    where t.id = new.target_id
      and t.user_id = new.user_id
      and t.plan_type = new.plan_type
      and t.exercise_key = new.exercise_key
      and t.active
      and t.effective_from <= new.workout_date
      and c.domain = 'fitness'
      and c.status = 'active'
  ) then
    raise exception using
      errcode = 'P0001',
      message = format(
        'Fitness save rejected: target_id for %s / %s is stale, inactive, superseded, or not owned by the active Fitness cycle.',
        coalesce(new.plan_type, 'unknown plan'),
        coalesce(new.exercise_key, 'unknown exercise')
      );
  end if;

  if new.daily_entry_id is not null then
    select
      count(*),
      count(t.id),
      count(distinct t.review_cycle_id)
    into v_workout_count, v_linked_count, v_cycle_count
    from public.fitness_workouts w
    left join public.fitness_exercise_targets t on t.id = w.target_id
    where w.user_id = new.user_id
      and w.daily_entry_id = new.daily_entry_id;

    if v_workout_count <> v_linked_count or v_cycle_count <> 1 then
      raise exception using
        errcode = 'P0001',
        message = 'Fitness save rejected: every workout in the entry must reference an active target from the same active Fitness cycle.';
    end if;
  end if;

  return null;
end;
$$;

revoke execute on function public.validate_fitness_workout_target() from public, anon, authenticated;

drop trigger if exists fitness_workouts_validate_active_cycle on public.fitness_workouts;
create constraint trigger fitness_workouts_validate_active_cycle
after insert or update of user_id, daily_entry_id, workout_date, plan_type, exercise_key, target_id
on public.fitness_workouts
deferrable initially deferred
for each row execute function public.validate_fitness_workout_target();

create or replace function public.save_fitness_entry_atomic(
  p_daily_entry jsonb,
  p_workouts jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_daily_id uuid;
  v_entry_date date;
  v_training_status text;
  v_workout jsonb;
  v_workout_id uuid;
  v_target_id uuid;
  v_active_cycle uuid;
  v_active_cycles uuid[];
  v_candidate_targets uuid[];
  v_workout_ids uuid[] := '{}'::uuid[];
  v_plan_type text;
  v_batch_plan text;
  v_exercise_key text;
  v_workout_date date;
  v_workout_count integer;
begin
  if v_user_id is null or not (select public.is_dashboard_user()) then
    raise exception using
      errcode = '42501',
      message = 'Fitness save rejected: an authorized Dashboard session is required.';
  end if;

  if jsonb_typeof(p_daily_entry) is distinct from 'object'
     or jsonb_typeof(p_workouts) is distinct from 'array' then
    raise exception using
      errcode = '22023',
      message = 'Fitness save rejected: daily entry and workouts must be one complete batch.';
  end if;

  begin
    v_daily_id := nullif(p_daily_entry ->> 'id', '')::uuid;
    v_entry_date := nullif(p_daily_entry ->> 'entry_date', '')::date;
  exception when invalid_text_representation or datetime_field_overflow then
    raise exception using
      errcode = '22023',
      message = 'Fitness save rejected: the daily entry id or date is invalid.';
  end;

  if v_daily_id is null or v_entry_date is null then
    raise exception using
      errcode = '22023',
      message = 'Fitness save rejected: daily entry id and date are required.';
  end if;

  if p_daily_entry ? 'user_id'
     and nullif(p_daily_entry ->> 'user_id', '')::uuid is distinct from v_user_id then
    raise exception using
      errcode = '42501',
      message = 'Fitness save rejected: the daily entry belongs to another user.';
  end if;

  v_training_status := p_daily_entry ->> 'training_status';
  if v_training_status not in ('trained', 'rest') then
    raise exception using
      errcode = '22023',
      message = 'Fitness save rejected: training_status must be trained or rest.';
  end if;

  v_workout_count := jsonb_array_length(p_workouts);
  if v_training_status = 'trained' and v_workout_count = 0 then
    raise exception using
      errcode = '22023',
      message = 'Fitness save rejected: a trained day requires at least one completed workout.';
  elsif v_training_status = 'rest' and v_workout_count <> 0 then
    raise exception using
      errcode = '22023',
      message = 'Fitness save rejected: a rest day cannot contain workouts.';
  end if;

  if v_training_status = 'trained' then
    select array_agg(c.id order by c.reviewed_at desc)
    into v_active_cycles
    from public.jessica_review_cycles c
    where c.user_id = v_user_id
      and c.domain = 'fitness'
      and c.status = 'active';

    if coalesce(cardinality(v_active_cycles), 0) <> 1 then
      raise exception using
        errcode = 'P0001',
        message = format(
          'Fitness save rejected: expected exactly one active Fitness cycle; found %s.',
          coalesce(cardinality(v_active_cycles), 0)
        );
    end if;

    v_active_cycle := v_active_cycles[1];
    perform 1
    from public.jessica_review_cycles c
    where c.id = v_active_cycle
    for share;
  end if;

  for v_workout in
    select value from jsonb_array_elements(p_workouts)
  loop
    begin
      v_workout_id := nullif(v_workout ->> 'id', '')::uuid;
      v_target_id := nullif(v_workout ->> 'target_id', '')::uuid;
      v_workout_date := nullif(v_workout ->> 'workout_date', '')::date;
    exception when invalid_text_representation or datetime_field_overflow then
      raise exception using
        errcode = '22023',
        message = 'Fitness save rejected: a workout id, target_id, or date is invalid.';
    end;

    v_plan_type := v_workout ->> 'plan_type';
    v_exercise_key := v_workout ->> 'exercise_key';

    if v_workout_id is null or v_target_id is null or v_workout_date is null
       or v_plan_type not in ('Plan A', 'Plan B')
       or coalesce(v_exercise_key, '') = '' then
      raise exception using
        errcode = '22023',
        message = 'Fitness save rejected: every workout requires id, target_id, date, Plan, and exercise_key.';
    end if;

    if v_workout_date <> v_entry_date
       or (
         v_workout ? 'daily_entry_id'
         and nullif(v_workout ->> 'daily_entry_id', '')::uuid is distinct from v_daily_id
       ) then
      raise exception using
        errcode = '22023',
        message = 'Fitness save rejected: every workout must use the daily entry id and date.';
    end if;

    if v_workout ? 'user_id'
       and nullif(v_workout ->> 'user_id', '')::uuid is distinct from v_user_id then
      raise exception using
        errcode = '42501',
        message = 'Fitness save rejected: a workout belongs to another user.';
    end if;

    if v_batch_plan is null then
      v_batch_plan := v_plan_type;
    elsif v_batch_plan <> v_plan_type then
      raise exception using
        errcode = '22023',
        message = 'Fitness save rejected: all workouts in one entry must use the same Plan.';
    end if;

    if v_workout_id = any(v_workout_ids) then
      raise exception using
        errcode = '22023',
        message = 'Fitness save rejected: duplicate workout ids are not allowed.';
    end if;
    v_workout_ids := array_append(v_workout_ids, v_workout_id);

    if exists (
      select 1
      from jsonb_array_elements(p_workouts) other
      where other.value ->> 'exercise_key' = v_exercise_key
        and other.value ->> 'id' <> v_workout ->> 'id'
    ) then
      raise exception using
        errcode = '22023',
        message = format('Fitness save rejected: duplicate exercise_key %s.', v_exercise_key);
    end if;

    select array_agg(t.id)
    into v_candidate_targets
    from public.fitness_exercise_targets t
    join public.jessica_review_cycles c
      on c.id = t.review_cycle_id
     and c.user_id = t.user_id
    where t.user_id = v_user_id
      and t.review_cycle_id = v_active_cycle
      and t.plan_type = v_plan_type
      and t.exercise_key = v_exercise_key
      and t.active
      and t.effective_from <= v_workout_date
      and c.domain = 'fitness'
      and c.status = 'active';

    if coalesce(cardinality(v_candidate_targets), 0) <> 1
       or v_candidate_targets[1] <> v_target_id then
      raise exception using
        errcode = 'P0001',
        message = format(
          'Fitness save rejected: target_id for %s / %s is stale, inactive, superseded, or not the sole active target. Refresh before saving.',
          v_plan_type,
          v_exercise_key
        );
    end if;

    perform 1
    from public.fitness_exercise_targets t
    where t.id = v_target_id
    for share;
  end loop;

  insert into public.fitness_daily_entries (
    id, user_id, entry_date, bodyweight_kg, training_status, training_content,
    protein, carbs_food, sleep_hours, energy_score, recovery_score,
    soreness_level, soreness_areas, source, notes
  )
  values (
    v_daily_id,
    v_user_id,
    v_entry_date,
    nullif(p_daily_entry ->> 'bodyweight_kg', '')::numeric,
    v_training_status,
    coalesce(p_daily_entry ->> 'training_content', ''),
    nullif(p_daily_entry ->> 'protein', ''),
    nullif(p_daily_entry ->> 'carbs_food', ''),
    nullif(p_daily_entry ->> 'sleep_hours', '')::numeric,
    nullif(p_daily_entry ->> 'energy_score', '')::integer,
    nullif(p_daily_entry ->> 'recovery_score', '')::integer,
    coalesce(nullif(p_daily_entry ->> 'soreness_level', ''), 'none'),
    coalesce(
      array(
        select jsonb_array_elements_text(
          coalesce(p_daily_entry -> 'soreness_areas', '[]'::jsonb)
        )
      ),
      '{}'::text[]
    ),
    coalesce(nullif(p_daily_entry ->> 'source', ''), 'manual'),
    nullif(p_daily_entry ->> 'notes', '')
  )
  on conflict (id) do update set
    entry_date = excluded.entry_date,
    bodyweight_kg = excluded.bodyweight_kg,
    training_status = excluded.training_status,
    training_content = excluded.training_content,
    protein = excluded.protein,
    carbs_food = excluded.carbs_food,
    sleep_hours = excluded.sleep_hours,
    energy_score = excluded.energy_score,
    recovery_score = excluded.recovery_score,
    soreness_level = excluded.soreness_level,
    soreness_areas = excluded.soreness_areas,
    source = excluded.source,
    notes = excluded.notes;

  delete from public.fitness_workouts w
  where w.user_id = v_user_id
    and w.daily_entry_id = v_daily_id
    and not (w.id = any(v_workout_ids));

  for v_workout in
    select value from jsonb_array_elements(p_workouts)
  loop
    insert into public.fitness_workouts (
      id, user_id, workout_date, plan_type, exercise, weight, reps, sets, rpe,
      next_target, daily_entry_id, exercise_key, weight_kg, reps_by_set,
      completed, source, target_id
    )
    values (
      (v_workout ->> 'id')::uuid,
      v_user_id,
      (v_workout ->> 'workout_date')::date,
      v_workout ->> 'plan_type',
      v_workout ->> 'exercise',
      nullif(v_workout ->> 'weight', ''),
      nullif(v_workout ->> 'reps', ''),
      nullif(v_workout ->> 'sets', ''),
      nullif(v_workout ->> 'rpe', ''),
      nullif(v_workout ->> 'next_target', ''),
      v_daily_id,
      v_workout ->> 'exercise_key',
      nullif(v_workout ->> 'weight_kg', '')::numeric,
      coalesce(
        array(
          select value::integer
          from jsonb_array_elements_text(
            coalesce(v_workout -> 'reps_by_set', '[]'::jsonb)
          )
        ),
        '{}'::integer[]
      ),
      coalesce((v_workout ->> 'completed')::boolean, true),
      coalesce(nullif(v_workout ->> 'source', ''), 'manual'),
      (v_workout ->> 'target_id')::uuid
    )
    on conflict (id) do update set
      workout_date = excluded.workout_date,
      plan_type = excluded.plan_type,
      exercise = excluded.exercise,
      weight = excluded.weight,
      reps = excluded.reps,
      sets = excluded.sets,
      rpe = excluded.rpe,
      next_target = excluded.next_target,
      daily_entry_id = excluded.daily_entry_id,
      exercise_key = excluded.exercise_key,
      weight_kg = excluded.weight_kg,
      reps_by_set = excluded.reps_by_set,
      completed = excluded.completed,
      source = excluded.source,
      target_id = excluded.target_id;
  end loop;

  return jsonb_build_object(
    'daily_entry_id', v_daily_id,
    'workout_count', v_workout_count,
    'review_cycle_id', v_active_cycle
  );
end;
$$;

revoke execute on function public.save_fitness_entry_atomic(jsonb, jsonb) from public, anon;
grant execute on function public.save_fitness_entry_atomic(jsonb, jsonb) to authenticated;
