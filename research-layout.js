// UI routing and discovery metadata only. Never changes a saved research artifact.
// Readable labels belong to the view. Original timestamps and model keys stay in artifacts.
export function researchDate(value,{time=false}={}){
 if(!value)return 'Unavailable';
 const input=String(value),date=new Date(/^\d{4}-\d{2}-\d{2}$/.test(input)?input+'T12:00:00Z':input);
 if(!Number.isFinite(date.getTime()))return input;
 return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC',...(time?{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}:{})}).format(date)+(time?' UTC':'');
}
export function researchModelName(key){return ({AR1:'AR(1)',garch:'GARCH',ewma:'EWMA',rolling60:'60 session rolling estimate',ROLLING60:'60 session rolling estimate'})[key]||String(key);}
export function researchPeriod(value){
 const text=String(value??'');
 const quarter=text.match(/^(\d{4})-Q([1-4])$/);if(quarter)return 'Q'+quarter[2]+' '+quarter[1];
 if(/^\d{4}-(0[1-9]|1[0-2])$/.test(text))return researchDate(text+'-01').replace(/^1 /,'');
 return /^\d{4}-\d{2}-\d{2}$/.test(text)?researchDate(text):text;
}
export const RESEARCH_VIEWS={overview:'Research overview',models:'Quantitative models',validation:'Model accountability',valuation:'Valuation sensitivity',thesis:'Investment thesis',saved:'Saved research',tools:'Advanced tools'};
export const runFromRoute=route=>route.startsWith('quant/run/')?route.split('/')[2]:'';
export function viewForJump(key){
 if(key==='predictions')return 'validation';
 if(['valuation'].includes(key))return 'valuation';
 if(['calculator','research','reference'].includes(key))return 'tools';
 if(['models','advanced','valuations','tickers','manual'].includes(key))return 'saved';
 if(['ticker','summary','brief-valuation','brief-risk','brief-actions','comparison'].includes(key))return 'overview';
 return 'models';
}
export function viewFromRoute(route){const key=route.match(/\/view\/([a-z]+)$/)?.[1];if(Object.hasOwn(RESEARCH_VIEWS,key))return key;const legacy=route.match(/^quant\/section\/([a-z-]+)$/)?.[1];return legacy?viewForJump(legacy):runFromRoute(route)?'models':'overview';}
export function researchRoute(route,view){if(!Object.hasOwn(RESEARCH_VIEWS,view))throw Error('Unknown research view.');const run=runFromRoute(route),source=route.match(/^quant\/source\/[a-f0-9]{64}(?:\/study\/[a-f0-9-]{36})?/)?.[0];return (run?'quant/run/'+run:source||'quant')+'/view/'+view;}
let marketIntent=null;
export function rememberMarketInstrument(market,ticker,observation=null){if(!['US','IDX'].includes(market)||!(market==='IDX'?/^[A-Z]{4}$/:/^[A-Z]{1,6}(-[A-Z])?$/).test(ticker))return;marketIntent={market,ticker};if(observation&&observation.market===market&&observation.ticker===ticker)marketIntent={market,ticker,currency:observation.currency||null,source:structuredClone(observation.source||{}),destination:'research'};}
export function takeMarketInstrument(){const value=marketIntent;marketIntent=null;return value;}
export function researchIndex(groups){
 const out=[];
 for(const [kind,rows]of Object.entries(groups))for(const r of rows){
  const source=kind==='core'?r.config:kind==='advanced'?r.source:kind==='valuations'?r.fundamental:kind==='tickers'?r.instrument:r;
  out.push({kind,id:r.id,ticker:source.ticker||r.artifact?.metadata?.asset||r.artifact?.label||'Manual study',market:source.market||'',date:r.created||r.createdAt||r.savedAt||r.registeredAt||'',cutoff:source.cutoff||r.modelCutoff||r.cutoff||r.artifact?.metadata?.asOf||'',seed:r.settings?.seed??r.config?.seed??null,status:r.status||'Retained',label:r.artifact?.method||r.mathVersion||r.results?.modelVersion||r.basis||'',raw:r});
 }
 return out.sort((a,b)=>b.date.localeCompare(a.date)||a.kind.localeCompare(b.kind)||a.id.localeCompare(b.id));
}
