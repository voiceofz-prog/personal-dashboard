(function (root) {
  const date = (row) => row.activity_date || row.entry_date || row.workout_date || "";
  const key = ({kind,row}) => `${kind}:${row.id}`;
  function merge(base, current) {
    return [...new Map([...base,...current].map((record) => [key(record),record])).values()];
  }
  function withdrawn(record, records) {
    return Boolean(record.row.withdrawn || record.kind === "workout" && records.some((r) => r.kind === "daily" && r.row.id === record.row.daily_entry_id && r.row.withdrawn));
  }
  function latest(records) {
    return records.filter((r) => !withdrawn(r,records)).map((r) => date(r.row)).sort().at(-1) || records.map((r) => date(r.row)).sort().at(-1) || null;
  }
  function monthRange(month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("年月不正確");
    const [year,m] = month.split("-").map(Number);
    return [month+"-01", `${m === 12 ? year+1 : year}-${String(m === 12 ? 1 : m+1).padStart(2,"0")}-01`];
  }
  function cells(month) {
    const [start,end] = monthRange(month);
    const first = new Date(start+"T12:00:00");
    const count = Math.round((new Date(end+"T12:00:00")-first)/86400000);
    return [...Array((first.getDay()+6)%7).fill(null), ...Array.from({length:count},(_,i) => `${month}-${String(i+1).padStart(2,"0")}`)];
  }
  // Read-only browsing cache never becomes recommendation input. Epochs isolate owners and refreshes.
  function createCache() {
    let owner=null, epoch=0;
    const months=new Map();
    return {
      reset(nextOwner) { owner=nextOwner;epoch++;months.clear(); },
      get: (month) => months.get(month),
      records: () => [...months.values()].flatMap((value) => value.records || []),
      async read(month, nextOwner, load, isCurrent) {
        const token=epoch;
        const records=await load(month);
        if (token !== epoch || owner !== nextOwner || !isCurrent()) return false;
        months.set(month,{records,complete:true});return true;
      }
    };
  }
  root.FitnessRecordBrowser={date,key,merge,withdrawn,latest,monthRange,cells,createCache};
})(globalThis);
