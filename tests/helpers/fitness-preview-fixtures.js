// Synthetic local-only fault controls. Served only by preview-fitness --qa.
// This file is outside app/ and is never shipped in the app shell.
(function () {
  const A=DashboardFitnessAdapter;
  const original={cloud:A.cloud,send:A.send,select:A.select,selectAll:A.selectAll,refresh:A.refresh,refreshToken:A.refreshToken};
  const panel=document.createElement('aside');
  panel.style.cssText='padding:12px;background:#fff0d9;position:relative;z-index:50';
  panel.innerHTML='<strong>本地 QA 模擬；不連接正式資料庫</strong><div id="qaControls"></div><p id="qaMode">Demo</p>';
  document.body.prepend(panel);
  const modes=['Demo','唯讀','舊版離線','V2離線','保存失敗','版本衝突'];
  for(const mode of modes) {
    const button=document.createElement('button');button.textContent=mode;button.type='button';
    button.addEventListener('click',()=>{
      const state=A.getState();
      if (!state.session || state.session.user.id!=='demo-preview') return;
      Object.assign(A,original);state.config.fitnessRecordsV2ReadOnly=mode==='唯讀';
      state.session.demo=!['舊版離線','V2離線','保存失敗','版本衝突'].includes(mode);
      state.data.fitness.recordsV2Ready=mode!=='舊版離線';
      if(['舊版離線','V2離線'].includes(mode)) A.cloud=()=>false;
      if(['保存失敗','版本衝突'].includes(mode)) {
        A.cloud=()=>true;A.refreshToken=async()=>{};A.refresh=async()=>A.render();
        A.send=async()=>{throw Object.assign(new Error(mode==='版本衝突'?'FITNESS_VERSION_CONFLICT: synthetic revision changed':'Synthetic save rejected'),{status:mode==='版本衝突'?409:400});};
        A.select=async(table)=>table==='fitness_record_heads' ? FitnessRecords.records(A.getFitness()).map(({kind,row})=>({record_kind:kind,record_id:row.id,revision:row.revision||1,withdrawn:row.withdrawn||false,snapshot:A.clone(row)})) : [];
        const select=A.select;
        A.select=async(table,query)=>{const rows=await select(table);const kind=query.match(/record_kind=eq\.([^&]+)/)?.[1],id=decodeURIComponent(query.match(/record_id=eq\.([^&]+)/)?.[1]||'');return rows.filter((r)=>r.record_kind===kind && r.record_id===id);};
        A.selectAll=async()=>[];
      }
      FitnessRecordBrowserUI.changed();A.render();document.getElementById('qaMode').textContent=mode;
    });
    document.getElementById('qaControls').appendChild(button);
  }
})();
