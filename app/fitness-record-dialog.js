(function(root) {
  const $=(id)=>document.getElementById(id);
  let trigger=null, identity=null, scroll=0, baseline="", generation=0;
  function fingerprint() {
    return Array.from($("fitnessRevisionForm").elements).filter((e)=>e.name).map((e)=>[e.name,e.value,e.checked]);
  }
  function markClean() {baseline=JSON.stringify(fingerprint());}
  function close(force=false) {
    if (!force && !$("fitnessRevisionEditor").hidden && baseline!==JSON.stringify(fingerprint())) {
      $("fitnessDiscardPrompt").hidden=false;$("keepFitnessDraft").focus?.();return false;
    }
    generation++;
    $("fitnessManagementDialog").close?.();
    $("fitnessRevisionEditor").hidden=true;$("fitnessVersionPanel").hidden=true;
    root.FitnessRecordsUI?.clearEditor();
    $("fitnessDiscardPrompt").hidden=true;
    if (!force) {
      const replacement=Array.from($("fitnessRecordList").querySelectorAll("[data-record-action]")).find((button)=>button.dataset.kind===identity?.kind && button.dataset.id===identity?.id);
      window.scrollTo?.(0,scroll);(trigger?.isConnected ? trigger : replacement || $("fitnessShowWithdrawn"))?.focus?.({preventScroll:true});
    }
    trigger=null;return true;
  }
  function open(button) {
    trigger=button;identity={...button.dataset};scroll=window.scrollY;generation++;
    $("fitnessDiscardPrompt").hidden=true;
    $("fitnessRevisionEditor").hidden=true;$("fitnessVersionPanel").hidden=true;
    $("fitnessManagementDialog").showModal?.();
    $("closeFitnessManagement").focus?.();
    return generation;
  }
  function bind() {
    $("closeFitnessManagement").addEventListener("click",()=>close());
    $("keepFitnessDraft").addEventListener("click",()=>{$("fitnessDiscardPrompt").hidden=true;$("closeFitnessManagement").focus?.();});
    $("discardFitnessDraft").addEventListener("click",()=>{markClean();close();});
    $("fitnessManagementDialog").addEventListener("cancel",(e)=>{e.preventDefault();close();});
  }
  root.FitnessRecordDialog={bind,open,close,markClean,token:()=>generation,begin:()=>++generation};
})(globalThis);
