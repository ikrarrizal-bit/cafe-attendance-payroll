export function isLateCheckIn(checkedInAt: Date, attendanceDay: string, shiftStart?: string): boolean {
  if (!shiftStart || !/^([01]\d|2[0-3]):[0-5]\d$/.test(shiftStart)) return false;
  const scheduledStart = Date.parse(`${attendanceDay}T${shiftStart}:00+07:00`);
  return checkedInAt.getTime() > scheduledStart + 5 * 60_000;
}

export function addDays(day:string,n:number){const d=new Date(day+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
export function cafeDay(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
export function paymentReminders(payroll:any[],today:string,leadDays=3){const lead=leadDays===2?2:3;return payroll.map(e=>({...e,daysUntil:Math.round((Date.parse(e.end+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000)})).filter(e=>Number.isFinite(e.daysUntil)&&e.daysUntil<=lead&&((e.active!==0&&e.active!==false)||e.days>0)).sort((a,b)=>a.daysUntil-b.daysUntil||a.name.localeCompare(b.name))}
export function nextMonthlyPayday(after:string,payday:number){const d=new Date(after+'T00:00:00Z');const anchor=(y:number,m:number)=>new Date(Date.UTC(y,m,Math.min(payday,new Date(Date.UTC(y,m+1,0)).getUTCDate()))).toISOString().slice(0,10);const current=anchor(d.getUTCFullYear(),d.getUTCMonth());return current>after?current:anchor(d.getUTCFullYear(),d.getUTCMonth()+1)}
export function period(employee:any,payments:any[],settings:any={}){const last=payments.filter(p=>p.employee===employee.id).sort((a,b)=>b.end.localeCompare(a.end))[0];const start=last?.end||employee.start;const payday=Number(savedSetting(settings,'payday:'+employee.id));return {start,end:Number.isInteger(payday)&&payday>=1&&payday<=31?nextMonthlyPayday(start,payday):addDays(start,30)}}
export function savedSetting(settings:any,key:string,fallback:any=null){try{return JSON.parse(settings[key]||'null')??fallback}catch{return fallback}}
export function overtime(record:any,settings:any={}){
 const start=Date.parse(record.clockIn),finish=Date.parse(record.clockOut);const hours=record.clockOut&&Number.isFinite(start)&&Number.isFinite(finish)?Math.max(0,(finish-start)/3600000):0;
 const schedule=savedSetting(settings,'attendanceSchedule:'+record.id);
 const validTime=(v:any)=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
 const known=validTime(schedule?.start)&&validTime(schedule?.end);
 const endDay=known&&schedule.end<=schedule.start?addDays(record.day,1):record.day;
 const scheduledEnd=known?endDay+'T'+schedule.end+':00+07:00':null;
 const extraHours=known&&record.clockOut?Math.max(0,(finish-Math.max(start,Date.parse(scheduledEnd!)))/3600000):0;
 const assignment=savedSetting(settings,'overtimeAssignment:'+record.employee+':'+record.day);
 const accepted=!assignment||assignment.status==='accepted';
 const actualPayableHours=extraHours>=1?Math.min(4,Math.ceil(extraHours)):0;
 const payableHours=accepted?Math.min(actualPayableHours,assignment?.hours||4):0;
 const signature=[record.clockIn,record.clockOut,scheduledEnd,...(assignment?[assignment.status,assignment.hours]:[])].join('|');
 const decision=savedSetting(settings,'overtime:'+record.id);
 const approved=decision?.status==='approved'&&decision.signature===signature&&decision.hours===payableHours;
 const rejected=decision?.status==='rejected'&&decision.signature===signature;
 return {hours,known,scheduledEnd,extraHours,payableHours,signature,regularHours:known?Math.max(0,hours-extraHours):hours,approvedHours:approved?decision.hours:0,approvedAmount:approved?decision.hours*10000:0,status:!record.clockOut?'Open shift':!known?'Schedule not recorded':!accepted?'Assignment not accepted':payableHours===0?'No eligible overtime':approved?'Approved':rejected?'Rejected':'Pending approval'};
}
export function validateDaysOff(month:string,dates:any){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||!Array.isArray(dates)||dates.length!==4||new Set(dates).size!==4)throw Error('Select exactly four different days off for this calendar month.');for(const day of dates){if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day)||day.slice(0,7)!==month||!Number.isFinite(Date.parse(day))||new Date(day+'T00:00:00Z').toISOString().slice(0,10)!==day)throw Error('All four dates must be valid days in the selected month.')}return [...dates].sort()}
export function approvedLeave(settings:any,employee:string,day:string){return Object.keys(settings).filter(key=>key.startsWith('leave:')).map(key=>savedSetting(settings,key)).find(x=>x?.employee===employee&&x.status==='approved'&&x.start<=day&&x.end>=day)}
export function attendanceReport(employee:any,records:any[],start:string,settings:any={},today=cafeDay(),end=addDays(start,30)){
 const length=Math.max(0,Math.round((Date.parse(end+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/86400000));
 return Array.from({length},(_,i)=>{const day=addDays(start,i),record=records.find(r=>r.employee===employee.id&&r.day===day),dates=savedSetting(settings,'daysOff:'+employee.id+':'+day.slice(0,7),[]);const scheduled=Array.isArray(dates)&&dates.length===4,off=scheduled&&dates.includes(day),leave=approvedLeave(settings,employee.id,day);return {day,record,late:record?isLateCheckIn(new Date(record.clockIn),day,savedSetting(settings,'attendanceSchedule:'+record.id)?.start):false,status:record?(off?'Worked on day off':'Present'):leave?(leave.kind==='sick'?'Sick leave (unpaid)':'Approved leave (unpaid)'):day>today?'Future':!scheduled?'Schedule not set':off?'Day off':day===today?'Not checked in yet':'Absent',overtime:record?overtime(record,settings):null}})
}
export function tally(employee:any,records:any[],payments:any[],settings:any={}){const p=period(employee,payments,settings);const rows=records.filter(r=>r.employee===employee.id&&r.day>=p.start&&r.day<p.end);const details=rows.map(r=>({record:r,ot:overtime(r,settings)}));const hours=details.reduce((n,r)=>n+r.ot.hours,0),regularHours=details.reduce((n,r)=>n+r.ot.regularHours,0);const baseAmount=details.reduce((n,r)=>n+(r.record.basis==='hourly'?r.ot.regularHours*r.record.rate:r.record.rate),0);const overtimeAmount=details.reduce((n,r)=>n+r.ot.approvedAmount,0),overtimeHours=details.reduce((n,r)=>n+r.ot.approvedHours,0),pendingOvertime=details.filter(r=>r.ot.status==='Pending approval').length;return {...p,rows,days:rows.length,hours,regularHours,baseAmount:Math.round(baseAmount*100)/100,overtimeAmount,overtimeHours,pendingOvertime,amount:Math.round((baseAmount+overtimeAmount)*100)/100,open:rows.filter(r=>!r.clockOut).length}}
