// Rebuild the data of the ported design sheets from a .pages-data snapshot and publish it as JSON.
// The builders in design/build are the same ones that produced the design preview; LH_SHEET_OUT points every file they
// generate at a scratch folder, so the committed preview is never touched. Each window.NAME=... output is published
// as sheet-data/<name>.json (and the Markets per-instrument histories as sheet-data/mk/*.json), fetched without caching.
// If a builder fails, that sheet keeps the committed design snapshot (with its own dates) so a deploy never breaks;
// the failure is reported in the build log.
import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,readFile,writeFile,copyFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
const GROUPS=[
 {name:'macro',files:['countries','macro-sheet','cycles','calendar'],steps:(root,input,now)=>[['build_atlas_rates.mjs',root,input,now],['build_atlas.mjs',root,input,now],['build_countries.mjs',root,path.join(root,'design')],['build_cycles.mjs',root],['build_macro_sheet.mjs',root,input,now],['build_calendar.mjs',root,input]]},
 {name:'markets',files:['markets-sheet'],histories:true,steps:root=>[['build_markets_sheet.mjs',root]]}];
const json=async(file,name)=>{const text=await readFile(file,'utf8'),start=text.search(/window\.[A-Z]+=/);if(start<0)throw Error('Sheet data '+name+' has no window assignment.');const body=text.slice(text.indexOf('=',start)+1).trim().replace(/;$/,'');JSON.parse(body);return body;};
async function publish(from,group,dest){
 for(const name of group.files)await writeFile(path.join(dest,name+'.json'),await json(path.join(from,name+'.js'),name));
 if(group.histories){await mkdir(path.join(dest,'mk'),{recursive:true});for(const f of await readdir(path.join(from,'mk')))if(/^[A-Za-z0-9_.-]+\.json$/.test(f))await copyFile(path.join(from,'mk',f),path.join(dest,'mk',f));}
}
export async function buildSheetData(root,input,dest,now=new Date().toISOString()){
 await mkdir(dest,{recursive:true});const report={};
 for(const group of GROUPS){
  const out=await mkdtemp(path.join(tmpdir(),'longhand-sheets-'));
  try{
   // the atlas builders compare against their previous output, so they start from the committed one
   await copyFile(path.join(root,'design','preview','atlas.js'),path.join(out,'atlas.js'));
   await copyFile(path.join(root,'design','build','atlas-rates.json'),path.join(out,'atlas-rates.json'));
   const env={...process.env,LH_SHEET_OUT:out};
   for(const [file,...args] of group.steps(root,input,now))execFileSync(process.execPath,[path.join(root,'design','build',file),...args],{cwd:root,env,stdio:['ignore','pipe','pipe'],timeout:180000});
   await publish(out,group,dest);report[group.name]='rebuilt';
  }catch(error){
   console.warn('Sheet data '+group.name+' could not be rebuilt ('+String(error.stderr||error.message).split('\n').filter(Boolean).slice(-1)[0]+'); keeping the committed design snapshot.');
   await publish(path.join(root,'design','preview'),group,dest);report[group.name]='committed snapshot';
  }finally{await rm(out,{recursive:true,force:true});}
 }
 return report;
}
