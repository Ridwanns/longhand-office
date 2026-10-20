import {isContextDay} from './macro-context-contract.js';
const bi=(slug,lang='en')=>'https://www.bi.go.id/'+lang+'/publikasi/ruang-media/news-release/Pages/'+slug+'.aspx';
export const INDICATOR_REVIEWED_AT='2026-10-20T12:50:07.847Z';
export const MACRO_INDICATORS={};
for(const [id,title,group,unit,frequency,url,method]of [
 ['id-cci','Consumer confidence','Activity and sentiment','Index, 100 = neutral','M',bi('sp_2821626'),'BI consumer survey; not a national production measure.'],
 ['id-cei','Consumer expectations','Activity and sentiment','Index, 100 = neutral','M',bi('sp_2821626'),'Consumer survey expectations index, not realized GDP.'],
 ['id-ceci','Current economic conditions','Activity and sentiment','Index, 100 = neutral','M',bi('sp_2821626'),'BI household survey of current conditions.'],
 ['id-retail','Real retail sales growth','Activity and sentiment','% YoY','M',bi('sp_2821726'),'Actual July/August sales growth reported by BI. September expectation is excluded from actual history.'],
 ['id-pmi-bi','PMI-BI, quarterly manufacturing survey','Activity and sentiment','Index, 50 = neutral','Q',bi('sp_2823126','id'),'BI quarterly Prompt Manufacturing Index. Not S&P Global monthly PMI. Expected Q4 is not an actual observation.'],
 ['id-business','Business activity, weighted net balance','Activity and sentiment','% weighted net balance','Q',bi('sp_2823026','id'),'BI business survey. Weighted net balance is not GDP growth. Expected Q4 is excluded.'],
 ['id-capacity','Production capacity utilisation','Activity and sentiment','% capacity','Q',bi('sp_2823026','id'),'Realised BI business-survey capacity utilisation.'],
 ['id-m2','Broad money M2','Money and credit','IDR tn','M',bi('sp_2819526','id'),'Nominal broad money level reported by BI, trillions of rupiah.'],
 ['id-m2-growth','Broad money growth','Money and credit','% YoY','M',bi('sp_2819526','id'),'Reported M2 annual growth, not a monthly change.'],
 ['id-credit','Credit growth, BI monetary statistics','Money and credit','% YoY','M',bi('sp_2819526','id'),'Credit growth under BI monetary-statistics coverage; not substituted for differently defined OJK lending statistics.'],
 ['id-reserves-monthly','Official reserve assets, month end','External accounts','USD bn','M',bi('sp_2821426'),'BI monthly official reserve assets; separate from annual WDI reserves.'],
 ['id-import-cover','Reserve coverage of goods imports','External accounts','Months of imports','M',bi('sp_2821426'),'Goods imports only. Import coverage including government debt service is a different measure.'],
 ['id-core','Core consumer inflation','Inflation composition','% YoY','M',bi('sp_2820926','id'),'BPS annual core inflation as reported by BI. Not monthly inflation.'],
 ['id-food','Volatile food inflation','Inflation composition','% YoY','M',bi('sp_2820926','id'),'BPS volatile-food component as reported by BI, not all food CPI.'],
 ['id-admin','Administered prices inflation','Inflation composition','% YoY','M',bi('sp_2820926','id'),'BPS administered-prices component as reported by BI.']
])MACRO_INDICATORS[id]={country:'IDN',title,group,unit,frequency,sourceUrl:url,source:'Bank Indonesia'+(group==='Inflation composition'?' reporting BPS data':''),provider:'reviewed',method};
for(const [id,code,title,group,unit,transform]of [
 ['id-industrial','IPTOTSAKD','Industrial production growth, seasonally adjusted','Activity and sentiment','% YoY','yoy'],
 ['id-exports','DXGSRMRCHNSCD','Merchandise exports, customs FOB','External accounts','USD bn','billions'],
 ['id-imports','DMGSRMRCHNSCD','Merchandise imports, customs CIF','External accounts','USD bn','billions'],
 ['id-trade-balance','TRADE_BALANCE','Merchandise trade balance, matched customs months','External accounts','USD bn','balance'],
 ['id-retail-gem','RETSALESSA','Retail sales volume, GEM history','Activity and sentiment','% YoY','yoy']
])MACRO_INDICATORS[id]={country:'IDN',title,group,unit,frequency:'M',provider:'gem',code,transform,source:'World Bank Global Economic Monitor',sourceUrl:'https://datacatalog.worldbank.org/infrastructure-data/search/dataset/0037798/global-economic-monitor',method:transform==='yoy'?'100 × (source level / exact same month one year earlier − 1). Original seasonal adjustment retained; missing months stay missing.':transform==='balance'?'Same-month exports FOB minus imports CIF, in current USD billions. Only matched numeric months are used. No substitute dates or countries.':'Current USD millions divided by 1,000. Not seasonally adjusted. Original customs valuation retained.'};
export const INDICATOR_GAPS=[['S&P Global manufacturing PMI','Licensed monthly series not connected; quarterly PMI-BI stays separately labelled.'],['Car and motorcycle sales','No validated association time series connected.'],['Producer prices','No validated current national PPI time series connected.'],['Foreign equity flows','No validated IDX exchange-wide net foreign-flow history connected.'],['Indonesia CDS 5Y','No entitled CDS feed connected.'],['Release consensus / surprise indices','No timestamped pre-release consensus archive connected. No surprises are inferred.']];
const stamp=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(s)&&Number.isFinite(Date.parse(s))&&isContextDay(s.slice(0,10));
export function validateMacroIndicators(feed,now=Date.now()){
 const fail=m=>{throw Error('Invalid supplementary macro indicators: '+m);};
 if(feed?.format!=='longhand-macro-indicators'||feed.version!==1||!stamp(feed.generatedAt)||Date.parse(feed.generatedAt)>now+300000||!Array.isArray(feed.series)||feed.series.length!==Object.keys(MACRO_INDICATORS).length)fail('header');const seen=new Set();
 for(const s of feed.series){const spec=MACRO_INDICATORS[s?.id];if(!spec||seen.has(s.id))fail('identity');seen.add(s.id);if(s.sourceUrl!==spec.sourceUrl||s.frequency!==spec.frequency||s.unit!==spec.unit||!stamp(s.retrievedAt)||s.retrievedAt>feed.generatedAt||!Array.isArray(s.observations)||s.observations.length>1000)fail('metadata');
  if(s.error){if(typeof s.error!=='string'||s.error.length>240||s.observations.length)fail('unavailable');continue;}
  if(!/^[a-f0-9]{64}$/.test(s.sourceHash||'')||!s.observations.length||spec.provider==='reviewed'&&s.retrievedAt!==INDICATOR_REVIEWED_AT)fail('provenance');let prior='';
  for(const o of s.observations){if(!isContextDay(o.date)||!o.date.endsWith('-01')||spec.frequency==='Q'&&!/^\d{4}-(01|04|07|10)-01$/.test(o.date)||o.date<=prior||o.date>s.retrievedAt.slice(0,10)||o.value!==null&&(!Number.isFinite(o.value)||Math.abs(o.value)>1e12)||!['reported','derived','missing'].includes(o.status)||(o.value===null)!==(o.status==='missing'))fail('observation');prior=o.date;
   if(spec.provider==='reviewed'&&(!isContextDay(o.releasedAt)||o.releasedAt<o.date||o.releasedAt>s.retrievedAt.slice(0,10)||!/^https:\/\/www\.bi\.go\.id\//.test(o.sourceUrl||'')))fail('reviewed release');
  }
 }
 if(feed.expectations!==undefined){if(!Array.isArray(feed.expectations)||feed.expectations.length>20)fail('survey expectations');const ids=new Set();for(const e of feed.expectations){const spec=MACRO_INDICATORS[e?.id],key=e.id+'|'+e.date;if(!spec||!['id-pmi-bi','id-business'].includes(e.id)||spec.provider!=='reviewed'||ids.has(key)||!isContextDay(e.date)||!/^\d{4}-(01|04|07|10)-01$/.test(e.date)||!Number.isFinite(e.value)||Math.abs(e.value)>100||e.status!=='survey-expectation'||e.sourceUrl!==spec.sourceUrl||!isContextDay(e.releasedAt)||e.releasedAt>INDICATOR_REVIEWED_AT.slice(0,10)||e.reviewedAt!==INDICATOR_REVIEWED_AT||!/^[a-f0-9]{64}$/.test(e.sourceHash||''))fail('survey expectation metadata');ids.add(key);}}
 return feed;
}
