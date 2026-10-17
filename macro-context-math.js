// New descriptive macro context only. No portfolio or research-model calculation is changed.
import {CONTEXT_SERIES} from './macro-context-contract.js';
export const contextSeries=(feed,id)=>feed?.series.find(s=>s.id===id)||null;
export function contextSummary(series,now=Date.now()){
 const spec=CONTEXT_SERIES[series?.id];if(!spec||series.error)return {available:false,latest:null,reason:series?.error||'Source not connected',outdated:false};
 // Annual context may show the latest reported year, explicitly retaining any later missing year.
 const supplied=series.observations.at(-1),latest=spec.frequency==='A'?series.observations.findLast(o=>Number.isFinite(o.value)):supplied;
 const available=Number.isFinite(latest?.value),age=available?(now-Date.parse(latest.date))/86400000:0;
 return {available,latest:latest||supplied||null,supplied,outdated:available&&(age>({D:10,W:21,M:100,Q:240,E:100,A:1100}[spec.frequency])||now-Date.parse(series.retrievedAt)>10*86400000),reason:available?null:'Latest observation not reported',laterMissing:!!latest&&supplied?.date>latest.date};
}
export function annualCycle(feed,country){
 const g=contextSeries(feed,'wdi-'+country+'-gdp'),c=contextSeries(feed,'wdi-'+country+'-inflation');if(g?.error||c?.error||!g||!c)return [];
 const gm=new Map(g.observations.map(o=>[o.date.slice(0,4),o.value])),cm=new Map(c.observations.map(o=>[o.date.slice(0,4),o.value]));
 return [...gm].flatMap(([year,growth])=>{const prior=String(Number(year)-1),inflation=cm.get(year),pg=gm.get(prior),pc=cm.get(prior);if(![growth,inflation,pg,pc].every(Number.isFinite))return [];const growthChange=growth-pg,inflationChange=inflation-pc;return [{year,growth,inflation,growthChange,inflationChange,state:(growthChange===0?'Growth unchanged':growthChange>0?'Growth accelerating':'Growth slowing')+', '+(inflationChange===0?'inflation unchanged':inflationChange>0?'inflation rising':'inflation easing')}];});
}
export function alignedContext(feed,ids,calculate){
 const sources=ids.map(id=>contextSeries(feed,id));if(sources.some(s=>!s||s.error))return [];
 const maps=sources.map(s=>new Map(s.observations.map(o=>[o.date,o.value])));
 return sources[0].observations.flatMap(o=>{const values=maps.map(m=>m.get(o.date));if(!values.every(Number.isFinite))return [];const value=calculate(values);return Number.isFinite(value)?[{date:o.date,value}]:[];});
}
export const liquidityProxy=feed=>alignedContext(feed,['fed-assets','treasury-cash','reverse-repo'],([assets,cash,repo])=>assets-cash-repo);
export const yieldSpread=feed=>alignedContext(feed,['us-10y','us-2y'],([ten,two])=>(ten-two)*100);
export function previousChange(series){
 const rows=series?.observations||[],latest=rows.at(-1),prior=rows.at(-2),frequency=CONTEXT_SERIES[series?.id]?.frequency;
 if(!Number.isFinite(latest?.value)||!Number.isFinite(prior?.value))return null;
 const months=o=>Number(o.date.slice(0,4))*12+Number(o.date.slice(5,7));
 if(frequency==='M'&&months(latest)-months(prior)!==1||frequency==='Q'&&months(latest)-months(prior)!==3||frequency==='A'&&months(latest)-months(prior)!==12)return null;
 return {value:latest.value-prior.value,priorDate:prior.date,latestDate:latest.date};
}
export function contextWindow(rows,range){
 if(range==='all'||!rows.length)return rows.slice();const end=rows.at(-1).date,year=Number(end.slice(0,4))-(range==='5y'?5:range==='3y'?3:1),cutoff=year+end.slice(4);return rows.filter(o=>o.date>=cutoff);
}
export function sampleContextRows(rows,target=600){
 if(rows.length<=target)return rows.slice();const indices=new Set([0,rows.length-1]),size=Math.ceil(rows.length/(target/4));
 for(let start=0;start<rows.length;start+=size){const end=Math.min(start+size,rows.length);indices.add(start);indices.add(end-1);let low=null,high=null;for(let i=start;i<end;i++){if(!Number.isFinite(rows[i].value)){indices.add(i);if(i+1<rows.length)indices.add(i+1);continue;}if(low===null||rows[i].value<rows[low].value)low=i;if(high===null||rows[i].value>rows[high].value)high=i;}if(low!==null)indices.add(low);if(high!==null)indices.add(high);}
 return [...indices].sort((a,b)=>a-b).map(i=>rows[i]);
}
export function upcomingReleases(calendar,now=Date.now(),days=45){
 if(calendar?.error)return [];const today=new Date(now).toISOString().slice(0,10),end=new Date(now+days*86400000).toISOString().slice(0,10);return (calendar?.events||[]).filter(e=>e.date>=today&&e.date<=end);
}
export function contextAtlasDatum(feed,country,indicator,now=Date.now()){
 const id=indicator==='policy'?({IDN:'id-policy',USA:'us-policy',EMU:'eu-policy'}[country]):['gdp','cpi'].includes(indicator)?'wdi-'+country+'-'+(indicator==='gdp'?'gdp':'inflation'):null;
 const s=contextSeries(feed,id),spec=CONTEXT_SERIES[id];if(!s||!spec)return null;const m=contextSummary(s,now);
 return {available:m.available,value:m.available?m.latest.value:null,period:m.latest?(spec.frequency==='A'?m.latest.date.slice(0,4):m.latest.date):null,frequency:spec.frequency,unit:spec.unit,source:spec.source,sourceUrl:spec.sourceUrl,retrievedAt:s.retrievedAt,status:m.latest?.status||'as published',outdated:m.outdated,reason:m.reason||'',series:null,contextSeries:s,basis:spec.title+(m.laterMissing?' · later supplied year not reported':'')};
}
