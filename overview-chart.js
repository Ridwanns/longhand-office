// Overview charts use dated source points. Straight segments never invent intermediate observations.
import {OVERVIEW_MARKETS} from './overview-contract.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors=['var(--series-1)','var(--series-2)','var(--series-3)','var(--series-4)'];
const seriesIndex=(s,i)=>{const known=OVERVIEW_MARKETS.findIndex(m=>m.category+':'+m.symbol===s.key);return (known<0?i:known)%colors.length;};
const seriesColor=(s,i)=>colors[seriesIndex(s,i)];
const number=(x,d=2)=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:d,minimumFractionDigits:d}).format(x);
const percent=x=>(x>0?'+':'')+number(x)+'%';
const date=(x,year=true)=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',...(year?{year:'numeric'}:{}),timeZone:'UTC'}).format(new Date(x+'T00:00:00Z'));
function scale(values){
 const low=Math.min(0,...values),high=Math.max(0,...values),span=high-low||1,raw=span/4,power=10**Math.floor(Math.log10(raw)),fraction=raw/power,step=(fraction<=1?1:fraction<=2?2:fraction<=2.5?2.5:fraction<=5?5:10)*power;
 const lo=Math.floor((low-span*.03)/step)*step,hi=Math.ceil((high+span*.03)/step)*step,ticks=[];
 for(let v=lo;v<=hi+step*.001;v+=step)ticks.push(Math.abs(v)<step*.001?0:v);
 return {lo,hi,ticks,decimals:step<1?Math.max(1,-Math.floor(Math.log10(step))):step%1?1:0};
}
function endpointLabels(items,top,bottom,gap){
 const sorted=items.map(s=>({...s})).sort((a,b)=>a.y-b.y);
 for(let i=0;i<sorted.length;i++)sorted[i].labelY=Math.max(sorted[i].y,i?sorted[i-1].labelY+gap:top);
 if(sorted.at(-1)?.labelY>bottom){sorted.at(-1).labelY=bottom;for(let i=sorted.length-2;i>=0;i--)sorted[i].labelY=Math.min(sorted[i].labelY,sorted[i+1].labelY-gap);}
 return sorted;
}
export function marketComparisonChart(result,width=650){
 const w=Math.max(240,Math.round(width)),mobile=w<470,h=mobile?252:300,left=43,right=w-(mobile?66:81),top=20,bottom=h-29;
 const series=result.series.map((s,i)=>({...s,color:seriesColor(s,i),values:s.points.map(p=>p.value-100)}));
 const {lo,hi,ticks,decimals}=scale(series.flatMap(s=>s.values)),y=v=>bottom-(v-lo)/(hi-lo)*(bottom-top),first=Date.parse(result.dates[0]),last=Date.parse(result.dates.at(-1)),x=i=>left+(Date.parse(result.dates[i])-first)/(last-first)*(right-left);
 const xTicks=[...new Set([0,Math.floor((result.dates.length-1)/2),result.dates.length-1])];
 const endpoints=endpointLabels(series.map((s,i)=>({i,y:y(s.values.at(-1)),color:s.color,value:s.values.at(-1)})),top+8,bottom-5,17);
 return `<figure class="command-price-chart" aria-label="Cross-asset price change on common source dates"><div class="command-period-returns">${series.map((s,i)=>`<span class="command-series-${seriesIndex(s,i)}"><i aria-hidden="true"></i>${esc(s.label)}<strong>${percent(s.priceReturn*100)}</strong></span>`).join('')}</div><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Price change in percent from ${date(result.baseDate)} to ${date(result.endDate)}"><g class="command-chart-grid">${ticks.map(v=>`<line x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}"/><text x="${left-9}" y="${y(v)+4}" text-anchor="end">${number(v,decimals)}%</text>`).join('')}<line class="command-zero" x1="${left}" x2="${right}" y1="${y(0)}" y2="${y(0)}"/>${xTicks.map(i=>`<text x="${x(i)}" y="${h-6}" text-anchor="${i===0?'start':i===result.dates.length-1?'end':'middle'}">${date(result.dates[i],false)}</text>`).join('')}</g>${series.map(s=>`<polyline class="command-price-line" points="${s.values.map((v,i)=>`${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ')}" stroke="${s.color}"/><circle cx="${right}" cy="${y(s.values.at(-1))}" r="3.4" fill="${s.color}" stroke="var(--white)" stroke-width="1.5"/>`).join('')}${endpoints.map(e=>`<path d="M${right+5},${e.y} L${right+10},${e.labelY} H${right+14}" fill="none" stroke="${e.color}" stroke-width="1"/><text class="command-end-label" x="${right+18}" y="${e.labelY+4}" fill="${e.color}">${percent(e.value)}</text>`).join('')}<g class="plot-crosshair" visibility="hidden"><line y1="${top}" y2="${bottom}" stroke="var(--muted)" stroke-dasharray="3 4"/>${series.map(s=>`<circle r="3.7" fill="${s.color}" stroke="var(--white)" stroke-width="1.5"/>`).join('')}</g><rect data-command-hit x="${left}" y="${top}" width="${right-left}" height="${bottom-top}" fill="transparent"/></svg><div class="command-chart-inspection"><div data-command-readout aria-live="polite"></div><label>Inspect date<input type="range" data-command-scrub min="0" max="${result.dates.length-1}" value="${result.dates.length-1}" aria-label="Inspect common market date"></label></div><figcaption>${date(result.baseDate)} – ${date(result.endDate)} · Common dates, no currency conversion. Price change excludes income. Gold futures.</figcaption></figure>`;
}
export function bindMarketComparison(target,result){
 const figure=target.querySelector('.command-price-chart');if(!figure)return;
 const svg=figure.querySelector('svg'),hit=figure.querySelector('[data-command-hit]'),cross=figure.querySelector('.plot-crosshair'),slider=figure.querySelector('[data-command-scrub]'),readout=figure.querySelector('[data-command-readout]');
 const left=Number(hit.getAttribute('x')),right=left+Number(hit.getAttribute('width')),top=Number(hit.getAttribute('y')),bottom=top+Number(hit.getAttribute('height'));
 const {lo,hi}=scale(result.series.flatMap(s=>s.points.map(p=>p.value-100))),first=Date.parse(result.baseDate),last=Date.parse(result.endDate);
 const inspect=i=>{i=Math.max(0,Math.min(result.dates.length-1,i));slider.value=i;const x=left+(Date.parse(result.dates[i])-first)/(last-first)*(right-left);cross.setAttribute('visibility','visible');cross.querySelector('line').setAttribute('x1',x);cross.querySelector('line').setAttribute('x2',x);cross.querySelectorAll('circle').forEach((c,j)=>{c.setAttribute('cx',x);c.setAttribute('cy',bottom-(result.series[j].points[i].value-100-lo)/(hi-lo)*(bottom-top));});readout.innerHTML=`<time>${date(result.dates[i])}</time>`+result.series.map((s,j)=>`<span class="command-series-${seriesIndex(s,j)}">${esc(s.label)}: <b>${percent(s.points[i].value-100)}</b></span>`).join('');};
 slider.addEventListener('input',()=>inspect(Number(slider.value)));
 hit.addEventListener('pointermove',e=>{const rect=svg.getBoundingClientRect(),w=svg.viewBox.baseVal.width,px=(e.clientX-rect.left)/rect.width*w,t=first+Math.max(0,Math.min(1,(px-left)/(right-left)))*(last-first);let index=0,distance=Infinity;result.dates.forEach((d,i)=>{const delta=Math.abs(Date.parse(d)-t);if(delta<distance){distance=delta;index=i;}});inspect(index);});
 inspect(result.dates.length-1);
}
export function treasuryCurveChart(curve,width=360){
 if(!curve)return '<p class="command-empty">Treasury curve unavailable. No spread inferred.</p>';
 const w=Math.max(235,Math.round(width)),h=156,left=36,right=w-18,top=21,bottom=129,values=curve.points.flatMap(p=>p.value===null?[]:[p.value]);
 if(!values.length)return '<p class="command-empty">Treasury curve unavailable.</p>';
 const low=Math.floor((Math.min(...values)-.1)*2)/2,hi=Math.ceil((Math.max(...values)+.1)*2)/2,span=hi-low||1,x=years=>left+(years-2)/28*(right-left),y=value=>bottom-(value-low)/span*(bottom-top);
 let segment=[];const lines=[];for(const point of curve.points){if(point.value===null){if(segment.length)lines.push(segment);segment=[];}else segment.push(point);}if(segment.length)lines.push(segment);
 const spread=curve.spreadBp,tickStep=span>2?1:.5,below=(p,i)=>{const next=curve.points.slice(i+1).find(q=>q.value!==null);return !!next&&next.value>p.value&&x(next.years)-x(p.years)<48;};
 return `<div class="command-yield-summary"><div><strong>${spread===null?'Unavailable':(spread>0?'+':'')+number(spread,0)+' <small>bp</small>'}</strong><span>10Y − 2Y spread</span></div><time datetime="${curve.date}">${date(curve.date)}</time></div><svg class="command-yield-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="US Treasury par yields on ${date(curve.date)}; ${curve.points.map(p=>p.tenor+': '+(p.value===null?'unavailable':number(p.value)+'%')).join(', ')}"><g class="command-chart-grid">${Array.from({length:Math.round(span/tickStep)+1},(_,i)=>low+i*tickStep).map(v=>`<line x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}"/><text x="${left-7}" y="${y(v)+4}" text-anchor="end">${number(v,1)}%</text>`).join('')}</g>${lines.map(points=>`<polyline points="${points.map(p=>`${x(p.years)},${y(p.value)}`).join(' ')}" class="command-yield-line"/>`).join('')}${curve.points.map((p,i)=>`<text x="${x(p.years)}" y="${h-7}" text-anchor="middle" class="command-maturity-label">${p.years}Y</text>${p.value===null?'':`<circle cx="${x(p.years)}" cy="${y(p.value)}" r="3.2" fill="var(--chart-teal)"/><text class="command-yield-value" x="${x(p.years)}" y="${y(p.value)+(below(p,i)?16:-9)}" text-anchor="middle">${number(p.value)}%</text>`}`).join('')}</svg><p class="command-curve-caption">Par yields · Maturity in years</p>`;
}
