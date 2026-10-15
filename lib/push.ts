import webpush from 'web-push';
import {createHash} from 'node:crypto';
import {env} from './server';
import {saveSetting} from './work-rules';
export const pushConfigured=()=>!!(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY&&process.env.VAPID_SUBJECT);
export function validateSubscription(s:any){
 if(!s||typeof s.endpoint!=='string'||s.endpoint.length>2048)throw Error('Invalid notification subscription.');
 const u=new URL(s.endpoint);
 if(u.protocol!=='https:'||u.username||u.password||u.port||!(u.hostname==='fcm.googleapis.com'||u.hostname==='updates.push.services.mozilla.com'||u.hostname.endsWith('.push.apple.com')||u.hostname==='web.push.apple.com'))throw Error('Unsupported notification provider.');
 if(!/^[A-Za-z0-9_-]{87}$/.test(s.keys?.p256dh)||!/^[A-Za-z0-9_-]{22}$/.test(s.keys?.auth))throw Error('Invalid notification keys.');
 return {endpoint:s.endpoint,keys:{p256dh:s.keys.p256dh,auth:s.keys.auth}};
}
export const subscriptionKey=(endpoint:string)=>'push:'+createHash('sha256').update(endpoint).digest('hex');
export async function notifyEmployee(employee:string,payload={title:'Café Team overtime request',body:'You have a new overtime request. Open Café Team to accept or reject.',url:'/overtime',tag:'cafe-overtime'}){
 if(!pushConfigured())return {sent:0,failed:0,configured:false};
 const person:any=await env.DB.prepare('SELECT * FROM employees WHERE id=? AND active=1').bind(employee).first();
 if(!person)return {sent:0,failed:0,configured:true};
 webpush.setVapidDetails(process.env.VAPID_SUBJECT!,process.env.VAPID_PUBLIC_KEY!,process.env.VAPID_PRIVATE_KEY!);
 const rows=await env.DB.prepare('SELECT * FROM settings').all();let sent=0,failed=0;
 await Promise.all(rows.results.filter((r:any)=>r.key.startsWith('push:')).map(async(r:any)=>{let s:any;try{s=JSON.parse(r.value)}catch{return}if(s?.employee!==employee||s.userId!==person.authUserId)return;
 try{await webpush.sendNotification(validateSubscription(s.subscription),JSON.stringify(payload),{TTL:payload.url==='/staff'?1800:86400,timeout:10000});sent++}catch(e:any){failed++;if(e.statusCode===404||e.statusCode===410)await saveSetting(r.key,null)}
 }));return {sent,failed,configured:true};
}
