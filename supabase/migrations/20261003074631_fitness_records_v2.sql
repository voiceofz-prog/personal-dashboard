-- CLI-generated migration. Production application remains a separately approved gate.
-- Requires PostgreSQL 15+ for security_invoker views. Never apply schema.sql to production.
begin;
create schema if not exists dashboard_internal;
revoke all on schema dashboard_internal from public, anon;
grant usage on schema dashboard_internal to authenticated;

create table public.fitness_activities (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  activity_date date not null,
  activity_type text not null check (activity_type in ('walk_run','hiking','cycling','swimming','ball','strength','mobility','other')),
  name text not null check (length(btrim(name)) between 1 and 120),
  metrics jsonb not null default '{}',
  exercises jsonb not null default '[]',
  feeling text not null default '',
  notes text not null default '',
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.fitness_record_heads (
  user_id uuid not null references auth.users(id),
  record_kind text not null check (record_kind in ('daily','workout','activity')),
  record_id uuid not null,
  revision integer not null check (revision > 0),
  snapshot jsonb not null,
  withdrawn boolean not null default false,
  changed_at timestamptz not null,
  primary key (user_id, record_kind, record_id)
);
create table public.fitness_record_revisions (
  user_id uuid not null references auth.users(id),
  record_kind text not null,
  record_id uuid not null,
  revision integer not null,
  snapshot jsonb not null,
  withdrawn boolean not null,
  reason text not null,
  changed_at timestamptz not null,
  request_id uuid,
  primary key (user_id, record_kind, record_id, revision),
  foreign key (user_id, record_kind, record_id) references public.fitness_record_heads
);
create table public.fitness_save_receipts (
  user_id uuid not null references auth.users(id),
  request_id uuid not null,
  request jsonb not null,
  receipt jsonb not null,
  committed_at timestamptz not null,
  primary key (user_id, request_id)
);
create index fitness_activities_owner_date on public.fitness_activities(user_id, activity_date desc);
create index fitness_revisions_owner_time on public.fitness_record_revisions(user_id, changed_at desc);

-- Source-project acknowledgement also covers reviews that intentionally publish no new targets.
create table public.fitness_review_acknowledgements (
  user_id uuid not null,
  record_kind text not null,
  record_id uuid not null,
  revision integer not null,
  acknowledged_at timestamptz not null default now(),
  review_reference text not null,
  result text not null check (result in ('no_review_needed','publication_verified')),
  primary key(user_id,record_kind,record_id,revision),
  foreign key(user_id,record_kind,record_id,revision) references public.fitness_record_revisions(user_id,record_kind,record_id,revision)
);
alter table public.fitness_review_acknowledgements enable row level security;
revoke all on public.fitness_review_acknowledgements from public,anon,authenticated;
grant select on public.fitness_review_acknowledgements to authenticated;
create policy acknowledgements_owner_read on public.fitness_review_acknowledgements for select to authenticated using ((select auth.uid())=user_id and (select public.is_dashboard_user()));

-- Browser has read access only. Every write is mediated by the checked internal RPC.
alter table public.fitness_activities enable row level security;
alter table public.fitness_record_heads enable row level security;
alter table public.fitness_record_revisions enable row level security;
alter table public.fitness_save_receipts enable row level security;
revoke all on public.fitness_activities, public.fitness_record_heads, public.fitness_record_revisions, public.fitness_save_receipts from public, anon, authenticated;
grant select on public.fitness_activities, public.fitness_record_heads, public.fitness_record_revisions, public.fitness_save_receipts to authenticated;
create policy activities_owner_read on public.fitness_activities for select to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy heads_owner_read on public.fitness_record_heads for select to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy revisions_owner_read on public.fitness_record_revisions for select to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));
create policy receipts_owner_read on public.fitness_save_receipts for select to authenticated using ((select auth.uid()) = user_id and (select public.is_dashboard_user()));

-- Register initial versions, including inserts made by older supported create-only clients.
create function dashboard_internal.register_fitness_original() returns trigger
language plpgsql security definer set search_path = '' as $$
declare k text := tg_argv[0]; stamp timestamptz := coalesce(new.updated_at, new.created_at, now());
begin
  insert into public.fitness_record_heads values (new.user_id,k,new.id,1,to_jsonb(new),false,stamp);
  insert into public.fitness_record_revisions values (new.user_id,k,new.id,1,to_jsonb(new),false,'Original record',stamp,null);
  return new;
end $$;
revoke all on function dashboard_internal.register_fitness_original() from public, anon, authenticated;
create trigger fitness_daily_register_original after insert on public.fitness_daily_entries for each row execute function dashboard_internal.register_fitness_original('daily');
create trigger fitness_workout_register_original after insert on public.fitness_workouts for each row execute function dashboard_internal.register_fitness_original('workout');
create trigger fitness_activity_register_original after insert on public.fitness_activities for each row execute function dashboard_internal.register_fitness_original('activity');

-- Backfill with original timestamps, not migration time: deployment is not new exercise evidence.
insert into public.fitness_record_heads
select user_id,'daily',id,1,to_jsonb(d),false,updated_at from public.fitness_daily_entries d
union all select user_id,'workout',id,1,to_jsonb(w),false,updated_at from public.fitness_workouts w;
insert into public.fitness_record_revisions
select user_id,record_kind,record_id,revision,snapshot,withdrawn,'Original record',changed_at,null from public.fitness_record_heads;

-- Original factual rows are immutable. Existing create-only RPC remains available to old queues.
create function dashboard_internal.reject_fitness_original_change() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin raise exception 'FITNESS_V2_REQUIRED: use append-only corrections'; end $$;
revoke all on function dashboard_internal.reject_fitness_original_change() from public, anon, authenticated;
create trigger fitness_daily_original_immutable before update or delete on public.fitness_daily_entries for each row execute function dashboard_internal.reject_fitness_original_change();
create trigger fitness_workout_original_immutable before update or delete on public.fitness_workouts for each row execute function dashboard_internal.reject_fitness_original_change();
create trigger fitness_activity_original_immutable before update or delete on public.fitness_activities for each row execute function dashboard_internal.reject_fitness_original_change();
create trigger fitness_revision_immutable before update or delete on public.fitness_record_revisions for each row execute function dashboard_internal.reject_fitness_original_change();
create trigger fitness_receipt_immutable before update or delete on public.fitness_save_receipts for each row execute function dashboard_internal.reject_fitness_original_change();
create trigger fitness_acknowledgement_immutable before update or delete on public.fitness_review_acknowledgements for each row execute function dashboard_internal.reject_fitness_original_change();

create view public.fitness_daily_effective with (security_invoker = true) as
select (jsonb_populate_record(null::public.fitness_daily_entries,h.snapshot)).*, h.revision,h.withdrawn,h.changed_at as revision_changed_at
from public.fitness_record_heads h where h.record_kind='daily';
create view public.fitness_workouts_effective with (security_invoker = true) as
select (jsonb_populate_record(null::public.fitness_workouts,h.snapshot)).*, h.revision,
  (h.withdrawn or coalesce(d.withdrawn,false)) as withdrawn,h.changed_at as revision_changed_at
from public.fitness_record_heads h left join public.fitness_record_heads d
on d.user_id=h.user_id and d.record_kind='daily' and d.record_id=(h.snapshot->>'daily_entry_id')::uuid
where h.record_kind='workout';
create view public.fitness_activities_effective with (security_invoker = true) as
select (jsonb_populate_record(null::public.fitness_activities,h.snapshot)).*, h.revision,h.withdrawn,h.changed_at as revision_changed_at
from public.fitness_record_heads h where h.record_kind='activity';
revoke all on public.fitness_daily_effective,public.fitness_workouts_effective,public.fitness_activities_effective from public,anon,authenticated;
grant select on public.fitness_daily_effective,public.fitness_workouts_effective,public.fitness_activities_effective to authenticated;

create or replace function dashboard_internal.validate_fitness_snapshot(k text,s jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare a public.fitness_activities; d public.fitness_daily_entries; w public.fitness_workouts;
  field text; metric_value numeric; ex jsonb; rep jsonb; allowed text[];
begin
  if k='activity' then
    a:=jsonb_populate_record(null::public.fitness_activities,s);
    if a.activity_date is null or a.activity_type is null or a.name is null or length(btrim(a.name)) not between 1 and 120
       or a.activity_type not in ('walk_run','hiking','cycling','swimming','ball','strength','mobility','other')
       or jsonb_typeof(a.metrics) is distinct from 'object' or jsonb_typeof(a.exercises) is distinct from 'array' then raise exception 'Invalid activity'; end if;
    allowed := case a.activity_type
      when 'walk_run' then array['duration_minutes','distance_km','intensity']
      when 'hiking' then array['duration_minutes','elapsed_minutes','distance_km','elevation_m','intensity']
      when 'cycling' then array['duration_minutes','distance_km','elevation_m','environment','intensity']
      when 'swimming' then array['duration_minutes','distance_km','stroke','pool_length_m','laps','intensity']
      else array['duration_minutes','intensity'] end;
    for field in select jsonb_object_keys(a.metrics) loop
      if not field=any(allowed) then raise exception 'Unexpected activity metric'; end if;
      if a.metrics->field <> 'null'::jsonb and field not in ('environment','stroke') then
        if jsonb_typeof(a.metrics->field)<>'number' then raise exception 'Invalid numeric metric'; end if;
        metric_value:=(a.metrics->>field)::numeric;
        if metric_value<0 or metric_value::text in ('NaN','Infinity','-Infinity') or (field in ('laps','intensity') and trunc(metric_value)<>metric_value) or (field='intensity' and metric_value not between 1 and 10) then raise exception 'Invalid metric value'; end if;
      end if;
    end loop;
    if a.metrics->>'environment' is not null and a.metrics->>'environment' not in ('indoor','outdoor') then raise exception 'Invalid environment'; end if;
    if (a.metrics->>'elapsed_minutes')::numeric < (a.metrics->>'duration_minutes')::numeric then raise exception 'Elapsed time is shorter than activity time'; end if;
    if a.activity_type<>'strength' and jsonb_array_length(a.exercises)>0 then raise exception 'Unexpected strength details'; end if;
    for ex in select value from jsonb_array_elements(a.exercises) loop
      if length(btrim(coalesce(ex->>'name','')))=0 or jsonb_typeof(ex->'reps_by_set') is distinct from 'array' or jsonb_array_length(ex->'reps_by_set')=0 then raise exception 'Invalid strength exercise'; end if;
      if ex->>'weight_kg' is not null and ((ex->>'weight_kg')::numeric<0 or (ex->>'weight_kg')::numeric::text in ('NaN','Infinity','-Infinity')) then raise exception 'Invalid weight'; end if;
      for rep in select value from jsonb_array_elements(ex->'reps_by_set') loop
        if jsonb_typeof(rep)<>'number' or (rep#>>'{}')::numeric<1 or trunc((rep#>>'{}')::numeric)<>(rep#>>'{}')::numeric then raise exception 'Invalid repetitions'; end if;
      end loop;
    end loop;
  elsif k='daily' then
    d:=jsonb_populate_record(null::public.fitness_daily_entries,s);
    if d.entry_date is null or d.training_status is null or d.training_status not in ('trained','rest') or d.soreness_level is null or d.soreness_level not in ('none','mild','moderate','severe')
       or d.energy_score not between 1 and 5 or d.recovery_score not between 1 and 5
       or d.bodyweight_kg<=0 or d.sleep_hours<0 or d.sleep_hours>24
       or d.bodyweight_kg::text in ('NaN','Infinity','-Infinity') or d.sleep_hours::text in ('NaN','Infinity','-Infinity') then raise exception 'Invalid daily status'; end if;
  elsif k='workout' then
    w:=jsonb_populate_record(null::public.fitness_workouts,s);
    if w.completed is null or w.weight_kg<0 or w.weight_kg::text in ('NaN','Infinity','-Infinity') or w.reps_by_set is null or cardinality(w.reps_by_set)=0 or exists(select 1 from unnest(w.reps_by_set) n where n is null or n<1) then raise exception 'Invalid workout actuals'; end if;
  else raise exception 'Unknown record kind'; end if;
end $$;
revoke all on function dashboard_internal.validate_fitness_snapshot(text,jsonb) from public,anon,authenticated;

-- Private definer is necessary because browser roles have no table write grants.
-- Public wrapper remains invoker; this function checks auth+allowlist+ownership itself.
create function dashboard_internal.save_fitness_record_v2(p_request jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid:=(select auth.uid()); rid uuid; change jsonb; kind text; ident uuid; op text;
  expected integer; h public.fitness_record_heads; snap jsonb; stamp timestamptz:=clock_timestamp();
  stored public.fitness_save_receipts; results jsonb:='[]'; fields text[]; key text; receipt jsonb;
  a public.fitness_activities; previous_ids text[]:='{}'; identity text; bundle_result jsonb;
begin
  if uid is null or not public.is_dashboard_user() then raise exception using errcode='42501',message='Authorized Dashboard session required'; end if;
  if jsonb_typeof(p_request) is distinct from 'object' then raise exception 'Invalid request'; end if;
  rid:=(p_request->>'request_id')::uuid;
  if rid is null then raise exception 'Request id required'; end if;
  -- Same ordered locks as the Fitness publication contract. ALL evidence writers
  -- participate, including activity-only saves and corrections to old workouts.
  lock table public.fitness_daily_entries in share row exclusive mode;
  lock table public.fitness_workouts in share row exclusive mode;
  lock table public.fitness_exercise_targets in share row exclusive mode;
  lock table public.jessica_review_cycles in share row exclusive mode;
  lock table public.fitness_activities in share row exclusive mode;
  lock table public.fitness_record_heads in share row exclusive mode;
  lock table public.fitness_record_revisions in share row exclusive mode;
  stamp:=clock_timestamp();
  select * into stored from public.fitness_save_receipts where user_id=uid and request_id=rid;
  if found then
    if stored.request<>p_request then raise exception 'Request id reused with different content'; end if;
    return stored.receipt;
  end if;
  if p_request ? 'bundle' then
    if p_request ? 'changes' then raise exception 'Bundle and changes cannot be combined'; end if;
    if p_request->'bundle'->'daily'->>'training_status'='trained' and exists(
      select 1 from public.jessica_review_cycles c where c.user_id=uid and c.domain='fitness' and c.status='active' and c.evidence->'decision'->>'training_lock'='true'
    ) then raise exception 'Training is locked; record completed facts through other activity'; end if;
    perform dashboard_internal.validate_fitness_snapshot('daily',p_request->'bundle'->'daily');
    for change in select value from jsonb_array_elements(p_request->'bundle'->'workouts') loop
      perform dashboard_internal.validate_fitness_snapshot('workout',change);
    end loop;
    bundle_result:=public.save_fitness_entry_atomic(p_request->'bundle'->'daily',p_request->'bundle'->'workouts');
    receipt:=jsonb_build_object('request_id',rid,'committed_at',stamp,'bundle',bundle_result);
  else
    if jsonb_typeof(p_request->'changes') is distinct from 'array' or jsonb_array_length(p_request->'changes') not between 1 and 50 then raise exception 'Changes array required (1-50)'; end if;
    for change in select value from jsonb_array_elements(p_request->'changes') loop
      kind:=change->>'kind'; ident:=(change->>'id')::uuid; op:=change->>'operation'; expected:=(change->>'expected_version')::integer;
      if ident is null or expected is null or kind is null or op is null or kind not in ('daily','workout','activity') or op not in ('create','revise','withdraw','restore') then raise exception 'Invalid change'; end if;
      identity:=kind||':'||ident;
      if identity=any(previous_ids) then raise exception 'Duplicate change identity'; end if;
      previous_ids:=array_append(previous_ids,identity);
      if op='create' then
        if kind<>'activity' or expected<>0 then raise exception 'Create Plan/daily using a complete bundle'; end if;
        if exists(select 1 from public.fitness_activities where id=ident) then raise exception 'Record id already exists'; end if;
        snap:=change->'snapshot';
        if jsonb_typeof(snap) is distinct from 'object' or (snap ? 'user_id' and snap->>'user_id'<>uid::text) or (snap ? 'id' and snap->>'id'<>ident::text) then raise exception 'Snapshot identity mismatch'; end if;
        snap:=snap||jsonb_build_object('id',ident,'user_id',uid,'source','manual','created_at',stamp,'updated_at',stamp);
        perform dashboard_internal.validate_fitness_snapshot(kind,snap);
        a:=jsonb_populate_record(null::public.fitness_activities,snap);
        insert into public.fitness_activities select a.*;
        select * into h from public.fitness_record_heads where user_id=uid and record_kind=kind and record_id=ident;
      else
        if length(btrim(coalesce(change->>'reason','')))=0 then raise exception 'Correction reason required'; end if;
        select * into h from public.fitness_record_heads where user_id=uid and record_kind=kind and record_id=ident for update;
        if not found then raise exception using errcode='42501',message='Record unavailable for this owner'; end if;
        if h.revision<>expected then raise exception using errcode='40001',message='FITNESS_VERSION_CONFLICT: reload and confirm your draft'; end if;
        if (op='withdraw' and h.withdrawn) or (op='restore' and not h.withdrawn) or (op='revise' and h.withdrawn) then raise exception 'Invalid record state transition'; end if;
        snap:=h.snapshot;
        if op='revise' then
          if jsonb_typeof(change->'snapshot') is distinct from 'object' then raise exception 'Complete snapshot required'; end if;
          fields:=case kind
            when 'daily' then array['entry_date','bodyweight_kg','training_status','training_content','protein','carbs_food','sleep_hours','energy_score','recovery_score','soreness_level','soreness_areas','notes']
            when 'workout' then array['weight_kg','weight','reps_by_set','reps','sets','rpe','completed','next_target']
            else array['activity_date','activity_type','name','metrics','exercises','feeling','notes'] end;
          -- Preserve all unknown legacy fields, ownership and provenance.
          for key in select jsonb_object_keys(change->'snapshot') loop
            if key=any(fields) then snap:=jsonb_set(snap,array[key],change->'snapshot'->key);
            elsif h.snapshot ? key and change->'snapshot'->key is distinct from h.snapshot->key then raise exception 'Immutable field changed: %',key;
            elsif not h.snapshot ? key then raise exception 'Unexpected field: %',key; end if;
          end loop;
          perform dashboard_internal.validate_fitness_snapshot(kind,snap);
        end if;
        if kind='workout' and op<>'withdraw' then
          if not exists(select 1 from public.fitness_workouts w join public.fitness_daily_entries d on d.id=w.daily_entry_id join public.fitness_exercise_targets t on t.id=w.target_id join public.jessica_review_cycles c on c.id=t.review_cycle_id
            where w.id=ident and w.user_id=uid and d.user_id=uid and d.entry_date=w.workout_date and t.user_id=uid and c.user_id=uid and c.domain='fitness' and t.plan_type=w.plan_type and t.exercise_key=w.exercise_key and t.effective_from<=w.workout_date) then raise exception 'Historical workout provenance invalid'; end if;
        end if;
        snap:=snap||jsonb_build_object('updated_at',stamp);
        update public.fitness_record_heads set revision=h.revision+1,snapshot=snap,
          withdrawn=case op when 'withdraw' then true when 'restore' then false else h.withdrawn end,changed_at=stamp
          where user_id=uid and record_kind=kind and record_id=ident returning * into h;
        insert into public.fitness_record_revisions values(uid,kind,ident,h.revision,snap,h.withdrawn,change->>'reason',stamp,rid);
      end if;
      results:=results||jsonb_build_array(jsonb_build_object('kind',kind,'id',ident,'revision',h.revision,'withdrawn',h.withdrawn));
    end loop;
    -- A daily identity cannot silently migrate its linked workouts to another date.
    if exists(select 1 from public.fitness_record_heads d join public.fitness_record_heads w
      on w.user_id=d.user_id and w.record_kind='workout' and w.snapshot->>'daily_entry_id'=d.record_id::text
      where d.user_id=uid and d.record_kind='daily' and not d.withdrawn and not w.withdrawn
        and (('daily:'||d.record_id::text)=any(previous_ids) or ('workout:'||w.record_id::text)=any(previous_ids)) and (
        d.snapshot->>'entry_date'<>w.snapshot->>'workout_date' or (d.snapshot->>'training_status'='rest' and (w.snapshot->>'completed')::boolean)
      )) then raise exception 'Withdraw linked workouts before changing the daily date or Plan status'; end if;
    receipt:=jsonb_build_object('request_id',rid,'committed_at',stamp,'records',results);
  end if;
  insert into public.fitness_save_receipts values(uid,rid,p_request,receipt,stamp);
  return receipt;
end $$;
revoke all on function dashboard_internal.save_fitness_record_v2(jsonb) from public,anon;
grant execute on function dashboard_internal.save_fitness_record_v2(jsonb) to authenticated;
create function public.save_fitness_record_v2(p_request jsonb) returns jsonb
language sql security invoker set search_path = '' as $$ select dashboard_internal.save_fitness_record_v2(p_request); $$;
revoke all on function public.save_fitness_record_v2(jsonb) from public,anon;
grant execute on function public.save_fitness_record_v2(jsonb) to authenticated;
commit;
