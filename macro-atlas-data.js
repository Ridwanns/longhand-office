// Presentation selections over the existing validated feed; no new observations or estimates.
import {MACRO_SERIES,ASEAN_COUNTRIES,periodIndex,seriesSummary} from './macro-contract.js';
export const ATLAS_INDICATORS={gdp:'GDP growth',cpi:'Inflation',policy:'Policy rate',yield:'10Y yield'};
export const ATLAS_GROUPS={EMU:'Euro area',WLD:'World'};
export const ATLAS_COUNTRIES={USA:'United States',IDN:'Indonesia',...Object.fromEntries(Object.entries(ASEAN_COUNTRIES).filter(([id])=>id!=='IDN'))};
export function atlasCountry(selection){if(selection.economy)return selection.economy;return selection.region==='us'?'USA':selection.region==='eu'?'EMU':selection.region==='global'?'WLD':selection.region==='asean'?selection.country:'IDN';}
export function atlasRoute(country,view='overview'){
 const region=country==='USA'?'us':country==='IDN'?'id':country==='EMU'?'eu':country==='WLD'?'global':Object.hasOwn(ASEAN_COUNTRIES,country)?'asean':null;
 return region?'#market/macro/'+region+'/'+view+(region==='asean'?'/'+country:''):null;
}
export function atlasSeries(feed,country,indicator){
 if(!['gdp','cpi'].includes(indicator))return null;
 const prefix=country==='IDN'?'id':country==='USA'?'us':country==='EMU'?'eu':'annual-'+country;
 return feed.series.find(s=>s.id===prefix+'-'+indicator)||null;
}
export function atlasObservation(feed,country,indicator,rates=null,now=Date.now()){
 const series=atlasSeries(feed,country,indicator);
 if(series){const summary=seriesSummary(series,now),spec=MACRO_SERIES[series.id];return {available:summary.available,value:summary.available?summary.latest.value:null,period:summary.latest?.period||null,frequency:spec.frequency,unit:'% YoY',source:spec.source,sourceUrl:summary.latest?.sourceUrl||spec.url,retrievedAt:series.retrievedAt,status:summary.latest?.status||null,outdated:summary.outdated,reason:summary.reason,series};}
 if(indicator==='yield'&&country==='USA'&&rates&&!rates.error){const latest=rates.observations.at(-1),value=latest?.rates['10 Yr'];return {available:Number.isFinite(value),value:Number.isFinite(value)?value:null,period:latest?.date||null,frequency:'D',unit:'% per year',source:'US Department of the Treasury',sourceUrl:rates.sourceUrl,retrievedAt:rates.retrievedAt,status:'reported',outdated:!!latest&&(now-Date.parse(latest.date))/86400000>7,reason:Number.isFinite(value)?null:'10-year yield not reported.',series:null};}
 return {available:false,value:null,period:null,frequency:null,unit:indicator==='yield'?'% per year':'%',source:null,sourceUrl:null,retrievedAt:null,status:null,outdated:false,reason:indicator==='policy'?'No validated numerical policy-rate feed is connected.':indicator==='yield'?'No validated 10-year sovereign yield series is connected for this selection.':'No macro series is connected for this country.',series:null};
}
export function atlasBin(value,indicator){if(!Number.isFinite(value))return 'no-data';if(indicator==='gdp')return value<0?'contracting':value<2?'low':value<4?'moderate':'high';return value<0?'contracting':value<2?'low':value<4?'moderate':'high';}
export function atlasWindow(series,range){if(!series)return [];const end=series.observations.at(-1);if(!end)return [];if(range==='all')return series.observations.slice();const frequency=MACRO_SERIES[series.id].frequency,periods=({A:1,Q:4,M:12}[frequency])*(range==='3y'?3:1),last=periodIndex(end.period,frequency);return series.observations.filter(o=>periodIndex(o.period,frequency)>last-periods);}
