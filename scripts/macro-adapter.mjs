import {readFile} from 'node:fs/promises';
import {collectMacro} from './macro-data.mjs';
import {validateMacroFeed} from '../macro-contract.js';
export const MACRO_REFRESH_MS=15*60*1000;
// Single flight and a bounded refresh cadence. Only fixed public sources are queried.
export function createMacroReader({collect=collectMacro,readPublished=async()=>JSON.parse(await readFile(new URL('../.pages-data/macro.json',import.meta.url),'utf8')),now=Date.now}={}){
 let cached=null,pending=null,checkedAt=-Infinity;
 return async()=>{
  if(cached&&now()-checkedAt<MACRO_REFRESH_MS)return cached;
  if(pending)return pending;
  pending=(async()=>{
   let published;try{published=validateMacroFeed(await readPublished(),now());}catch{}
   const feed=published&&now()-Date.parse(published.generatedAt)<MACRO_REFRESH_MS?published:validateMacroFeed(await collect(),now());
   cached=feed;checkedAt=now();return feed;
  })();
  try{return await pending;}finally{pending=null;}
 };
}
export const readMacroSnapshot=createMacroReader();
