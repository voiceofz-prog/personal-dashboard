-- Regression test for mixed-cycle Fitness saves.
-- It discovers the sole current cycle dynamically; the outer transaction rolls back.

begin;
select set_config(
  'request.jwt.claim.sub',
  (
    select user_id::text
    from public.jessica_review_cycles
    where domain = 'fitness' and status = 'active'
    order by reviewed_at desc
    limit 1
  ),
  true
);
set local role authenticated;

do $$
declare
  v_cycle_id uuid;
  v_user_id uuid;
  v_plan_type text;
  v_current_one public.fitness_exercise_targets%rowtype;
  v_current_two public.fitness_exercise_targets%rowtype;
  v_stale public.fitness_exercise_targets%rowtype;
  v_entry_date date := current_date;
  v_result jsonb;
begin
  select id, user_id
    into v_cycle_id, v_user_id
  from public.jessica_review_cycles
  where domain = 'fitness' and status = 'active'
  order by reviewed_at desc
  limit 1;

  if v_cycle_id is null then
    raise exception 'test requires one active Fitness review cycle';
  end if;

  select plan_type
    into v_plan_type
  from public.fitness_exercise_targets
  where user_id = v_user_id
    and review_cycle_id = v_cycle_id
    and active
  group by plan_type
  having count(*) >= 2
  order by plan_type
  limit 1;

  select *
    into v_current_one
  from public.fitness_exercise_targets
  where user_id = v_user_id
    and review_cycle_id = v_cycle_id
    and active
    and plan_type = v_plan_type
  order by exercise_key
  limit 1;

  select *
    into v_current_two
  from public.fitness_exercise_targets
  where user_id = v_user_id
    and review_cycle_id = v_cycle_id
    and active
    and plan_type = v_plan_type
    and id <> v_current_one.id
  order by exercise_key
  limit 1;

  select *
    into v_stale
  from public.fitness_exercise_targets
  where user_id = v_user_id
    and not active
    and plan_type = v_current_one.plan_type
    and exercise_key = v_current_one.exercise_key
  order by updated_at desc
  limit 1;

  if v_current_one.id is null or v_current_two.id is null or v_stale.id is null then
    raise exception 'test requires two current targets and one matching superseded target';
  end if;

  -- A current target succeeds, then this inner exception rolls the test write back.
  begin
    v_result := public.save_fitness_entry_atomic(
      jsonb_build_object(
        'id', '00000000-0000-4000-8000-000000000901',
        'entry_date', v_entry_date,
        'training_status', 'trained',
        'soreness_level', 'none',
        'soreness_areas', jsonb_build_array()
      ),
      jsonb_build_array(jsonb_build_object(
        'id', '00000000-0000-4000-8000-000000000902',
        'daily_entry_id', '00000000-0000-4000-8000-000000000901',
        'workout_date', v_entry_date,
        'plan_type', v_current_one.plan_type,
        'exercise_key', v_current_one.exercise_key,
        'exercise', 'transaction test',
        'weight_kg', coalesce(v_current_one.weight_kg, 1),
        'reps_by_set', v_current_one.reps_by_set,
        'target_id', v_current_one.id
      ))
    );
    set constraints fitness_workouts_validate_active_cycle immediate;
    if v_result ->> 'review_cycle_id' <> v_cycle_id::text then
      raise exception 'current-cycle test returned the wrong cycle';
    end if;
    raise exception 'ROLLBACK_SUCCESS_CASE';
  exception when others then
    if sqlerrm <> 'ROLLBACK_SUCCESS_CASE' then raise; end if;
  end;

  -- A stale UI target from a superseded cycle must fail.
  begin
    perform public.save_fitness_entry_atomic(
      jsonb_build_object(
        'id', '00000000-0000-4000-8000-000000000911',
        'entry_date', v_entry_date,
        'training_status', 'trained',
        'soreness_level', 'none',
        'soreness_areas', jsonb_build_array()
      ),
      jsonb_build_array(jsonb_build_object(
        'id', '00000000-0000-4000-8000-000000000912',
        'daily_entry_id', '00000000-0000-4000-8000-000000000911',
        'workout_date', v_entry_date,
        'plan_type', v_stale.plan_type,
        'exercise_key', v_stale.exercise_key,
        'exercise', 'stale test',
        'target_id', v_stale.id
      ))
    );
    raise exception 'stale target was accepted';
  exception when sqlstate 'P0001' then
    if position('stale' in sqlerrm) = 0 then raise; end if;
  end;

  -- A batch mixing current and superseded target ids must fail in full.
  begin
    perform public.save_fitness_entry_atomic(
      jsonb_build_object(
        'id', '00000000-0000-4000-8000-000000000921',
        'entry_date', v_entry_date,
        'training_status', 'trained',
        'soreness_level', 'none',
        'soreness_areas', jsonb_build_array()
      ),
      jsonb_build_array(
        jsonb_build_object(
          'id', '00000000-0000-4000-8000-000000000922',
          'daily_entry_id', '00000000-0000-4000-8000-000000000921',
          'workout_date', v_entry_date,
          'plan_type', v_current_two.plan_type,
          'exercise_key', v_current_two.exercise_key,
          'exercise', 'mixed test current',
          'target_id', v_current_two.id
        ),
        jsonb_build_object(
          'id', '00000000-0000-4000-8000-000000000923',
          'daily_entry_id', '00000000-0000-4000-8000-000000000921',
          'workout_date', v_entry_date,
          'plan_type', v_stale.plan_type,
          'exercise_key', v_stale.exercise_key,
          'exercise', 'mixed test stale',
          'target_id', v_stale.id
        )
      )
    );
    raise exception 'mixed target ids were accepted';
  exception when sqlstate 'P0001' then
    if position('stale' in sqlerrm) = 0 then raise; end if;
  end;

  -- A late insert error proves that the daily row and earlier workout roll back together.
  begin
    perform public.save_fitness_entry_atomic(
      jsonb_build_object(
        'id', '00000000-0000-4000-8000-000000000931',
        'entry_date', v_entry_date,
        'training_status', 'trained',
        'soreness_level', 'none',
        'soreness_areas', jsonb_build_array()
      ),
      jsonb_build_array(
        jsonb_build_object(
          'id', '00000000-0000-4000-8000-000000000932',
          'daily_entry_id', '00000000-0000-4000-8000-000000000931',
          'workout_date', v_entry_date,
          'plan_type', v_current_one.plan_type,
          'exercise_key', v_current_one.exercise_key,
          'exercise', 'atomic test valid',
          'target_id', v_current_one.id
        ),
        jsonb_build_object(
          'id', '00000000-0000-4000-8000-000000000933',
          'daily_entry_id', '00000000-0000-4000-8000-000000000931',
          'workout_date', v_entry_date,
          'plan_type', v_current_two.plan_type,
          'exercise_key', v_current_two.exercise_key,
          'exercise', 'atomic test invalid',
          'weight_kg', 'not-a-number',
          'target_id', v_current_two.id
        )
      )
    );
    raise exception 'late insert error was not raised';
  exception when invalid_text_representation then null;
  end;

  if exists (
    select 1 from public.fitness_daily_entries
    where id = '00000000-0000-4000-8000-000000000931'::uuid
  ) or exists (
    select 1 from public.fitness_workouts
    where daily_entry_id = '00000000-0000-4000-8000-000000000931'::uuid
  ) then
    raise exception 'atomic rollback test left partial rows';
  end if;
end;
$$;

rollback;
