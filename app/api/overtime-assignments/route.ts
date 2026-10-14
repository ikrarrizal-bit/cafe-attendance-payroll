import {identity,requireOwner,writeOrigin} from '../../../lib/access';
import {env} from '../../../lib/server';
import {saveSetting} from '../../../lib/work-rules';
import {addDays,cafeDay,savedSetting,approvedLeave} from '../../../lib/payroll';
import {notifyEmployee,pushConfigured} from '../../../lib/push';
const json=(b:any,status=200)=>Response.json(b,{status,headers:{'Cache-Control':'no-store'}});
async function settings(){const s=await env.DB.prepare('SELECT * FROM settings').all();return Object.fromEntries(s.results.map((r:any)=>[r.key,r.value]))}
export async function GET(r:Request){try{const who=await identity(r),s=await settings();const items=Object.keys(s).filter(k=>k.startsWith('overtimeAssignment:')).map(k=>savedSetting(s,k)).filter(x=>x&&(who.role==='owner'||x.employee===who.employee.id)).sort((a,b)=>b.day.localeCompare(a.day));const employees=who.role==='owner'?(await env.DB.prepare('SELECT id,name,role FROM employees WHERE active=1').all()).results:[];return json({role:who.role,items,employees,today:cafeDay(),pushConfigured:pushConfigured()})}catch(e:any){return json({error:e.message},e.status||400)}}
export async function POST(r:Request){try{const who=await identity(r);writeOrigin(r);const b=await r.json();const s=await settings();
 if(b.action==='assign'){
 requireOwner(who);
 const valid=(d:any)=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d;
 if(!valid(b.start)||!valid(b.end)||b.start<cafeDay()||b.end<b.start||(Date.parse(b.end)-Date.parse(b.start))/86400000>30)throw Error('Choose today or future dates, covering at most 31 days.');
 if(!Number.isInteger(b.hours)||b.hours<1||b.hours>4)throw Error('Choose 1 to 4 planned overtime hours.');
 if(typeof b.message!=='string'||!b.message.trim()||b.message.length>300)throw Error('Enter the overtime job or message, up to 300 characters.');
 if(!Array.isArray(b.employees)||!b.employees.length||b.employees.length>50||new Set(b.employees).size!==b.employees.length)throw Error('Select staff for overtime.');
 const staff=(await env.DB.prepare('SELECT * FROM employees WHERE active=1').all()).results;
 const payments=(await env.DB.prepare('SELECT * FROM payments').all()).results;
 const attendance=(await env.DB.prepare('SELECT * FROM attendance').all()).results;
 const assignments:any[]=[];
 for(const employee of b.employees){const person=staff.find((x:any)=>x.id===employee);if(!person)throw Error('Select active staff.');for(let day=b.start;day<=b.end;day=addDays(day,1)){
 const key='overtimeAssignment:'+employee+':'+day;
 if(savedSetting(s,key))throw Error('An overtime assignment already exists for '+person.name+' on '+day+'.');
 if(day<person.start||approvedLeave(s,employee,day)||payments.some((p:any)=>p.employee===employee&&p.start<=day&&p.end>day)||attendance.some((a:any)=>a.employee===employee&&a.day===day&&a.clockOut))throw Error('Cannot assign overtime on leave, a completed shift or a paid date.');
 assignments.push({key,item:{employee,name:person.name,day,hours:b.hours,message:b.message.trim(),status:'pending',createdAt:new Date().toISOString(),createdBy:who.userId}});
 }}
 // Save each request before attempting delivery; push failure does not lose it.
 for(const a of assignments)await saveSetting(a.key,a.item);
 const notifications=await Promise.all(b.employees.map(async(employee:string)=>{try{return {employee,...await notifyEmployee(employee)}}catch{return {employee,sent:0,failed:1,configured:false}}}));
 return json({message:'Overtime requests saved. Staff must accept each date in the app.',notifications});
 }
 if(b.action==='respond'){
 if(who.role!=='employee')throw Error('Only the assigned staff member can respond.');
 if(!['accepted','rejected'].includes(b.status)||typeof b.day!=='string')throw Error('Choose accept or reject.');
 const key='overtimeAssignment:'+who.employee.id+':'+b.day,item=savedSetting(s,key);if(!item||item.status!=='pending')throw Error('This request is already answered or missing.');
 if(item.day<cafeDay())throw Error('This overtime request has expired.');
 const a:any=await env.DB.prepare('SELECT * FROM attendance WHERE employee=? AND day=?').bind(who.employee.id,item.day).first();if(a?.clockOut)throw Error('Respond before completing your shift.');
 await saveSetting(key,{...item,status:b.status,respondedAt:new Date().toISOString(),respondedBy:who.userId});return json({message:'Your overtime response is saved.'});
 }
 throw Error('Unknown overtime action.');
 }catch(e:any){return json({error:e.message},e.status||400)}}
