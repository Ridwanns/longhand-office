import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {validateMacroContext} from '../macro-context-contract.js';
import {validateMacroReleases} from '../macro-releases-contract.js';
import {validateMacroExtended} from '../macro-extended-contract.js';
import {validateMacroFeed} from '../macro-contract.js';

// The baseline is read only from a preceding successful full Pages artifact.
// Retention is per failed series; successful new acquisitions stay untouched.
export function retainMacroSeries(current,previous,validate){
 validate(current);if(!previous)return current;validate(previous);
 if(Date.parse(previous.generatedAt)>Date.parse(current.generatedAt))throw Error('Macro baseline is newer than the attempted publication.');
 return validate({...current,series:current.series.map(item=>{
  if(!item.error)return item;
  const old=previous.series.find(p=>p.id===item.id);
  if(!old||old.error||!old.observations.some(o=>Number.isFinite(o.value))||Date.parse(old.retrievedAt)>Date.parse(item.retrievedAt))return item;
  // Preserve original response hash, complete observations and retrieval date.
  return {...old,refreshError:item.error,refreshAttemptAt:item.retrievedAt,retainedFromGeneratedAt:previous.generatedAt};
 })});
}
export async function retainMacroData(directory='.pages-data',baseline='.tools/source-baseline'){
 const report=[];
 for(const [name,validate] of [['macro',validateMacroFeed],['macro-context',validateMacroContext],['macro-releases',validateMacroReleases],['macro-extended',validateMacroExtended]]){
  const current=JSON.parse(await readFile(directory+'/'+name+'.json','utf8'));
  let previous=null;try{previous=JSON.parse(await readFile(baseline+'/'+name+'.json','utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
  const feed=retainMacroSeries(current,previous,validate);await writeFile(directory+'/'+name+'.json',JSON.stringify(feed));
  report.push({feed:name,retained:feed.series.filter(s=>s.refreshError).length,unavailable:feed.series.filter(s=>s.error).length});
 }
 console.log(JSON.stringify({macroSourceRetention:report}));return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await retainMacroData();
