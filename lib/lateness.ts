export function attendanceLateness(record:any,schedule:any,pause:any,now=Date.now()){
 const actual=Date.parse(record.clockIn);
 const planned=typeof schedule?.start==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.start)?Date.parse(record.day+'T'+schedule.start+':00+07:00'):NaN;
 const checkInMinutes=Number.isFinite(actual)&&Number.isFinite(planned)?Math.max(0,(actual-planned)/60000-5):null;
 const breakStart=pause?Date.parse(pause.startedAt):NaN;
 const breakEnd=pause?.resumedAt?Date.parse(pause.resumedAt):now;
 const breakMinutes=Number.isFinite(breakStart)&&Number.isFinite(breakEnd)?Math.max(0,(breakEnd-breakStart)/60000-90):0;
 return {checkInMinutes,breakMinutes,totalMinutes:(checkInMinutes||0)+breakMinutes,breakActive:!!pause&&!pause.resumedAt};
}

export function formatLateMinutes(minutes:number|null|undefined){
 if(minutes==null||!Number.isFinite(minutes))return 'Not recorded';
 const seconds=Math.max(0,Math.round(minutes*60)),hours=Math.floor(seconds/3600),mins=Math.floor(seconds%3600/60),secs=seconds%60;
 return [hours?hours+' h':'',mins||!hours?mins+' min':'',secs?secs+' sec':''].filter(Boolean).join(' ');
}

export function latenessTotals(rows:any[]){
 return rows.reduce((out:any,row:any)=>{
 if(!row.record)return out;
 if(!row.lateness){out.notRecorded++;return out}
 const late=row.lateness;
 out.checkInMinutes+=late.checkInMinutes||0;out.breakMinutes+=late.breakMinutes||0;out.totalMinutes+=late.totalMinutes||0;
 if(late.checkInMinutes===null)out.unknownSchedules++;
 if(late.breakActive)out.activeBreaks++;
 return out;
 },{checkInMinutes:0,breakMinutes:0,totalMinutes:0,unknownSchedules:0,activeBreaks:0,notRecorded:0});
}
