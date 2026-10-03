-- Disposable database only. All synthetic fixtures are rolled back.
begin;
insert into auth.users(id,email,aud,role,created_at,updated_at) values
('91000000-0000-4000-8000-000000000001','fitness-v2-a@example.invalid','authenticated','authenticated',now(),now()),
('91000000-0000-4000-8000-000000000002','fitness-v2-b@example.invalid','authenticated','authenticated',now(),now());
insert into public.dashboard_allowed_users(user_id,email) values
('91000000-0000-4000-8000-000000000001','fitness-v2-a@example.invalid'),
('91000000-0000-4000-8000-000000000002','fitness-v2-b@example.invalid');
insert into public.jessica_review_cycles(id,user_id,domain,status,evidence,summary,next_focus,reviewed_at)
values('92000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','fitness','active','{}','fixture','fixture',now());
insert into public.fitness_exercise_targets(id,user_id,review_cycle_id,plan_type,exercise_key,exercise_name,weight_kg,reps_by_set,active,effective_from)
values('93000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','92000000-0000-4000-8000-000000000001','Plan A','a_row','Fixture row',6,'{10,10,10}',true,'2026-01-01');
insert into public.fitness_daily_entries(id,user_id,entry_date,training_status,protein,carbs_food,notes)
values('94000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','2026-10-03','trained','豆漿','飯糰','preserved'),
('94000000-0000-4000-8000-000000000002','91000000-0000-4000-8000-000000000002','2026-10-03','rest','蛋',null,null);
insert into public.fitness_workouts(id,user_id,daily_entry_id,workout_date,plan_type,exercise_key,exercise,target_id,weight_kg,reps_by_set,completed)
values('95000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','94000000-0000-4000-8000-000000000001','2026-10-03','Plan A','a_row','Fixture row','93000000-0000-4000-8000-000000000001',6,'{10,10,10}',true);
select set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
do $$
declare req jsonb; receipt jsonb; snap jsonb; k text; i integer:=0; failed boolean; n integer;
begin
  if (select count(*) from public.fitness_daily_effective)<>1 then raise exception 'Cross-owner read'; end if;
  foreach k in array array['walk_run','hiking','cycling','swimming','ball','strength','mobility','other'] loop
    i:=i+1;
    req:=jsonb_build_object('request_id',('96000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,'changes',jsonb_build_array(jsonb_build_object(
      'kind','activity','id',('97000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,'operation','create','expected_version',0,
      'snapshot',jsonb_build_object('activity_date','2026-10-03','activity_type',k,'name','Fixture activity','metrics',jsonb_build_object('duration_minutes',30.5,'intensity',null),'exercises','[]'::jsonb,'feeling','','notes',''))));
    receipt:=public.save_fitness_record_v2(req);
    if public.save_fitness_record_v2(req)<>receipt then raise exception 'Retry not idempotent'; end if;
    failed:=false;
    begin perform public.save_fitness_record_v2(req||jsonb_build_object('different',true)); exception when others then failed:=true; end;
    if not failed then raise exception 'Request identity reuse accepted'; end if;
  end loop;
  if (select count(*) from public.fitness_activities_effective)<>8 then raise exception 'Activity creation failed'; end if;
  failed:=false;
  begin perform public.save_fitness_record_v2(jsonb_build_object('request_id','96000000-0000-4000-8000-000000000010','changes',jsonb_build_array(jsonb_build_object('kind','activity','id','97000000-0000-4000-8000-000000000010','operation','create','expected_version',0,'snapshot',jsonb_build_object('activity_date','2026-10-03','activity_type','ball','name','invalid','metrics',jsonb_build_object('duration_minutes',-1),'exercises','[]'::jsonb,'feeling','','notes',''))))); exception when others then failed:=true; end;
  if not failed or (select count(*) from public.fitness_activities_effective)<>8 then raise exception 'Invalid duration accepted'; end if;
  snap:=(select snapshot from public.fitness_record_heads where record_kind='activity' and record_id='97000000-0000-4000-8000-000000000001');
  req:=jsonb_build_object('request_id','96000000-0000-4000-8000-000000000020','changes',jsonb_build_array(jsonb_build_object('kind','activity','id','97000000-0000-4000-8000-000000000001','operation','revise','expected_version',1,'snapshot',snap||jsonb_build_object('metrics',jsonb_build_object('duration_minutes',15)),'reason','Time correction')));
  perform public.save_fitness_record_v2(req);
  if (select (metrics->>'duration_minutes')::numeric from public.fitness_activities_effective where id='97000000-0000-4000-8000-000000000001')<>15 then raise exception 'Effective revision failed'; end if;
  if (select (metrics->>'duration_minutes')::numeric from public.fitness_activities where id='97000000-0000-4000-8000-000000000001')<>30.5 then raise exception 'Original overwritten'; end if;
  failed:=false;
  begin perform public.save_fitness_record_v2(jsonb_set(req,'{request_id}','"96000000-0000-4000-8000-000000000021"')); exception when serialization_failure then failed:=true; end;
  if not failed then raise exception 'Stale correction accepted'; end if;
  for i in 1..2 loop
    perform public.save_fitness_record_v2(jsonb_build_object('request_id',('96000000-0000-4000-8000-'||lpad((30+i)::text,12,'0'))::uuid,'changes',jsonb_build_array(jsonb_build_object('kind','activity','id','97000000-0000-4000-8000-000000000001','operation',case i when 1 then 'withdraw' else 'restore' end,'expected_version',i+1,'reason','State correction'))));
  end loop;
  if (select revision<>4 or withdrawn from public.fitness_record_heads where record_kind='activity' and record_id='97000000-0000-4000-8000-000000000001') then raise exception 'Withdrawal/restoration failed'; end if;
  -- Atomic correction of daily nutrition and workout actuals preserves provenance and fields.
  req:=jsonb_build_object('request_id','96000000-0000-4000-8000-000000000040','changes',jsonb_build_array(
    jsonb_build_object('kind','daily','id','94000000-0000-4000-8000-000000000001','operation','revise','expected_version',1,'snapshot',jsonb_build_object('protein','優格'),'reason','Nutrition correction'),
    jsonb_build_object('kind','workout','id','95000000-0000-4000-8000-000000000001','operation','revise','expected_version',1,'snapshot',jsonb_build_object('weight_kg',7,'reps_by_set',jsonb_build_array(11,10,10)),'reason','Actuals correction')));
  perform public.save_fitness_record_v2(req);
  if (select protein<>'優格' or carbs_food<>'飯糰' or notes<>'preserved' from public.fitness_daily_effective where id='94000000-0000-4000-8000-000000000001') then raise exception 'Daily preservation failed'; end if;
  if (select weight_kg<>7 or target_id<>'93000000-0000-4000-8000-000000000001'::uuid from public.fitness_workouts_effective where id='95000000-0000-4000-8000-000000000001') then raise exception 'Workout correction failed'; end if;
  if (select weight_kg<>6 from public.fitness_workouts where id='95000000-0000-4000-8000-000000000001') then raise exception 'Historical workout overwritten'; end if;
  -- A late stale member rolls back the entire request and its receipt.
  failed:=false;
  begin perform public.save_fitness_record_v2(jsonb_build_object('request_id','96000000-0000-4000-8000-000000000041','changes',jsonb_build_array(
    jsonb_build_object('kind','daily','id','94000000-0000-4000-8000-000000000001','operation','revise','expected_version',2,'snapshot',jsonb_build_object('notes','must roll back'),'reason','fixture'),
    jsonb_build_object('kind','workout','id','95000000-0000-4000-8000-000000000001','operation','revise','expected_version',1,'snapshot',jsonb_build_object('weight_kg',99),'reason','fixture')))); exception when serialization_failure then failed:=true; end;
  if not failed or (select revision<>2 or snapshot->>'notes'<>'preserved' from public.fitness_record_heads where record_kind='daily' and record_id='94000000-0000-4000-8000-000000000001') then raise exception 'Atomic rollback failed'; end if;
  if exists(select 1 from public.fitness_save_receipts where request_id='96000000-0000-4000-8000-000000000041') then raise exception 'Rolled-back receipt leaked'; end if;
  -- Cross-owner correction, direct inserts, history updates, provenance rebinding all fail.
  failed:=false;
  begin perform public.save_fitness_record_v2(jsonb_build_object('request_id','96000000-0000-4000-8000-000000000042','changes',jsonb_build_array(jsonb_build_object('kind','daily','id','94000000-0000-4000-8000-000000000002','operation','withdraw','expected_version',1,'reason','fixture')))); exception when insufficient_privilege then failed:=true; end;
  if not failed then raise exception 'Cross-owner correction accepted'; end if;
  failed:=false;
  begin update public.fitness_record_revisions set reason='tamper'; exception when insufficient_privilege then failed:=true; end;
  if not failed then raise exception 'Direct history write accepted'; end if;
  failed:=false;
  begin insert into public.fitness_save_receipts values('91000000-0000-4000-8000-000000000001','96000000-0000-4000-8000-000000000099','{}','{}',now()); exception when insufficient_privilege then failed:=true; end;
  if not failed then raise exception 'Direct receipt write accepted'; end if;
  failed:=false;
  begin perform public.save_fitness_record_v2(jsonb_build_object('request_id','96000000-0000-4000-8000-000000000043','changes',jsonb_build_array(jsonb_build_object('kind','workout','id','95000000-0000-4000-8000-000000000001','operation','revise','expected_version',2,'snapshot',jsonb_build_object('target_id','93000000-0000-4000-8000-000000000099'),'reason','fixture')))); exception when others then failed:=true; end;
  if not failed then raise exception 'Target rebinding accepted'; end if;
  -- Withdrawal of a daily hides its workouts without deleting original links.
  perform public.save_fitness_record_v2(jsonb_build_object('request_id','96000000-0000-4000-8000-000000000044','changes',jsonb_build_array(jsonb_build_object('kind','daily','id','94000000-0000-4000-8000-000000000001','operation','withdraw','expected_version',2,'reason','duplicate'))));
  if exists(select 1 from public.fitness_workouts_effective where not withdrawn) then raise exception 'Daily withdrawal left workouts effective'; end if;
  if (select count(*) from public.fitness_workouts)<>1 then raise exception 'Withdrawal erased history'; end if;
  req:=jsonb_build_object('request_id','96000000-0000-4000-8000-000000000050','bundle',jsonb_build_object(
    'daily',jsonb_build_object('id','94000000-0000-4000-8000-000000000003','entry_date','2026-10-03','training_status','trained','soreness_level','none','soreness_areas','[]'::jsonb),
    'workouts',jsonb_build_array(jsonb_build_object('id','95000000-0000-4000-8000-000000000003','daily_entry_id','94000000-0000-4000-8000-000000000003','workout_date','2026-10-03','plan_type','Plan A','exercise_key','a_row','exercise','Fixture row','target_id','93000000-0000-4000-8000-000000000001','weight_kg',6,'reps_by_set',jsonb_build_array(10,10,10),'completed',true))));
  receipt:=public.save_fitness_record_v2(req);
  if public.save_fitness_record_v2(req)<>receipt then raise exception 'Bundle receipt retry failed'; end if;
  if (select count(*) from public.fitness_workouts)<>2 then raise exception 'Bundle duplicated'; end if;
  if not exists(select 1 from public.fitness_record_revisions where record_kind='workout' and record_id='95000000-0000-4000-8000-000000000003' and revision=1) then raise exception 'Bundle original version absent'; end if;
end $$;
reset role;
insert into public.fitness_review_acknowledgements(user_id,record_kind,record_id,revision,review_reference,result)
values('91000000-0000-4000-8000-000000000001','activity','97000000-0000-4000-8000-000000000001',4,'fixture worksheet','no_review_needed');
set local role authenticated;
do $$ declare denied boolean:=false; begin
  if (select count(*) from public.fitness_review_acknowledgements)<>1 then raise exception 'Acknowledgement read failed'; end if;
  begin insert into public.fitness_review_acknowledgements(user_id,record_kind,record_id,revision,review_reference,result) values('91000000-0000-4000-8000-000000000001','activity','97000000-0000-4000-8000-000000000001',3,'forged','no_review_needed'); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Browser can self-acknowledge'; end if;
end $$;
reset role;
set local role anon;
do $$ declare denied boolean:=false; begin
  begin perform public.save_fitness_record_v2('{}'); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Anonymous execution allowed'; end if;
  denied:=false;
  begin perform * from public.fitness_record_heads; exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Anonymous private read allowed'; end if;
end $$;
reset role;
select 'PASS activities, bundle/exact replay, request collision, revisions, withdrawal/restore, stale conflicts, atomic rollback, RLS, immutable provenance, dependent withdrawal and source-only acknowledgements' as result;
rollback;
