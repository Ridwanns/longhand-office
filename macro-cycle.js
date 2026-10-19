import {consecutiveMacroDates,macroDateLabel,macroScale} from './macro-chart.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=x=>new Intl.NumberFormat('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2}).format(x);
const signed=x=>(x>0?'+':'')+number(x);
export const cycleQuad=p=>!p||![p.growthChange,p.inflationChange].every(Number.isFinite)||p.growthChange===0||p.inflationChange===0?null:p.growthChange>0?(p.inflationChange<0?1:2):(p.inflationChange>0?3:4);
const names={1:'Growth accelerating, inflation easing',2:'Growth accelerating, inflation rising',3:'Growth slowing, inflation rising',4:'Growth slowing, inflation easing'};

// Historical verified official release observations, not a live feed or a model forecast.
const quarterEndIdn2026={
 period:'2026 Q2',reviewedAt:'2026-10-20',
 gdp:{prior:{period:'2026 Q1',value:5.61},latest:{period:'2026 Q2',value:5.29}},
 cpi:{prior:{period:'March 2026',value:3.48},latest:{period:'June 2026',value:3.34}},
 sources:{
  gdp:'https://www.bi.go.id/en/publikasi/ruang-media/news-release/Pages/sp_2815026.aspx',
  march:'https://www.bps.go.id/en/pressrelease/2026/04/01/2564/the-year-on-year--y-on-y--headline-inflation-in-march-2026-was-recorded-at-3-48-percent-.html',
  june:'https://www.bps.go.id/en/pressrelease/2026/07/01/2590/inflasi-year-on-year--y-on-y--pada-juni-2026-sebesar-3-34-persen-.html'
 }
};
export function indonesiaQuarterEndReference2026(){
 const r=quarterEndIdn2026;
 const growthChange=Number((r.gdp.latest.value-r.gdp.prior.value).toFixed(10));
 const inflationChange=Number((r.cpi.latest.value-r.cpi.prior.value).toFixed(10));
 const quad=cycleQuad({growthChange,inflationChange});
 return {...r,growthChange,inflationChange,quad,state:quad?names[quad]:'On an axis'};
}
function renderQuarterEndReference(country){
 if(country!=='Indonesia')return '';
 const r=indonesiaQuarterEndReference2026();
 return '<details class="latest-cycle-quarter-reference" data-quarter-end-reference="'+esc(JSON.stringify({period:r.period,quad:r.quad,growthChange:r.growthChange,inflationChange:r.inflationChange,reviewedAt:r.reviewedAt}))+'">'+
  '<summary><span>Quarter-aligned historical check<small>2026 Q2 · GDP and quarter-end CPI</small></span><strong>Quad '+r.quad+'</strong></summary>'+
  '<div class="quarter-reference-readings"><div><span>GDP growth · Q2 vs Q1</span><strong>'+signed(r.growthChange)+' pp</strong><small>'+number(r.gdp.latest.value)+'% vs '+number(r.gdp.prior.value)+'% YoY</small></div>'+
  '<div><span>Quarter-end CPI · June vs March</span><strong>'+signed(r.inflationChange)+' pp</strong><small>'+number(r.cpi.latest.value)+'% vs '+number(r.cpi.prior.value)+'% YoY</small></div></div>'+
  '<p><strong>'+esc(r.state)+'.</strong> The CPI input is the YoY inflation rate in the last month of each GDP quarter, not quarterly-average CPI. This fixed historical reference is not a current-quarter regime, nowcast, or investment signal.</p>'+
  '<p class="quarter-reference-sources">Official references: <a href="'+esc(r.sources.gdp)+'" target="_blank" rel="noopener noreferrer">GDP, BI</a> · <a href="'+esc(r.sources.march)+'" target="_blank" rel="noopener noreferrer">March CPI, BPS</a> · <a href="'+esc(r.sources.june)+'" target="_blank" rel="noopener noreferrer">June CPI, BPS</a>. Checked '+esc(r.reviewedAt)+'. This snapshot does not auto-update with subsequent releases.</p></details>';
}

// Compare each latest rate with its own preceding consecutive source period.
// Never splice a prior value from a second source or call the mixed periods one quarter.
export function latestReleaseCycle(readings,now=Date.now()){
 const pair=key=>{
  const item=readings.find(r=>r.key===key)?.item;if(!item?.latest||item.error||!['M','Q'].includes(item.spec.frequency))return {available:false,reason:'No connected monthly or quarterly '+key+' release'};
  const current=item.latest,index=item.observations.findIndex(o=>o.date===current.date),prior=item.observations[index-1];
  if(item.supplied?.date>current.date)return {available:false,reason:'The latest supplied '+key+' period has no reported value'};
  if(!Number.isFinite(current.value)||!Number.isFinite(prior?.value)||!consecutiveMacroDates(prior.date,current.date,item.spec.frequency))return {available:false,reason:'Consecutive '+key+' observations are unavailable'};
  if([current,prior].some(o=>!Number.isFinite(Date.parse(o.date))||Date.parse(o.date)>now||o.releasedAt&&(!Number.isFinite(Date.parse(o.releasedAt))||Date.parse(o.releasedAt)>now))||!Number.isFinite(Date.parse(item.retrievedAt))||Date.parse(item.retrievedAt)>now+300000)return {available:false,reason:'Unverified release or acquisition date'};
  return {available:true,current,prior,change:current.value-prior.value,frequency:item.spec.frequency,source:item.spec.source,sourceUrl:current.sourceUrl||item.spec.sourceUrl,priorSourceUrl:prior.sourceUrl||item.spec.sourceUrl,retrievedAt:item.retrievedAt,id:item.id,outdated:readings.find(r=>r.key===key).summary?.outdated||false};
 };
 const growth=pair('gdp'),inflation=pair('inflation');
 if(!growth.available||!inflation.available)return {available:false,growth,inflation,reason:[growth,inflation].filter(x=>!x.available).map(x=>x.reason).join('. ')};
 const point={growthChange:growth.change,inflationChange:inflation.change},quad=cycleQuad(point);
 return {available:true,...point,quad,state:quad?names[quad]:'On an axis · one rate is unchanged',growth,inflation,mixedPeriods:growth.current.date!==inflation.current.date||growth.frequency!==inflation.frequency,asOf:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now))};
}
export function renderLatestCycle(readings,{country,width=600,now=Date.now()}={}){
 const s=latestReleaseCycle(readings,now);
 if(!s.available)return '<section class="latest-cycle latest-cycle-missing" aria-label="Latest release quadrant"><h3>Latest release quadrant</h3><p>Not enough comparable observations</p><p class="quiet-note">'+esc(s.reason)+'. Annual history below remains a separate view.</p></section>';
 const w=600,h=340,l=74,r=578,t=32,b=278,cx=(l+r)/2,cy=(t+b)/2;
 const bound=v=>macroScale([-Math.max(.2,Math.abs(v)*1.8),Math.max(.2,Math.abs(v)*1.8)]).hi;
 const bx=bound(s.growthChange),by=bound(s.inflationChange),x=v=>cx+v/bx*(r-l)/2,y=v=>cy-v/by*(b-t)/2;
 const zones=[[3,l,t,'Slower growth','Rising inflation'],[2,cx,t,'Faster growth','Rising inflation'],[4,l,cy,'Slower growth','Easing inflation'],[1,cx,cy,'Faster growth','Easing inflation']];
 const evidence=(key,label,v)=>`<article data-latest-cycle-metric="${key}"><header><span>${label}</span><strong>${signed(v.change)} <small>pp</small></strong></header><p><b>${number(v.current.value)}%</b> <span>from ${number(v.prior.value)}% YoY</span></p><p>${esc(macroDateLabel(v.current.date,v.frequency))} vs ${esc(macroDateLabel(v.prior.date,v.frequency))}</p></article>`;
 const source=(label,v)=>`<li><strong>${label}</strong> · ${esc(v.source)}<br>${esc(macroDateLabel(v.current.date,v.frequency))}${v.current.releasedAt?' · released '+esc(v.current.releasedAt):' · publication date not supplied'}<br><a href="${esc(v.sourceUrl)}" target="_blank" rel="noopener noreferrer">Latest source ↗</a> · <a href="${esc(v.priorSourceUrl)}" target="_blank" rel="noopener noreferrer">Previous source ↗</a><br>Acquired ${esc(v.retrievedAt)} · ${esc(v.current.status||'as published')}</li>`;
 return `<section class="latest-cycle regime-${s.quad||'axis'}" data-latest-cycle="${esc(JSON.stringify(s))}" aria-label="Latest release quadrant"><header class="latest-cycle-heading"><div><p class="eyebrow">LATEST RELEASES · ${esc(country)}</p><h3>Growth & inflation</h3></div><span class="latest-cycle-badge">${s.quad?'Quad '+s.quad:'On an axis'}</span></header><p class="latest-cycle-state">${esc(s.state)}</p><p class="latest-cycle-timing">GDP ${esc(macroDateLabel(s.growth.current.date,s.growth.frequency))} · CPI ${esc(macroDateLabel(s.inflation.current.date,s.inflation.frequency))}${s.mixedPeriods?' · Different reporting periods':''}</p><figure class="latest-cycle-plot"><svg viewBox="0 0 ${w} ${h}" font-size="${Math.max(13,600/Math.max(240,width)*10)}" role="img" aria-label="${esc(s.state)}. GDP rate change ${signed(s.growthChange)} percentage points; inflation rate change ${signed(s.inflationChange)} percentage points.">${zones.map(([q,a,z,g,i])=>`<g class="latest-cycle-zone quad-${q} ${q===s.quad?'is-active':''}"><rect x="${a}" y="${z}" width="${(r-l)/2}" height="${(b-t)/2}" rx="4"/><text class="cycle-zone-full" x="${a+14}" y="${q<3?z+((b-t)/2)-52:z+20}">Quad ${q}<tspan x="${a+14}" dy="16">${g}</tspan><tspan x="${a+14}" dy="16">${i}</tspan></text><text class="cycle-zone-compact" x="${a+14}" y="${q<3?z+((b-t)/2)-52:z+20}">Quad ${q}<tspan x="${a+14}" dy="24">Growth ${q===1||q===2?"↑":"↓"}</tspan><tspan x="${a+14}" dy="24">CPI ${q===2||q===3?"↑":"↓"}</tspan></text></g>`).join('')}<path class="latest-cycle-axes" d="M${cx} ${t}V${b}M${l} ${cy}H${r}"/>${[-bx,0,bx].map(v=>`<text class="latest-cycle-tick" x="${x(v)}" y="${b+19}" text-anchor="middle">${number(v)}</text>`).join('')}${[-by,0,by].map(v=>`<text class="latest-cycle-tick" x="${l-8}" y="${y(v)+4}" text-anchor="end">${number(v)}</text>`).join('')}<path class="latest-cycle-vector" d="M${cx} ${cy}L${x(s.growthChange)} ${y(s.inflationChange)}"/><circle class="latest-cycle-halo" cx="${x(s.growthChange)}" cy="${y(s.inflationChange)}" r="14"/><circle class="latest-cycle-point" cx="${x(s.growthChange)}" cy="${y(s.inflationChange)}" r="6"><title>Latest releases · ${signed(s.growthChange)}, ${signed(s.inflationChange)} pp</title></circle><text class="latest-cycle-axis-label" x="${l}" y="17">Inflation change (pp)</text><text class="latest-cycle-axis-label" x="${cx}" y="327" text-anchor="middle">Growth change (pp)</text></svg><figcaption>Latest connected releases, each compared with its own previous period. Axes auto-fit independently; point distances are not comparable across economies.</figcaption></figure><div class="latest-cycle-evidence">${evidence('gdp','GDP growth',s.growth)}${evidence('inflation','CPI inflation',s.inflation)}</div>${s.growth.outdated||s.inflation.outdated?'<p class="macro-warning">Older observation or acquisition · check the original sources.</p>':''}<details class="latest-cycle-method"><summary>Sources & calculation</summary><p>Direction = latest YoY rate minus its preceding consecutive source-period rate. GDP and CPI periods remain separate; this is a mixed-frequency release reading, not a same-quarter estimate, forecast or investment signal. Calculated from retained source vintages; acquisition dates are listed below. Display date ${esc(s.asOf)} WIB does not indicate a new source verification.</p><ul>${source('GDP',s.growth)}${source('CPI',s.inflation)}</ul></details></section>`;
}
