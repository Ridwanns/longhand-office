// Presentation only. Source observations, analytical inputs and saved studies are never changed.
import {sampleContextRows} from './macro-context-math.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=(n,digits=2,minimumFractionDigits=0)=>Number.isFinite(n)?new Intl.NumberFormat('en-GB',{maximumFractionDigits:digits,minimumFractionDigits}).format(n):'Not reported';
export function macroScale(values,{zero=false,target=4}={}){
 let lo=Math.min(...values),hi=Math.max(...values);if(zero){lo=Math.min(0,lo);hi=Math.max(0,hi);}
 if(lo===hi){const pad=Math.max(Math.abs(lo)*.08,1);lo-=pad;hi+=pad;}
 const raw=(hi-lo)/target,power=10**Math.floor(Math.log10(raw)),ratio=raw/power,step=[1,2,2.5,5,10].reduce((best,n)=>Math.abs(Math.log(n/ratio))<Math.abs(Math.log(best/ratio))?n:best,1)*power;
 lo=Math.floor(lo/step)*step;hi=Math.ceil(hi/step)*step;
 const ticks=[];for(let i=0;i<=Math.round((hi-lo)/step);i++)ticks.push(Number((lo+i*step).toPrecision(12)));
 return {lo,hi,step,ticks};
}
const monthIndex=d=>Number(d.slice(0,4))*12+Number(d.slice(5,7));
export function consecutiveMacroDates(a,b,frequency){
 if(frequency==='A')return Number(b.slice(0,4))-Number(a.slice(0,4))===1;
 if(frequency==='M'||frequency==='Q')return monthIndex(b)-monthIndex(a)===(frequency==='Q'?3:1);
 const days=(Date.parse(b)-Date.parse(a))/86400000;
 return days>0&&days<=(frequency==='W'?8:frequency==='E'?45:4);
}
export function macroSegments(rows,frequency){
 const segments=[];let current=[],prior=null;
 for(const row of rows){if(!Number.isFinite(row.value)){if(current.length)segments.push(current);current=[];prior=null;continue;}
  if(prior&&!consecutiveMacroDates(prior.date,row.date,frequency)){segments.push(current);current=[];}
  current.push(row);prior=row;
 }if(current.length)segments.push(current);return segments;
}
export function macroDateLabel(date,frequency){
 if(frequency==='A')return date.slice(0,4);
 if(frequency==='Q')return 'Q'+(Math.floor((Number(date.slice(5,7))-1)/3)+1)+' '+date.slice(0,4);
 return new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',...(frequency==='M'?{month:'short',year:'numeric'}:{day:'numeric',month:'short',year:'numeric'})}).format(new Date(date+'T00:00:00Z'));
}
export function macroTimeTicks(first,last,count=6){
 const start=Date.parse(first),end=Date.parse(last),years=(end-start)/31557600000;
 if(start===end)return [{time:start,label:first.slice(0,4)}];
 if(years<2)return Array.from({length:Math.min(count,4)},(_,i)=>({time:start+(end-start)*i/(Math.min(count,4)-1),label:new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',month:'short',year:'2-digit'}).format(new Date(start+(end-start)*i/(Math.min(count,4)-1)))}));
 const raw=years/Math.max(1,count-1),step=[1,2,5,10,20,25,50].find(v=>v>=raw)||100,ticks=[];
 for(let year=Math.ceil(Number(first.slice(0,4))/step)*step;year<=Number(last.slice(0,4));year+=step){const time=Date.UTC(year,0,1);if(time>=start&&time<=end)ticks.push({time,label:String(year)});}
 const spacing=(end-start)/Math.max(1,count-1)*.65;
 return [{time:start,label:first.slice(0,4)},...ticks.filter(t=>t.time-start>=spacing&&end-t.time>=spacing),{time:end,label:last.slice(0,4)}];
}
export function nativeMacroChart(rows,{title='Historical observations',unit='',frequency='D',bars=false,width=760,exact=true}={}){
 const valid=rows.filter(o=>Number.isFinite(o.value));if(!valid.length)return `<figure class="context-empty-chart"><figcaption>${esc(title)}<span>${esc(unit)}</span></figcaption><p class="quiet-note">No reported observations. Missing values are not replaced.</p></figure>`;
 const first=valid[0],last=valid.at(-1),visible=rows.filter(o=>o.date>=first.date&&o.date<=last.date),w=Math.round(Math.max(240,Math.min(1100,width))),h=w<420?244:300,l=w<420?48:62,r=w-18,t=22,b=h-42;
 const scale=macroScale(valid.map(o=>o.value),{zero:bars}),y=v=>b-(v-scale.lo)/(scale.hi-scale.lo)*(b-t),start=Date.parse(first.date),end=Date.parse(last.date),pad=bars?Math.min(22,(r-l)/Math.max(3,valid.length)*.5):8,x=d=>l+pad+(Date.parse(d)-start)/(end-start||1)*(r-l-2*pad);
 const segments=macroSegments(visible,frequency),plotted=segments.map(segment=>sampleContextRows(segment,Math.max(12,Math.round(600*segment.length/valid.length)))),sampled=plotted.reduce((n,s)=>n+s.length,0)<valid.length;
 const bw=Math.max(1,Math.min(26,(r-l)/Math.max(3,frequency==='A'?Number(last.date.slice(0,4))-Number(first.date.slice(0,4))+1:visible.length)*.62));
 const titleText=o=>macroDateLabel(o.date,frequency)+' · '+number(o.value,2,1)+' '+unit;
 const marks=bars?valid.map(o=>`<rect class="macro-bar ${o.value<0?'negative':''}" x="${x(o.date)-bw/2}" y="${Math.min(y(0),y(o.value))}" width="${bw}" height="${Math.max(.7,Math.abs(y(o.value)-y(0)))}"><title>${esc(titleText(o))}</title></rect>`).join(''):plotted.map(points=>`<path class="context-history-line" d="${points.map((o,i)=>i&&frequency==='E'?'H'+x(o.date).toFixed(2)+'V'+y(o.value).toFixed(2):(i?'L':'M')+x(o.date).toFixed(2)+' '+y(o.value).toFixed(2)).join(' ')}"/>${points.length===1?`<circle class="context-history-dot" cx="${x(points[0].date)}" cy="${y(points[0].value)}" r="2.5"/>`:''}`).join('')+`<circle class="context-history-dot" cx="${x(last.date)}" cy="${y(last.value)}" r="3.5"/>`;
 const data=visible.map(o=>[o.date,o.value,o.status||'As published']);
 const timeTicks=frequency==='A'&&Number(last.date.slice(0,4))-Number(first.date.slice(0,4))<2?[...new Map([first,last].map(o=>[o.date,{time:Date.parse(o.date),label:o.date.slice(0,4)}])).values()]:macroTimeTicks(first.date,last.date,Math.max(3,Math.floor((r-l)/95)));
 return `<figure class="context-history-chart ${bars?'context-bar-chart':'scientific-plot'}" data-macro-chart data-macro-unit="${esc(unit)}" data-macro-frequency="${frequency}" data-macro-points="${esc(JSON.stringify(data))}"><figcaption>${esc(title)}<span>${esc(unit)} · ${frequency==='A'?'Annual':frequency==='M'?'Monthly':frequency==='Q'?'Quarterly':frequency==='W'?'Weekly':frequency==='E'?'Decision dates':'Daily'} observations</span></figcaption><div class="context-chart-reading"><strong data-macro-reading>${esc(titleText(last))}</strong><span data-macro-status>${esc(last.status||'As published')}</span></div><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}. ${esc(macroDateLabel(first.date,frequency))} to ${esc(macroDateLabel(last.date,frequency))}. ${valid.length} reported observations. Inspect dates below.">${scale.ticks.map(v=>`<path class="context-chart-grid" d="M${l} ${y(v)}H${r}"/><text x="${l-10}" y="${y(v)+4}" text-anchor="end" font-size="12">${number(v,6)}${unit.startsWith('%')?'%':''}</text>`).join('')}${scale.lo<=0&&scale.hi>=0?`<path class="macro-zero" d="M${l} ${y(0)}H${r}"/>`:''}${marks}<path class="context-chart-cursor" data-macro-cursor d="M${x(last.date)} ${t}V${b}"/>${timeTicks.map(tick=>`<text x="${l+pad+(tick.time-start)/(end-start||1)*(r-l-2*pad)}" y="${h-12}" text-anchor="middle" font-size="12">${esc(tick.label)}</text>`).join('')}</svg><label class="context-chart-inspector">Inspect history<input type="range" min="0" max="${visible.length-1}" value="${visible.length-1}" step="1" aria-label="Inspect ${esc(title)} history" aria-valuetext="${esc(titleText(last))}" data-macro-inspect></label><div class="context-chart-coverage"><span>${first.date.slice(0,4)} to ${last.date.slice(0,4)} · ${valid.length} reported observations</span><span>Calendar spacing · gaps retained</span></div>${sampled?'<p class="quiet-note">Chart display uses sampled observations, retaining interval extremes and reported gaps. Exact inspection and download retain every source value. No model input is sampled.</p>':''}${exact?`<details class="context-exact"><summary>Exact observations</summary><div class="table-wrap" tabindex="0" role="region" aria-label="Macro context exact observations"><table><thead><tr><th scope="col">Observation period</th><th scope="col">${esc(unit)}</th><th scope="col">Source status</th></tr></thead><tbody>${rows.map(o=>`<tr><th scope="row">${esc(macroDateLabel(o.date,frequency))}</th><td>${Number.isFinite(o.value)?esc(String(o.value)):'Not reported'}</td><td>${esc(o.status||'As published')}</td></tr>`).join('')}</tbody></table></div></details>`:''}</figure>`;
}
// A single delegated inspector works after redraws and in the geographic atlas.
export function mountMacroChartInspectors(parent,signal){
 const update=(figure,index)=>{const rows=JSON.parse(figure.dataset.macroPoints),row=rows[index],unit=figure.dataset.macroUnit,frequency=figure.dataset.macroFrequency;if(!row)return;
  const text=macroDateLabel(row[0],frequency)+' · '+number(row[1],2,1)+' '+unit;figure.querySelector('[data-macro-reading]').textContent=text;figure.querySelector('[data-macro-status]').textContent=row[2];figure.querySelector('[data-macro-inspect]').setAttribute('aria-valuetext',text);
  const svg=figure.querySelector('svg'),w=svg.viewBox.baseVal.width,l=w<420?48:62,r=w-18,pad=figure.classList.contains('context-bar-chart')?Math.min(22,(r-l)/Math.max(3,rows.filter(o=>Number.isFinite(o[1])).length)*.5):8,x=l+pad+(Date.parse(row[0])-Date.parse(rows[0][0]))/(Date.parse(rows.at(-1)[0])-Date.parse(rows[0][0])||1)*(r-l-2*pad);figure.querySelector('[data-macro-cursor]').setAttribute('d',`M${x} 22V${svg.viewBox.baseVal.height-42}`);
 };
 parent.addEventListener('input',e=>{if(e.target.matches('[data-macro-inspect]'))update(e.target.closest('[data-macro-chart]'),Number(e.target.value));},{signal});
 parent.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const svg=e.target.closest('[data-macro-chart] svg');if(!svg)return;const figure=svg.closest('[data-macro-chart]'),rows=JSON.parse(figure.dataset.macroPoints),box=svg.getBoundingClientRect(),w=svg.viewBox.baseVal.width,l=w<420?48:62,ratio=Math.max(0,Math.min(1,((e.clientX-box.left)/box.width*w-l)/(w-18-l))),time=Date.parse(rows[0][0])+ratio*(Date.parse(rows.at(-1)[0])-Date.parse(rows[0][0]));let index=0;for(let i=1;i<rows.length;i++)if(Math.abs(Date.parse(rows[i][0])-time)<Math.abs(Date.parse(rows[index][0])-time))index=i;figure.querySelector('[data-macro-inspect]').value=index;update(figure,index);},{signal});
}
