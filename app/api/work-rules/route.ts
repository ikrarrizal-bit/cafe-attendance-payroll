import {identity,requireOwner,writeOrigin} from '../../../lib/access';
import {manageWorkRules} from '../../../lib/work-rules';
export async function POST(r:Request){try{const who=await identity(r);requireOwner(who);writeOrigin(r);const b:any=await r.json();return Response.json({message:await manageWorkRules(b,who.userId)},{headers:{'Cache-Control':'no-store'}})}catch(e:any){return Response.json({error:e.message},{status:e.status||400,headers:{'Cache-Control':'no-store'}})}}
