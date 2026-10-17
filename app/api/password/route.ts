import {clearTemporaryPassword} from '../../../lib/staff-accounts';
import {identity,writeOrigin} from '../../../lib/access';
import {signedInUser} from '../../../lib/server';
const json=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(r:Request){try{
 const who=await identity(r);writeOrigin(r);
 const user=await signedInUser(r);if(!user||user.id!==who.userId)return json({error:'Please sign in again.'},401);
 const b:any=await r.json();
 if(typeof b.currentPassword!=='string'||!b.currentPassword||b.currentPassword.length>1024)return json({error:'Enter your current password.'},400);
 if(typeof b.newPassword!=='string'||b.newPassword.length<12||b.newPassword.length>128)return json({error:'Use a new password between 12 and 128 characters.'},400);
 if(b.newPassword!==b.confirmPassword)return json({error:'The new passwords do not match.'},400);
 if(b.currentPassword===b.newPassword)return json({error:'Choose a password different from your current password.'},400);
 const url=process.env.SUPABASE_URL!,key=process.env.SUPABASE_ANON_KEY!;
 const verified=await fetch(url.replace(/\/$/,'')+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email:user.email,password:b.currentPassword}),cache:'no-store'});
 const session:any=await verified.json();if(!verified.ok||!session.access_token||session.user?.id!==who.userId)return json({error:'The current password is incorrect, or verification failed. Please try again.'},401);
 const updated=await fetch(url.replace(/\/$/,'')+'/auth/v1/user',{method:'PUT',headers:{apikey:key,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({password:b.newPassword,current_password:b.currentPassword}),cache:'no-store'});
 if(!updated.ok){const result:any=await updated.json().catch(()=>({}));return json({error:result.code==='weak_password'?'Choose a stronger password.':'The password could not be changed. Please try again.'},400)}
 if(user.temporaryPasswordToken)await clearTemporaryPassword(user.id,user.temporaryPasswordToken);
 const cookie='cafe_session='+encodeURIComponent(session.access_token)+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+Math.min(session.expires_in||3600,3600)+(process.env.NODE_ENV==='production'?'; Secure':'');
 return Response.json({message:'Your password has been changed.'},{headers:{'Cache-Control':'no-store','Set-Cookie':cookie}});
 }catch(e:any){return json({error:e.status?e.message:'Password change failed. Please try again.'},e.status||500)}}
