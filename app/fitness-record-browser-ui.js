(function (root) {
  const B=root.FitnessRecordBrowser, R=root.FitnessRecords;
  const $=(id)=>document.getElementById(id), A=()=>root.DashboardFitnessAdapter;
  const escape=(s)=>String(s??"").replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cache=B.createCache();
  let owner=null, selected=null, month=null, showWithdrawn=false, loading=false, serial=0, message="";
  function records() { return B.merge(cache.records(),R.records(A().getFitness())); }
  function groupRecords(group, date=selected) {
    const all=records();
    const day=all.filter((r)=>B.date(r.row)===date && (showWithdrawn || !B.withdrawn(r,all)));
    if (group==='activity') return day.filter((r)=>r.kind==='activity');
    return day.filter((r)=>r.kind!=='activity');
  }
  function groupCard(group,title,rows) {
    const available=groupRecords(group).length>0;
    return `<article class="record-group"><div class="record-group-heading"><h3>${title}</h3><button type="button" class="secondary-action" data-record-action="group" data-kind="group" data-id="${group}" ${available?'':'disabled'}>管理 ${title}</button></div>${rows.length ? rows.map(({kind,row})=>`<div class="record-summary ${B.withdrawn({kind,row},records())?'record-withdrawn':''}"><p>${escape(root.FitnessRecordsUI.summary(row,kind))}</p><small class="muted">第 ${escape(row.revision || 1)} 版${B.withdrawn({kind,row},records())?' · 已撤回':''}</small></div>`).join('') : '<p class="muted">這天沒有這類紀錄</p>'}</article>`;
  }
  async function loadMonth() {
    const state=A().getState(), token=++serial, requestedMonth=month, requestedOwner=owner;
    message="";loading=false;
    if (state.session?.demo || A().getFitness().recordsV2Ready || cache.get(month)?.complete) { render();return; }
    if (!A().cloud()) { message="需連線取得這個月份的完整紀錄";render();return; }
    loading=true;render();
    try {
      const accepted=await cache.read(requestedMonth,requestedOwner,async (m)=>{
        const [start,end]=B.monthRange(m);
        const read=(table,field)=>A().selectAll(table,`select=*&${field}=gte.${start}&${field}=lt.${end}&order=${field}.desc,id.asc`);
        const [daily,workout]=await Promise.all([read("fitness_daily_entries","entry_date"),read("fitness_workouts","workout_date")]);
        return [...daily.map((row)=>({kind:"daily",row:A().normalizeEntry(row)})),...workout.map((row)=>({kind:"workout",row:A().normalizeWorkout(row)}))];
      },()=>token===serial && requestedMonth===month && requestedOwner === A().getState().session?.user?.id);
      if (!accepted || token !== serial) return;
    } catch (error) { if (token===serial && requestedOwner===owner) message=`無法取得完整紀錄：${error.message}`; }
    finally { if (token===serial) {loading=false;render();} }
  }
  function selectDate(date) {
    const same=selected===date;selected=date;month=date.slice(0,7);
    const detail=$("fitnessRecordList").querySelector("details");if(detail && !same) detail.open=false;
    $("fitnessCalendar").open=false;
    render();loadMonth();
  }
  function changed(date) {
    cache.reset(owner);serial++;loading=false;
    if (date) selectDate(date);else render();
  }
  function bind() {
    $("fitnessCalendar").addEventListener("toggle",()=>{if ($("fitnessCalendar").open) loadMonth();});
    $("fitnessMonth").addEventListener("change",(e)=>{if (/^\d{4}-(0[1-9]|1[0-2])$/.test(e.target.value)) {month=e.target.value;loadMonth();}});
    for (const [id,delta] of [["fitnessPreviousMonth",-1],["fitnessNextMonth",1]]) $(id).addEventListener("click",()=>{
      const d=new Date(month+"-01T12:00:00");d.setMonth(d.getMonth()+delta);
      month=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;loadMonth();
    });
    $("fitnessCalendarDays").addEventListener("click",(event)=>{const button=event.target.closest("[data-date]");if(button) selectDate(button.dataset.date);});
    $("fitnessRecordedDates").addEventListener("click",(event)=>{const button=event.target.closest("[data-date]");if(button) selectDate(button.dataset.date);});
    $("fitnessBackLatest").addEventListener("click",()=>selectDate(B.latest(records()) || A().today()));
    $("fitnessShowWithdrawn").addEventListener("change",(e)=>{showWithdrawn=e.target.checked;render();});
  }
  function render() {
    const nextOwner=A().getState().session?.user?.id || null;
    if (nextOwner!==owner) {owner=nextOwner;cache.reset(owner);serial++;loading=false;message="";selected=null;month=null;showWithdrawn=false;$("fitnessShowWithdrawn").checked=false;}
    const all=records(), newest=B.latest(all);
    const initial=!selected;
    selected ||= newest || A().today();month ||= selected.slice(0,7);
    $("fitnessMonth").value=month;
    const dates=new Set(all.map((r)=>B.date(r.row)));
    $("fitnessCalendarDays").innerHTML=B.cells(month).map((d)=>d ? `<button type="button" data-date="${d}" aria-label="${d}${dates.has(d)?' 有紀錄':''}" aria-pressed="${d===selected}" class="calendar-day ${dates.has(d)?'has-record':''}">${Number(d.slice(-2))}${dates.has(d)?'<span aria-hidden="true">●</span>':''}</button>`:'<span></span>').join("");
    const complete=Boolean(A().getState().session?.demo || A().getFitness().recordsV2Ready || cache.get(month)?.complete);
    const monthDates=[...dates].filter((d)=>d.startsWith(month+'-')).sort().reverse();
    $("fitnessMonthStatus").textContent=loading ? "正在讀取紀錄…" : message || (complete ? monthDates.length ? "直接選擇有紀錄的日期，或使用下方月曆" : "這個月沒有紀錄" : "需連線取得完整月份");
    $("fitnessRecordedDates").innerHTML=monthDates.map((d)=>`<button type="button" class="secondary-action" data-date="${d}" aria-pressed="${d===selected}">${Number(d.slice(5,7))}/${Number(d.slice(-2))}</button>`).join('');
    $("fitnessSelectedDate").textContent=selected;
    $("fitnessBackLatest").disabled=selected===newest;
    const day=all.filter((r)=>B.date(r.row)===selected);
    const visible=day.filter((r)=>showWithdrawn || !B.withdrawn(r,all));
    const pending=A().getState().pending || [];
    const warnings=day.flatMap(({kind,row})=>{
      const item=pending.find((p)=>p.owner_user_id===owner && p.payload?.changes?.some((c)=>c.kind===kind && c.id===row.id));
      return item?.conflict ? ["版本衝突待處理"] : row._pending || item ? ["待同步／待確認"] : [];
    });
    if (!A().getState().session?.demo && !A().getFitness().recordsV2Ready && !cache.get(selected.slice(0,7))?.complete) warnings.push("目前顯示部分已取得資料；需連線取得完整日期紀錄");
    $("fitnessDateWarnings").textContent=[...new Set(warnings)].join(" · ");
    const selectedComplete=Boolean(A().getState().session?.demo || A().getFitness().recordsV2Ready || cache.get(selected.slice(0,7))?.complete);
    $("fitnessDateSummary").textContent=visible.length ? `每日狀態 ${visible.filter((r)=>r.kind==='daily').length} 筆 · Plan 動作 ${visible.filter((r)=>r.kind==='workout').length} 筆 · 其他活動 ${visible.filter((r)=>r.kind==='activity').length} 筆` : day.length ? "這天僅有撤回內容，開啟「查看撤回內容」可查閱及恢復。" : selectedComplete ? "這天沒有紀錄" : "需連線取得這天的完整紀錄";
    const container=$("fitnessRecordList"), wasOpen=container.querySelector("details")?.open || false;
    const ready=Boolean(A().getState().session?.demo || A().getFitness().recordsV2Ready), readOnly=A().getState().config?.fitnessRecordsV2ReadOnly;
    $("fitnessManagementStatus").textContent=!ready ? "唯讀查閱：管理功能待資料庫升級；可查看原始版本。" : readOnly ? "目前為唯讀模式" : "要微調紀錄，選擇下方對應的管理入口";
    container.innerHTML=visible.length ? `<details ${wasOpen?'open':''}><summary>查看當日詳細內容</summary><div class="date-record-grid">${groupCard('quick','Quick Log',visible.filter((r)=>r.kind!=='activity'))}${groupCard('activity','其他運動／活動',visible.filter((r)=>r.kind==='activity'))}</div></details>` : "";
    if (initial && !A().getState().session?.demo && !A().getFitness().recordsV2Ready) loadMonth();
  }
  function refresh() {cache.reset(owner);serial++;loading=false;render();loadMonth();}
  root.FitnessRecordBrowserUI={bind,render,records,groupRecords,selectDate,changed,refresh};
})(globalThis);
