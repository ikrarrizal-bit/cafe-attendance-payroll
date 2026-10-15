import {env} from '../../../lib/server';
import {identity,writeOrigin,canViewRecord} from '../../../lib/access';
import {breakSummary} from '../../../lib/break-rules';
import {validateCheckInLocation} from '../../../lib/checkin-location';
const json=(b:any,status=200)=>Response.json(b,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(r:Request){try{
 const who=await identity(r);
 const attendance=who.role==='owner'?(await env.DB.prepare('SELECT id,employee FROM attendance').all()).results:(await env.DB.prepare('SELECT id,employee FROM attendance WHERE employee=?').bind(who.employee.id).all()).results;
 const rows=await env.DB.prepare('SELECT * FROM settings').all();
 const breaks=Object.fromEntries(rows.results.filter((x:any)=>x.key.startsWith('break:')&&attendance.some((a:any)=>x.key==='break:'+a.id)).map((x:any)=>{try{return [x.key.slice(6),JSON.parse(x.value)]}catch{return [x.key.slice(6),null]}}));
 return json({breaks,serverNow:new Date().toISOString()});
 }catch(e:any){return json({error:e.message},e.status||400)}}
export async function POST(r:Request){try{
 const who=await identity(r);writeOrigin(r);if(who.role!=='employee')throw Error('Staff must start and resume their own break using their staff account.');
 const form=await r.formData(),id=form.get('attendance'),action=form.get('action');if(typeof id!=='string')throw Error('Choose an open attendance record.');
 const record:any=await env.DB.prepare('SELECT * FROM attendance WHERE id=?').bind(id).first();
 if(!canViewRecord(who,record))return json({error:'You can only manage your own break.'},403);
 if(record.clockOut)throw Error('This shift is already completed.');
 const key='break:'+id,old:any=await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind(key).first();
 const now=new Date();let value:any;
 if(action==='start'){
 if(old)throw Error('Only one break is allowed per shift.');
 value={attendance:id,employee:who.employee.id,startedAt:now.toISOString()};
 // A unique settings key prevents simultaneous taps from starting two breaks.
 await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?)').bind(key,JSON.stringify(value)).run();
 }else if(action==='resume'){
 if(!old)throw Error('Start your break before resuming.');value=JSON.parse(old.value);if(value.resumedAt)throw Error('You have already resumed this shift.');
 validateCheckInLocation(form,now.getTime(),20,20);
 value={...value,resumedAt:now.toISOString()};
 const updated=await env.DB.prepare('UPDATE settings SET value=? WHERE key=? AND value=?').bind(JSON.stringify(value),key,old.value).first();
 if(!updated)throw Error('Your break changed. Refresh and try again.');
 }else throw Error('Unknown break action.');
 return json({break:value,serverNow:now.toISOString(),message:action==='start'?'Paid break started. Your reminder is due in 60 minutes.':'You have resumed your shift.'});
 }catch(e:any){return json({error:e.message.includes('UNIQUE')?'Your break has already started. Refresh to see it.':e.message},e.status||400)}}
