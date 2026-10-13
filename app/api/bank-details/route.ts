import {identity,requireOwner,writeOrigin} from '../../../lib/access';
import {saveBankDetails} from '../../../lib/bank-details';
export async function POST(r:Request){try{const who=await identity(r);requireOwner(who);writeOrigin(r);const body:any=await r.json();if(!['save','clear'].includes(body.action))throw Error('Unknown bank detail action.');return Response.json({bankDetails:await saveBankDetails(body,who.userId)},{headers:{'Cache-Control':'no-store'}})}catch(e:any){return Response.json({error:e.message},{status:e.status||400,headers:{'Cache-Control':'no-store'}})}}
