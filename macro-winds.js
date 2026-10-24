// Winds reaching Indonesia: three dated external series, each read against its own usual 30-day swing.
// Descriptive context only. It is not a forecast, a trading signal or an input to any portfolio or research model.
import {validateFxHistory} from './fx-history-contract.js';

const DAY=86400000;
export const WIND_WINDOW_DAYS=30;
const HISTORY_YEARS=3;
const MIN_CHANGES=250;
const TAPE_LENGTH=52,TAPE_STEP=5,TAPE_HEIGHT=44,TAPE_LIMIT=3;
// Gauges whose rise has conventionally weighed on emerging-market assets and the rupiah.
export const WIND_GAUGES={
 dollar:{label:'US dollar, broad',source:'contextSeries',id:'broad-dollar',measure:'percent',unit:'index',staleDays:10,sourceName:'Federal Reserve Board via FRED'},
 yield:{label:'US 10-year yield',source:'contextSeries',id:'us-10y',measure:'points',unit:'%',staleDays:10,sourceName:'Federal Reserve Board via FRED'},
 rupiah:{label:'Rupiah per US dollar',source:'fxHistory',id:'FX_IDC:USDIDR',measure:'percent',unit:'IDR per USD',staleDays:10,sourceName:'Yahoo Finance daily close'}
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>new Intl.NumberFormat('en-GB',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
const signed=(n,d=2)=>(n>0?'+':n<0?'−':'')+fmt(Math.abs(n),d);
const dateLabel=d=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(d+'T00:00:00Z'));

// Change over the last `days` calendar days, ending on every observation that has a prior point within a week of the target date.
export function windowChanges(rows,days=WIND_WINDOW_DAYS,measure='percent'){
 const clean=(rows||[]).filter(o=>typeof o?.date==='string'&&/^\d{4}-\d\d-\d\d$/.test(o.date)&&Number.isFinite(o.value)).sort((a,b)=>a.date.localeCompare(b.date)),out=[];
 let j=0;
 for(let i=0;i<clean.length;i++){
  const target=Date.parse(clean[i].date)-days*DAY;
  while(j+1<i&&Date.parse(clean[j+1].date)<=target)j++;
  const prior=clean[j];if(j>=i||Date.parse(prior.date)>target||target-Date.parse(prior.date)>7*DAY)continue;
  if(measure==='percent'&&prior.value<=0)continue;
  out.push({date:clean[i].date,from:prior.date,value:clean[i].value,priorValue:prior.value,change:measure==='percent'?(clean[i].value/prior.value-1)*100:clean[i].value-prior.value});
 }
 return out;
}

export const windTone=z=>!Number.isFinite(z)?'unavailable':z>=1.5?'strong-headwind':z>=.5?'headwind':z<=-1.5?'strong-tailwind':z<=-.5?'tailwind':'calm';

export function windReading(key,rows,now=Date.now()){
 const spec=WIND_GAUGES[key],changes=windowChanges(rows,WIND_WINDOW_DAYS,spec.measure);
 if(!changes.length)return {key,spec,available:false,tone:'unavailable',reason:'No dated observations to compare.'};
 const latest=changes.at(-1),cutoff=new Date(Date.parse(latest.date)-HISTORY_YEARS*365.25*DAY).toISOString().slice(0,10),sample=changes.filter(c=>c.date>=cutoff&&c.date<latest.date);
 if(sample.length<MIN_CHANGES)return {key,spec,available:false,tone:'unavailable',latest,reason:'Fewer than '+MIN_CHANGES+' earlier 30-day comparisons are available, so no usual swing is estimated.'};
 // Root-mean-square swing: the size of a typical 30-day move, whichever direction it went.
 const swing=Math.sqrt(sample.reduce((s,c)=>s+c.change*c.change,0)/sample.length);
 if(!(swing>0))return {key,spec,available:false,tone:'unavailable',latest,reason:'The series did not move over the comparison history.'};
 const z=latest.change/swing;
 // One reading per ~week over the last year, newest last, in units of the usual swing.
 const yearAgo=new Date(Date.parse(latest.date)-364*DAY).toISOString().slice(0,10),recent=changes.filter(c=>c.date>=yearAgo),tape=[];
 for(let i=recent.length-1;i>=0&&tape.length<TAPE_LENGTH;i-=TAPE_STEP)tape.unshift({date:recent[i].date,z:recent[i].change/swing});
 return {key,spec,available:true,latest,swing,z,tone:windTone(z),sampleSize:sample.length,tape,stale:now-Date.parse(latest.date)>spec.staleDays*DAY};
}

// `feed` is the published macro context snapshot; `fx` the validated FX history snapshot (either may be missing).
export function windReadings(feed,fx,now=Date.now()){
 return Object.entries(WIND_GAUGES).map(([key,spec])=>{
  const item=spec.source==='fxHistory'?fx?.entries?.find(e=>e.id===spec.id):feed?.series?.find(s=>s.id===spec.id);
  if(!item||item.error||!Array.isArray(item.observations))return {key,spec,available:false,tone:'unavailable',reason:item?.error||'Source not connected.'};
  return windReading(key,item.observations,now);
 });
}

export function rateCushion(feed){
 const bi=feed?.series?.find(s=>s.id==='id-policy'),us=feed?.series?.find(s=>s.id==='us-policy');
 const a=bi?.error?null:bi?.observations?.findLast(o=>Number.isFinite(o.value)),b=us?.error?null:us?.observations?.findLast(o=>Number.isFinite(o.value));
 return a&&b?{gap:a.value-b.value,bi:a,us:b}:null;
}

export function windSummary(readings){
 const count=t=>readings.filter(r=>r.tone.endsWith(t)).length,head=count('headwind'),tail=count('tailwind'),calm=readings.filter(r=>r.tone==='calm').length,missing=readings.filter(r=>!r.available).length,total=readings.length;
 if(missing===total)return {head,tail,calm,missing,headline:'The winds cannot be read from the published data.'};
 const headline=head>tail&&head>calm?(head+' of '+total+' external winds lean against Indonesia.'):tail>head&&tail>calm?(tail+' of '+total+' external winds lean in Indonesia’s favour.'):head===tail&&head>0?'Mixed winds: some lean against Indonesia, some with it.':'Mostly calm: the external winds sit within their usual range.';
 return {head,tail,calm,missing,headline:headline+(missing?' '+missing+' could not be read.':'')};
}

const toneWord={'strong-headwind':'Strong headwind',headwind:'Headwind',calm:'Calm',tailwind:'Tailwind','strong-tailwind':'Strong tailwind',unavailable:'Unavailable'};
const tapeY=z=>TAPE_HEIGHT/2-Math.max(-TAPE_LIMIT,Math.min(TAPE_LIMIT,z))/TAPE_LIMIT*(TAPE_HEIGHT/2-1);

// Swing tape: about a year of 30-day moves, each in units of the series' usual swing. Bars that leave the shaded calm band are unusual.
export function swingTape(tape){
 const mid=TAPE_HEIGHT/2,band=.5/TAPE_LIMIT*(mid-1),width=tape.length*2;
 return `<svg class="wind-tape" viewBox="0 0 ${width} ${TAPE_HEIGHT}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><rect class="wind-calm" x="0" y="${(mid-band).toFixed(2)}" width="${width}" height="${(band*2).toFixed(2)}"/><path class="wind-zero" d="M0 ${mid}H${width}"/>${tape.map((t,i)=>{const y=tapeY(t.z),top=Math.min(y,mid),h=Math.max(.8,Math.abs(y-mid));return `<rect class="wind-bar${i===tape.length-1?' is-now':''}" x="${i*2+.3}" y="${top.toFixed(2)}" width="1.4" height="${h.toFixed(2)}"/>`;}).join('')}</svg>`;
}

function cell(r){
 const name=esc(r.spec.label);
 if(!r.available)return `<li class="wind-cell" data-tone="unavailable" data-wind="${r.key}"><div class="wind-cell-head"><strong>${name}</strong></div><p class="wind-missing">${esc(r.reason)}</p></li>`;
 const pct=r.spec.measure==='percent',value=pct?signed(r.latest.change)+'%':signed(r.latest.change*100,0)+' bp',times=fmt(Math.abs(r.z),1)+'× usual swing',label=`${r.spec.label}: ${value} over 30 days to ${dateLabel(r.latest.date)}, ${times}. ${toneWord[r.tone]} for Indonesia.`;
 return `<li class="wind-cell" data-tone="${r.tone}" data-wind="${r.key}" aria-label="${esc(label)}"><div class="wind-cell-head"><strong>${name}</strong><time datetime="${esc(r.latest.date)}">${esc(dateLabel(r.latest.date))}</time></div><div class="wind-cell-value"><b>${esc(value)}</b><span class="wind-tag">${esc(toneWord[r.tone])}</span></div><p class="wind-cell-note">30 days · ${esc(times)}${r.stale?' · older observation':''}</p>${swingTape(r.tape)}</li>`;
}

function gapRow(c){
 return `<div class="wind-gap" data-wind="gap"><strong>Policy-rate gap</strong><b>${signed(c.gap)} pp</b><span class="wind-tag">Not scored</span><span class="wind-gap-note">Bank Indonesia ${fmt(c.bi.value)}% (<time datetime="${esc(c.bi.date)}">${esc(dateLabel(c.bi.date))}</time>) less effective US federal funds ${fmt(c.us.value)}% (<time datetime="${esc(c.us.date)}">${esc(dateLabel(c.us.date))}</time>). A fact, not a verdict.</span></div>`;
}

export function renderWindGauge(readings,cushion=null){
 const s=windSummary(readings),sources=[...new Set(readings.map(r=>r.spec.sourceName))],lean=s.head>s.tail?'headwind':s.tail>s.head?'tailwind':'calm',total=readings.length;
 const chip=s.missing===total?'No reading':s.head>=s.tail&&s.head>0?s.head+' of '+total+' headwind':s.tail>0?s.tail+' of '+total+' tailwind':'All calm';
 return `<div class="wind-head"><div><h4>EXTERNAL WINDS · INDONESIA</h4><p>${esc(s.headline)} Each 30-day move is read against that series’ own typical move over three years.</p></div><span class="wind-tag wind-total" data-tone="${s.missing===total?'unavailable':lean==='headwind'?'headwind':lean==='tailwind'?'tailwind':'calm'}">${esc(chip)}</span></div><ul class="wind-cells">${readings.map(cell).join('')}</ul>${cushion?gapRow(cushion):''}<p class="wind-legend">Tape: about a year of 30-day moves, one per week, in units of usual swing. The shaded band is calm (under 0.5×); the highlighted bar is the latest.</p><details class="wind-method"><summary>How this is read</summary><p>A rising US dollar, rising US 10-year yield or a weaker rupiah are the directions that have conventionally weighed on Indonesian assets, so they are labelled headwinds. That convention is a reading aid, not a measured effect on any holding, and it can fail. Usual swing is the root-mean-square of every earlier 30-day change in the previous three years, with at least ${MIN_CHANGES} comparisons required. Prior points must fall within seven days of the target date. Calm below 0.5, headwind or tailwind from 0.5, strong from 1.5 usual swings. Sources: ${esc(sources.join('; '))}. Observation dates differ by series and are shown on each cell. This is not a forecast or a recommendation.</p></details>`;
}

let fxCache=null,fxPending=null;
export async function readWindFx(force=false){
 if(!force&&fxCache&&Date.now()-fxCache.time<300000)return fxCache.feed;if(fxPending)return fxPending;
 fxPending=(async()=>{const r=await fetch(new URL('./data/fx-history.json',import.meta.url),{cache:'no-store',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('FX history unavailable.');const text=await r.text();if(text.length>12000000)throw Error('FX history exceeds the public-data limit.');const feed=validateFxHistory(JSON.parse(text));fxCache={feed,time:Date.now()};return feed;})();
 try{return await fxPending;}finally{fxPending=null;}
}

export async function mountWindGauge(body,feed,now=Date.now()){
 const host=document.createElement('section');host.className='wind-gauge';host.setAttribute('aria-label','External winds reaching Indonesia');host.setAttribute('aria-busy','true');
 host.innerHTML='<p class="quiet-note" role="status">Reading dated dollar, yield and rupiah series…</p>';body.replaceChildren(host);
 let fx=null;try{fx=await readWindFx();}catch{}
 if(!host.isConnected)return;
 host.innerHTML=renderWindGauge(windReadings(feed,fx,now),rateCushion(feed));host.removeAttribute('aria-busy');
}
