"use client";
import {useEffect,useState} from 'react';
export default function Logout(){const [error,setError]=useState('');useEffect(()=>{fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})}).then(r=>{if(!r.ok)throw Error('Could not sign out.');window.location.replace('/login')}).catch(e=>setError(e.message))},[]);return <div className="staff-shell">{error||'Signing out…'}</div>}
