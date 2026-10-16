import {env} from './server';

/** Owner-only caller. Never delete the shared Supabase Auth user. */
export async function deleteEmployee(body:any){
 const db=env.DB;
 if(typeof body.id!=='string')throw Error('Choose an employee.');
 const employee:any=await db.prepare('SELECT * FROM employees WHERE id=?').bind(body.id).first();
 if(!employee)throw Error('Employee not found. Refresh the page.');
 const attendance=(await db.prepare('SELECT * FROM attendance WHERE employee=?').bind(employee.id).all()).results;
 const ids=new Set(attendance.map((a:any)=>a.id));
 const settings=(await db.prepare('SELECT * FROM settings').all()).results;
 const keys=settings.filter((row:any)=>{
  const key=row.key;
  if(key==='bank:'+employee.id||key==='payday:'+employee.id||key.startsWith('daysOff:'+employee.id+':')||key.startsWith('overtimeAssignment:'+employee.id+':'))return true;
  if(['break:','breakReminder:','overtime:','attendanceSchedule:'].some(prefix=>key.startsWith(prefix)&&ids.has(key.slice(prefix.length))))return true;
  if(key.startsWith('leave:')||key.startsWith('push:')){try{return JSON.parse(row.value)?.employee===employee.id}catch{return false}}
  return false;
 }).map((row:any)=>row.key);
 // Delete photos while their attendance IDs are still available for safe retries.
 for(const row of attendance)if(row.photo)await env.BUCKET.delete(row.photo);
 for(const key of keys)await db.prepare('DELETE FROM settings WHERE key=?').bind(key).run();
 await db.prepare('DELETE FROM payments WHERE employee=?').bind(employee.id).run();
 await db.prepare('DELETE FROM attendance WHERE employee=?').bind(employee.id).run();
 const deleted=await db.prepare('DELETE FROM employees WHERE id=?').bind(employee.id).first();
 if(!deleted)throw Error('The employee changed during deletion. Refresh and review their status.');
}
