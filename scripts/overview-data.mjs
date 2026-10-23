import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {validateOverviewFeed,OVERVIEW_MARKETS} from '../overview-contract.js';
import {validateMarketHistories} from '../market-history-contract.js';
import {validateMacroFeed} from '../macro-contract.js';
import {validateMacroContext} from '../macro-context-contract.js';
import {validateMacroReleases} from '../macro-releases-contract.js';
import {validateMacroExtended} from '../macro-extended-contract.js';
import {validateOfficialRates} from '../official-rates-contract.js';
import {validateFxHistory} from '../fx-history-contract.js';
import {briefingReadings} from '../macro-briefing.js';
export async function writeOverviewSnapshot(directory,destination){
 const read=async name=>JSON.parse(await readFile(path.join(directory,name+'.json'),'utf8'));
 const [history,legacy,context,releases,extended,fx,rates]=await Promise.all([read('market-history').then(validateMarketHistories),read('macro').then(validateMacroFeed),read('macro-context').then(validateMacroContext),read('macro-releases').then(validateMacroReleases),read('macro-extended').then(validateMacroExtended),read('fx-history').then(validateFxHistory),read('official-rates').then(validateOfficialRates)]);
 const markets=OVERVIEW_MARKETS.map(({category,symbol})=>{const s=history.entries.find(e=>e.category===category&&e.symbol===symbol);return s?.quote?{category,symbol,quote:{...s.quote,history:s.quote.history.slice(-370)},...(s.refreshError?{refreshError:s.refreshError}:{})}:{category,symbol,error:s?.error||'Published history unavailable'};});
 const macro=['IDN','USA'].map(country=>({country,readings:briefingReadings({releases,legacy,extended,context,country}).map(r=>({key:r.key,label:r.label,items:r.items.map(s=>({...s,observations:s.observations.slice(-120)}))}))}));
 const fxSource=fx.entries.find(e=>e.id==='FX_IDC:USDIDR'&&!e.error),fxLast=fxSource?.observations.findLast(o=>Number.isFinite(o.value)),rate=rates.observations.findLast(o=>Number.isFinite(o.rates['10 Yr']));
 const extra=[...(fxLast?[{key:'USDIDR',label:'USD/IDR',value:fxLast.value,date:fxLast.date,unit:'IDR per USD',retrievedAt:fxSource.retrievedAt,sourceUrl:fxSource.sourceUrl}]:[]),...(rate?[{key:'UST10Y',label:'US Treasury 10Y',value:rate.rates['10 Yr'],date:rate.date,unit:'% par yield',retrievedAt:rates.retrievedAt,sourceUrl:rates.sourceUrl}]:[])];
 const snapshot=validateOverviewFeed({format:'longhand-overview',version:1,assembledAt:new Date().toISOString(),marketPublishedAt:history.publishedAt,markets,macro,context:extra});
 await writeFile(destination,JSON.stringify(snapshot));return snapshot;
}
