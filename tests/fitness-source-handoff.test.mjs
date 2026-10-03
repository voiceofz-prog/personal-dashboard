import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { loadDashboardHarness } from './helpers/dashboard-harness.mjs';
const R = createRequire(import.meta.url)('../app/fitness-records.js');

// Dashboard executes only transport/capability checks here. Fitness owns the
// separate source shadow cases and all recovery, schedule and progression rules.
const surfaces = ['fitness_record_heads','fitness_activities','fitness_review_acknowledgements','fitness_record_revisions','fitness_daily_effective','fitness_workouts_effective','fitness_activities_effective'];
const { api, context, navigator, setFetch } = loadDashboardHarness();
context.FitnessRecords = R;
const fixture = JSON.parse(readFileSync(new URL('./fixtures/fitness-source-handoff.json',import.meta.url),'utf8'));
assert.equal(fixture.synthetic,true);
assert.equal(fixture.schema,'fitness-source-handoff/v1');
assert.equal(fixture.consumer_cases.length,20);
for (const test of fixture.consumer_cases) {
  const fitness = structuredClone(test.fitness), before = JSON.stringify(fitness);
  assert.equal(R.needsReview(fitness),test.expected_needs_review,`Fitness-produced case: ${test.id}`);
  assert.equal(JSON.stringify(fitness),before,'consumer cannot mutate source evidence');
  const recordHeads = R.records(fitness).map(({kind,row})=>({record_kind:kind,record_id:row.id,user_id:row.user_id,revision:row.revision,withdrawn:Boolean(row.withdrawn),changed_at:row.revision_changed_at || row.updated_at,snapshot:row}));
  const built = api.buildFitnessData({dailyEntries:[],workouts:[],activities:[],planTargets:[],weeklyReviews:[],exerciseTargets:[],reviewCycles:fitness.jessicaReview ? [fitness.jessicaReview] : [],recordHeads,reviewAcknowledgements:fitness._reviewAcknowledgements,recordsV2Ready:true});
  assert.equal(R.needsReview(built),test.expected_needs_review,`REST head projection preserves source acceptance: ${test.id}`);
  if (fitness._activities.length && !fitness._workouts.length) assert.equal(R.stats(built,'2026-09-01','2026-10-31').planDays,0,'activity cannot become Plan execution evidence');
}
api.state.session = { user: { id: 'owner' }, access_token: 'synthetic-token' };
api.state.config = { supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'synthetic-anon-key' };
api.state.supabaseReady = true;
navigator.onLine = true;
let mode = 'ready', requests = [];
setFetch(async (url) => {
  const parsed = new URL(url), table = parsed.pathname.split('/').at(-1);
  requests.push(parsed);
  assert.equal(parsed.searchParams.get('user_id'),'eq.owner');
  const v2 = surfaces.includes(table);
  if (v2 && (mode === 'legacy' || mode === 'partial' && table === 'fitness_daily_effective')) {
    return { ok: false, status: 404, text: async () => JSON.stringify({code:'PGRST205',message:'Could not find table in schema cache'}) };
  }
  if (v2 && mode === 'denied' && table === 'fitness_record_revisions') {
    return { ok: false, status: 403, text: async () => JSON.stringify({code:'42501',message:'permission denied'}) };
  }
  if (v2 && mode === 'transport' && table === 'fitness_activities_effective') throw new Error('synthetic transport failure');
  const offset = Number(parsed.searchParams.get('offset') || 0);
  const data = mode === 'pagination' && table === 'fitness_record_heads'
    ? Array.from({length:offset === 0 ? 500 : 1},(_, i) => ({record_id:`head-${offset+i}`})) : [];
  return { ok:true, status:200, headers:{get:()=>null}, json:async()=>data };
});
let rows = await api.fetchFitnessRows();
assert.equal(rows.recordsV2Ready,true);
assert.deepEqual([...new Set(requests.map((r)=>r.pathname.split('/').at(-1)).filter((name)=>surfaces.includes(name)))].sort(),surfaces.toSorted());
mode='legacy'; rows=await api.fetchFitnessRows();
assert.equal(rows.recordsV2Ready,false,'only a completely absent V2 surface permits legacy reads');
mode='partial'; await assert.rejects(api.fetchFitnessRows(),/FITNESS_V2_INCOMPLETE/);
mode='denied'; await assert.rejects(api.fetchFitnessRows(),/permission denied/);
mode='transport'; await assert.rejects(api.fetchFitnessRows(),/synthetic transport failure/);
mode='pagination'; rows=await api.fetchFitnessRows();
assert.equal(rows.recordHeads.length,501,'the source handoff does not silently truncate record versions at one REST page');
assert.equal(rows.recordHeads[500].record_id,'head-500');
console.log('PASS Dashboard side of source handoff: 20 Fitness-produced consumer cases, REST head projection, seven owned V2 read surfaces, complete legacy/partial capability, permission/transport failures and pagination');
