import {env} from '../../../lib/server';
import {identity,requireOwner,writeOrigin} from '../../../lib/access';
import {saveSetting} from '../../../lib/work-rules';
import {savedSetting} from '../../../lib/payroll';
const json=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function read(){const rows=await env.DB.prepare('SELECT * FROM settings').all();return rows.results.filter((r:any)=>r.key.startsWith('leave:')).map((r:any)=>savedSetting({[r.key]:r.value},r.key)).filter(Boolean)}
export async function GET(r:Request){try{const who=await identity(r);const requests=(await read()).filter((x:any)=>who.role==='owner'||x.employee===who.employee.id).sort((a:any,b:any)=>b.createdAt.localeCompare(a.createdAt));return json({role:who.role,requests})}catch(e:any){return json({error:e.message},e.status||400)}}
export async function POST(r:Request){try{const who=await identity(r);writeOrigin(r);const b=await r.json();const requests=await read();let item:any;
if(b.action==='request'){
 if(who.role!=='employee')throw Error('Please use your linked staff account to request leave.');
 const valid=(d:any)=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d;
 if(!valid(b.start)||!valid(b.end)||b.end<b.start||(Date.parse(b.end)-Date.parse(b.start))/86400000>30)throw Error('Choose valid leave dates covering at most 31 days.');
 if(!['sick','other'].includes(b.kind)||typeof b.reason!=='string'||!b.reason.trim()||b.reason.length>1000)throw Error('Choose a leave type and enter a reason of up to 1,000 characters.');
 if(b.start<who.employee.start)throw Error('Leave cannot start before your employment date.');
 if(requests.some((x:any)=>x.employee===who.employee.id&&x.status!=='rejected'&&x.start<=b.end&&x.end>=b.start))throw Error('These dates overlap an existing pending or approved request.');
 item={id:crypto.randomUUID(),employee:who.employee.id,name:who.employee.name,start:b.start,end:b.end,kind:b.kind,reason:b.reason.trim(),status:'pending',createdAt:new Date().toISOString()};
}else{
 requireOwner(who);if(!['approved','rejected'].includes(b.status))throw Error('Choose approve or reject.');item=requests.find((x:any)=>x.id===b.id);if(!item||item.status!=='pending')throw Error('This request is already decided or missing.');
 item={...item,status:b.status,decidedAt:new Date().toISOString(),decidedBy:who.userId};
}
const payments=await env.DB.prepare('SELECT * FROM payments WHERE employee=?').bind(item.employee).all();if(payments.results.some((p:any)=>p.start<=item.end&&p.end>item.start))throw Error('Leave dates in an already paid period cannot be changed.');
if(b.action==='request'||item.status==='approved'){const records=await env.DB.prepare('SELECT * FROM attendance WHERE employee=?').bind(item.employee).all();if(records.results.some((a:any)=>a.day>=item.start&&a.day<=item.end))throw Error('Attendance is already recorded on these dates. Choose dates without attendance.');}
await saveSetting('leave:'+item.id,item);return json({message:b.action==='request'?'Leave request sent to the owner.':'Leave decision saved.'});
}catch(e:any){return json({error:e.message},e.status||400)}}
