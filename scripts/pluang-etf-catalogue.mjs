import {readFile} from 'node:fs/promises';

// Listing discovery is independent of quotes, histories, and portfolio records.
export const PLUANG_ETF_CATALOGUE=JSON.parse(await readFile(new URL('../pages/pluang-etf-catalogue.json',import.meta.url),'utf8'));
export function seedPluangCatalogue(instruments,catalogue=PLUANG_ETF_CATALOGUE){
 for(const entry of catalogue.records){
  let item=instruments.find(i=>i.market==='US'&&i.ticker===entry.ticker);
  if(!item){item={ticker:entry.ticker,market:'US',name:entry.name,currency:'USD',instrumentType:null,marketCap:null,source:'Pluang catalogue; price verification pending'};instruments.push(item);}
  Object.assign(item,{pluangListed:true,pluangName:entry.name,pluangCatalogueRetrievedAt:catalogue.retrievedAt});
 }
 return instruments;
}
export function pluangCatalogueCoverage(instruments,catalogue=PLUANG_ETF_CATALOGUE){
 const entries=instruments.filter(i=>i.pluangListed);
 return {source:catalogue.source,retrievedAt:catalogue.retrievedAt,discovered:catalogue.records.length,listed:entries.length,priced:entries.filter(i=>i.priceAvailable).length,historyPublished:entries.filter(i=>i.historyPublished).length,modelReady:entries.filter(i=>i.modelCutoff).length,unavailable:entries.filter(i=>!i.priceAvailable).map(i=>i.ticker).sort(),completeness:catalogue.completeness};
}
