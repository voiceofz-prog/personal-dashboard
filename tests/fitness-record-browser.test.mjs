import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const nodes=new Map();
const node=(id)=>{
  if (!nodes.has(id)) nodes.set(id,{hidden:false,value:'',checked:false,innerHTML:'',textContent:'',open:false,elements:[],dataset:{},handlers:{},isConnected:true,
    addEventListener(type,fn){this.handlers[type]=fn;},querySelector(){return null;},querySelectorAll(){return [];},focus(){focus=id;},showModal(){this.open=true;},close(){this.open=false;}});
  return nodes.get(id);
};
let focus=null, scrolled=null;
const fit={_entries:[{id:'d',entry_date:'2026-10-02',training_status:'rest'}],_workouts:[],_activities:[],_versions:[],recordsV2Ready:true};
const state={session:{user:{id:'a'},demo:true},pending:[],config:{}};
let online=false, reads=[];
const context=vm.createContext({console,Date,Map,Set,Array,window:{scrollY:200,scrollTo:(x,y)=>scrolled=y},document:{getElementById:node},DashboardFitnessAdapter:{
  getState:()=>state,getFitness:()=>fit,today:()=> '2026-10-03',cloud:()=>online,
  normalizeEntry:(row)=>row,normalizeWorkout:(row)=>({...row,weight_kg:5,reps_by_set:[10,9]}),
  selectAll:async(table,query)=>{reads.push([table,query]);return table==='fitness_workouts'?[{id:'old',workout_date:'2026-10-02',weight:'5kg',reps:'10/9'}]:[];}
},FitnessRecordsUI:{summary:(row)=>JSON.stringify(row),clearEditor(){}}});
for(const file of ['fitness-records.js','fitness-record-browser.js','fitness-record-browser-ui.js','fitness-record-dialog.js']) vm.runInContext(readFileSync(new URL('../app/'+file,import.meta.url),'utf8'),context);
const B=context.FitnessRecordBrowser, UI=context.FitnessRecordBrowserUI, D=context.FitnessRecordDialog;
assert.equal(B.cells('2026-02').filter(Boolean).length,28);
assert.equal(B.cells('2024-02').filter(Boolean).length,29);
assert.deepEqual(Array.from(B.monthRange('2026-12')),['2026-12-01','2027-01-01']);
assert.throws(()=>B.monthRange('2026-13'));
fit._workouts=Array.from({length:5},(_,i)=>({id:'w'+i,daily_entry_id:'d',workout_date:'2026-10-02',exercise:'action'+i}));
fit._activities=[{id:'activity',activity_date:'2026-10-02',name:'<img onerror=alert(1)>',activity_type:'hiking'}];
UI.bind();UI.render();
assert.match(node('fitnessDateSummary').textContent,/Plan 動作 5 筆.*其他活動 1 筆/);
assert.match(node('fitnessRecordList').innerHTML,/&lt;img/);
assert.equal((node('fitnessRecordList').innerHTML.match(/data-record-action="group"/g)||[]).length,2);
assert.equal(UI.groupRecords('quick').length,6,'whole-day entry plus individual action history remains accessible');
assert.equal(UI.groupRecords('activity').length,1);
assert.match(node('fitnessRecordedDates').innerHTML,/2026-10-02/);
assert.equal(B.latest([{kind:'daily',row:{id:'x',entry_date:'2026-10-03',withdrawn:true}},{kind:'daily',row:fit._entries[0]}]),'2026-10-02');
fit._entries[0].withdrawn=true;fit._activities[0].withdrawn=true;UI.render();
assert.match(node('fitnessDateSummary').textContent,/僅有撤回/);
node('fitnessShowWithdrawn').handlers.change({target:{checked:true}});assert.match(node('fitnessRecordList').innerHTML,/action4/);
assert.equal(UI.groupRecords('quick').length,6,'withdrawn linked actions remain available for restore');
state.pending=[{owner_user_id:'a',payload:{changes:[{kind:'activity',id:'activity'}]},conflict:true}];UI.render();assert.match(node('fitnessDateWarnings').textContent,/版本衝突/);
UI.selectDate('2026-09-01');UI.render();assert.equal(node('fitnessSelectedDate').textContent,'2026-09-01');
node('fitnessBackLatest').handlers.click();assert.equal(node('fitnessSelectedDate').textContent,'2026-10-02');
fit._entries=[];fit._workouts=[];fit._activities=[];state.session.user.id='b';UI.render();assert.match(node('fitnessDateSummary').textContent,/沒有紀錄/);
fit.recordsV2Ready=false;state.session.demo=false;UI.selectDate('2026-08-01');assert.match(node('fitnessDateWarnings').textContent,/需連線/);assert.match(node('fitnessDateSummary').textContent,/需連線/);
// Legacy first render reads the whole month, normalized for display only.
state.session.user.id='c';fit._entries=[{id:'d',entry_date:'2026-10-02'}];online=true;UI.render();
await new Promise(resolve=>setImmediate(resolve));
assert.equal(reads.length,2);assert.match(reads[0][1],/gte.2026-10-01.*lt.2026-11-01/);
assert.match(node('fitnessRecordList').innerHTML,/reps_by_set.*10,9/);
assert.equal(fit._workouts.length,0,'month browsing cannot become recommendation input');
// Cache rejects owner switches, refresh epochs, and out-of-order results.
const cache=B.createCache();cache.reset('a');let finish;
const first=cache.read('2026-10','a',()=>new Promise(resolve=>finish=resolve),()=>true);cache.reset('b');finish([{kind:'daily',row:{id:'a'}}]);assert.equal(await first,false);assert.equal(cache.records().length,0);
cache.reset('a');let serial=1, slow;
const old=cache.read('2026-10','a',()=>new Promise(resolve=>slow=resolve),()=>serial===1);serial=2;
await cache.read('2026-10','a',async()=>[{kind:'daily',row:{id:'new'}}],()=>serial===2);slow([{kind:'daily',row:{id:'old'}}]);assert.equal(await old,false);assert.equal(cache.records()[0].row.id,'new');
// Dirty close, cancel, discard, focus and scroll restoration are real handlers.
D.bind();const trigger={dataset:{kind:'daily',id:'d'},isConnected:true,focus:()=>focus='trigger'};
D.open(trigger);node('fitnessRevisionEditor').hidden=false;node('fitnessRevisionForm').elements=[{name:'notes',value:'original'}];D.markClean();node('fitnessRevisionForm').elements[0].value='draft';
assert.equal(D.close(),false);assert.equal(node('fitnessDiscardPrompt').hidden,false);
node('keepFitnessDraft').handlers.click();assert.equal(node('fitnessManagementDialog').open,true);assert.equal(node('fitnessRevisionForm').elements[0].value,'draft');
node('discardFitnessDraft').handlers.click();assert.equal(node('fitnessManagementDialog').open,false);assert.equal(focus,'trigger');assert.equal(scrolled,200);
D.open({...trigger,isConnected:false});node('fitnessRevisionEditor').hidden=true;D.close();assert.equal(focus,'fitnessShowWithdrawn');
// Exercise the actual management event handler and legacy version fallback.
context.DashboardFitnessAdapter.clone=(value)=>JSON.parse(JSON.stringify(value));
context.DashboardFitnessAdapter.toast=()=>{};
node('fitnessActivityForm').elements={activity_date:{value:''}};
vm.runInContext(readFileSync(new URL('../app/fitness-records-ui.js',import.meta.url),'utf8'),context);
context.FitnessRecordsUI.bind();
fit._activities=[{id:'conflict',activity_date:'2026-10-02',activity_type:'hiking',name:'test',withdrawn:true}];
state.session.demo=true;fit.recordsV2Ready=true;state.pending=[{owner_user_id:'c',conflict:true,payload:{changes:[{kind:'activity',id:'conflict',operation:'revise'}]}}];
node('fitnessRecordList').handlers.click({target:{closest:()=>({dataset:{kind:'activity',id:'conflict'},focus(){}})}});
assert.match(node('fitnessManagementMenu').innerHTML,/先恢復紀錄/);
assert.match(node('fitnessManagementMenu').innerHTML,/data-record-action="restore"/);
node('fitnessShowWithdrawn').handlers.change({target:{checked:true}});
node('fitnessRecordList').handlers.click({target:{closest:()=>({dataset:{kind:'group',id:'activity'},focus(){}})}});
assert.match(node('fitnessManagementTitle').textContent,/其他運動/);
assert.match(node('fitnessManagementMenu').innerHTML,/先恢復紀錄/);
state.session.demo=false;fit.recordsV2Ready=false;
context.DashboardFitnessAdapter.select=()=>{throw new Error('legacy cannot query V2 tables');};
await context.FitnessRecordsUI.openEditor('daily','d','history');
assert.match(node('fitnessVersionList').innerHTML,/原始紀錄/);
// An old failed management read cannot expose a menu over a newer editor.
fit.recordsV2Ready=true;online=true;
let rejectHead;
context.DashboardFitnessAdapter.select=()=>new Promise((resolve,reject)=>{rejectHead=reject;});
const staleClick=node('fitnessManagementMenu').handlers.click({target:{closest:()=>({dataset:{kind:'daily',id:'d',recordAction:'revise'}})}});
D.begin();node('fitnessManagementMenu').hidden=true;node('fitnessManagementGroup').hidden=true;
rejectHead(new Error('old request failed'));await staleClick;
assert.equal(node('fitnessManagementMenu').hidden,true);
assert.equal(node('fitnessManagementGroup').hidden,true);
console.log('PASS Fitness date aggregation, calendar, withdrawn dates, legacy month normalization, owner/epoch races, offline and dialog state');
