import fs from 'node:fs';
import webpush from 'web-push';
const file='.env.local';
let contents=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
const present=name=>new RegExp('^'+name+'=.+','m').test(contents);
if(!present('VAPID_PUBLIC_KEY')||!present('VAPID_PRIVATE_KEY')){
 const keys=webpush.generateVAPIDKeys();
 contents=contents.replace(/^VAPID_(PUBLIC|PRIVATE)_KEY=.*\r?\n?/gm,'');
 contents+='\nVAPID_PUBLIC_KEY='+keys.publicKey+'\nVAPID_PRIVATE_KEY='+keys.privateKey+'\n';
}
if(!present('VAPID_SUBJECT')){
 const owner=contents.match(/^CAFE_OWNER_EMAIL=(.+)$/m)?.[1].trim().replace(/^['"]|['"]$/g,'');
 if(!owner)throw Error('Set CAFE_OWNER_EMAIL before configuring notifications.');
 contents+='VAPID_SUBJECT=mailto:'+owner+'\n';
}
fs.writeFileSync(file,contents);
console.log('Notification keys saved privately in .env.local. Copy the three VAPID values into Vercel environment variables, then redeploy. Do not commit or share the private key.');
