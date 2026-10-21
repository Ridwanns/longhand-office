// Public macro observations only. Metadata is fixed here, never supplied by a remote feed.
import {validateMacroRetention} from './macro-context-contract.js';
export const MACRO_REGIONS={id:'Indonesia',us:'United States',eu:'Europe',asean:'ASEAN',global:'Global'};
export const ASEAN_COUNTRIES={IDN:'Indonesia',MYS:'Malaysia',SGP:'Singapore',THA:'Thailand',PHL:'Philippines',VNM:'Vietnam'};
export const WORLD_BANK_URL='https://api.worldbank.org/v2/country/IDN;USA;EMU;MYS;SGP;THA;PHL;VNM;WLD/indicator/NY.GDP.MKTP.KD.ZG;FP.CPI.TOTL.ZG?source=2&format=json&date=2020:2026&per_page=1000';
export const EURO_GDP_URL='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/namq_10_gdp?lang=en&geo=EA&na_item=B1GQ&unit=CLV_PCH_SM&s_adj=SCA&lastTimePeriod=12';
export const EURO_CPI_URL='https://data-api.ecb.europa.eu/service/data/HICP/M.U2.N.000000.4D0.ANR?format=csvdata&startPeriod=2020-01';
const fred=id=>'https://fred.stlouisfed.org/graph/fredgraph.csv?id='+id+'&cosd=2020-01-01';
export const MACRO_SERIES={
 'id-gdp':{title:'Real GDP growth',frequency:'Q',scope:'Indonesia',source:'BPS',url:'https://www.bps.go.id/en/pressrelease',method:'Reported year-on-year real GDP growth; not quarter-on-quarter growth.',acquisition:'reviewed-release'},
 'id-cpi':{title:'Headline CPI inflation',frequency:'M',scope:'Indonesia',source:'BPS',url:'https://www.bps.go.id/en/pressrelease',method:'Reported headline CPI year-on-year inflation; not core or month-on-month inflation.',acquisition:'reviewed-release'},
 'us-gdp':{title:'Real GDP growth',frequency:'Q',scope:'United States',source:'BEA via FRED · GDPC1',url:fred('GDPC1'),method:'100 × (real GDP level / level four quarters earlier − 1). Seasonally adjusted real levels; this is YoY, not annualized QoQ.',acquisition:'automatic'},
 'us-cpi':{title:'CPI inflation (seasonally adjusted)',frequency:'M',scope:'United States',source:'BLS via FRED · CPIAUCSL',url:fred('CPIAUCSL'),method:'100 × (CPI level / level twelve months earlier − 1). Derived from seasonally adjusted CPI; may differ from the unadjusted headline release.',acquisition:'automatic'},
 'eu-gdp':{title:'Real GDP growth',frequency:'Q',scope:'Euro area, changing composition',source:'Eurostat · namq_10_gdp',url:EURO_GDP_URL,method:'Reported YoY real GDP growth (CLV_PCH_SM); seasonally and calendar adjusted. Europe coverage is the euro area, not all European countries.',acquisition:'automatic'},
 'eu-cpi':{title:'HICP inflation',frequency:'M',scope:'Euro area, changing composition',source:'Eurostat via ECB · HICP',url:EURO_CPI_URL,method:'Reported annual rate of change; neither seasonally nor working-day adjusted. New HICP dataset; discontinued ICP is not used.',acquisition:'automatic'}
};
for(const [country,name] of Object.entries({...ASEAN_COUNTRIES,WLD:'World'}))for(const [metric,title,indicator] of [['gdp','Real GDP growth','NY.GDP.MKTP.KD.ZG'],['cpi','Consumer price inflation','FP.CPI.TOTL.ZG']])MACRO_SERIES['annual-'+country+'-'+metric]={title,frequency:'A',scope:name,source:'World Bank · WDI · '+indicator,url:WORLD_BANK_URL,indicator,country,method:'Reported annual percentage. Annual context only; not a current monthly or quarterly release. World aggregate follows the provider methodology.',acquisition:'automatic'};
const fail=s=>{throw Error('Invalid macro data: '+s);};
const stamp=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(s)&&Number.isFinite(Date.parse(s))&&day(s.slice(0,10));
const day=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
export function periodIndex(period,frequency){
 if(typeof period!=='string'||Number(period.slice(0,4))<1900||Number(period.slice(0,4))>2100)fail('invalid period year');
 let m;if(frequency==='M'&&(m=/^(\d{4})-(0[1-9]|1[0-2])$/.exec(period)))return Number(m[1])*12+Number(m[2])-1;
 if(frequency==='Q'&&(m=/^(\d{4})-Q([1-4])$/.exec(period)))return Number(m[1])*4+Number(m[2])-1;
 if(frequency==='A'&&/^\d{4}$/.test(period))return Number(period);
 fail('invalid observation period');
}
export function periodEnd(period,frequency){periodIndex(period,frequency);const year=Number(period.slice(0,4)),month=frequency==='M'?Number(period.slice(5)):frequency==='Q'?Number(period.at(-1))*3:12;return new Date(Date.UTC(year,month,0)).toISOString().slice(0,10);}
export function validateMacroFeed(input,now=Date.now()){
 if(!input||input.format!=='longhand-macro'||input.version!==1||!stamp(input.generatedAt)||Date.parse(input.generatedAt)>now+300000||!Array.isArray(input.series)||input.series.length!==Object.keys(MACRO_SERIES).length)fail('feed header');
 const ids=new Set();
 for(const s of input.series){if(!s||!Object.hasOwn(MACRO_SERIES,s.id)||ids.has(s.id))fail('unknown or duplicate series');const spec=MACRO_SERIES[s.id];ids.add(s.id);
  if(!stamp(s.retrievedAt)||Date.parse(s.retrievedAt)>Date.parse(input.generatedAt)||s.acquisition!==spec.acquisition||s.sourceUrl!==spec.url||!Array.isArray(s.observations)||s.observations.length>200)fail('series metadata');
  validateMacroRetention(s,input.generatedAt);
  if(s.error){if(typeof s.error!=='string'||s.error.length>240||s.observations.length)fail('failed series contains observations');continue;}
  if(!/^[a-f0-9]{64}$/.test(s.sourceHash)||!s.observations.length)fail('missing provenance or observations');
  let previous=-Infinity;
  for(const o of s.observations){const index=periodIndex(o.period,spec.frequency),end=periodEnd(o.period,spec.frequency);if(index<=previous||end>s.retrievedAt.slice(0,10))fail('duplicate, unsorted or future observation');previous=index;
   if(o.value!==null&&(typeof o.value!=='number'||!Number.isFinite(o.value)||Math.abs(o.value)>10000))fail('invalid value');
   if(!['reported','derived','estimate','provisional'].includes(o.status))fail('observation status');
   if(o.releasedAt!==null&&(!day(o.releasedAt)||o.releasedAt<end||o.releasedAt>s.retrievedAt.slice(0,10)))fail('release date');
   if(spec.acquisition==='reviewed-release'){let url;try{url=new URL(o.sourceUrl);}catch{fail('release source');}if(url.protocol!=='https:'||url.hostname!=='www.bps.go.id'||!url.pathname.startsWith('/en/pressrelease/')||url.username||url.password||url.search||url.hash||!o.releasedAt)fail('release provenance');}
   else if(o.sourceUrl!==spec.url)fail('source identity');
  }
 }
 return input;
}
export function seriesSummary(s,now=Date.now()){
 const spec=MACRO_SERIES[s?.id];if(!spec||s.error||!s.observations?.length)return {available:false,latest:null,prior:null,delta:null,outdated:false,reason:s?.error||'No observations published.'};
 const latest=s.observations.at(-1),prior=s.observations.at(-2),age=Math.floor((now-Date.parse(periodEnd(latest.period,spec.frequency)+'T00:00:00Z'))/86400000),vintageAge=Math.floor((now-Date.parse(s.retrievedAt))/86400000),outdated=age>({M:75,Q:210,A:550}[spec.frequency])||vintageAge>10;
 const delta=latest.value!==null&&prior?.value!==null&&prior&&periodIndex(latest.period,spec.frequency)-periodIndex(prior.period,spec.frequency)===1?Number((latest.value-prior.value).toFixed(10)):null;
 return {available:latest.value!==null,latest,prior,delta,age,vintageAge,outdated,reason:latest.value===null?'Latest observation was not reported.':null};
}
export function growthInflationState(gdp,cpi,now=Date.now()){
 const g=seriesSummary(gdp,now),i=seriesSummary(cpi,now);
 if(!g.available||!i.available||g.outdated||i.outdated||g.delta===null||i.delta===null)return {label:'Direction unavailable',key:null,reason:'Requires two consecutive reported observations for each series and a recent acquisition vintage.'};
 if(MACRO_SERIES[gdp.id].scope!==MACRO_SERIES[cpi.id].scope)return {label:'Direction unavailable',key:null,reason:'Geographic scopes differ.'};
 const growth=g.delta>0?'accelerating':g.delta<0?'slowing':'unchanged',inflation=i.delta>0?'rising':i.delta<0?'easing':'unchanged';
 return {label:`Growth ${growth} · inflation ${inflation}`,key:g.delta===0||i.delta===0?null:(g.delta>0?'up':'down')+'-'+(i.delta>0?'up':'down'),reason:MACRO_SERIES[gdp.id].frequency==='A'?'Annual context; not a current-cycle or trading signal.':'Mixed cadence: GDP compares quarters; inflation compares months. This describes their latest separate observations, not a synchronized regime or forecast.'};
}
export function seriesIds(region,country='IDN'){return region==='asean'?['annual-'+country+'-gdp','annual-'+country+'-cpi']:region==='global'?['annual-WLD-gdp','annual-WLD-cpi']:[region+'-gdp',region+'-cpi'];}
export function macroEvidence(feed,selection,now=Date.now()){
 validateMacroFeed(feed,now);if(!Object.hasOwn(MACRO_REGIONS,selection.region)||selection.region==='asean'&&!Object.hasOwn(ASEAN_COUNTRIES,selection.country))fail('evidence region');
 const series=seriesIds(selection.region,selection.country).map(id=>feed.series.find(s=>s.id===id)),name=selection.region==='asean'?ASEAN_COUNTRIES[selection.country]:MACRO_REGIONS[selection.region];
 return {title:name+' macro — source notes',evidence:['MACRO SOURCE NOTES · '+name,'Published assembly: '+feed.generatedAt,...series.map(s=>{const spec=MACRO_SERIES[s.id],m=seriesSummary(s,now);return [spec.title+' · '+spec.scope,m.available?`${m.latest.value}% YoY · ${m.latest.period} · ${m.latest.status}`:'Unavailable',m.delta===null?'Direction unavailable':`Change: ${m.delta} percentage points vs ${m.prior.period}`,m.outdated?'OUTDATED: check the official source before use.':'Freshness is a review prompt, not proof that no newer release exists.',spec.method,spec.source,`${s.acquisition==='reviewed-release'?'Reviewed':'Retrieved'}: ${s.retrievedAt}`,`Release date: ${m.latest?.releasedAt||'Not supplied'}`,m.latest?.sourceUrl||spec.url].join('\n');}),'GDP and inflation can have different observation periods. No causal, consensus-surprise or investment-return claim is made. Write your own assumptions, risks and decision.'].join('\n\n')};
}
