"use client";
import {useEffect,useState} from 'react';
import type {StaffBreak} from './break-rules';

export function useLiveBreaks(enabled:boolean){
 const [breaks,setBreaks]=useState<Record<string,StaffBreak|null>>({});
 const [error,setError]=useState(''),[offset,setOffset]=useState(0),[now,setNow]=useState(Date.now());
 useEffect(()=>{
 if(!enabled)return;
 let disposed=false,inFlight=false;
 const controller=new AbortController();
 async function refresh(){
 if(disposed||inFlight||document.visibilityState==='hidden')return;
 inFlight=true;
 try{const r=await fetch('/api/breaks',{cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});const s=await r.json();if(!r.ok)throw Error(s.error);
 if(!disposed){setBreaks(s.breaks);setOffset(Date.parse(s.serverNow)-Date.now());setNow(Date.now());setError('');}}
 catch(e:any){if(!disposed)setError('Live break updates paused. '+(e.name==='TimeoutError'?'Check your connection.':e.message))}
 finally{inFlight=false}
 }
 void refresh();const timer=setInterval(refresh,15000),clock=setInterval(()=>{if(document.visibilityState==='visible')setNow(Date.now())},1000);
 const focus=()=>{setNow(Date.now());void refresh()};
 window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);
 return()=>{disposed=true;controller.abort();clearInterval(timer);clearInterval(clock);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus)};
 },[enabled]);
 return {breaks,now:now+offset,error};
}
