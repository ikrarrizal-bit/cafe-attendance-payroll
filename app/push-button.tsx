"use client";
import {useEffect,useRef,useState} from 'react';
export default function PushButton(){const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[enabled,setEnabled]=useState(false),[checking,setChecking]=useState(true);
 const revision=useRef(0);
 useEffect(()=>{let disposed=false,inFlight=false;async function check(){if(inFlight||document.visibilityState==='hidden')return;inFlight=true;const observed=revision.current;try{
 if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window)||Notification.permission!=='granted'){if(!disposed&&observed===revision.current)setEnabled(false);return}
 const registration=await navigator.serviceWorker.getRegistration('/sw.js');const subscription=await registration?.pushManager.getSubscription();if(!subscription){if(!disposed)setEnabled(false);return}
 const r=await fetch('/api/push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'status',subscription:subscription.toJSON()}),signal:AbortSignal.timeout(15000)});const result=await r.json();if(!r.ok)throw Error(result.error);if(!disposed){setEnabled(result.enabled===true);if(result.enabled)setMessage('');}
 }catch(e:any){if(!disposed){setEnabled(false);setMessage('Could not confirm notification status. '+e.message)}}finally{inFlight=false;if(!disposed)setChecking(false)}}
 void check();window.addEventListener('focus',check);document.addEventListener('visibilitychange',check);return()=>{disposed=true;window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check)};},[]);
 async function enable(){revision.current++;setBusy(true);setMessage('');try{
 if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window))throw Error('On iPhone, add Café Team to your Home Screen and open that icon. Requires iOS 16.4 or later.');
 const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('Allow notifications in your phone settings to receive overtime and break reminders.');
 const r=await fetch('/api/push');const s=await r.json();if(!r.ok)throw Error(s.error);if(!s.configured)throw Error('The owner needs to finish notification setup first.');
 const registration=await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;
 const bytes=Uint8Array.from(atob(s.publicKey.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
 const subscription=await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
 const save=await fetch('/api/push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscription:subscription.toJSON()})});const result=await save.json();if(!save.ok)throw Error(result.error);revision.current++;setEnabled(true);setMessage('Notifications enabled for this phone and staff account.');
 }catch(e:any){setMessage(e.message)}finally{setBusy(false)}}
 if(enabled)return <p className="help" role="status">Phone notifications enabled.</p>;
 return <div><button className="secondary full" disabled={busy||checking} onClick={enable}>{checking?'Checking notifications…':busy?'Setting up…':'Enable phone notifications'}</button><p className="help" role="status">{message||'Enable on your own phone while signed in with your own staff account. iPhone: open the Home Screen app first.'}</p></div>
}
