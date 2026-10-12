// Some Windows hosts reject native realpath on files while the portable
// implementation can resolve the same permitted path. Preserve native behavior
// unless it reports EPERM, then let the portable implementation enforce access.
import fs from 'node:fs';
if(process.platform==='win32'){
 const native=fs.realpathSync.native;
 fs.realpathSync.native=function(path,options){try{return native(path,options)}catch(error){if(error.code!=='EPERM')throw error;return fs.realpathSync(path,options)}};
}
