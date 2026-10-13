"use client";
import {useEffect,useState} from 'react';
import {Bell,ChevronRight} from 'lucide-react';
import {cafeDay,paymentReminders} from '../lib/payroll';
export default function PaymentReminders({payroll,currency,leadDays,onReview}:{payroll:any[];currency:string;leadDays:number;onReview:()=>void}){
 const [today,setToday]=useState(cafeDay);useEffect(()=>{const timer=setInterval(()=>setToday(cafeDay()),60000);const update=()=>setToday(cafeDay());window.addEventListener('focus',update);return()=>{clearInterval(timer);window.removeEventListener('focus',update)}},[]);
 const reminders=paymentReminders(payroll,today,leadDays);
 const date=(day:string)=>new Date(day+'T00:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
 const label=(n:number)=>n<0?'Overdue by '+Math.abs(n)+' day'+(n===-1?'':'s'):n===0?'Due today':n===1?'Due tomorrow':'Due in '+n+' days';
 return <section className="card payment-reminders" aria-label="Payment reminders"><div className="section-head"><div><h2><Bell size={18}/> Payment reminders <span className="count">{reminders.length}</span></h2><p>Individual 30-day cycles · Remind from {leadDays===2?2:3} days before payday</p></div><button className="text-btn" onClick={onReview}>Review payroll <ChevronRight size={16}/></button></div>{reminders.length?<ul className="reminder-list">{reminders.map(e=><li key={e.id} className={e.daysUntil<=0?'reminder-overdue':e.daysUntil<=2?'reminder-urgent':''}><div><strong>{e.name}</strong><small>Payment due {date(e.end)}</small></div><span className={'badge '+(e.daysUntil<=2?'amber':'muted')}>{label(e.daysUntil)}</span><div className="reminder-amount"><strong>{new Intl.NumberFormat('en-GB',{style:'currency',currency,maximumFractionDigits:2}).format(e.amount)}</strong><small>Calculated so far{e.open?' · Check-out pending':''}</small></div></li>)}</ul>:<div className="quiet-empty">No payments due within the next {leadDays===2?2:3} days.</div>}</section>
}
