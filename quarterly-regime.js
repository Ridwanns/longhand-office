const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=s=>typeof s==='string'&&/^\d{4}-\d{2}-01$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const date=(y,m)=>`${y}-${String(m).padStart(2,'0')}-01`;
const priorQuarter=d=>{const m=Number(d.slice(5,7)),y=Number(d.slice(0,4));return m===1?date(y-1,10):date(y,m-3);};
const endMonth=d=>date(Number(d.slice(0,4)),Number(d.slice(5,7))+2);
const quarter=d=>d.slice(0,4)+' Q'+(Math.floor((Number(d.slice(5,7))-1)/3)+1);
const names={1:'Growth accelerating · inflation easing',2:'Growth accelerating · inflation rising',3:'Growth slowing · inflation rising',4:'Growth slowing · inflation easing'};
// Pick a common completed quarter. Within each metric both rates must come
// from one supplied series; neither interpolation nor provider splicing occurs.
export function synchronizedQuarterlyRegime(readings,now=Date.now()){
 const candidates=key=>{const r=readings.find(r=>r.key===key);return (r?.items||[r?.item]).filter(s=>s&&!s.error&&s.spec?.frequency===(key==='gdp'?'Q':'M')&&Number.isFinite(Date.parse(s.retrievedAt))&&Date.parse(s.retrievedAt)<=now+300000);};
 const observed=(s,d)=>s.observations.find(o=>o.date===d&&day(o.date)&&Number.isFinite(o.value)&&Date.parse(o.date)<=now&&(!o.releasedAt||Number.isFinite(Date.parse(o.releasedAt))&&Date.parse(o.releasedAt)<=now));
 const matches=[];
 for(const g of candidates('gdp'))for(const o of g.observations){
  if(!day(o.date)||![1,4,7,10].includes(Number(o.date.slice(5,7))))continue;
  const d=o.date,p=priorQuarter(d),end=new Date(Date.UTC(Number(d.slice(0,4)),Number(d.slice(5,7))+2,1));if(end.getTime()>now)continue;
  const current=observed(g,d),prior=observed(g,p);if(!current||!prior)continue;
  for(const c of candidates('inflation')){const latest=observed(c,endMonth(d)),previous=observed(c,endMonth(p));if(!latest||!previous)continue;
   matches.push({date:d,period:quarter(d),priorPeriod:quarter(p),growth:{id:g.id,source:g.spec.source,sourceUrl:g.spec.sourceUrl,retrievedAt:g.retrievedAt,current,prior,method:g.spec.method},inflation:{id:c.id,source:c.spec.source,sourceUrl:c.spec.sourceUrl,retrievedAt:c.retrievedAt,current:latest,prior:previous,method:c.spec.method},priority:(g.spec.priority||0)+(c.spec.priority||0)});
  }
 }
 matches.sort((a,b)=>b.date.localeCompare(a.date)||b.priority-a.priority||a.growth.id.localeCompare(b.growth.id)||a.inflation.id.localeCompare(b.inflation.id));
 if(!matches.length)return {available:false,reason:'No completed quarter has consecutive GDP YoY rates and CPI YoY rates for both quarter-end months in the connected sources.'};
 const s=matches[0],growthChange=Number((s.growth.current.value-s.growth.prior.value).toFixed(10)),inflationChange=Number((s.inflation.current.value-s.inflation.prior.value).toFixed(10)),quad=growthChange===0||inflationChange===0?null:growthChange>0?(inflationChange<0?1:2):(inflationChange>0?3:4);
 const currentQuarter=Date.UTC(new Date(now).getUTCFullYear(),Math.floor(new Date(now).getUTCMonth()/3)*3,1),previousCompleted=new Date(currentQuarter-86400000),expected=date(previousCompleted.getUTCFullYear(),Math.floor(previousCompleted.getUTCMonth()/3)*3+1);
 return {...s,available:true,growthChange,inflationChange,quad,state:quad?names[quad]:'On an axis · one rate is unchanged',olderCommonQuarter:s.date<expected,oldAcquisition:[s.growth,s.inflation].some(v=>now-Date.parse(v.retrievedAt)>10*86400000),method:'GDP YoY change between consecutive quarters; CPI YoY change between their final months. Not quarter-average CPI. Latest common reported quarter from retained vintages; no nowcast or forecast.'};
}
export function renderQuarterlyRegime(readings,{country,now=Date.now()}={}){
 const s=synchronizedQuarterlyRegime(readings,now),n=v=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:2,minimumFractionDigits:2}).format(v),signed=v=>(v>0?'+':'')+n(v);
 if(!s.available)return `<section class="quarterly-regime evidence-empty"><p class="eyebrow">SYNCHRONIZED QUARTERLY REGIME</p><h3>Quarter-aligned reading unavailable</h3><p>${esc(s.reason)}</p></section>`;
 const metric=(title,v,delta)=>`<article><span>${title}</span><strong>${signed(delta)} pp</strong><small>${esc(v.current.date.slice(0,7))}: ${n(v.current.value)}% · ${esc(v.prior.date.slice(0,7))}: ${n(v.prior.value)}%</small></article>`;
 const evidence=(title,v)=>`<tr><th>${title}</th><td>${esc(v.id)}<br>${esc(v.source)}</td><td>${esc(v.prior.date)} · ${v.prior.value}%<br>${esc(v.current.date)} · ${v.current.value}%</td><td>${[v.prior,v.current].map(o=>`<a href="${esc(o.sourceUrl||v.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(o.date)} source</a>${o.releasedAt?' · released '+esc(o.releasedAt):' · release date not supplied'}`).join('<br>')}<br>Acquired ${esc(v.retrievedAt)}</td></tr>`;
 return `<section class="quarterly-regime regime-${s.quad||'axis'}" data-quarterly-regime="${esc(JSON.stringify(s))}"><header class="section-heading"><div><p class="eyebrow">SYNCHRONIZED QUARTERLY REGIME · ${esc(country)}</p><h3>${esc(s.period)} <span class="evidence-label">${s.quad?'Quad '+s.quad:'On an axis'}</span></h3></div></header><p class="quarterly-state">${esc(s.state)}</p><div class="evidence-stats">${metric('GDP YoY rate · change in pp',s.growth,s.growthChange)}${metric('Quarter-end CPI YoY · change in pp',s.inflation,s.inflationChange)}</div><p class="quarterly-method-note">Latest common reported quarter. Recalculated when published source snapshots change.</p>${s.olderCommonQuarter?'<span class="evidence-label" title="The latest completed quarter does not yet have all four reported inputs.">Earlier matched quarter</span>':''}${s.oldAcquisition?'<span class="evidence-label">Older acquisition</span>':''}<details><summary>Four inputs, sources & method</summary><p>${esc(s.method)}</p><div class="table-wrap" tabindex="0"><table><thead><tr><th>Metric</th><th>Single series</th><th>Original observations</th><th>Provenance</th></tr></thead><tbody>${evidence('GDP',s.growth)}${evidence('CPI',s.inflation)}</tbody></table></div><p>Different providers may supply GDP and CPI; providers are never joined inside a metric. Revisions may change the classification. This is a descriptive regime, not an allocation instruction.</p></details></section>`;
}
