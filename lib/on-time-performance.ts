export function onTimePerformance(records:any[],settings:Record<string,string>={}) {
 let early=0,onTime=0,late=0,unknown=0;
 for(const record of records){
  let schedule:any;try{schedule=JSON.parse(settings['attendanceSchedule:'+record.id]||'null')}catch{}
  const clockIn=Date.parse(record.clockIn);
  const start=typeof schedule?.start==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.start)
    ?Date.parse(record.day+'T'+schedule.start+':00+07:00'):NaN;
  if(!Number.isFinite(clockIn)||!Number.isFinite(start)){unknown++;continue}
  if(clockIn<start)early++;else if(clockIn===start)onTime++;else late++;
 }
 const assessed=early+onTime+late,qualifying=early+onTime;
 return {early,onTime,late,unknown,assessed,qualifying,total:records.length,percentage:assessed?Math.round(qualifying/assessed*100):null};
}
