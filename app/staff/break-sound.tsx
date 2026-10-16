"use client";
import {useEffect,useRef,useState} from 'react';

/** A short synthesized chime: no audio download or background playback. */
export function playBreakChime(context:AudioContext){
 const at=context.currentTime;
 for(const [delay,frequency] of [[0,660],[0.48,523.25]]){
  const tone=context.createOscillator(),gain=context.createGain();
  tone.type='sine';tone.frequency.value=frequency;
  gain.gain.setValueAtTime(0.0001,at+delay);
  gain.gain.exponentialRampToValueAtTime(0.22,at+delay+0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001,at+delay+1.1);
  tone.connect(gain);gain.connect(context.destination);
  tone.start(at+delay);tone.stop(at+delay+1.15);
  tone.onended=()=>{tone.disconnect();gain.disconnect()};
 }
}

export default function BreakSound({attendance,dueAt,active,now}:{attendance:string;dueAt?:string;active:boolean;now:number}){
 const audio=useRef<AudioContext|null>(null),announced=useRef(new Set<string>());
 const [enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const key=dueAt?'cafe-break-chime:'+attendance+':'+dueAt:'';
 const due=!!dueAt&&now>=Date.parse(dueAt);
 function mark(){if(!key)return;announced.current.add(key);try{sessionStorage.setItem(key,'played')}catch{}}
 useEffect(()=>()=>{void audio.current?.close().catch(()=>{});audio.current=null},[]);
 useEffect(()=>{
  if(!enabled||!active||!due||!key)return;
  let cancelled=false;
  async function ring(){
   if(document.visibilityState!=='visible'||announced.current.has(key))return;
   try{if(sessionStorage.getItem(key)==='played'){announced.current.add(key);return}}catch{}
   const context=audio.current;if(!context)return;
   // Reserve before resuming the audio device so repeated clock ticks do not ring twice.
   announced.current.add(key);
   try{await context.resume();if(cancelled){announced.current.delete(key);return}if(context.state!=='running')throw Error('Audio is paused.');playBreakChime(context);try{sessionStorage.setItem(key,'played')}catch{}setMessage('Your break is over.');}
   catch{announced.current.delete(key);if(!cancelled){setEnabled(false);setMessage('Tap Enable break sound again to allow audio.');}}
  }
  void ring();document.addEventListener('visibilitychange',ring);
  return()=>{cancelled=true;document.removeEventListener('visibilitychange',ring)};
 },[enabled,active,due,key]);
 async function enable(){setBusy(true);try{
  const Constructor=window.AudioContext||(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  if(!Constructor)throw Error('Sound is not supported in this browser.');
  const context=audio.current||new Constructor();audio.current=context;
  await context.resume();if(context.state!=='running')throw Error('Please allow audio and try again.');
  playBreakChime(context);if(active&&due)mark();setEnabled(true);setMessage('Break sound enabled. Keep this app open to hear it.');
 }catch(e:any){setEnabled(false);setMessage(e.message)}finally{setBusy(false)}}
 function disable(){setEnabled(false);const context=audio.current;audio.current=null;void context?.close().catch(()=>{});setMessage('Break sound off. Phone push reminders are unchanged.');}
 return <div style={{margin:'12px 0'}}><button type="button" className="secondary full" disabled={busy} onClick={enabled?disable:enable}>{busy?'Enabling…':enabled?'Break sound on · Turn off':'Enable break sound'}</button><p className="help" role="status">{message||'Tap to enable and test the ding-dong sound.'}</p></div>;
}
