"use client";
import {useEffect,useRef,useState} from 'react';

export default function LeaveNotice({onChanged}:{onChanged:()=>Promise<void>}) {
 const [requests,setRequests]=useState<any[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState('');
 const revision=useRef(0);
 const refreshRef=useRef<()=>Promise<void>>(async()=>{});
 useEffect(()=>{
   let disposed=false,loading=false;
   const controller=new AbortController();
   async function refresh(){
     if(disposed||loading||document.visibilityState==='hidden')return;
     loading=true;const observedRevision=revision.current;
     try{const r=await fetch('/api/leave',{cache:'no-store',signal:controller.signal});const s=await r.json();if(!r.ok)throw Error(s.error);if(!disposed&&observedRevision===revision.current){setRequests(s.requests.filter((x:any)=>x.status==='pending'));setError('');}}
     catch(e:any){if(!disposed&&e.name!=='AbortError')setError(e.message)}finally{loading=false}
   }
   refreshRef.current=refresh;
   void refresh();const timer=setInterval(refresh,30000);
   window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
   return()=>{disposed=true;controller.abort();clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)};
 },[]);
 async function decide(id:string,status:string){setBusy(id);setError('');try{
   const r=await fetch('/api/leave',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'decide',id,status})});const s=await r.json();if(!r.ok)throw Error(s.error);
   revision.current++;setRequests(rows=>rows.filter(x=>x.id!==id));await refreshRef.current();await onChanged();
 }catch(e:any){setError(e.message)}finally{setBusy('')}}
 if(!requests.length&&!error)return null;
 return <section className="card" aria-label="Pending leave requests"><div className="section-head"><div><h2>{requests.length} leave request{requests.length===1?'':'s'} awaiting approval</h2><p>Approved leave is unpaid. This notice refreshes every 30 seconds while the page is visible.</p></div><a className="secondary" href="/leave">Leave history</a></div>{error&&<div className="alert error" role="alert">Leave updates: {error} <button className="text-btn" onClick={()=>refreshRef.current()}>Retry</button></div>}<div aria-live="polite">{requests.map(x=><div className="staff-record" key={x.id}><div><strong>{x.name} · {x.kind==='sick'?'Sick leave':'Other permission'}</strong><small>{x.start} → {x.end}</small><p>{x.reason}</p></div><div className="inline"><button className="primary" disabled={!!busy} onClick={()=>decide(x.id,'approved')}>{busy===x.id?'Saving…':'Approve unpaid leave'}</button><button className="secondary" disabled={!!busy} onClick={()=>decide(x.id,'rejected')}>Reject</button></div></div>)}</div></section>;
}
