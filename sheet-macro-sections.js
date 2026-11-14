// Sheet 02 Macro: the detail sections. Ported from design/preview/macro-sections.js.
// Sheet 02 Macro — renders every section of the original Office macro page from window.MACRO (+ window.COUNTRIES).
export function mountMacroSections(listen){
const M=window.MACRO,C=window.COUNTRIES||{};if(!M)return;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f2=v=>Number(v).toFixed(2);
// computed pulse records (built from the snapshot) reused wherever a card repeats a series
const REC=id=>[...M.pulse.priority,...M.pulse.groups.flatMap(g=>g.items)].find(r=>r.id===id)||{};
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];
const dLabel=d=>{d=String(d);if(/^\d{4}$/.test(d))return d;const y=d.slice(0,4),m=+d.slice(5,7);if(d.length<=7)return `${MON[m-1]} ${y}`;return `${+d.slice(8,10)} ${MON[m-1]} ${y}`};
const qLabel=d=>`Q${Math.floor((+d.slice(5,7)-1)/3)+1} ${d.slice(0,4)}`;
const chClass=t=>/^Up/.test(t)?'up':/^Down/.test(t)?'dn':'flat';
const glyph=t=>/^Up/.test(t)?'▲ ':/^Down/.test(t)?'▼ ':'';

/* ---------- generic line / bar chart with crosshair readout ---------- */
function lineChart(svg,pts,o={}){
  if(!svg)return;const W=Math.max(220,svg.clientWidth||svg.parentElement.clientWidth),H=o.h||220,L=4,R=W-46,T=10,B=H-20;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('preserveAspectRatio','none');
  if(!pts||pts.length<2){svg.innerHTML=`<text x="${W/2}" y="${H/2}" text-anchor="middle">No history series in the snapshot</text>`;return}
  const v=pts.map(p=>p[1]),mn=Math.min(...v,o.zero?0:Infinity),mx=Math.max(...v,o.zero?0:-Infinity),pad=(mx-mn)*.08||1,lo=mn-pad,hi=mx+pad;
  const X=i=>L+(R-L)*i/(pts.length-1),Y=x=>B-(B-T)*(x-lo)/(hi-lo);
  let s='';for(let k=0;k<=4;k++){const val=lo+(hi-lo)*k/4;s+=`<line class="g" x1="${L}" x2="${R}" y1="${Y(val)}" y2="${Y(val)}"/><text x="${R+6}" y="${Y(val)+3}">${(o.fmt||f2)(val)}</text>`}
  if(lo<0&&hi>0)s+=`<line class="z" x1="${L}" x2="${R}" y1="${Y(0)}" y2="${Y(0)}"/>`;
  const step=Math.max(1,Math.round(pts.length/6));pts.forEach((p,i)=>{if(i%step===0||i===pts.length-1)s+=`<text x="${X(i)}" y="${H-4}" text-anchor="${i===pts.length-1?'end':i===0?'start':'middle'}">${(o.xl||(d=>String(d).slice(0,4)))(p[0])}</text>`});
  if(o.bars){const bw=Math.max(2,(R-L)/pts.length*.62);pts.forEach((p,i)=>{const y0=Y(Math.max(0,Math.min(p[1],0))),y1=Y(Math.max(p[1],0));s+=`<rect class="bar ${p[1]<0?'neg':'pos'} ${o.sel===i?'sel':''}" x="${X(i)-bw/2}" y="${Math.min(Y(p[1]),Y(0))}" width="${bw}" height="${Math.max(1,Math.abs(Y(p[1])-Y(0)))}"/>`})}
  else{const d=pts.map((p,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(p[1]).toFixed(1)).join('');s+=`<path class="a" d="${d} L${X(pts.length-1)} ${B} L${X(0)} ${B}Z"/><path class="l" d="${d}"/>`;
    s+=`<circle cx="${X(pts.length-1)}" cy="${Y(v.at(-1))}" r="3.5" fill="var(--focus)"/>`}
  s+=`<line class="xh" y1="${T}" y2="${B}"/>`;svg.innerHTML=s;
  const xh=svg.querySelector('.xh'),ro=o.ro&&document.getElementById(o.ro);
  svg.onpointermove=e=>{const r=svg.getBoundingClientRect(),i=Math.round(Math.min(1,Math.max(0,((e.clientX-r.left)/r.width*W-L)/(R-L)))*(pts.length-1));
    xh.setAttribute('x1',X(i));xh.setAttribute('x2',X(i));xh.style.opacity=.45;if(ro)ro.innerHTML=`${esc((o.pl||dLabel)(pts[i][0]))} · <b>${(o.fmt||f2)(pts[i][1])}${o.unit?' '+esc(o.unit):''}</b>${o.srcName?' · '+esc(o.srcName):''}`};
  svg.onpointerleave=()=>{xh.style.opacity=0;if(ro)ro.textContent=''};
}
function spark(r){
  const h=r.hist||[];if(h.length<1)return '';
  const W=240,H=44,v=h.map(p=>p[1]),mn=Math.min(...v),mx=Math.max(...v),sp=mx-mn||1,X=i=>h.length===1?W/2:6+(W-12)*i/(h.length-1),Y=x=>H-6-(H-14)*(x-mn)/sp;
  const d=h.map((p,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(p[1]).toFixed(1)).join('');
  const dots=h.length<=12?h.map((p,i)=>`<circle class="${i===h.length-1?'last':''}" cx="${X(i)}" cy="${Y(p[1])}" r="${i===h.length-1?3.2:2.4}"/>`).join(''):`<circle class="last" cx="${X(h.length-1)}" cy="${Y(v.at(-1))}" r="3.2"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${h.length>1?`<path class="l" d="${d}"/>`:''}${dots}</svg>`;
}
function card(r,small){
  const na=!/\d/.test(r.v);
  return `<article class="ic ${small?'small':''} ${na?'na':''}" data-q="${esc((r.t+' '+r.u+' '+(r.g||'')).toLowerCase())}">
    <div class="t">${esc(r.t)}</div><div class="per">${esc(r.per)}</div>
    <div class="v"><b class="num">${esc(r.v)}</b><span>${esc(r.u)}</span></div>
    <div class="ch ${chClass(r.ch)}">${glyph(r.ch)}${esc(r.ch)}</div>
    ${spark(r)}${r.range?`<div class="rng"><span>${esc(r.range[0])}</span><span>${esc(r.range[1])}</span></div>`:''}
    ${r.note?`<div class="note">${esc(r.note)}</div>`:''}
    <div>${(r.flags||[]).map(f=>`<span class="flag">${esc(f)}</span>`).join('')}</div>
    ${r.src?`<div class="src" data-css="margin-top:4px">${esc(r.src.id)}${r.src.url?` · <a href="${esc(r.src.url)}" target="_blank" rel="noopener noreferrer">source</a>`:''}</div>`:''}
  </article>`;
}

function rec(r){
  const na=!/\d/.test(r.v);
  return `<div class="rec ${na?'na':''}" role="row" data-q="${esc((r.t+' '+r.u+' '+(r.g||'')).toLowerCase())}">
    <span class="rt"><b>${esc(r.t)}</b><small>${esc(r.per)}${r.src?` · ${esc(r.src.id)}${r.src.url?` · <a href="${esc(r.src.url)}" target="_blank" rel="noopener noreferrer">source</a>`:''}`:''}</small>${(r.flags||[]).map(f=>`<span class="flag">${esc(f)}</span>`).join('')}</span>
    <span class="rv"><b class="num">${esc(r.v)}</b><small>${esc(r.u)}</small></span>
    <span class="rc ch">${glyph(r.ch)}${esc(r.ch)}${r.note?`<small>${esc(r.note)}</small>`:''}</span>
    <span class="rs">${spark(r)}${r.range?`<small><span>${esc(r.range[0])}</span><span>${esc(r.range[1])}</span></small>`:''}</span>
  </div>`;
}
/* ---------- 1. Economic pulse ---------- */
function pulse(){
  const el=$('#pulse .panel');if(!el)return;const P=M.pulse,n=P.groups.reduce((a,g)=>a+g.items.length,0);
  el.innerHTML=`<div class="sec-head"><div><div class="kicker">Economic pulse · IDN</div><h2>High-impact focus <span class="stars">★★★</span></h2><p>${esc(P.summary)}</p></div>
    <input class="filter" id="indfind" type="search" placeholder="Find an indicator" aria-label="Find an indicator"></div>
    <div class="cards prio">${P.priority.map(r=>card(r)).join('')}</div>
    <details class="more" open><summary>More indicators &amp; separate source records<small>${n} records</small></summary>
      <div class="recs" role="table" aria-label="More indicators and separate source records">
        <div class="rec head" role="row"><span>Indicator</span><span>Latest</span><span>Change</span><span>History</span></div>
        ${P.groups.map(g=>`<div class="rgrp" role="rowgroup"><div class="sub">${esc(g.g)}</div>${g.items.map(r=>rec({...r,g:g.g})).join('')}</div>`).join('')}
      </div>
      <div class="sub">Coverage still missing</div><ul class="missing">${P.missing.map(m=>`<li><b>${esc(m[0])}</b><span>${esc(m[1])}</span></li>`).join('')}</ul>
    </details>`;
  $('#indfind').oninput=e=>{const q=e.target.value.trim().toLowerCase();$$('#pulse .ic,#pulse .rec:not(.head)').forEach(c=>c.hidden=!!q&&!c.dataset.q.includes(q));
    $$('#pulse .rgrp').forEach(g=>g.hidden=g.querySelectorAll('.rec:not([hidden])').length===0)};
}

/* ---------- 2. Cycle analysis ---------- */
function quadSVG(o){
  const S=300,pad=34,X=v=>pad+(v+o.xr)/(2*o.xr)*(S-2*pad),Y=v=>S-pad-(v+o.yr)/(2*o.yr)*(S-2*pad),cx=X(0),cy=Y(0);
  const lab=[[1,pad+6,pad+14,'Quad 3','Slower growth','Rising inflation','start'],[2,S-pad-6,pad+14,'Quad 2','Faster growth','Rising inflation','end'],[4,pad+6,S-pad-26,'Quad 4','Slower growth','Easing inflation','start'],[3,S-pad-6,S-pad-26,'Quad 1','Faster growth','Easing inflation','end']];
  const qn={1:3,2:2,4:4,3:1};
  let s=`<rect class="qcell ${o.active===3?'on':''}" x="${pad}" y="${pad}" width="${cx-pad}" height="${cy-pad}" data-css="fill:${o.active===3?'var(--accent-soft)':'none'}\"/><rect class="qcell" x="${cx}" y="${pad}" width="${S-pad-cx}" height="${cy-pad}" data-css="fill:${o.active===2?'var(--accent-soft)':'none'}\"/><rect class="qcell" x="${pad}" y="${cy}" width="${cx-pad}" height="${S-pad-cy}" data-css="fill:${o.active===4?'var(--accent-soft)':'none'}\"/><rect class="qcell" x="${cx}" y="${cy}" width="${S-pad-cx}" height="${S-pad-cy}" data-css="fill:${o.active===1?'var(--accent-soft)':'none'}\"/>`;
  for(const l of lab)s+=`<text class="qlab" x="${l[1]}" y="${l[2]}" text-anchor="${l[6]}">${l[3]}</text><text class="qsub" x="${l[1]}" y="${l[2]+13}" text-anchor="${l[6]}">${l[4]}</text><text class="qsub" x="${l[1]}" y="${l[2]+25}" text-anchor="${l[6]}">${l[5]}</text>`;
  s+=`<line class="ax" x1="${pad}" x2="${S-pad}" y1="${cy}" y2="${cy}"/><line class="ax" x1="${cx}" x2="${cx}" y1="${pad}" y2="${S-pad}"/>`;
  s+=`<text class="tick" x="${pad}" y="${S-pad+14}" text-anchor="start">${(-o.xr).toFixed(1)}</text><text class="tick" x="${cx}" y="${S-pad+14}" text-anchor="middle">0</text><text class="tick" x="${S-pad}" y="${S-pad+14}" text-anchor="end">${o.xr.toFixed(1)}</text>`;
  s+=`<text class="tick" x="${pad-4}" y="${pad+4}" text-anchor="end">${o.yr.toFixed(1)}</text><text class="tick" x="${pad-4}" y="${S-pad}" text-anchor="end">${(-o.yr).toFixed(1)}</text>`;
  s+=`<text class="tick" x="${S/2}" y="${S-6}" text-anchor="middle">Growth change (pp) →</text><text class="tick" transform="translate(10 ${S/2}) rotate(-90)" text-anchor="middle">Inflation change (pp) →</text>`;
  if(o.path)s+=`<path class="path" d="${o.path.map((p,i)=>(i?'L':'M')+X(p[0])+' '+Y(p[1])).join('')}"/>`;
  for(const p of o.points)s+=p.annual?`<circle class="apt ${p.sel?'sel':''}" data-y="${p.label}" cx="${X(p.x)}" cy="${Y(p.y)}" r="${p.sel?6:4.2}"><title>${p.label}: growth ${f2(p.x)} pp, inflation ${f2(p.y)} pp</title></circle>${p.sel||p.show?`<text class="yr" x="${X(p.x)+8}" y="${Y(p.y)-6}">${p.label}</text>`:''}`
    :`<circle class="pt" cx="${X(p.x)}" cy="${Y(p.y)}" r="7"/><text class="yr" x="${X(p.x)+11}" y="${Y(p.y)+4}">${esc(p.label)}</text>`;
  return `<svg class="quadchart" viewBox="0 0 ${S} ${S}">${s}</svg>`;
}
const QTXT={1:'Growth accelerating, inflation easing',2:'Growth accelerating, inflation rising',3:'Growth slowing, inflation rising',4:'Growth slowing, inflation easing'};
const CY=window.CYCLES||{};
let CYC='IDN',annualSel=-1,showPath=false,gdpRange='10y',cpiRange='10y';
const sp=v=>(v>0?'+':v<0?'−':'')+f2(Math.abs(v));
const axisTxt='On an axis · one rate is unchanged';
/* one shape for every economy: Indonesia keeps its reviewed BPS readings, the rest come from cycles.js */
function cyc(iso){
  if(iso==='IDN'){const m=M.cycle;return {iso,name:'Indonesia',regime:m.regime,latest:m.latest,annual:m.annual,gdpHist:m.gdpHist,gdpLong:m.gdpLong,cpiHist:m.cpiHist,cpiLong:m.cpiLong,
    regimeSrc:'GDP: BPS release; CPI quarter-end: BIS long consumer prices / BPS. Different reporting periods are aligned to the quarter.',
    gdpNote:C.IDN?.gdp&&Number.isFinite(C.IDN.gdp.v)?`latest reading ${C.IDN.gdp.per}: ${f2(C.IDN.gdp.v)}% (${C.IDN.gdp.src})`:'',cpiNote:C.IDN?.cpi&&Number.isFinite(C.IDN.cpi.v)?`latest reading ${C.IDN.cpi.per}: ${f2(C.IDN.cpi.v)}% (${C.IDN.cpi.src})`:'',gdpSrcName:'World Bank GEM, derived',cpiSrcName:'BIS / national, reported',
    method:`${m.method} GDP history: ${m.sources.gdp?.id} (World Bank GEM; Office derives 100 × (seasonally adjusted real GDP level / same quarter a year earlier − 1), not annualized). CPI history: ${m.sources.cpi?.id} (national sources via the BIS long consumer prices database, published year-on-year change). Annual archive: World Bank WDI annual rates.`}}
  const c=CY[iso];if(!c)return null;const r=c.regime,l=c.latest;
  const R=r.missing?{missing:r.missing}:{quad:r.quad,label:r.label,text:r.quad?QTXT[r.quad]:axisTxt,gdp:{ch:sp(r.gdp.ch)+' pp',detail:r.gdp.detail},cpi:{ch:sp(r.cpi.ch)+' pp',detail:r.cpi.detail}};
  const side=x=>({ch:x.ch,v:f2(x.v)+'%',from:f2(x.from)+'%',per:`${x.per} vs ${x.prior}`});
  const L=l.missing?{missing:l.missing}:{quad:l.quad,text:l.quad?QTXT[l.quad]:axisTxt,note:`GDP ${l.gdp.per} · CPI ${l.cpi.per}${l.mixed?' · Different reporting periods':''}`,gdp:side(l.gdp),cpi:side(l.cpi)};
  return {iso,name:c.name,regime:R,latest:L,annual:c.annual||[],gdpHist:c.gdpHist,gdpLong:c.gdpHist,cpiHist:c.cpiHist,cpiLong:c.cpiHist,
    regimeSrc:`GDP: ${c.gdpSrc}. CPI: ${c.cpiSrc}, year-on-year rate in the last month of each quarter.`,
    gdpNote:l.gdp?.newer||'',cpiNote:l.cpi?.newer||'',gdpSrcName:c.gdpSrc,cpiSrcName:c.cpiSrc,
    method:`Each annual change is the World Bank WDI rate minus the preceding year's rate (${c.annualSrc?.gdp||'n/a'}, ${c.annualSrc?.cpi||'n/a'}). Both series must cover the same two years; missing years break the path; the last twelve valid points are shown. Latest releases compare each rate with its own preceding consecutive period from the same series. A newer reading from another source is listed, never spliced in.`};
}
const latestQuad=iso=>{const k=cyc(iso);return k&&!k.latest.missing?k.latest.quad:null};
/* small 2×2 key: quad cells laid out as on the chart (3 2 / 4 1) */
const qglyph=(q,s=26)=>{const h=s/2,cell=(n,x,y)=>`<rect x="${x+1}" y="${y+1}" width="${h-2}" height="${h-2}" rx="1.5" class="${n===q?'on':''}"/>`;return `<svg class="qglyph" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" aria-hidden="true">${cell(3,0,0)}${cell(2,h,0)}${cell(4,0,h)}${cell(1,h,h)}</svg>`};
window.cycleChip=iso=>{const k=cyc(iso);if(!k)return '';const L=k.latest;
  return `<button class="cychip" type="button" data-cyc="${iso}">${qglyph(L.missing?0:L.quad)}<span><small>Growth &amp; inflation quad · latest releases</small><b>${L.missing?'Not enough comparable observations':L.quad?'Quad '+L.quad+' · '+esc(L.text):esc(axisTxt)}</b></span><em>Cycle analysis ↓</em></button>`};
function goCycle(iso){setCycle(iso,true);if(window.showView)window.showView('cycle')}
listen(document,'click',e=>{const b=e.target.closest('[data-cyc]');if(!b)return;e.preventDefault();const iso=b.dataset.cyc;
  if(b.closest('#qboard')&&window.selectEconomy)window.selectEconomy(iso,false);goCycle(iso)});
function setCycle(iso,force){if(!cyc(iso)||(iso===CYC&&!force&&$('#cycle .cyc')))return;CYC=iso;annualSel=-1;cycle()}
window.setCycle=setCycle;
function board(){
  const isos=Object.keys(CY).sort((a,b)=>CY[a].name.localeCompare(CY[b].name)),by={1:[],2:[],3:[],4:[],x:[]};
  for(const i of isos){const q=latestQuad(i);(q?by[q]:by.x).push(i)}
  const btn=i=>`<button type="button" data-cyc="${i}" class="${i===CYC?'on':''}" title="${esc(CY[i].name)}">${esc(CY[i].name)}</button>`;
  const cellB=(q,g,inf)=>`<div class="qb q${q}"><header><b>Quad ${q}</b><span>${g} · ${inf}</span><strong>${by[q].length}</strong></header><div>${by[q].map(btn).join('')}</div></div>`;
  return `<div class="qboard" id="qboard"><div class="qb-axis y">Inflation rising ↑</div><div class="qb-grid">${cellB(3,'Growth slowing','inflation rising')}${cellB(2,'Growth accelerating','inflation rising')}${cellB(4,'Growth slowing','inflation easing')}${cellB(1,'Growth accelerating','inflation easing')}</div><div class="qb-axis x">Growth accelerating →</div>
    ${by.x.length?`<div class="qb-none"><small>Not enough comparable observations</small>${by.x.map(btn).join('')}</div>`:''}</div>`;
}
function cycle(){
  const el=$('#cycle .panel');if(!el)return;const K=cyc(CYC),R=K.regime,Lt=K.latest;
  if(annualSel<0||annualSel>=K.annual.length)annualSel=K.annual.length-1;
  const opts=Object.keys(CY).sort((a,b)=>CY[a].name.localeCompare(CY[b].name)).map(i=>{const q=latestQuad(i);return `<option value="${i}" ${i===CYC?'selected':''}>${esc(CY[i].name)}${q?' · Quad '+q:''}</option>`}).join('');
  const missing=(t,why)=>`<div class="kicker">${t} · ${esc(K.name)}</div><div data-css="font:500 15px var(--body);margin:4px 0 2px">Not enough comparable observations</div><div class="src">${esc(why)}. The annual archive below is a separate view.</div>`;
  const bx=Lt.missing?2:Math.max(2,Math.ceil(Math.max(Math.abs(Lt.gdp.ch),Math.abs(Lt.cpi.ch))*1.8));
  el.innerHTML=`<div class="sec-head"><div><div class="kicker">Cycle analysis</div><h2>Growth and inflation quad, every economy</h2><p>Where each economy sits on its latest releases. Pick one to see its quarter-aligned regime, annual path and history.</p></div>
    <label class="cyc-pick"><span>Economy</span><select id="cycEco">${opts}</select></label></div>
  ${board()}
  <div class="sub">${esc(K.name)} · regime, latest releases and annual archive</div>
  <div class="cyc">
    <div class="box regime">${R.missing?missing('Synchronized quarterly regime',R.missing):`<div class="kicker">Synchronized quarterly regime · ${esc(K.name)}</div><div class="q">${esc(R.label)} <em>${R.quad?'Quad '+R.quad:'On an axis'}</em></div><div class="src" data-css="font-size:13px;color:var(--ink2)">${esc(R.text)}</div>
      <div class="d"><div><small>GDP YoY rate · change</small><b class="num">${esc(R.gdp.ch)}</b><span>${esc(R.gdp.detail)}</span></div><div><small>Quarter-end CPI YoY · change</small><b class="num">${esc(R.cpi.ch)}</b><span>${esc(R.cpi.detail)}</span></div></div>
      <div class="src" data-css="margin-top:14px">${esc(K.regimeSrc)}</div>`}</div>
    <div class="box">${Lt.missing?missing('Latest releases',Lt.missing):`<div class="kicker">Latest releases · ${esc(K.name)}</div><div data-css="font:500 15px var(--body);margin:4px 0 2px">${Lt.quad?'Quad '+Lt.quad:'On an axis'} · ${esc(Lt.text)}</div><div class="src">${esc(Lt.note)}</div>
      ${quadSVG({xr:bx,yr:bx,active:Lt.quad,points:[{x:Lt.gdp.ch,y:Lt.cpi.ch,label:'Latest'}]})}
      <div class="d" data-css="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px"><div><small class="kicker">GDP growth</small><div><b class="num" data-css="font:500 18px var(--mono)">${sp(Lt.gdp.ch)} pp</b></div><div class="src">${Lt.gdp.v} from ${Lt.gdp.from} YoY · ${Lt.gdp.per}</div></div><div><small class="kicker">CPI inflation</small><div><b class="num" data-css="font:500 18px var(--mono)">${sp(Lt.cpi.ch)} pp</b></div><div class="src">${Lt.cpi.v} from ${Lt.cpi.from} YoY · ${Lt.cpi.per}</div></div></div>`}</div>
    <div class="box" id="annual"><div class="kicker">Annual cycle archive · ${K.annual.length?'through '+K.annual.at(-1)[0]:'no data'}</div><div data-css="font:500 15px var(--body);margin:4px 0 2px">Growth and inflation cycle</div><div class="src">Annual rate changes. One point per year. Units are percentage points.</div>
      <div id="annualChart"></div><div class="years" id="years"></div>
      <div id="annualInfo"></div><label class="src" data-css="display:flex;gap:6px;align-items:center;margin-top:6px;cursor:pointer"><input type="checkbox" id="fullpath" ${showPath?'checked':''}> Show full trajectory</label></div>
  </div>
  <div class="sub">Observed states · last ${K.annual.length} valid annual observations</div><div class="states" id="states"></div>
  <div class="sub">The path by year · reported annual changes, no projections</div><div class="pathrow" id="pathrow"></div>
  <div class="sub">GDP &amp; CPI history · ${esc(K.name)}</div>
  <div class="two">
    <div><div data-css="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><b data-css="font-weight:500">Real GDP growth</b> <span class="src" id="gdpSub"></span></div><div class="seg" data-r="gdp"><button data-v="1y">1Y</button><button data-v="3y">3Y</button><button data-v="10y">10Y</button><button data-v="all">All</button></div></div>
      <svg class="lc" id="gdpChart"></svg><div class="ro" id="gdpRo"></div><div class="src" id="gdpSrc"></div>
      <details class="more"><summary>Exact observations<small id="gdpN"></small></summary><div class="obswrap" id="gdpObs"></div></details></div>
    <div><div data-css="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><b data-css="font-weight:500">Consumer price inflation</b> <span class="src" id="cpiSub"></span></div><div class="seg" data-r="cpi"><button data-v="1y">1Y</button><button data-v="3y">3Y</button><button data-v="10y">10Y</button><button data-v="all">All</button></div></div>
      <svg class="lc" id="cpiChart"></svg><div class="ro" id="cpiRo"></div><div class="src" id="cpiSrc"></div>
      <details class="more"><summary>Exact observations<small id="cpiN"></small></summary><div class="obswrap" id="cpiObs"></div></details></div>
  </div>
  <div class="sub">Changes over time · annual bar charts</div>
  <div class="two"><div><b data-css="font-weight:500">Change in growth</b> <span class="src">percentage points · annual</span><svg class="lc" id="gBars" data-css="height:170px"></svg><div class="ro" id="gBarsRo"></div></div>
    <div><b data-css="font-weight:500">Change in inflation</b> <span class="src">percentage points · annual</span><svg class="lc" id="iBars" data-css="height:170px"></svg><div class="ro" id="iBarsRo"></div></div></div>
  <details class="more"><summary>Observations and method</summary><p class="src" data-css="font-size:13px;line-height:1.5;padding-bottom:12px">${esc(K.method)}</p></details>`;
  $$('#cycle .seg[data-r]').forEach(sg=>{const cur=sg.dataset.r==='gdp'?gdpRange:cpiRange;sg.querySelectorAll('button').forEach(b=>{b.classList.toggle('on',b.dataset.v===cur);b.onclick=()=>{sg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));if(sg.dataset.r==='gdp')gdpRange=b.dataset.v;else cpiRange=b.dataset.v;histCharts()}})});
  $('#fullpath').onchange=e=>{showPath=e.target.checked;annual()};
  $('#cycEco').onchange=e=>{if(window.selectEconomy)window.selectEconomy(e.target.value,false);setCycle(e.target.value,true)};
  annual();histCharts();
}
function annual(){
  const K=cyc(CYC),A=K.annual;
  if(!A.length){['annualChart','years','annualInfo','states','pathrow'].forEach(i=>$('#'+i).innerHTML='');$('#annualInfo').innerHTML='<div class="src">No World Bank WDI annual pair for this economy.</div>';return}
  const sel=A[annualSel],ax=Math.max(2,Math.ceil(Math.max(...A.map(a=>Math.abs(a[1])))*1.1)),ay=Math.max(1,Math.ceil(Math.max(...A.map(a=>Math.abs(a[2])))*1.1));
  const path=showPath?A.map(a=>[a[1],a[2]]):annualSel>0?[[A[annualSel-1][1],A[annualSel-1][2]],[sel[1],sel[2]]]:null;
  $('#annualChart').innerHTML=quadSVG({xr:ax,yr:ay,active:sel[3],path,points:A.map((a,i)=>({x:a[1],y:a[2],label:a[0],annual:true,sel:i===annualSel,show:showPath&&(i===0||i===A.length-1)}))});
  $$('#annualChart .apt').forEach(c=>c.onclick=()=>{annualSel=A.findIndex(a=>String(a[0])===c.dataset.y);annual()});
  $('#years').innerHTML=A.map((a,i)=>`<button class="${i===annualSel?'on':''}" data-i="${i}">${a[0]}${i===A.length-1?' (latest)':''}</button>`).join('');
  $$('#years button').forEach(b=>b.onclick=()=>{annualSel=+b.dataset.i;annual()});
  $('#annualInfo').innerHTML=`<div data-css="font:500 14px var(--body)">${sel[0]} · Quad ${sel[3]}</div><div class="src" data-css="font-size:12.5px">${QTXT[sel[3]]} · growth change <b class="num">${sp(sel[1])} pp</b> · inflation change <b class="num">${sp(sel[2])} pp</b></div>`;
  const cnt=[1,2,3,4].map(q=>A.filter(a=>a[3]===q).length),lab={1:'Growth up, inflation down',2:'Growth up, inflation up',3:'Growth down, inflation up',4:'Growth down, inflation down'};
  $('#states').innerHTML=[1,2,3,4].map(q=>`<div><b>Quad ${q}</b><strong>${cnt[q-1]} of ${A.length}</strong><span>${lab[q]}</span></div>`).join('');
  $('#pathrow').innerHTML=A.map((a,i)=>`<span data-css="${i===annualSel?'border-color:var(--focus)':''}">${a[0]}<b>Q${a[3]}</b></span>`).join('');
  const yl=d=>String(d);
  lineChart($('#gBars'),A.map(a=>[a[0],a[1]]),{bars:true,h:170,zero:true,xl:yl,pl:yl,unit:'pp',ro:'gBarsRo',sel:annualSel});
  lineChart($('#iBars'),A.map(a=>[a[0],a[2]]),{bars:true,h:170,zero:true,xl:yl,pl:yl,unit:'pp',ro:'iBarsRo',sel:annualSel});
}
function cut(pts,r){if(r==='all')return pts;const yrs={'1y':1,'3y':3,'10y':10}[r],last=pts.at(-1)[0],y=+last.slice(0,4)-yrs,cutoff=`${y}${last.slice(4)}`;return pts.filter(p=>p[0]>=cutoff)}
function histCharts(){
  const K=cyc(CYC);
  const one=(k,pts,lab,srcName,note,unitTag)=>{
    const svg=$('#'+k+'Chart');
    if(!pts||pts.length<2){svg.innerHTML='';$('#'+k+'Sub').textContent='';$('#'+k+'Src').textContent=`No ${k==='gdp'?'quarterly GDP':'monthly CPI'} history is connected for ${K.name}.`;$('#'+k+'N').textContent='';$('#'+k+'Obs').innerHTML='';return}
    lineChart(svg,pts,{zero:true,unit:'% YoY',ro:k+'Ro',pl:k==='gdp'?qLabel:undefined,srcName});
    $('#'+k+'Sub').textContent=`${lab(pts.at(-1)[0])} · ${f2(pts.at(-1)[1])} % YoY`;
    $('#'+k+'Src').textContent=`${lab(pts[0][0])} to ${lab(pts.at(-1)[0])} · ${pts.length} reported observations${note?' · '+note:''}`;
    $('#'+k+'N').textContent=pts.length+' rows';
    $('#'+k+'Obs').innerHTML=`<table class="obs"><thead><tr><th>Period</th><th>% YoY</th><th>Status</th></tr></thead><tbody>${pts.slice().reverse().map(p=>`<tr><td>${lab(p[0])}</td><td>${p[1]}</td><td>${unitTag}</td></tr>`).join('')}</tbody></table>`};
  const pick=(r,h,l)=>h?cut(r==='10y'?h:l,r):null;
  one('gdp',pick(gdpRange,K.gdpHist,K.gdpLong),qLabel,K.gdpSrcName,K.gdpNote,K.iso==='IDN'?'derived':'reported');
  one('cpi',pick(cpiRange,K.cpiHist,K.cpiLong),dLabel,K.cpiSrcName,K.cpiNote,'reported');
}

/* ---------- 3. External winds ---------- */
function winds(){
  const el=$('#winds .panel');if(!el)return;const W=M.winds;
  const cls=s=>/Strong tailwind|Tailwind/.test(s)?'tail':/Headwind/.test(s)?'head':'calm';
  const tape=t=>{if(!t?.length)return '';const w=300,h=46,mx=Math.max(2,...t.map(p=>Math.abs(p[1]))),bw=w/t.length,Y=v=>h/2-v/mx*(h/2-2);
    return `<svg class="tape" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><rect class="band" x="0" y="${Y(.5)}" width="${w}" height="${Y(-.5)-Y(.5)}"/>${t.map((p,i)=>`<rect class="b ${i===t.length-1?'last':''}" x="${i*bw+bw*.15}" y="${Math.min(Y(p[1]),h/2)}" width="${bw*.7}" height="${Math.max(1,Math.abs(Y(p[1])-h/2))}"><title>${p[0]}: ${p[1]}× usual swing</title></rect>`).join('')}</svg>`};
  el.innerHTML=`<div class="sec-head"><div><div class="kicker">External winds · Indonesia</div><h2>Cross-market context</h2><p>${esc(W.summary)}</p></div><div class="score"><em>${esc(W.score.split(' tail')[0])}</em> tailwind</div></div>
    <div class="winds">${W.cells.map(c=>`<article class="ic wind"><div class="t">${esc(c.t)}</div><div class="per">${esc(c.d||'Policy rates')}</div><div class="v"><b class="num">${esc(c.v)}</b></div><div class="state ${cls(c.state)}">${esc(c.state)}</div><div class="note">${esc(c.note)}</div>${tape(c.tape)}</article>`).join('')}</div>
    <div class="src" data-css="margin-top:10px">Tape: about a year of 30-day moves, one per week, in units of usual swing. The shaded band is calm (under 0.5×); the highlighted bar is the latest.</div>
    <details class="more"><summary>How this is read</summary><p class="src" data-css="font-size:13px;line-height:1.5;padding-bottom:12px">${esc(W.method)}</p></details>`;
}

/* ---------- 4. Rates and currency ---------- */
function rates(){
  const el=$('#rates .panel');if(!el)return;const R=M.rates;
  el.innerHTML=`<div class="sec-head"><div><div class="kicker">Rates and currency · Indonesia</div><h2>Policy rate, ten-year yield and the rupiah</h2><p>Each instrument keeps its own definition, dates and frequency.</p></div></div>
    <div class="rates"><div>
      <div data-css="display:flex;justify-content:space-between;align-items:baseline"><b data-css="font-weight:500">Policy instrument rate</b><span class="src">BIS monthly since 2016 · BI decisions</span></div><svg class="lc" id="polChart"></svg><div class="ro" id="polRo"></div>
      <div data-css="display:flex;justify-content:space-between;align-items:baseline;margin-top:14px"><b data-css="font-weight:500">Rupiah per US dollar</b><span class="src">Yahoo Finance daily close, weekly points since 2016</span></div><svg class="lc" id="fxChart"></svg><div class="ro" id="fxRo"></div>
    </div><div data-css="display:flex;flex-direction:column;gap:12px">
      ${card({...REC('id-policy'),t:'Bank Indonesia policy rate',range:[dLabel(R.decisions[0][0]),dLabel(R.decisions.at(-1)[0])],hist:R.decisions,src:R.sources.decisions})}
      ${card({t:'Government bond yield, ten-year tenor',per:R.yield10.per,v:R.yield10.v,u:'% per year',ch:'Previous consecutive observation unavailable',flags:R.yield10.flags,note:R.yield10.src})}
      ${card({...REC('id-jisdor'),t:'JISDOR, official Bank Indonesia fixing',range:[dLabel(R.jisdor[0][0]),dLabel(R.jisdor.at(-1)[0])],hist:R.jisdor,src:R.sources.jisdor})}
      <div class="box"><div class="kicker">Alternative sources</div>${R.alternatives.map(a=>`<div class="src" data-css="font-size:12.5px;margin-top:6px">${esc(a)}</div>`).join('')}</div>
    </div></div>`;
  lineChart($('#polChart'),R.bisMonthly,{unit:'%',ro:'polRo',srcName:'BIS policy instrument rate, end of month'});
  lineChart($('#fxChart'),R.usdidr,{unit:'IDR per USD',ro:'fxRo',fmt:v=>Math.round(v).toLocaleString('en-US'),srcName:'Yahoo Finance IDR=X'});
}

/* ---------- 5. Compare economies ---------- */
let cmpSort='name',cmpDir=1;
function compare(){
  const el=$('#compare .panel');if(!el)return;
  const cols=[['gdp','GDP growth','% YoY'],['cpi','Inflation','% YoY'],['policy','Policy rate','%'],['yield','10Y yield','% per year']];
  const rows=Object.entries(C).map(([iso,c])=>({iso,name:c.name,reg:false,...Object.fromEntries(cols.map(([k])=>[k,c[k]&&Number.isFinite(c[k].v)?{v:c[k].v,per:c[k].per,src:c[k].src,stale:c[k].stale}:null]))}));
  const regional=M.compareRegional.map(r=>({iso:'',name:r.name,reg:true,...Object.fromEntries(cols.map(([k])=>[k,r[k]?{v:+r[k][0],per:r[k][1],src:r[k][2],stale:/Outdated/.test(r[k][1])}:null]))}));
  const sorted=rows.sort((a,b)=>cmpSort==='name'?a.name.localeCompare(b.name)*cmpDir:((b[cmpSort]?.v??-1e9)-(a[cmpSort]?.v??-1e9))*cmpDir);
  const cell=x=>x?`<td><b class="num">${f2(x.v)}</b><small class="${x.stale?'o':''}">${esc(x.per)}${x.stale?' · Outdated':''}</small><small>${esc(x.src||'')}</small></td>`:'<td><span class="src">—</span></td>';
  el.innerHTML=`<div class="sec-head"><div><div class="kicker">Compare economies</div><h2>Latest available, periods may differ</h2><p>${rows.length} countries and ${regional.length} regional series. Click a column to sort, a row to open its dossier.</p></div></div>
    <div class="cmpwrap"><table class="cmp"><thead><tr><th data-s="name" class="${cmpSort==='name'?'on':''}">Country / regional series</th>${cols.map(([k,t,u])=>`<th data-s="${k}" class="${cmpSort===k?'on':''}">${t}<br><span data-css="font-size:9.5px">${u}</span></th>`).join('')}</tr></thead>
    <tbody>${regional.map(r=>`<tr class="reg"><td>${esc(r.name)}<small>${r.reg?'Regional series':''}</small></td>${cols.map(([k])=>cell(r[k])).join('')}</tr>`).join('')}${sorted.map(r=>`<tr data-iso="${r.iso}"><td>${esc(r.name)}<small>Country</small></td>${cols.map(([k])=>cell(r[k])).join('')}</tr>`).join('')}</tbody></table></div>
    <details class="more"><summary>Coverage gaps &amp; unavailable indicators</summary><p class="src" data-css="font-size:13px;line-height:1.5;padding-bottom:12px">${esc(M.coverageNote)}</p></details>`;
  $$('#compare th[data-s]').forEach(th=>th.onclick=()=>{const s=th.dataset.s;cmpDir=cmpSort===s?-cmpDir:1;cmpSort=s;compare()});
  $$('#compare tbody tr[data-iso]').forEach(tr=>tr.onclick=()=>{if(window.selectEconomy)window.selectEconomy(tr.dataset.iso,true);showView('overview');window.scrollTo({top:0,behavior:'smooth'})});
}

/* ---------- 6. Regional context ---------- */
function region(){
  const el=$('#region .panel');if(!el)return;
  el.innerHTML=`<div class="sec-head"><div><div class="kicker">Regional context</div><h2>Southeast Asia, in perspective</h2><p>Annual real GDP growth · six countries · World Bank annual data. 6 of 6 countries reported · no ASEAN aggregate.</p></div></div>
    <div class="rbars">${M.region.slice().sort((a,b)=>b[3]-a[3]).map(([iso,n,y,v])=>{const mx=Math.max(...M.region.map(r=>r[3])),h=(M.regionHist[iso]||[]).map(p=>[String(p[0]),p[1]]);
      return `<div class="rbar"><span class="rn">${esc(n)}<small>${y}</small></span><span class="rtrack"><i data-css="width:${(v/mx*100).toFixed(1)}%"></i></span><b class="num">${f2(v)}%</b><span class="rs">${spark({hist:h})}<small><span>${h[0]?.[0]||''}</span><span>${h.at(-1)?.[0]||''}</span></small></span></div>`}).join('')}</div>
    <div class="src" data-css="margin-top:10px">World Development Indicators. Reported annual history is separate from the quarterly GDP and monthly inflation above.</div>`;
}

/* ---------- 7. Research tools + US liquidity ---------- */
function tools(){
  const el=$('#tools .panel');if(!el)return;const L=M.liquidity;
  const map={'Monitor':'pulse','Economic data':'sources','Research briefing':'overview','Annual history':'cycle','Growth and inflation':'cycle','US liquidity':'tools','Release calendar':'overview'};
  el.innerHTML=`<div class="sec-head"><div><div class="kicker">Independent public sources</div><h2>Research desk</h2><p>Research tools from the original Office macro desk.</p></div></div>
    <div class="tools">${M.researchTools.map(t=>`<a href="#${map[t]||'overview'}" data-view="${map[t]||'overview'}">${esc(t)}</a>`).join('')}</div>
    <div class="sub" id="liquidity">US liquidity · weekly since 2019</div>
    <div class="liq"><div><b data-css="font-weight:500">Federal Reserve total assets</b><div class="src">USD bn · ${esc(L.sources.fed?.id)}</div><svg class="lc" id="liqFed" data-css="height:160px"></svg><div class="ro" id="liqFedRo"></div></div>
      <div><b data-css="font-weight:500">Treasury General Account</b><div class="src">USD bn · ${esc(L.sources.tga?.id)}</div><svg class="lc" id="liqTga" data-css="height:160px"></svg><div class="ro" id="liqTgaRo"></div></div>
      <div><b data-css="font-weight:500">Overnight reverse repo</b><div class="src">USD bn · ${esc(L.sources.rrp?.id)}</div><svg class="lc" id="liqRrp" data-css="height:160px"></svg><div class="ro" id="liqRrpRo"></div></div></div>`;
  const fmt=v=>Math.round(v).toLocaleString('en-US');
  lineChart($('#liqFed'),L.fed,{h:160,unit:'USD bn',fmt,ro:'liqFedRo'});lineChart($('#liqTga'),L.tga,{h:160,unit:'USD bn',fmt,ro:'liqTgaRo'});lineChart($('#liqRrp'),L.rrp,{h:160,unit:'USD bn',fmt,ro:'liqRrpRo'});
}

/* ---------- 8. Sources and methods ---------- */
function sources(){
  const el=$('#sources .panel');if(!el)return;
  el.innerHTML=`<div class="sec-head"><div><div class="kicker">Sources and methods</div><h2>Public-data provenance</h2><p>${M.ledger.length} connected series behind this sheet. Every value keeps its source, unit, frequency and acquisition date.</p></div></div>
    <div class="ledgerwrap"><table class="ledger"><thead><tr><th>Series</th><th>Unit</th><th>Freq.</th><th>Obs.</th><th>Coverage</th><th>Acquired</th><th>Source</th></tr></thead>
    <tbody>${M.ledger.map(s=>`<tr><td><code>${esc(s.id)}</code></td><td>${esc(s.unit)}</td><td>${esc(s.freq)}</td><td class="num">${s.n}</td><td class="num">${esc(s.first)} → ${esc(s.last)}</td><td class="num">${esc((s.retrieved||'').slice(0,10))}</td><td>${s.url?`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">open</a>`:'—'}</td></tr>`).join('')}</tbody></table></div>
    <div class="src" data-css="margin-top:8px">${esc(M.builtFrom)}.</div>`;
}

/* ---------- in-page tabs (original Macro tabs) ---------- */
/* ---------- views: Macro opens on an overview; each deep analysis is its own view ---------- */
const VIEWS=[
  ['overview','Overview',null],
  ['cycle','Cycle & quad',()=>cycle()],
  ['pulse','Indonesia pulse',()=>pulse()],
  ['winds','External winds',()=>winds()],
  ['rates','Rates',()=>rates()],
  ['compare','Compare economies',()=>compare()],
  ['region','Southeast Asia',()=>region()],
  ['tools','Research tools',()=>tools()],
  ['sources','Sources',()=>sources()]];
let VIEW='overview';
const viewIds=VIEWS.map(v=>v[0]);
function tileFacts(){
  const P=M.pulse.priority,gd=P.find(r=>/GDP/.test(r.t)),cp=P.find(r=>/price|CPI|inflation/i.test(r.t));
  const by={1:0,2:0,3:0,4:0};let none=0;for(const i of Object.keys(CY)){const q=latestQuad(i);q?by[q]++:none++}
  const top=Object.entries(by).sort((a,b)=>b[1]-a[1])[0];
  const dec=M.rates.decisions.at(-1),reg=M.region.slice().sort((a,b)=>b[3]-a[3]),fed=M.liquidity.fed.at(-1);
  return {
    cycle:{fig:`Quad ${top[0]}`,line:`${top[1]} of ${Object.keys(CY).length} economies sit here on their latest releases. ${QTXT[top[0]]}.`,glyph:+top[0],
      foot:`Q1 ${by[1]} · Q2 ${by[2]} · Q3 ${by[3]} · Q4 ${by[4]}${none?` · ${none} without enough data`:''}`},
    pulse:{fig:gd?`${gd.v}%`:'—',line:`Real GDP growth, ${gd?gd.per.split(' ·')[0]:''}${cp?`. Inflation ${cp.v}% in ${cp.per.split(' ·')[0]}`:''}.`,foot:M.pulse.summary},
    winds:{fig:M.winds.score.split(' tail')[0],line:'The broad US dollar, the US 10-year yield and the rupiah, each read against its own typical 30-day move.',foot:'Tailwind, calm or headwind, never a forecast'},
    rates:{fig:`${f2(dec[1])}%`,line:`BI rate after the ${dLabel(dec[0])} decision. Policy path, money-market rates and the US Treasury curve.`,foot:`${M.rates.decisions.length} decisions since ${dLabel(M.rates.decisions[0][0])}`},
    compare:{fig:`${Object.keys(C).length}`,line:'Economies side by side on growth, inflation, policy rate and 10-year yield, plus the Euro area and the World.',foot:'Each value keeps its own period and source'},
    region:{fig:`${f2(reg[0][3])}%`,line:`${reg[0][1]} grew fastest in Southeast Asia in ${reg[0][2]}; ${reg.at(-1)[1]} slowest at ${f2(reg.at(-1)[3])}%.`,foot:'World Bank WDI annual growth, 2002 onward'},
    tools:{fig:`$${(fed[1]/1000).toFixed(2)}tn`,line:`Federal Reserve total assets in the week of ${dLabel(fed[0])}. US liquidity charts and the research toolkit.`,foot:`${M.researchTools.length} tools`},
    sources:{fig:`${M.ledger.length}`,line:'Connected series behind this sheet, each with its source link, retrieval time and period range.',foot:'Nothing is filled in or estimated'}};
}
function deep(){
  const el=$('#deep');if(!el)return;const T=tileFacts();
  el.innerHTML=`<div class="deep-head"><div><div class="kicker">Deep analysis</div><h2>Choose what to study next</h2></div><p>Each view opens on its own. Your country selection carries across, and the back button returns here.</p></div>
  <div class="tiles">${VIEWS.slice(1).map(([id,t],i)=>{const f=T[id];return `<button class="tile" type="button" data-view="${id}"><span class="tn">${String(i+1).padStart(2,'0')}</span><span class="tt">${t}</span>
    <span class="tf">${id==='cycle'?qglyph(f.glyph,22):''}<b>${esc(f.fig)}</b></span><span class="tl">${esc(f.line)}</span><span class="tfoot">${esc(f.foot)}</span><span class="go">Open →</span></button>`}).join('')}</div>`;
}
function showView(v,{push=true,scroll=true}={}){
  if(!viewIds.includes(v))v='overview';const prev=VIEW;VIEW=v;
  const ov=v==='overview';$('#top').hidden=!ov;$('#deep').hidden=!ov;
  for(const id of viewIds.slice(1)){const s=$('#'+id);if(s)s.hidden=id!==v}
  if(!ov){VIEWS.find(x=>x[0]===v)[2]();details()}
  const tgt=ov?$('#top'):$('#'+v);if(tgt&&prev!==v){tgt.classList.remove('lh-enter');void tgt.offsetWidth;tgt.classList.add('lh-enter')}
  if(ov&&prev!==v){const d=$('#deep');d.classList.remove('lh-enter');void d.offsetWidth;d.classList.add('lh-enter')}
  $$('#mtabs button[data-view]').forEach(b=>{const on=b.dataset.view===v;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
  const back=$('#mtabs .back');if(back)back.hidden=ov;
  
  if(scroll)window.scrollTo({top:0,behavior:'auto'});
  if(ov&&typeof window.redrawMap==='function')window.redrawMap();
}
window.showView=showView;
function tabs(){
  const nav=$('#mtabs');if(!nav)return;
  nav.innerHTML=`<button type="button" class="back" data-view="overview" hidden>← Overview</button><div class="seg" role="tablist" aria-label="Macro views">${VIEWS.map(([id,t])=>`<button role="tab" data-view="${id}" class="${id===VIEW?'on':''}">${t}</button>`).join('')}</div>`;
  deep();
}
listen(document,'click',e=>{const b=e.target.closest('[data-view]');if(!b)return;e.preventDefault();showView(b.dataset.view)});
// views switch inside the page; the URL hash stays the Office route

function details(){ // number every section like a detail on a drawing sheet
  ['pulse','cycle','winds','rates','compare','region','tools','sources'].forEach((id,i)=>{const h=document.querySelector('#'+id+' .sec-head>div:first-child');if(!h||h.querySelector('.dbub'))return;
    const inner=h.innerHTML;h.innerHTML=`<span class="dbub" aria-label="Detail ${i+2} of sheet 02"><b>${i+2}</b><i>02</i></span><div class="ttl">${inner}</div>`;
    const k=h.querySelector('.kicker');if(k)k.textContent=`Detail ${i+2} · `+k.textContent});
}
function all(){pulse();cycle();winds();rates();compare();region();tools();sources();details();tabs();showView('overview',{push:false,scroll:false});}
all();
let rz;listen(window,'resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{histCharts();annual();rates();tools();details()},180)});
}
