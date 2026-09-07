-- Hosted Supabase runtime fixture for the legacy Fitness create-only guard.
-- All identities and rows are synthetic and removed by the outer rollback.

begin;

-- Minimal Hosted PG17-compatible Auth fixtures. Both users are allowlisted so
-- the cross-owner assertions exercise RLS rather than the allowlist alone.
insert into auth.users (id, email, aud, role, created_at, updated_at)
values
  ('10000000-0000-4000-8000-000000000001', 'fitness-fixture-owner-a@example.invalid', 'authenticated', 'authenticated', '2026-08-01 00:00:00+00', '2026-08-01 00:00:00+00'),
  ('10000000-0000-4000-8000-000000000002', 'fitness-fixture-owner-b@example.invalid', 'authenticated', 'authenticated', '2026-08-01 00:00:00+00', '2026-08-01 00:00:00+00');

insert into public.dashboard_allowed_users (user_id, email)
values
  ('10000000-0000-4000-8000-000000000001', 'fitness-fixture-owner-a@example.invalid'),
  ('10000000-0000-4000-8000-000000000002', 'fitness-fixture-owner-b@example.invalid');

insert into public.jessica_review_cycles (
  id, user_id, domain, status, evidence, summary, next_focus, reviewed_at
)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'fitness', 'active', '{}'::jsonb, 'fixture active cycle', 'fixture next focus', '2026-08-01 00:00:00+00'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'fitness', 'superseded', '{}'::jsonb, 'fixture stale cycle', 'fixture next focus', '2026-07-01 00:00:00+00');

insert into public.fitness_exercise_targets (
  id, user_id, review_cycle_id, plan_type, exercise_key, exercise_name,
  weight_kg, reps_by_set, sort_order, active, effective_from
)
values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Plan A', 'squat', 'Fixture squat', 100, '{5,5,5}', 10, true, '2026-01-01'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Plan A', 'bench', 'Fixture bench', 70, '{5,5,5}', 20, true, '2026-01-01'),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'Plan A', 'squat', 'Fixture stale squat', 90, '{5,5,5}', 10, false, '2026-01-01');

-- Existing rows are only fixtures for owner isolation and global-id conflict.
insert into public.fitness_daily_entries (
  id, user_id, entry_date, training_status, training_content, source
)
values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '2026-08-01', 'rest', 'owner A protected fixture', 'manual'),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '2026-08-01', 'rest', 'owner B conflict fixture', 'manual');

select set_config(
  'fixture.owner_b_snapshot',
  jsonb_build_object(
    'daily_rows', coalesce((
      select jsonb_agg(to_jsonb(d) order by d.id)
      from public.fitness_daily_entries d
      where d.user_id = '10000000-0000-4000-8000-000000000002'::uuid
    ), '[]'::jsonb),
    'workout_rows', coalesce((
      select jsonb_agg(to_jsonb(w) order by w.id)
      from public.fitness_workouts w
      where w.user_id = '10000000-0000-4000-8000-000000000002'::uuid
    ), '[]'::jsonb)
  )::text,
  true
);

-- The fixture verifies the deployed security shape before exercising behavior.
do $$
declare
  v_function oid;
  v_rls_count integer;
begin
  select p.oid
    into v_function
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace
    and p.proname = 'save_fitness_entry_atomic'
    and pg_get_function_identity_arguments(p.oid) = 'p_daily_entry jsonb, p_workouts jsonb';

  if v_function is null then
    raise exception 'save_fitness_entry_atomic(jsonb, jsonb) is missing';
  end if;

  if (select p.prosecdef from pg_proc p where p.oid = v_function) then
    raise exception 'save_fitness_entry_atomic must remain SECURITY INVOKER';
  end if;

  if not has_function_privilege('authenticated', v_function, 'EXECUTE')
     or has_function_privilege('anon', v_function, 'EXECUTE') then
    raise exception 'save_fitness_entry_atomic grants are unsafe';
  end if;

  if exists (
    select 1
    from pg_proc p
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) privilege
    where p.oid = v_function
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ) then
    raise exception 'save_fitness_entry_atomic must not grant EXECUTE to PUBLIC';
  end if;

  select count(*)
    into v_rls_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in (
      'fitness_daily_entries',
      'fitness_workouts',
      'jessica_review_cycles',
      'fitness_exercise_targets'
    )
    and c.relrowsecurity;

  if v_rls_count <> 4 then
    raise exception 'Fitness runtime tables must have RLS enabled';
  end if;
end;
$$;

-- A fixture-local snapshot prevents a rejected v1 request from being accepted
-- merely because it returns an error after changing or deleting a row.
create function pg_temp.fitness_owner_snapshot()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'daily_count', (select count(*) from public.fitness_daily_entries d where d.user_id = auth.uid()),
    'daily_rows', coalesce((
      select jsonb_agg(to_jsonb(d) order by d.id)
      from public.fitness_daily_entries d
      where d.user_id = auth.uid()
    ), '[]'::jsonb),
    'workout_count', (select count(*) from public.fitness_workouts w where w.user_id = auth.uid()),
    'workout_rows', coalesce((
      select jsonb_agg(to_jsonb(w) order by w.id)
      from public.fitness_workouts w
      where w.user_id = auth.uid()
    ), '[]'::jsonb)
  );
$$;

create function pg_temp.assert_owner_snapshot(p_before jsonb, p_case text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if pg_temp.fitness_owner_snapshot() is distinct from p_before then
    raise exception '% changed daily/workout rows, row counts, or provenance after rejection', p_case;
  end if;
end;
$$;

-- An unauthenticated role cannot invoke the RPC at all.
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
do $$
begin
  begin
    perform public.save_fitness_entry_atomic(
      jsonb_build_object(
        'id', '50000000-0000-4000-8000-000000000001',
        'entry_date', '2026-08-01',
        'training_status', 'rest'
      ),
      '[]'::jsonb
    );
    raise exception 'unauthenticated RPC call was accepted';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
reset role;

-- A second authorized owner cannot see or change owner A rows and cannot
-- supply owner A's identity to the RPC.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
do $$
declare
  v_rows integer;
begin
  if exists (
    select 1
    from public.fitness_daily_entries
    where id = '40000000-0000-4000-8000-000000000001'::uuid
  ) then
    raise exception 'owner B can read owner A Fitness data';
  end if;

  update public.fitness_daily_entries
  set notes = 'owner B must not update this'
  where id = '40000000-0000-4000-8000-000000000001'::uuid;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'owner B updated an owner A Fitness row';
  end if;

  begin
    perform public.save_fitness_entry_atomic(
      jsonb_build_object(
        'id', '50000000-0000-4000-8000-000000000002',
        'user_id', '10000000-0000-4000-8000-000000000001',
        'entry_date', '2026-08-01',
        'training_status', 'rest'
      ),
      '[]'::jsonb
    );
    raise exception 'owner B submitted an owner A user_id';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
reset role;

-- Owner A exercises the v1 create-only contract using a fixed date.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $$
declare
  v_entry_date constant date := '2026-08-01';
  v_cycle_id constant uuid := '20000000-0000-4000-8000-000000000001';
  v_current_one constant uuid := '30000000-0000-4000-8000-000000000001';
  v_current_two constant uuid := '30000000-0000-4000-8000-000000000002';
  v_stale constant uuid := '30000000-0000-4000-8000-000000000003';
  v_daily_payload jsonb;
  v_workouts_payload jsonb;
  v_owner_before jsonb;
  v_result jsonb;
begin
  -- Daily-only rest create remains valid under the emergency create-only rule.
  v_result := public.save_fitness_entry_atomic(
    jsonb_build_object(
      'id', '50000000-0000-4000-8000-000000000010',
      'entry_date', v_entry_date,
      'training_status', 'rest',
      'soreness_level', 'none',
      'soreness_areas', jsonb_build_array(),
      'source', 'manual'
    ),
    '[]'::jsonb
  );
  if v_result ->> 'daily_entry_id' <> '50000000-0000-4000-8000-000000000010'
     or v_result ->> 'workout_count' <> '0' then
    raise exception 'daily-only rest create returned the wrong result';
  end if;

  if not exists (
    select 1
    from public.fitness_daily_entries d
    where d.id = '50000000-0000-4000-8000-000000000010'::uuid
      and d.user_id = auth.uid()
      and d.entry_date = v_entry_date
      and d.training_status = 'rest'
      and d.soreness_level = 'none'
      and d.soreness_areas = '{}'::text[]
      and d.source = 'manual'
  ) or exists (
    select 1
    from public.fitness_workouts w
    where w.daily_entry_id = '50000000-0000-4000-8000-000000000010'::uuid
  ) then
    raise exception 'daily-only rest create did not persist the expected owner row and zero workouts';
  end if;

  -- A trained create validates the sole active cycle and two published targets.
  v_daily_payload := jsonb_build_object(
    'id', '50000000-0000-4000-8000-000000000020',
    'entry_date', v_entry_date,
    'training_status', 'trained',
    'training_content', 'synthetic create-only fixture',
    'soreness_level', 'none',
    'soreness_areas', jsonb_build_array(),
    'source', 'manual'
  );
  v_workouts_payload := jsonb_build_array(
    jsonb_build_object(
      'id', '50000000-0000-4000-8000-000000000021',
      'daily_entry_id', '50000000-0000-4000-8000-000000000020',
      'workout_date', v_entry_date,
      'plan_type', 'Plan A',
      'exercise_key', 'squat',
      'exercise', 'fixture squat',
      'weight_kg', 100,
      'reps_by_set', jsonb_build_array(5, 5, 5),
      'target_id', v_current_one
    ),
    jsonb_build_object(
      'id', '50000000-0000-4000-8000-000000000022',
      'daily_entry_id', '50000000-0000-4000-8000-000000000020',
      'workout_date', v_entry_date,
      'plan_type', 'Plan A',
      'exercise_key', 'bench',
      'exercise', 'fixture bench',
      'weight_kg', 70,
      'reps_by_set', jsonb_build_array(5, 5, 5),
      'target_id', v_current_two
    )
  );

  v_result := public.save_fitness_entry_atomic(v_daily_payload, v_workouts_payload);
  set constraints fitness_workouts_validate_active_cycle immediate;
  if v_result ->> 'daily_entry_id' <> '50000000-0000-4000-8000-000000000020'
     or v_result ->> 'workout_count' <> '2'
     or v_result ->> 'review_cycle_id' <> v_cycle_id::text then
    raise exception 'trained create returned the wrong result';
  end if;

  if not exists (
    select 1
    from public.fitness_daily_entries d
    where d.id = '50000000-0000-4000-8000-000000000020'::uuid
      and d.user_id = auth.uid()
      and d.entry_date = v_entry_date
      and d.training_status = 'trained'
      and d.training_content = 'synthetic create-only fixture'
      and d.soreness_level = 'none'
      and d.soreness_areas = '{}'::text[]
      and d.source = 'manual'
  ) then
    raise exception 'trained create did not persist the expected daily row';
  end if;

  if (select count(*) from public.fitness_workouts w
      where w.daily_entry_id = '50000000-0000-4000-8000-000000000020'::uuid) <> 2
     or not exists (
       select 1
       from public.fitness_workouts w
       where w.id = '50000000-0000-4000-8000-000000000021'::uuid
         and w.user_id = auth.uid()
         and w.daily_entry_id = '50000000-0000-4000-8000-000000000020'::uuid
         and w.target_id = v_current_one
         and w.plan_type = 'Plan A'
         and w.exercise_key = 'squat'
     )
     or not exists (
       select 1
       from public.fitness_workouts w
       where w.id = '50000000-0000-4000-8000-000000000022'::uuid
         and w.user_id = auth.uid()
         and w.daily_entry_id = '50000000-0000-4000-8000-000000000020'::uuid
         and w.target_id = v_current_two
         and w.plan_type = 'Plan A'
         and w.exercise_key = 'bench'
     )
     or (select count(*)
         from public.fitness_exercise_targets t
         where t.id in (v_current_one, v_current_two)
           and t.user_id = auth.uid()
           and t.review_cycle_id = v_cycle_id
           and t.active) <> 2 then
    raise exception 'trained create did not persist the expected linked workouts and active-cycle targets';
  end if;

  v_owner_before := pg_temp.fitness_owner_snapshot();
  perform set_config('fixture.owner_a_snapshot', v_owner_before::text, true);

  -- Exact replay is deliberately rejected: v1 does not claim idempotent replay.
  begin
    perform public.save_fitness_entry_atomic(v_daily_payload, v_workouts_payload);
    raise exception 'identical replay was accepted';
  exception when sqlstate 'P0001' then
    if position('FITNESS_V1_UPGRADE_REQUIRED' in sqlerrm) = 0 then raise; end if;
  end;
  perform pg_temp.assert_owner_snapshot(v_owner_before, 'identical replay');

  -- Existing daily edits cannot reach replacement or delete reconciliation.
  begin
    perform public.save_fitness_entry_atomic(
      v_daily_payload || jsonb_build_object('training_content', 'unsafe replacement attempt'),
      jsonb_build_array(v_workouts_payload -> 0)
    );
    raise exception 'changed existing daily was accepted';
  exception when sqlstate 'P0001' then
    if position('FITNESS_V1_UPGRADE_REQUIRED' in sqlerrm) = 0 then raise; end if;
  end;
  perform pg_temp.assert_owner_snapshot(v_owner_before, 'changed existing daily');

  begin
    perform public.save_fitness_entry_atomic(
      v_daily_payload,
      v_workouts_payload || jsonb_build_array(
        jsonb_build_object(
          'id', '50000000-0000-4000-8000-000000000023',
          'daily_entry_id', '50000000-0000-4000-8000-000000000020',
          'workout_date', v_entry_date,
          'plan_type', 'Plan A',
          'exercise_key', 'new-exercise',
          'exercise', 'must not be added',
          'target_id', v_current_one
        )
      )
    );
    raise exception 'existing daily plus new workout was accepted';
  exception when sqlstate 'P0001' then
    if position('FITNESS_V1_UPGRADE_REQUIRED' in sqlerrm) = 0 then raise; end if;
  end;
  perform pg_temp.assert_owner_snapshot(v_owner_before, 'existing daily plus new workout');

  -- Existing workout ids are rejected before a new daily can be inserted.
  begin
    perform public.save_fitness_entry_atomic(
      v_daily_payload || jsonb_build_object('id', '50000000-0000-4000-8000-000000000030'),
      jsonb_build_array(
        (v_workouts_payload -> 0)
        || jsonb_build_object(
          'daily_entry_id', '50000000-0000-4000-8000-000000000030',
          'exercise', 'changed existing workout'
        )
      )
    );
    raise exception 'changed existing workout id was accepted';
  exception when sqlstate 'P0001' then
    if position('FITNESS_V1_UPGRADE_REQUIRED' in sqlerrm) = 0 then raise; end if;
  end;
  perform pg_temp.assert_owner_snapshot(v_owner_before, 'changed existing workout id');

  begin
    perform public.save_fitness_entry_atomic(
      v_daily_payload || jsonb_build_object('id', '50000000-0000-4000-8000-000000000031'),
      jsonb_build_array(
        (v_workouts_payload -> 1)
        || jsonb_build_object('daily_entry_id', '50000000-0000-4000-8000-000000000031')
      )
    );
    raise exception 'supplied existing workout id was accepted';
  exception when sqlstate 'P0001' then
    if position('FITNESS_V1_UPGRADE_REQUIRED' in sqlerrm) = 0 then raise; end if;
  end;
  perform pg_temp.assert_owner_snapshot(v_owner_before, 'supplied existing workout id');

  -- A global primary-key conflict hidden by RLS also fails closed rather than
  -- changing owner B's existing row or creating an owner A replacement.
  begin
    perform public.save_fitness_entry_atomic(
      jsonb_build_object(
        'id', '40000000-0000-4000-8000-000000000002',
        'entry_date', v_entry_date,
        'training_status', 'rest',
        'source', 'manual'
      ),
      '[]'::jsonb
    );
    raise exception 'cross-owner daily conflict was accepted';
  exception when sqlstate 'P0001' then
    if position('FITNESS_V1_UPGRADE_REQUIRED' in sqlerrm) = 0 then raise; end if;
  end;
  perform pg_temp.assert_owner_snapshot(v_owner_before, 'cross-owner daily conflict');

  -- Duplicate request identities and duplicate exercise keys fail before writes.
  begin
    perform public.save_fitness_entry_atomic(
      v_daily_payload || jsonb_build_object('id', '50000000-0000-4000-8000-000000000040'),
      jsonb_build_array(
        (v_workouts_payload -> 0)
          || jsonb_build_object('id', '50000000-0000-4000-8000-000000000041', 'daily_entry_id', '50000000-0000-4000-8000-000000000040'),
        (v_workouts_payload -> 0)
          || jsonb_build_object('id', '50000000-0000-4000-8000-000000000041', 'daily_entry_id', '50000000-0000-4000-8000-000000000040')
      )
    );
    raise exception 'duplicate workout ids were accepted';
  exception when sqlstate '22023' then
    if position('duplicate workout ids' in sqlerrm) = 0 then raise; end if;
  end;
  perform pg_temp.assert_owner_snapshot(v_owner_before, 'duplicate workout ids');

  begin
    perform public.save_fitness_entry_atomic(
      v_daily_payload || jsonb_build_object('id', '50000000-0000-4000-8000-000000000050'),
      jsonb_build_array(
        (v_workouts_payload -> 0)
          || jsonb_build_object('id', '50000000-0000-4000-8000-000000000051', 'daily_entry_id', '50000000-0000-4000-8000-000000000050'),
        (v_workouts_payload -> 0)
          || jsonb_build_object('id', '50000000-0000-4000-8000-000000000052', 'daily_entry_id', '50000000-0000-4000-8000-000000000050')
      )
    );
    raise exception 'duplicate exercise key was accepted';
  exception when sqlstate '22023' then
    if position('duplicate exercise_key' in sqlerrm) = 0 then raise; end if;
  end;
  perform pg_temp.assert_owner_snapshot(v_owner_before, 'duplicate exercise key');

  -- Stale and mixed target batches cannot create a daily or workout row.
  begin
    perform public.save_fitness_entry_atomic(
      jsonb_build_object(
        'id', '50000000-0000-4000-8000-000000000060',
        'entry_date', v_entry_date,
        'training_status', 'trained',
        'soreness_level', 'none',
        'soreness_areas', jsonb_build_array(),
        'source', 'manual'
      ),
      jsonb_build_array(jsonb_build_object(
        'id', '50000000-0000-4000-8000-000000000061',
        'daily_entry_id', '50000000-0000-4000-8000-000000000060',
        'workout_date', v_entry_date,
        'plan_type', 'Plan A',
        'exercise_key', 'squat',
        'exercise', 'stale target',
        'target_id', v_stale
      ))
    );
    raise exception using
      errcode = 'P0002',
      message = 'stale target acceptance sentinel';
  exception when sqlstate 'P0001' then
    if position('stale' in sqlerrm) = 0 then raise; end if;
  end;
  perform pg_temp.assert_owner_snapshot(v_owner_before, 'stale target');

  begin
    perform public.save_fitness_entry_atomic(
      jsonb_build_object(
        'id', '50000000-0000-4000-8000-000000000070',
        'entry_date', v_entry_date,
        'training_status', 'trained',
        'soreness_level', 'none',
        'soreness_areas', jsonb_build_array(),
        'source', 'manual'
      ),
      jsonb_build_array(
        jsonb_build_object(
          'id', '50000000-0000-4000-8000-000000000071',
          'daily_entry_id', '50000000-0000-4000-8000-000000000070',
          'workout_date', v_entry_date,
          'plan_type', 'Plan A',
          'exercise_key', 'bench',
          'exercise', 'current target',
          'target_id', v_current_two
        ),
        jsonb_build_object(
          'id', '50000000-0000-4000-8000-000000000072',
          'daily_entry_id', '50000000-0000-4000-8000-000000000070',
          'workout_date', v_entry_date,
          'plan_type', 'Plan A',
          'exercise_key', 'squat',
          'exercise', 'stale target',
          'target_id', v_stale
        )
      )
    );
    raise exception using
      errcode = 'P0002',
      message = 'mixed target acceptance sentinel';
  exception when sqlstate 'P0001' then
    if position('stale' in sqlerrm) = 0 then raise; end if;
  end;
  perform pg_temp.assert_owner_snapshot(v_owner_before, 'mixed target batch');

  -- A late conversion error proves the atomic function leaves no partial rows.
  begin
    perform public.save_fitness_entry_atomic(
      v_daily_payload || jsonb_build_object('id', '50000000-0000-4000-8000-000000000080'),
      jsonb_build_array(
        (v_workouts_payload -> 0)
          || jsonb_build_object('id', '50000000-0000-4000-8000-000000000081', 'daily_entry_id', '50000000-0000-4000-8000-000000000080'),
        (v_workouts_payload -> 1)
          || jsonb_build_object('id', '50000000-0000-4000-8000-000000000082', 'daily_entry_id', '50000000-0000-4000-8000-000000000080', 'weight_kg', 'not-a-number')
      )
    );
    raise exception 'late insert error was not raised';
  exception when invalid_text_representation then
    null;
  end;
  perform pg_temp.assert_owner_snapshot(v_owner_before, 'late insert error');
end;
$$;

reset role;

-- The owner A workouts now exist, so owner B can prove RLS hides every
-- Fitness read model and prevents writes without relying on the allowlist.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
do $$
declare
  v_rows integer;
begin
  if exists (
    select 1 from public.fitness_workouts
    where id in (
      '50000000-0000-4000-8000-000000000021'::uuid,
      '50000000-0000-4000-8000-000000000022'::uuid
    )
  ) or exists (
    select 1 from public.jessica_review_cycles
    where id = '20000000-0000-4000-8000-000000000001'::uuid
  ) or exists (
    select 1 from public.fitness_exercise_targets
    where id in (
      '30000000-0000-4000-8000-000000000001'::uuid,
      '30000000-0000-4000-8000-000000000002'::uuid
    )
  ) then
    raise exception 'owner B can read owner A Fitness workouts, cycle, or targets';
  end if;

  update public.fitness_workouts
  set rpe = 'owner B must not update this'
  where id = '50000000-0000-4000-8000-000000000021'::uuid;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'owner B updated an owner A workout';
  end if;

  begin
    update public.jessica_review_cycles
    set summary = 'owner B must not update this'
    where id = '20000000-0000-4000-8000-000000000001'::uuid;
    raise exception 'owner B received cycle update permission';
  exception when insufficient_privilege then
    null;
  end;

  begin
    update public.fitness_exercise_targets
    set instructions = 'owner B must not update this'
    where id = '30000000-0000-4000-8000-000000000001'::uuid;
    raise exception 'owner B received target update permission';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
reset role;

do $$
declare
  v_owner_a_after jsonb;
  v_owner_b_after jsonb;
begin
  select jsonb_build_object(
    'daily_count', (select count(*) from public.fitness_daily_entries d where d.user_id = '10000000-0000-4000-8000-000000000001'::uuid),
    'daily_rows', coalesce((
      select jsonb_agg(to_jsonb(d) order by d.id)
      from public.fitness_daily_entries d
      where d.user_id = '10000000-0000-4000-8000-000000000001'::uuid
    ), '[]'::jsonb),
    'workout_count', (select count(*) from public.fitness_workouts w where w.user_id = '10000000-0000-4000-8000-000000000001'::uuid),
    'workout_rows', coalesce((
      select jsonb_agg(to_jsonb(w) order by w.id)
      from public.fitness_workouts w
      where w.user_id = '10000000-0000-4000-8000-000000000001'::uuid
    ), '[]'::jsonb)
  ) into v_owner_a_after;

  select jsonb_build_object(
    'daily_rows', coalesce((
      select jsonb_agg(to_jsonb(d) order by d.id)
      from public.fitness_daily_entries d
      where d.user_id = '10000000-0000-4000-8000-000000000002'::uuid
    ), '[]'::jsonb),
    'workout_rows', coalesce((
      select jsonb_agg(to_jsonb(w) order by w.id)
      from public.fitness_workouts w
      where w.user_id = '10000000-0000-4000-8000-000000000002'::uuid
    ), '[]'::jsonb)
  ) into v_owner_b_after;

  if v_owner_a_after is distinct from current_setting('fixture.owner_a_snapshot')::jsonb then
    raise exception 'owner B RLS checks changed owner A data';
  end if;

  if v_owner_b_after is distinct from current_setting('fixture.owner_b_snapshot')::jsonb then
    raise exception 'cross-owner daily conflict changed owner B data';
  end if;
end;
$$;

rollback;
