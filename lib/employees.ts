import { env } from './server';
export async function saveEmployee(b:any){
 const db=env.DB!;const {id,name,role,basis,rate,start,active}=b;
 if(typeof name!=='string'||!name.trim()||name.length>80||!['daily','hourly'].includes(basis)||!Number.isFinite(Number(rate))||Number(rate)<0||Number(rate)>1e9||!/^\d{4}-\d{2}-\d{2}$/.test(start)||isNaN(Date.parse(start))||new Date(start).toISOString().slice(0,10)!==start)throw new Error('Enter a name, valid rate and starting date.');
 const email=String(b.loginEmail||'').trim().toLowerCase()||null;
 if(email&&(email.length>254||!/^\S+@\S+\.\S+$/.test(email)))throw new Error('Enter a valid employee sign-in email.');
 if(email&&email===env.CAFE_OWNER_EMAIL?.trim().toLowerCase())throw new Error('Use a staff account email, different from the owner account.');
 const values=[name.trim(),String(role||'Team member').slice(0,80),basis,Number(rate),start];
 if(id){const old:any=await db.prepare('SELECT * FROM employees WHERE id=?').bind(id).first();if(!old)throw new Error('Employee not found.');if(start!==old.start&&(await db.prepare('SELECT id FROM attendance WHERE employee=? UNION SELECT id FROM payments WHERE employee=? LIMIT 1').bind(id,id).first()))throw new Error('The start date is locked once attendance or payments exist.');await db.prepare('UPDATE employees SET name=?,role=?,basis=?,rate=?,start=?,active=?,loginEmail=?,authUserId=? WHERE id=?').bind(...values,active===false?0:1,email,email===old.loginEmail?old.authUserId:null,id).run();}
 else await db.prepare('INSERT INTO employees(id,name,role,basis,rate,start,loginEmail,active) VALUES(?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),...values,email,active===false?0:1).run();
}
