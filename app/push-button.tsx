"use client";
import {useState} from 'react';
export default function PushButton(){const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function enable(){setBusy(true);setMessage('');try{
 if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window))throw Error('On iPhone, add Café Team to your Home Screen and open that icon. Requires iOS 16.4 or later.');
 const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('Allow notifications in your phone settings to receive overtime and break reminders.');
 const r=await fetch('/api/push');const s=await r.json();if(!r.ok)throw Error(s.error);if(!s.configured)throw Error('The owner needs to finish notification setup first.');
 const registration=await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;
 const bytes=Uint8Array.from(atob(s.publicKey.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
 const subscription=await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
 const save=await fetch('/api/push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscription:subscription.toJSON()})});const result=await save.json();if(!save.ok)throw Error(result.error);setMessage('Notifications enabled for this phone and staff account.');
 }catch(e:any){setMessage(e.message)}finally{setBusy(false)}}
 return <div><button className="secondary full" disabled={busy} onClick={enable}>{busy?'Setting up…':'Enable phone notifications'}</button><p className="help" role="status">{message||'Enable on your own phone while signed in with your own staff account. iPhone: open the Home Screen app first.'}</p></div>
}
