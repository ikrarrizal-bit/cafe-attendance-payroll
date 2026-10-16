"use client";
import {useEffect,useState} from 'react';
import {breakSummary,type StaffBreak} from '../../lib/break-rules';
import {addPhoneLocation} from '../../lib/checkin-location';
import BreakSound from './break-sound';

export default function BreakControls({attendance,onActiveChange}:{attendance:string;onActiveChange:(active:boolean)=>void}){
 const [value,setValue]=useState<StaffBreak|null>(null),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[now,setNow]=useState(Date.now()),[offset,setOffset]=useState(0);
 useEffect(()=>{let disposed=false;const controller=new AbortController();async function load(){try{
 const r=await fetch('/api/breaks',{cache:'no-store',signal:controller.signal});const s=await r.json();if(!r.ok)throw Error(s.error);
 if(!disposed){setValue(s.breaks[attendance]||null);setOffset(Date.parse(s.serverNow)-Date.now());setLoaded(true);setError('');}
 }catch(e:any){if(!disposed&&e.name!=='AbortError')setError(e.message)}}
 void load();const poll=setInterval(()=>{if(document.visibilityState==='visible')void load()},30000);const clock=setInterval(()=>setNow(Date.now()),1000);
 const focus=()=>{void load();setNow(Date.now())};window.addEventListener('focus',focus);
 return()=>{disposed=true;controller.abort();clearInterval(poll);clearInterval(clock);window.removeEventListener('focus',focus)};
 },[attendance]);
 const summary=breakSummary(value,now+offset);
 useEffect(()=>{onActiveChange(!loaded||!!summary?.active)},[loaded,summary?.active,onActiveChange]);
 async function act(action:string){setBusy(true);setError('');try{
 const form=new FormData();form.set('attendance',attendance);form.set('action',action);
 if(action==='resume')await addPhoneLocation(form);
 const r=await fetch('/api/breaks',{method:'POST',body:form});const s=await r.json();if(!r.ok)throw Error(s.error);
 setValue(s.break);setLoaded(true);setOffset(Date.parse(s.serverNow)-Date.now());setNow(Date.now());
 }catch(e:any){setError(e.message)}finally{setBusy(false)}}
 const time=(d:string)=>new Date(d).toLocaleTimeString('en-GB',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit'});
 return <section className="paid-break" style={{borderLeft:'4px solid '+(summary?.late?'#b91c1c':'#164e63'),padding:'12px 16px',margin:'20px 0'}}><h3>Paid break</h3>{loaded&&(!summary||summary.active)&&<BreakSound attendance={attendance} dueAt={summary?.dueAt} active={!!summary?.active} now={now+offset}/>}{error&&<p className="alert error" role="alert">{error}</p>}{!loaded?<p>Loading break status…</p>:!summary?<button className="secondary full" disabled={busy} onClick={()=>{if(window.confirm('Start your one paid break now?'))void act('start')}}>{busy?'Saving…':'Start break'}</button>:<><p style={summary.late?{color:'#b91c1c',fontWeight:600}:undefined}>{summary.status} · {Math.floor(summary.elapsedMinutes)} minutes<br/>Started {time(summary.startedAt)} · break ends {time(summary.dueAt)}{summary.resumedAt&&<><br/>Resumed {time(summary.resumedAt)}</>}</p>{summary.active&&<><p role="status">{now+offset>=Date.parse(summary.dueAt)?'Your break is over.':Math.ceil((Date.parse(summary.dueAt)-now-offset)/60000)+' minutes until your break ends.'}</p><button className="primary full" disabled={busy} onClick={()=>act('resume')}>{busy?'Checking location…':'Resume shift'}</button></>}</>}</section>
}
