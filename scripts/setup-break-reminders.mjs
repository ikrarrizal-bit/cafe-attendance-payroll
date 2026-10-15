import fs from 'node:fs';
import {randomBytes} from 'node:crypto';
const file='.env.local';
let contents=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
if(!/^CRON_SECRET=.+/m.test(contents)){
 contents=contents.replace(/^CRON_SECRET=.*\r?\n?/gm,'');
 contents+='\nCRON_SECRET='+randomBytes(32).toString('hex')+'\n';
 fs.writeFileSync(file,contents);
}
console.log('Break reminder secret is ready in .env.local. Add CRON_SECRET to Vercel Production and redeploy. Keep its value private.');
