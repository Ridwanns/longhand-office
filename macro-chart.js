// Presentation only. Source observations, analytical inputs and saved studies are never changed.
import {sampleContextRows} from './macro-context-math.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=(n,digits=2,minimumFractionDigits=0)=>Number.isFinite(n)?new Intl.NumberFormat('en-GB',{maximumFractionDigits:digits,minimumFractionDigits}).format(n):'Not reported';
export function macroPeriodRows(rows,frequency){
 return rows.map(row=>{let date;if(frequency==='A'&&/^\d{4}$/.test(row.period))date=row.period+'-12-31';else if(frequency==='M'&&/^\d{4}-\d\d$/.test(row.period))date=row.period+'-01';else if(frequency==='Q'&&/^\d{4}-Q[1-4]$/.test(row.period))date=row.period.slice(0,4)+'-'+String((Number(row.period.at(-1))-1)*3+1).padStart(2,'0')+'-01';else throw Error('Unsupported macro observation period.');return {...row,date};});
}
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
// A display comparison, never an analytical/model input. Missing periods are not skipped.
export function macroPointChange(rows,index,frequency,unit=''){
 const row=rows[index],prior=rows[index-1];
 if(!row||!Number.isFinite(row.value))return 'No reported value for this period';
 if(!prior||!Number.isFinite(prior.value)||!consecutiveMacroDates(prior.date,row.date,frequency))return 'Previous consecutive observation unavailable';
 const delta=row.value-prior.value,amount=Math.abs(delta),label=unit.startsWith('%')?'percentage points':unit==='Basis points'?'basis points':unit.includes('Index')||unit.includes('index')?'index points':unit;
 return (delta===0?'Unchanged':(delta>0?'Up ':'Down ')+(amount>0&&amount<.005?'less than 0.01':number(amount,2,1))+(label?' '+label:''))+' vs '+macroDateLabel(prior.date,frequency);
}
export function macroTimeTicks(first,last,count=6){
 const start=Date.parse(first),end=Date.parse(last),years=(end-start)/31557600000;
 if(start===end)return [{time:start,label:first.slice(0,4)}];
 if(years<2)return Array.from({length:Math.min(count,4)},(_,i)=>({time:start+(end-start)*i/(Math.min(count,4)-1),label:new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',month:'short',...(years<.25?{day:'numeric'}:{year:'2-digit'})}).format(new Date(start+(end-start)*i/(Math.min(count,4)-1)))}));
 const raw=years/Math.max(1,count-1),step=[1,2,5,10,20,25,50].find(v=>v>=raw)||100,ticks=[];
 for(let year=Math.ceil(Number(first.slice(0,4))/step)*step;year<=Number(last.slice(0,4));year+=step){const time=Date.UTC(year,0,1);if(time>=start&&time<=end)ticks.push({time,label:String(year)});}
 const spacing=(end-start)/Math.max(1,count-1)*.65;
 return [{time:start,label:first.slice(0,4)},...ticks.filter(t=>t.time-start>=spacing&&end-t.time>=spacing&&t.label!==first.slice(0,4)&&t.label!==last.slice(0,4)),{time:end,label:last.slice(0,4)}];
}
export function nativeMacroChart(rows,{title='Historical observations',unit='',frequency='D',bars=false,width=760,exact=true}={}){
 const valid=rows.filter(o=>Number.isFinite(o.value));if(!valid.length)return `<figure class="context-empty-chart"><figcaption>${esc(title)}<span>${esc(unit)}</span></figcaption><p class="quiet-note">No reported observations. Missing values are not replaced.</p></figure>`;
 const first=valid[0],last=valid.at(-1),visible=rows.filter(o=>o.date>=first.date&&o.date<=last.date),w=Math.round(Math.max(240,Math.min(1100,width))),h=w<420?244:300,l=w<420?48:62,r=w-18,t=22,b=h-42;
 const scale=macroScale(valid.map(o=>o.value),{zero:bars||unit.startsWith('%')||unit==='Basis points'}),y=v=>b-(v-scale.lo)/(scale.hi-scale.lo)*(b-t),start=Date.parse(first.date),end=Date.parse(last.date),pad=bars?Math.min(22,(r-l)/Math.max(3,valid.length)*.5):8,x=d=>l+pad+(Date.parse(d)-start)/(end-start||1)*(r-l-2*pad);
 const segments=macroSegments(visible,frequency),plotted=segments.map(segment=>sampleContextRows(segment,Math.max(12,Math.round(600*segment.length/valid.length)))),sampled=plotted.reduce((n,s)=>n+s.length,0)<valid.length;
 const bw=Math.max(1,Math.min(26,(r-l)/Math.max(3,frequency==='A'?Number(last.date.slice(0,4))-Number(first.date.slice(0,4))+1:visible.length)*.62));
 const titleText=o=>macroDateLabel(o.date,frequency)+' · '+number(o.value,2,1)+' '+unit;
 const marks=bars?valid.map(o=>`<rect class="macro-bar ${o.value<0?'negative':''}" x="${x(o.date)-bw/2}" y="${Math.min(y(0),y(o.value))}" width="${bw}" height="${Math.max(.7,Math.abs(y(o.value)-y(0)))}"><title>${esc(titleText(o))}</title></rect>`).join(''):plotted.map(points=>`<path class="context-history-line" d="${points.map((o,i)=>i&&frequency==='E'?'H'+x(o.date).toFixed(2)+'V'+y(o.value).toFixed(2):(i?'L':'M')+x(o.date).toFixed(2)+' '+y(o.value).toFixed(2)).join(' ')}"/>${points.length===1?`<circle class="context-history-dot" cx="${x(points[0].date)}" cy="${y(points[0].value)}" r="2.5"/>`:''}`).join('')+`<circle class="context-history-dot" cx="${x(last.date)}" cy="${y(last.value)}" r="3.5"/>`;
 const data=visible.map(o=>[o.date,o.value,o.status||'As published']),comparison=macroPointChange(visible,visible.length-1,frequency,unit);
 const timeTicks=(['M','Q'].includes(frequency)&&(end-start)/31557600000<2)?[...new Set(Array.from({length:Math.min(4,valid.length)},(_,i)=>Math.round(i*(valid.length-1)/Math.max(1,Math.min(4,valid.length)-1))))].map(i=>({time:Date.parse(valid[i].date),label:macroDateLabel(valid[i].date,frequency)})):frequency==='A'&&Number(last.date.slice(0,4))-Number(first.date.slice(0,4))<2?[...new Map([first,last].map(o=>[o.date,{time:Date.parse(o.date),label:o.date.slice(0,4)}])).values()]:macroTimeTicks(first.date,last.date,Math.max(3,Math.floor((r-l)/95)));
 return `<figure class="context-history-chart ${bars?'context-bar-chart':'scientific-plot'}" data-macro-chart data-macro-lo="${scale.lo}" data-macro-hi="${scale.hi}" data-macro-unit="${esc(unit)}" data-macro-frequency="${frequency}" data-macro-points="${esc(JSON.stringify(data))}"><figcaption>${esc(title)}<span>${esc(unit)} · ${frequency==='A'?'Annual':frequency==='M'?'Monthly':frequency==='Q'?'Quarterly':frequency==='W'?'Weekly':frequency==='E'?'Decision dates':'Daily'} observations</span></figcaption><div class="context-chart-reading"><strong data-macro-reading>${esc(titleText(last))}</strong><span data-macro-status>${esc(last.status||'As published')}</span></div><p class="context-chart-change" data-macro-change>${esc(comparison)}</p><div class="context-chart-plot"><div class="context-chart-tooltip" data-macro-tooltip hidden></div><svg viewBox="0 0 ${w} ${h}" role="group" tabindex="0" data-macro-surface aria-roledescription="interactive chart" aria-label="${esc(title)}. Use Left and Right arrows, Home or End to inspect. ${esc(macroDateLabel(first.date,frequency))} to ${esc(macroDateLabel(last.date,frequency))}. ${valid.length} reported observations. Inspect dates below.">${scale.ticks.map(v=>`<path class="context-chart-grid" d="M${l} ${y(v)}H${r}"/><text x="${l-10}" y="${y(v)+4}" text-anchor="end" font-size="12">${number(v,6)}${unit.startsWith('%')?'%':''}</text>`).join('')}${scale.lo<=0&&scale.hi>=0?`<path class="macro-zero" d="M${l} ${y(0)}H${r}"/>`:''}${marks}<path class="context-chart-cursor" data-macro-cursor d="M${x(last.date)} ${t}V${b}"/><circle class="context-inspected-point" data-macro-point cx="${x(last.date)}" cy="${y(last.value)}" r="4.5"/>${timeTicks.map(tick=>`<text x="${l+pad+(tick.time-start)/(end-start||1)*(r-l-2*pad)}" y="${h-12}" text-anchor="middle" font-size="12">${esc(tick.label)}</text>`).join('')}</svg></div><div class="context-chart-actions"><span>Hover or tap a point. Arrow keys inspect history.</span><button type="button" class="text-button" data-macro-latest aria-label="Return to latest observation">Latest</button></div><label class="context-chart-inspector">Inspect history<input type="range" min="0" max="${visible.length-1}" value="${visible.length-1}" step="1" aria-label="Inspect ${esc(title)} history" aria-valuetext="${esc(titleText(last))}" data-macro-inspect></label><div class="context-chart-coverage"><span>${esc(macroDateLabel(first.date,frequency))} to ${esc(macroDateLabel(last.date,frequency))} · ${valid.length} reported observations</span><span>Calendar spacing · gaps retained</span></div>${sampled?'<p class="quiet-note">Chart display uses sampled observations, retaining interval extremes and reported gaps. Exact inspection and download retain every source value. No model input is sampled.</p>':''}${exact?`<details class="context-exact"><summary>Exact observations</summary><div class="table-wrap" tabindex="0" role="region" aria-label="Macro context exact observations"><table><thead><tr><th scope="col">Observation period</th><th scope="col">${esc(unit)}</th><th scope="col">Source status</th></tr></thead><tbody>${rows.map(o=>`<tr><th scope="row">${esc(macroDateLabel(o.date,frequency))}</th><td>${Number.isFinite(o.value)?esc(String(o.value)):'Not reported'}</td><td>${esc(o.status||'As published')}</td></tr>`).join('')}</tbody></table></div></details>`:''}</figure>`;
}
// A single delegated inspector works after redraws and in the geographic atlas.
export function mountMacroChartInspectors(parent,signal){
 const update=(figure,index,{tooltip=false}={})=>{const points=JSON.parse(figure.dataset.macroPoints),rows=points.map(([date,value])=>({date,value})),row=points[index],unit=figure.dataset.macroUnit,frequency=figure.dataset.macroFrequency;if(!row)return;
  const text=macroDateLabel(row[0],frequency)+' · '+number(row[1],2,1)+' '+unit,change=macroPointChange(rows,index,frequency,unit),slider=figure.querySelector('[data-macro-inspect]');
  figure.querySelector('[data-macro-reading]').textContent=text;figure.querySelector('[data-macro-status]').textContent=row[2];figure.querySelector('[data-macro-change]').textContent=change;slider.value=index;slider.setAttribute('aria-valuetext',text+'. '+change);
  const svg=figure.querySelector('svg'),w=svg.viewBox.baseVal.width,h=svg.viewBox.baseVal.height,l=w<420?48:62,r=w-18,pad=figure.classList.contains('context-bar-chart')?Math.min(22,(r-l)/Math.max(3,points.filter(o=>Number.isFinite(o[1])).length)*.5):8,x=l+pad+(Date.parse(row[0])-Date.parse(points[0][0]))/(Date.parse(points.at(-1)[0])-Date.parse(points[0][0])||1)*(r-l-2*pad),b=h-42,y=b-(row[1]-Number(figure.dataset.macroLo))/(Number(figure.dataset.macroHi)-Number(figure.dataset.macroLo))*(b-22);
  figure.querySelector('[data-macro-cursor]').setAttribute('d',`M${x} 22V${b}`);const point=figure.querySelector('[data-macro-point]');point.style.display=Number.isFinite(row[1])?'':'none';if(Number.isFinite(row[1])){point.setAttribute('cx',x);point.setAttribute('cy',y);}
  const tip=figure.querySelector('[data-macro-tooltip]');tip.hidden=!tooltip;if(tooltip){tip.replaceChildren();const date=document.createElement('span'),value=document.createElement('strong'),detail=document.createElement('small');date.textContent=macroDateLabel(row[0],frequency);value.textContent=number(row[1],2,1)+' '+unit;detail.textContent=change;tip.append(date,value,detail);const box=svg.getBoundingClientRect(),half=Math.min(220,box.width-24)/2,position=Math.max(half+6,Math.min(box.width-half-6,x/w*box.width));tip.style.left=position+'px';}
 };
 const inspect=(e,pin)=>{const svg=e.target.closest('[data-macro-chart] svg');if(!svg)return;const figure=svg.closest('[data-macro-chart]');if(!pin&&figure.dataset.macroPinned==='true')return;const rows=JSON.parse(figure.dataset.macroPoints),box=svg.getBoundingClientRect(),w=svg.viewBox.baseVal.width,l=w<420?48:62,r=w-18,pad=figure.classList.contains('context-bar-chart')?Math.min(22,(r-l)/Math.max(3,rows.filter(o=>Number.isFinite(o[1])).length)*.5):8,ratio=Math.max(0,Math.min(1,((e.clientX-box.left)/box.width*w-l-pad)/(r-l-2*pad))),time=Date.parse(rows[0][0])+ratio*(Date.parse(rows.at(-1)[0])-Date.parse(rows[0][0]));let index=0;for(let i=1;i<rows.length;i++)if(Math.abs(Date.parse(rows[i][0])-time)<Math.abs(Date.parse(rows[index][0])-time))index=i;if(pin){figure.dataset.macroPinned='true';svg.focus({preventScroll:true});}update(figure,index,{tooltip:true});};
 parent.addEventListener('input',e=>{if(e.target.matches('[data-macro-inspect]')){const figure=e.target.closest('[data-macro-chart]');figure.dataset.macroPinned='true';update(figure,Number(e.target.value));}},{signal});
 parent.addEventListener('keydown',e=>{if(!e.target.matches('[data-macro-surface]')||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const figure=e.target.closest('[data-macro-chart]'),slider=figure.querySelector('[data-macro-inspect]'),max=Number(slider.max),index=e.key==='Home'?0:e.key==='End'?max:Math.max(0,Math.min(max,Number(slider.value)+(e.key==='ArrowLeft'?-1:1)));figure.dataset.macroPinned='true';update(figure,index,{tooltip:true});},{signal});
 parent.addEventListener('pointerdown',e=>{if(e.button===0)inspect(e,true);},{signal});
 parent.addEventListener('pointermove',e=>{if(e.pointerType!=='touch')inspect(e,false);},{signal});
 parent.addEventListener('pointerout',e=>{const plot=e.target.closest('.context-chart-plot');if(plot&&!plot.contains(e.relatedTarget)&&plot.closest('[data-macro-chart]').dataset.macroPinned!=='true')plot.querySelector('[data-macro-tooltip]').hidden=true;},{signal});
 parent.addEventListener('click',e=>{const button=e.target.closest('[data-macro-latest]');if(button){const figure=button.closest('[data-macro-chart]');delete figure.dataset.macroPinned;update(figure,JSON.parse(figure.dataset.macroPoints).length-1);}},{signal});
}
