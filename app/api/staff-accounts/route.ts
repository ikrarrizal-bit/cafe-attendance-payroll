import {identity,requireOwner,writeOrigin} from '../../../lib/access';
import {accountList,manageAccount} from '../../../lib/staff-accounts';
const json=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(r:Request){try{requireOwner(await identity(r));return json({employees:await accountList()})}catch(e:any){return json({error:e.message},e.status||500)}}
export async function POST(r:Request){try{requireOwner(await identity(r));writeOrigin(r);const b:any=await r.json();const message=await manageAccount(b);return json({message,employees:await accountList()})}catch(e:any){return json({error:e.message},e.status||400)}}
