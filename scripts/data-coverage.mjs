import {validatePublicQuote} from '../public-quote-contract.js';
import {readFile,writeFile} from 'node:fs/promises';
import {buildCoverageReport} from '../data-coverage.js';
import {validateMacroFeed} from '../macro-contract.js';
import {validateMacroContext} from '../macro-context-contract.js';
import {validateMacroReleases} from '../macro-releases-contract.js';
import {validateMacroExtended} from '../macro-extended-contract.js';
import {validateOfficialRates} from '../official-rates-contract.js';
import {validateFxHistory} from '../fx-history-contract.js';
import {validateMarketHistories} from '../market-history-contract.js';
import {validateSecFeed} from '../sec-fundamentals-contract.js';
const definitions={macro:validateMacroFeed,'macro-context':validateMacroContext,'macro-releases':validateMacroReleases,'macro-extended':validateMacroExtended,'official-rates':validateOfficialRates,'fx-history':validateFxHistory,'market-history':validateMarketHistories,'sec-fundamentals':validateSecFeed,manifest:x=>x,market:x=>x,fundamentals:x=>x};
export async function writeCoverageReport(directory){const s=Object.fromEntries(await Promise.all(Object.entries(definitions).map(async([name,validate])=>[name,validate(JSON.parse(await readFile(directory+'/'+name+'.json','utf8')))])));if(s.manifest.format!=='longhand-public-market-data'||s.manifest.version!==1||!Array.isArray(s.manifest.histories)||!Array.isArray(s.manifest.instruments)||s.fundamentals.format!=='longhand-public-fundamentals'||s.fundamentals.version!==1||!Array.isArray(s.fundamentals.records)||!s.market.quotes||Array.isArray(s.market.quotes)||s.market.publishedAt!==s.manifest.publishedAt||s.fundamentals.publishedAt!==s.manifest.publishedAt)throw Error('Coverage source publications do not match.');for(const [key,item]of Object.entries(s.market.quotes)){if(item.quote){const [category,symbol]=key.split(':');validatePublicQuote(item.quote,category,symbol,s.market.publishedAt);}}const report=buildCoverageReport(s);await writeFile(directory+'/data-coverage.json',JSON.stringify(report));return report;}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/scripts/data-coverage.mjs')||process.argv[1]==='scripts/data-coverage.mjs'){const r=await writeCoverageReport('.pages-data');console.log(JSON.stringify({series:r.summary.series,available:r.summary.available,unavailable:r.summary.unavailable}));}
