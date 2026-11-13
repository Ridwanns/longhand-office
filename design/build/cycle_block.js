const QTXT={1:'Growth accelerating, inflation easing',2:'Growth accelerating, inflation rising',3:'Growth slowing, inflation rising',4:'Growth slowing, inflation easing'};
const CY=window.CYCLES||{};
let CYC='IDN',annualSel=-1,showPath=false,gdpRange='10y',cpiRange='10y';
const sp=v=>(v>0?'+':v<0?'−':'')+f2(Math.abs(v));
const axisTxt='On an axis · one rate is unchanged';
/* one shape for every economy: Indonesia keeps its reviewed BPS readings, the rest come from cycles.js */
function cyc(iso){
  if(iso==='IDN'){const m=M.cycle;return {iso,name:'Indonesia',regime:m.regime,latest:m.latest,annual:m.annual,gdpHist:m.gdpHist,gdpLong:m.gdpLong,cpiHist:m.cpiHist,cpiLong:m.cpiLong,
    regimeSrc:'GDP: BPS release; CPI quarter-end: BIS long consumer prices / BPS. Different reporting periods are aligned to the quarter.',
    gdpNote:'the latest reading (Q3 2026, 5.47%, BPS) is newer than this history',cpiNote:'latest BPS reading Oct 2026: 3.23%',gdpSrcName:'World Bank GEM, derived',cpiSrcName:'BIS / national, reported',
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
function goCycle(iso){setCycle(iso,true);const t=$('#cycle');if(t)t.scrollIntoView({behavior:'smooth',block:'start'})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-cyc]');if(!b)return;e.preventDefault();const iso=b.dataset.cyc;
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
  const missing=(t,why)=>`<div class="kicker">${t} · ${esc(K.name)}</div><div style="font:500 15px var(--body);margin:4px 0 2px">Not enough comparable observations</div><div class="src">${esc(why)}. The annual archive below is a separate view.</div>`;
  const bx=Lt.missing?2:Math.max(2,Math.ceil(Math.max(Math.abs(Lt.gdp.ch),Math.abs(Lt.cpi.ch))*1.8));
  el.innerHTML=`<div class="sec-head"><div><div class="kicker">Cycle analysis</div><h2>Growth and inflation quad, every economy</h2><p>Where each economy sits on its latest releases. Pick one to see its quarter-aligned regime, annual path and history.</p></div>
    <label class="cyc-pick"><span>Economy</span><select id="cycEco">${opts}</select></label></div>
  ${board()}
  <div class="sub">${esc(K.name)} · regime, latest releases and annual archive</div>
  <div class="cyc">
    <div class="box regime">${R.missing?missing('Synchronized quarterly regime',R.missing):`<div class="kicker">Synchronized quarterly regime · ${esc(K.name)}</div><div class="q">${esc(R.label)} <em>${R.quad?'Quad '+R.quad:'On an axis'}</em></div><div class="src" style="font-size:13px;color:var(--ink2)">${esc(R.text)}</div>
      <div class="d"><div><small>GDP YoY rate · change</small><b class="num">${esc(R.gdp.ch)}</b><span>${esc(R.gdp.detail)}</span></div><div><small>Quarter-end CPI YoY · change</small><b class="num">${esc(R.cpi.ch)}</b><span>${esc(R.cpi.detail)}</span></div></div>
      <div class="src" style="margin-top:14px">${esc(K.regimeSrc)}</div>`}</div>
    <div class="box">${Lt.missing?missing('Latest releases',Lt.missing):`<div class="kicker">Latest releases · ${esc(K.name)}</div><div style="font:500 15px var(--body);margin:4px 0 2px">${Lt.quad?'Quad '+Lt.quad:'On an axis'} · ${esc(Lt.text)}</div><div class="src">${esc(Lt.note)}</div>
      ${quadSVG({xr:bx,yr:bx,active:Lt.quad,points:[{x:Lt.gdp.ch,y:Lt.cpi.ch,label:'Latest'}]})}
      <div class="d" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px"><div><small class="kicker">GDP growth</small><div><b class="num" style="font:500 18px var(--mono)">${sp(Lt.gdp.ch)} pp</b></div><div class="src">${Lt.gdp.v} from ${Lt.gdp.from} YoY · ${Lt.gdp.per}</div></div><div><small class="kicker">CPI inflation</small><div><b class="num" style="font:500 18px var(--mono)">${sp(Lt.cpi.ch)} pp</b></div><div class="src">${Lt.cpi.v} from ${Lt.cpi.from} YoY · ${Lt.cpi.per}</div></div></div>`}</div>
    <div class="box" id="annual"><div class="kicker">Annual cycle archive · ${K.annual.length?'through '+K.annual.at(-1)[0]:'no data'}</div><div style="font:500 15px var(--body);margin:4px 0 2px">Growth and inflation cycle</div><div class="src">Annual rate changes. One point per year. Units are percentage points.</div>
      <div id="annualChart"></div><div class="years" id="years"></div>
      <div id="annualInfo"></div><label class="src" style="display:flex;gap:6px;align-items:center;margin-top:6px;cursor:pointer"><input type="checkbox" id="fullpath" ${showPath?'checked':''}> Show full trajectory</label></div>
  </div>
  <div class="sub">Observed states · last ${K.annual.length} valid annual observations</div><div class="states" id="states"></div>
  <div class="sub">The path by year · reported annual changes, no projections</div><div class="pathrow" id="pathrow"></div>
  <div class="sub">GDP &amp; CPI history · ${esc(K.name)}</div>
  <div class="two">
    <div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><b style="font-weight:500">Real GDP growth</b> <span class="src" id="gdpSub"></span></div><div class="seg" data-r="gdp"><button data-v="1y">1Y</button><button data-v="3y">3Y</button><button data-v="10y">10Y</button><button data-v="all">All</button></div></div>
      <svg class="lc" id="gdpChart"></svg><div class="ro" id="gdpRo"></div><div class="src" id="gdpSrc"></div>
      <details class="more"><summary>Exact observations<small id="gdpN"></small></summary><div class="obswrap" id="gdpObs"></div></details></div>
    <div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><b style="font-weight:500">Consumer price inflation</b> <span class="src" id="cpiSub"></span></div><div class="seg" data-r="cpi"><button data-v="1y">1Y</button><button data-v="3y">3Y</button><button data-v="10y">10Y</button><button data-v="all">All</button></div></div>
      <svg class="lc" id="cpiChart"></svg><div class="ro" id="cpiRo"></div><div class="src" id="cpiSrc"></div>
      <details class="more"><summary>Exact observations<small id="cpiN"></small></summary><div class="obswrap" id="cpiObs"></div></details></div>
  </div>
  <div class="sub">Changes over time · annual bar charts</div>
  <div class="two"><div><b style="font-weight:500">Change in growth</b> <span class="src">percentage points · annual</span><svg class="lc" id="gBars" style="height:170px"></svg><div class="ro" id="gBarsRo"></div></div>
    <div><b style="font-weight:500">Change in inflation</b> <span class="src">percentage points · annual</span><svg class="lc" id="iBars" style="height:170px"></svg><div class="ro" id="iBarsRo"></div></div></div>
  <details class="more"><summary>Observations and method</summary><p class="src" style="font-size:13px;line-height:1.5;padding-bottom:12px">${esc(K.method)}</p></details>`;
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
  $('#annualInfo').innerHTML=`<div style="font:500 14px var(--body)">${sel[0]} · Quad ${sel[3]}</div><div class="src" style="font-size:12.5px">${QTXT[sel[3]]} · growth change <b class="num">${sp(sel[1])} pp</b> · inflation change <b class="num">${sp(sel[2])} pp</b></div>`;
  const cnt=[1,2,3,4].map(q=>A.filter(a=>a[3]===q).length),lab={1:'Growth up, inflation down',2:'Growth up, inflation up',3:'Growth down, inflation up',4:'Growth down, inflation down'};
  $('#states').innerHTML=[1,2,3,4].map(q=>`<div><b>Quad ${q}</b><strong>${cnt[q-1]} of ${A.length}</strong><span>${lab[q]}</span></div>`).join('');
  $('#pathrow').innerHTML=A.map((a,i)=>`<span style="${i===annualSel?'border-color:var(--focus)':''}">${a[0]}<b>Q${a[3]}</b></span>`).join('');
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
