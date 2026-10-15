import {timingSafeEqual} from 'node:crypto';
import {env} from '../../../../lib/server';
import {notifyEmployee,pushConfigured} from '../../../../lib/push';
import {breakSummary} from '../../../../lib/break-rules';
export const maxDuration=60;
export const dynamic='force-dynamic';
const json=(b:any,status=200)=>Response.json(b,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(r:Request){
 const secret=process.env.CRON_SECRET,actual=r.headers.get('authorization')||'';
 if(!secret)return json({error:'Reminder secret is not configured.'},503);
 const expected='Bearer '+secret;
 if(Buffer.byteLength(actual)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return json({error:'Unauthorized'},401);
 if(!pushConfigured())return json({error:'Push notifications are not configured.'},503);
 try{
 const started=Date.now();const rows=(await env.DB.prepare('SELECT * FROM settings').all()).results;
 const open=(await env.DB.prepare('SELECT id,employee FROM attendance WHERE clockOut IS NULL').all()).results;
 let sent=0,failed=0,processed=0;
 for(const row of rows.filter((x:any)=>x.key.startsWith('break:'))){
 if(Date.now()-started>45000)break;
 let value:any;try{value=JSON.parse(row.value)}catch{continue}
 const summary=breakSummary(value);
 if(!summary?.active||Date.now()<Date.parse(summary.dueAt)||!open.some((x:any)=>x.id===value.attendance&&x.employee===value.employee))continue;
 const key='breakReminder:'+value.attendance;
 const prior:any=await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind(key).first();
 let previous:any;try{previous=prior?JSON.parse(prior.value):null}catch{previous=null}
 if(previous?.state==='sent'||(previous?.state==='sending'&&Date.now()-Date.parse(previous.at)<120000)||previous?.attempts>=5)continue;
 const claim=JSON.stringify({state:'sending',at:new Date().toISOString(),attempts:(previous?.attempts||0)+1});
 if(prior){const acquired=await env.DB.prepare('UPDATE settings SET value=? WHERE key=? AND value=?').bind(claim,key,prior.value).first();if(!acquired)continue}
 else{try{await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?)').bind(key,claim).run()}catch(e:any){if(e.message.includes('UNIQUE'))continue;throw e}}
 // A staff member may have resumed while this job acquired its reminder lease.
 const fresh:any=await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind(row.key).first();
 if(!fresh||!breakSummary(JSON.parse(fresh.value))?.active){await env.DB.prepare('UPDATE settings SET value=? WHERE key=? AND value=?').bind(JSON.stringify({...JSON.parse(claim),state:'sent',skipped:true}),key,claim).run();continue}
 try{const result=await notifyEmployee(value.employee,{title:'Your break is over',body:'Your 60-minute break has ended. Please return to the café and tap Resume shift.',url:'/staff',tag:'cafe-break-'+value.attendance});
 sent+=result.sent;failed+=result.failed;processed++;
 const state=result.sent>0?'sent':'retry';await env.DB.prepare('UPDATE settings SET value=? WHERE key=? AND value=?').bind(JSON.stringify({...JSON.parse(claim),state,sent:result.sent,failed:result.failed}),key,claim).run();
 }catch{failed++;await env.DB.prepare('UPDATE settings SET value=? WHERE key=? AND value=?').bind(JSON.stringify({...JSON.parse(claim),state:'retry'}),key,claim).run()}
 }
 return json({processed,sent,failed});
 }catch{return json({error:'Break reminder check failed. It will retry on the next scheduled run.'},500)}
}
