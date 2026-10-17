import assert from 'node:assert/strict';
import {loadData} from '../lib/load-data.ts';
const original=globalThis.fetch;
let closed=false,reads=0;
try{
 globalThis.fetch=async(url,options)=>{assert.equal(options.cache,'no-store');reads++;return Response.json({role:'owner',attendance:[{id:'a',clockOut:closed?'2026-10-17T08:00:00Z':null}]})};
 assert.equal((await loadData()).attendance[0].clockOut,null);
 closed=true;
 assert.equal((await loadData()).attendance[0].clockOut,'2026-10-17T08:00:00Z');
 assert.equal(reads,2);
 const controller=new AbortController();controller.abort();
 globalThis.fetch=async(url,options)=>{assert.equal(options.signal.aborted,true);throw new DOMException('Aborted','AbortError')};
 await assert.rejects(loadData(controller.signal),/Loading took too long/);
 globalThis.fetch=async()=>Response.json({error:'Please sign in again.'},{status:401});
 await assert.rejects(loadData(),/Please sign in again/);
 console.log('Attendance refresh checks passed: uncached check-out updates, cancellation and visible sign-in errors.');
}finally{globalThis.fetch=original}
