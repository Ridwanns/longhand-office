import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {briefingReadings} from '../macro-briefing.js';
import {buildMacroOutlook} from '../macro-forecast.js';
const read=async file=>JSON.parse(await readFile('.pages-data/'+file+'.json','utf8'));
const sources={context:await read('macro-context'),releases:await read('macro-releases'),extended:await read('macro-extended'),legacy:await read('macro')},asOf=Date.now(),cases=[];
for(const country of ['IDN','USA','EMU','CHN','JPN','MYS']){
 const result=buildMacroOutlook(briefingReadings({...sources,country}),{country,asOf});
 for(const [metric,m]of Object.entries(result.metrics))if(m.available)cases.push({country,metric,values:m.history.map(o=>o.value),model:m.model,points:m.points});
 if(country==='IDN'&&(!result.metrics.gdp.available||!result.metrics.inflation.available))throw Error('Indonesia forecast source history unavailable; do not publish an empty substitute.');
}
await mkdir('.tools',{recursive:true});await writeFile('.tools/macro-outlook-audit.json',JSON.stringify({asOf:new Date(asOf).toISOString(),cases}));console.log(JSON.stringify({scope:'Current-vintage macro model arithmetic; no future accuracy claim',cases:cases.length}));
