import {env,signedInUser} from './server';
export class AccessError extends Error {constructor(message:string,public status=403){super(message)}}
export type Identity={role:'owner',userId:string}|{role:'employee',userId:string,employee:any};
export async function identity(request:Request):Promise<Identity>{
 const user=await signedInUser(request);
 const userId=user?.id;
 const email=user?.email?.trim().toLowerCase();
 if(!userId||!email)throw new AccessError('Please sign in to continue.',401);
 if(!env.DB||!env.BUCKET)throw new AccessError('Storage is unavailable.',503);
 const ownerEmail=env.CAFE_OWNER_EMAIL?.trim().toLowerCase();
 if(!ownerEmail)throw new AccessError('Owner sign-in configuration is missing.',503);
 if(email===ownerEmail)return {role:'owner',userId};
 let employee:any=await env.DB.prepare('SELECT * FROM employees WHERE authUserId=? AND active=1').bind(userId).first();
 if(!employee){
  employee=await env.DB.prepare('SELECT * FROM employees WHERE loginEmail=? AND active=1 AND authUserId IS NULL').bind(email).first();
  if(!employee)throw new AccessError('Your account is not linked to an active employee. Ask the café owner to add your sign-in email.');
  await env.DB.prepare('UPDATE employees SET authUserId=? WHERE id=? AND authUserId IS NULL AND active=1').bind(userId,employee.id).run();
  employee=await env.DB.prepare('SELECT * FROM employees WHERE id=? AND authUserId=? AND active=1').bind(employee.id,userId).first();
  if(!employee)throw new AccessError('Account linking changed. Ask the café owner to review your profile.');
 }
 return {role:'employee',userId,employee};
}
export function writeOrigin(request:Request){if(request.headers.get('origin')!==new URL(request.url).origin)throw new AccessError('Invalid request origin.')}
export function requireOwner(who:Identity){if(who.role!=='owner')throw new AccessError('Only the café owner can manage staff or payroll.')}
export function canViewRecord(who:Identity,record:any){return !!record&&(who.role==='owner'||record.employee===who.employee.id)}
