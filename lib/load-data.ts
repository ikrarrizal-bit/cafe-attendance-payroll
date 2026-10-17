// Only reads use this timeout. Mutations retain their existing completion flow.
export async function loadData(){
 try{
  const response=await fetch('/api/data',{cache:'no-store',signal:AbortSignal.timeout(20000)});
  const type=response.headers.get('content-type')||'';
  if(!type.includes('application/json'))throw new Error('The app returned an unexpected response. Refresh the page and check the development terminal.');
  const data:any=await response.json();
  if(response.status===428&&typeof window!=='undefined')window.location.assign('/account/password');
  if(!response.ok)throw new Error(data.error||'Could not load the café workspace.');
  return data;
 }catch(error:any){if(error.name==='TimeoutError'||error.name==='AbortError')throw new Error('Loading took too long. Check your internet connection, then click Try again.');throw error}
}
