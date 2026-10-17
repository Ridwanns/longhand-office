// Independent public-source context. Existing GDP/CPI contracts and investment models are unchanged.
export const CONTEXT_COUNTRIES={IDN:'Indonesia',USA:'United States',EMU:'Euro area',CHN:'China',JPN:'Japan',MYS:'Malaysia',SGP:'Singapore',THA:'Thailand',PHL:'Philippines',VNM:'Vietnam',WLD:'World',GBR:'United Kingdom',DEU:'Germany',FRA:'France',ITA:'Italy',ESP:'Spain',NLD:'Netherlands',CHE:'Switzerland',SWE:'Sweden',NOR:'Norway',DNK:'Denmark',POL:'Poland',CAN:'Canada',AUS:'Australia',NZL:'New Zealand',KOR:'South Korea',IND:'India',HKG:'Hong Kong SAR, China',BRA:'Brazil',MEX:'Mexico',ARG:'Argentina',CHL:'Chile',COL:'Colombia',PER:'Peru',ZAF:'South Africa',EGY:'Egypt',NGA:'Nigeria',SAU:'Saudi Arabia',ARE:'United Arab Emirates',TUR:'Türkiye',RUS:'Russia',BRN:'Brunei Darussalam',KHM:'Cambodia',LAO:'Lao PDR',MMR:'Myanmar',TLS:'Timor-Leste'};
export const CONTEXT_WDI={gdp:['NY.GDP.MKTP.KD.ZG','Real GDP growth','% YoY'],inflation:['FP.CPI.TOTL.ZG','Consumer price inflation','% YoY'],unemployment:['SL.UEM.TOTL.ZS','Unemployment, modelled ILO estimate','% of labour force'],currentAccount:['BN.CAB.XOKA.GD.ZS','Current account balance','% of GDP'],fdi:['BX.KLT.DINV.WD.GD.ZS','Foreign direct investment, net inflows','% of GDP'],reserves:['FI.RES.TOTL.CD','Total reserves including gold','USD bn']};
export const CONTEXT_WDI_URL='https://api.worldbank.org/v2/country/'+Object.keys(CONTEXT_COUNTRIES).join(';')+'/indicator/'+Object.values(CONTEXT_WDI).map(s=>s[0]).join(';')+'?source=2&format=json&date=2000:'+new Date().getUTCFullYear()+'&per_page=20000';
const FRED_ORIGINS={DFF:'Federal Reserve Board',ECBDFR:'European Central Bank',DGS2:'Federal Reserve Board',DGS10:'Federal Reserve Board',WALCL:'Federal Reserve Board',WDTGAL:'Federal Reserve Board',RRPONTSYD:'Federal Reserve Bank of New York',DTWEXBGS:'Federal Reserve Board',UNRATE:'US Bureau of Labor Statistics',PAYEMS:'US Bureau of Labor Statistics',INDPRO:'Federal Reserve Board',RSAFS:'US Census Bureau',ICSA:'US Department of Labor',GDPC1:'US Bureau of Economic Analysis',CPIAUCSL:'US Bureau of Labor Statistics'};
const fred=(code,title,unit,frequency,group,scope='USA',multiplier=1)=>({code,title,unit,frequency,group,scope,multiplier,url:'https://fred.stlouisfed.org/graph/fredgraph.csv?id='+code+'&cosd=2000-01-01',sourceUrl:'https://fred.stlouisfed.org/series/'+code,source:(FRED_ORIGINS[code]||'Official source')+' via FRED',acquisition:'automatic',method:'Reported source observations. Observation dates are not release dates; retrieval-vintage revisions may change history.'});
export const CONTEXT_SERIES={
 'us-policy':fred('DFF','Effective federal funds rate','%', 'D','rates'),
 'eu-policy':fred('ECBDFR','ECB deposit facility rate','%','D','rates','EMU'),
 'us-2y':fred('DGS2','US Treasury 2-year constant-maturity yield','%','D','rates'),
 'us-10y':fred('DGS10','US Treasury 10-year constant-maturity yield','%','D','rates'),
 'fed-assets':fred('WALCL','Federal Reserve total assets','USD bn','W','liquidity','USA',.001),
 'treasury-cash':fred('WDTGAL','Treasury General Account, Wednesday level','USD bn','W','liquidity','USA',.001),
 'reverse-repo':fred('RRPONTSYD','Overnight reverse repo','USD bn','D','liquidity'),
 'broad-dollar':fred('DTWEXBGS','Broad trade-weighted US dollar index','Jan 2006 = 100','D','currency'),
 'us-unemployment':fred('UNRATE','US unemployment rate','%','M','labour'),
 'us-payrolls':fred('PAYEMS','US nonfarm payroll employment','Thousand people','M','labour'),
 'us-production':fred('INDPRO','US industrial production','2017 = 100','M','activity'),
 'us-retail':fred('RSAFS','US retail and food services sales, nominal','USD bn','M','activity','USA',.001),
 'us-claims':fred('ICSA','US initial unemployment claims','Thousand claims','W','labour','USA',.001),
 'us-gdp-level':fred('GDPC1','US real GDP, seasonally adjusted annual rate','USD bn, chained 2017','Q','cycle'),
 'us-cpi-level':fred('CPIAUCSL','US consumer price index, seasonally adjusted','1982–84 = 100','M','cycle'),
 'id-policy':{title:'Bank Indonesia policy rate',unit:'%',frequency:'E',group:'rates',scope:'IDN',source:'Bank Indonesia',url:'https://www.bi.go.id/en/statistik/indikator/bi-rate.aspx',sourceUrl:'https://www.bi.go.id/en/statistik/indikator/bi-rate.aspx',acquisition:'automatic',method:'Latest ten published decision observations. Decision dates are retained; a missing comparison period is not estimated.'},
 'id-jisdor':{title:'JISDOR, official Bank Indonesia fixing',unit:'IDR per USD',frequency:'D',group:'currency',scope:'IDN',source:'Bank Indonesia',url:'https://www.bi.go.id/en/statistik/informasi-kurs/jisdor/Default.aspx',sourceUrl:'https://www.bi.go.id/en/statistik/informasi-kurs/jisdor/Default.aspx',acquisition:'automatic',method:'Latest published working-day fixings. Distinct from the Federal Reserve USD/IDR reference; the two sources are never spliced.'}
};
for(const [country]of Object.entries(CONTEXT_COUNTRIES))for(const [metric,[code,title,unit]]of Object.entries(CONTEXT_WDI))CONTEXT_SERIES['wdi-'+country+'-'+metric]={code,title,unit,frequency:'A',group:'annual',scope:country,source:'World Bank, World Development Indicators',url:CONTEXT_WDI_URL,sourceUrl:'https://data.worldbank.org/indicator/'+code,acquisition:'automatic',method:metric==='reserves'?'Annual reported USD level divided by one billion. Includes gold; not a current monthly FX reserve release.':metric==='unemployment'?'Reported annual modelled ILO estimate; not a current national labour-force release.':'Reported annual observation; not current monthly or quarterly conditions.'};
export const BLS_CALENDAR_URL='https://www.bls.gov/schedule/news_release/bls.ics';
export const isContextDay=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const validStamp=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(s)&&Number.isFinite(Date.parse(s))&&isContextDay(s.slice(0,10));
export function validateMacroContext(feed,now=Date.now()){
 const fail=m=>{throw Error('Invalid macro context: '+m);};
 if(feed?.format!=='longhand-macro-context'||feed.version!==1||!validStamp(feed.generatedAt)||Date.parse(feed.generatedAt)>now+300000||!Array.isArray(feed.series)||feed.series.length!==Object.keys(CONTEXT_SERIES).length)fail('header or coverage');
 const ids=new Set();for(const s of feed.series){const spec=CONTEXT_SERIES[s?.id];if(!Object.hasOwn(CONTEXT_SERIES,s?.id)||ids.has(s.id))fail('series identity');ids.add(s.id);
  if(!validStamp(s.retrievedAt)||Date.parse(s.retrievedAt)>Date.parse(feed.generatedAt)||s.sourceUrl!==spec.sourceUrl||s.unit!==spec.unit||s.frequency!==spec.frequency||!Array.isArray(s.observations)||s.observations.length>12000)fail('source metadata');
  if(s.error){if(typeof s.error!=='string'||s.error.length>240||s.observations.length)fail('unavailable series');continue;}
  if(!/^[a-f0-9]{64}$/.test(s.sourceHash)||!s.observations.length)fail('provenance');let prior='';
  for(const o of s.observations){if(!isContextDay(o.date)||o.date<=prior||o.date>s.retrievedAt.slice(0,10)||o.value!==null&&(!Number.isFinite(o.value)||Math.abs(o.value)>1e15))fail('observation');prior=o.date;
   if(Number.isFinite(o.value)){
    if((['fed-assets','treasury-cash','reverse-repo','us-payrolls','us-production','us-retail','us-claims','us-gdp-level','us-cpi-level','id-jisdor','broad-dollar'].includes(s.id)||s.id.endsWith('-reserves'))&&o.value<0)fail('negative reported level');
    if((s.id==='us-unemployment'||s.id.endsWith('-unemployment'))&&(o.value<0||o.value>100))fail('unemployment units');
   }
   if(['fed-assets','treasury-cash'].includes(s.id)&&new Date(o.date+'T00:00:00Z').getUTCDay()!==3)fail('Wednesday observation alignment');
   if(spec.frequency==='M'&&!o.date.endsWith('-01')||spec.frequency==='Q'&&!/^\d{4}-(01|04|07|10)-01$/.test(o.date)||spec.frequency==='A'&&(!o.date.endsWith('-12-31')||o.date>s.retrievedAt.slice(0,10)))fail('observation cadence');
  }
 }
 const c=feed.calendar;if(!c||c.sourceUrl!==BLS_CALENDAR_URL||!validStamp(c.retrievedAt)||Date.parse(c.retrievedAt)>Date.parse(feed.generatedAt)||!Array.isArray(c.events)||c.events.length>2000)fail('calendar');
 if(c.error){if(typeof c.error!=='string'||c.error.length>240||c.events.length)fail('unavailable calendar');}
 else{if(!/^[a-f0-9]{64}$/.test(c.sourceHash))fail('calendar provenance');const seen=new Set();for(const e of c.events){const key=e.date+'|'+e.title;if(!isContextDay(e.date)||typeof e.title!=='string'||!e.title.trim()||e.title.length>240||seen.has(key))fail('calendar event');seen.add(key);}}
 return feed;
}
