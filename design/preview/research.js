// Sheet 04 Research Lab — renders every section of the original Research Lab from window.RESEARCH (+ MARKETS for comparison).
(function(){
const Q=window.RESEARCH;if(!Q)return;const MK=window.MARKETS;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pct=(v,d=3)=>v==null||!Number.isFinite(v)?'—':(v*100).toFixed(d)+'%';
const pp=(v,d=3)=>(v*100).toFixed(d)+' pp';
const nf=(v,d=2)=>v==null||!Number.isFinite(v)?'—':v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];const dl=d=>`${+d.slice(8,10)} ${MON[+d.slice(5,7)-1]} ${d.slice(0,4)}`;

function chart(svg,series,o={}){ // series: [{pts:[[x,y]],cls}] x = index-aligned labels in o.labels or dates
  if(!svg)return;const W=Math.max(260,svg.clientWidth||svg.parentElement.clientWidth),H=o.h||240,L=4,R=W-56,T=10,B=H-22;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);const all=series.flatMap(s=>s.pts.map(p=>p[1])).filter(Number.isFinite);
  if(!all.length){svg.innerHTML='';return}let mn=Math.min(...all,o.zero?0:Infinity),mx=Math.max(...all,o.zero?0:-Infinity);if(o.band){mn=Math.min(mn,...o.band.map(b=>b[1]));mx=Math.max(mx,...o.band.map(b=>b[2]))}
  const pad=(mx-mn)*.08||1,lo=mn-pad,hi=mx+pad,n=Math.max(...series.map(s=>s.pts.length)),X=i=>L+(R-L)*(n<2?.5:i/(n-1)),Y=v=>B-(B-T)*(v-lo)/(hi-lo);
  let s='';for(let k=0;k<=4;k++){const v=lo+(hi-lo)*k/4;s+=`<line class="g" x1="${L}" x2="${R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${R+6}" y="${Y(v)+3}">${(o.fmt||(x=>nf(x,2)))(v)}</text>`}
  if(lo<0&&hi>0)s+=`<line class="z" x1="${L}" x2="${R}" y1="${Y(0)}" y2="${Y(0)}"/>`;
  const lab=series[0].pts,step=Math.max(1,Math.round(lab.length/6));lab.forEach((p,i)=>{if(i%step===0||i===lab.length-1)s+=`<text x="${X(i)}" y="${H-4}" text-anchor="${i===0?'start':i===lab.length-1?'end':'middle'}">${esc((o.xl||(x=>String(x).slice(0,7)))(p[0]))}</text>`});
  if(o.band)s+=`<path class="band" d="${o.band.map((b,i)=>(i?'L':'M')+X(i)+' '+Y(b[2])).join('')}${o.band.slice().reverse().map((b,j)=>'L'+X(o.band.length-1-j)+' '+Y(b[1])).join('')}Z"/>`;
  for(const sr of series)s+=`<path class="${sr.cls||'l'}" d="${sr.pts.map((p,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(p[1]).toFixed(1)).join('')}"/>`;
  if(o.refY!=null)s+=`<line class="ref" x1="${L}" x2="${R}" y1="${Y(o.refY)}" y2="${Y(o.refY)}"/>`;
  s+=`<line class="xh" y1="${T}" y2="${B}"/>`;svg.innerHTML=s;
  const xh=svg.querySelector('.xh'),ro=o.ro&&document.getElementById(o.ro);
  svg.onpointermove=e=>{const r=svg.getBoundingClientRect(),i=Math.round(Math.min(1,Math.max(0,((e.clientX-r.left)/r.width*W-L)/(R-L)))*(n-1));xh.setAttribute('x1',X(i));xh.setAttribute('x2',X(i));xh.style.opacity=.45;
    if(ro)ro.innerHTML=`${esc((o.pl||(x=>x))(series[0].pts[i]?.[0]))} · `+series.map(sr=>sr.pts[i]?`${esc(sr.name||'')} <b>${(o.fmt||(x=>nf(x,2)))(sr.pts[i][1])}</b>`:'').filter(Boolean).join(' · ')};
  svg.onpointerleave=()=>{xh.style.opacity=0;if(ro)ro.textContent=''};
}
const head=(kicker,title,lede,right='')=>`<div class="sec-head"><div><div class="kicker">${esc(kicker)}</div><h2>${title}</h2>${lede?`<p>${lede}</p>`:''}</div>${right}</div>`;
const segs=(name,opts,on)=>`<div class="seg" data-seg="${name}">${opts.map(([v,t])=>`<button data-v="${v}" class="${v===on?'on':''}">${t}</button>`).join('')}</div>`;
function wireSeg(root,name,cb){root.querySelectorAll(`[data-seg="${name}"] button`).forEach(b=>b.onclick=()=>{root.querySelectorAll(`[data-seg="${name}"] button`).forEach(z=>z.classList.toggle('on',z===b));cb(b.dataset.v)})}

/* 1. Instrument research + investment brief */
function brief(){
  const B=Q.brief,el=$('#brief .panel');
  el.innerHTML=head('Instrument research','Start with a ticker.','Price, historical risk and available models appear below. No market selection or model settings required.')+
  `<form class="tform" onsubmit="return false"><label>US or Indonesia ticker<input value="${B.ticker}" aria-describedby="tnote"></label><button class="btn-ink" type="button" disabled title="Runs in the live app">Analyse ticker</button><span class="src" id="tnote">Enter a ticker or company. Use US: or IDX: for matching symbols. This preview shows the study retained for AAPL.</span></form>
  <div class="sub">At a glance · investment brief</div>
  <div class="brief"><div class="bh"><div><div class="kicker">${B.market} · ${B.ticker}</div><h3>${B.name}</h3></div><span class="flag">${esc(B.status)}</span></div>
   <div class="bgrid">
    <div><small>Source price</small><b class="num">${B.price}</b><span>${B.priceNote}</span></div>
    <div><small>Historical annualized volatility</small><b class="num">${B.vol}</b><span>${B.volNote}<br>${B.volWindow}</span></div>
    <div><small>Historical maximum drawdown</small><b class="num">${B.mdd}</b><span>${B.mddNote}</span></div>
    <div><small>Observed returns</small><b class="num">${B.returns}</b><span>${B.window} · model history through ${B.through}</span></div>
    <div><small>Recorded earnings yield</small><b class="na">${B.earningsYield}</b><span>Recorded annual EPS ÷ valuation price</span></div>
    <div><small>Annual reported financials</small><b class="na">Unavailable</b><span>${esc(B.sec)}</span></div></div>
   <div class="two" style="margin-top:14px"><div class="box"><div class="kicker">Valuation under your assumptions</div><p class="src" style="font-size:13px;margin-top:6px">${esc(B.valuation)}</p><a class="act" href="#valuation">Edit assumptions →</a></div>
    <div class="box"><div class="kicker">What needs your judgement?</div><p style="font-size:13.5px;margin-top:6px">${esc(B.judgement)}</p><a class="act" href="#thesis">Save to thesis →</a></div></div>
   <p class="src" style="margin-top:10px">${esc(B.caveat)} History describes the past. Model bands depend on their assumptions and are not guaranteed probabilities.</p></div>`;
}

/* 2. Compare retained stocks — historical risk on shared dates */
async function compare(){
  const el=$('#compare .panel');if(!MK){el.innerHTML='';return}
  const pool=MK.us.concat(MK.idx);let picked=['AAPL','MSFT','NVDA'];
  el.innerHTML=head('Side by side','Compare retained stocks.','Select two to four stocks. Historical risk uses the same available dates within each market and currency group. No missing prices or exchange rates are filled.')+
   `<div class="picks">${pool.map(x=>`<label class="pick"><input type="checkbox" value="${x.sym}" ${picked.includes(x.sym)?'checked':''}> ${esc(x.sym)} <small>${esc(x.currency)}</small></label>`).join('')}</div><div id="cmpOut"></div>`;
  const run=async()=>{
    const sel=pool.filter(x=>picked.includes(x.sym)),out=$('#cmpOut');
    if(sel.length<2||sel.length>4){out.innerHTML='<p class="src">Select two to four stocks.</p>';return}
    const groups={};for(const s of sel)(groups[s.currency]=groups[s.currency]||[]).push(s);
    let html='';for(const [cur,arr] of Object.entries(groups)){
      if(arr.length<2){html+=`<p class="src">${arr.map(a=>a.sym).join(', ')} (${cur}) has no partner in the same currency group, so it is not compared.</p>`;continue}
      const data=await Promise.all(arr.map(a=>fetch(a.file).then(r=>r.json())));
      const maps=data.map(d=>new Map(d.d.map(p=>[p[0],p[1]]))),dates=[...maps[0].keys()].filter(dt=>maps.every(m=>m.has(dt))).slice(-253);
      const rows=arr.map((a,i)=>{const px=dates.map(dt=>maps[i].get(dt)),rets=px.slice(1).map((p,j)=>Math.log(p/px[j])),mu=rets.reduce((x,y)=>x+y,0)/rets.length,sd=Math.sqrt(rets.reduce((x,y)=>x+(y-mu)**2,0)/(rets.length-1));
        let peak=-Infinity,mdd=0;for(const p of px){peak=Math.max(peak,p);mdd=Math.min(mdd,p/peak-1)}return {sym:a.sym,name:a.name,vol:sd*Math.sqrt(252),mdd,ret:px.at(-1)/px[0]-1,n:rets.length,rets}});
      const corr=(a,b)=>{const ma=a.reduce((x,y)=>x+y,0)/a.length,mb=b.reduce((x,y)=>x+y,0)/b.length;let s=0,sa=0,sb=0;for(let k=0;k<a.length;k++){s+=(a[k]-ma)*(b[k]-mb);sa+=(a[k]-ma)**2;sb+=(b[k]-mb)**2}return s/Math.sqrt(sa*sb)};
      html+=`<div class="sub">${cur} group · ${dates.length} shared sessions · ${dl(dates[0])} → ${dl(dates.at(-1))}</div>
      <table class="obs cmpt"><thead><tr><th>Stock</th><th>Price change</th><th>Annualized volatility</th><th>Maximum drawdown</th><th>Returns</th>${rows.map(r=>`<th>ρ ${r.sym}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td><b>${r.sym}</b> <span class="src">${esc(r.name)}</span></td><td>${pct(r.ret,2)}</td><td>${pct(r.vol,2)}</td><td>${pct(r.mdd,2)}</td><td>${r.n}</td>${rows.map(q=>`<td>${q===r?'1.00':corr(r.rets,q.rets).toFixed(2)}</td>`).join('')}</tr>`).join('')}</tbody></table>`}
    out.innerHTML=html+'<p class="src" style="margin-top:8px">Daily log returns on adjusted closes, annualized with √252. Correlation ρ uses the same sessions. Historical description only, not expected return.</p>';
  };
  el.querySelectorAll('.pick input').forEach(c=>c.onchange=()=>{picked=[...el.querySelectorAll('.pick input:checked')].map(i=>i.value);run()});run();
}

/* 3. Quantitative models */
let tab='mc',fh='5',mdl='Mean';
function models(){
  const C5=Q.core5,C20=Q.core20,A=Q.advanced,el=$('#models .panel');
  const ftab=(F,label)=>`<table class="obs"><thead><tr><th>Model</th><th>Implied return</th><th>RMSE</th><th>MAE</th><th>Direction accuracy</th><th>90% residual interval</th></tr></thead><tbody>${F.models.map(m=>`<tr><td><b>${m.name}</b></td><td>${pct(m.priceReturn,4)}</td><td>${pp(m.rmse,3)}</td><td>${pp(m.mae,3)}</td><td>${Math.round(m.directionAccuracy*100)}%</td><td>${pct(m.interval.lower,2)} to ${pct(m.interval.upper,2)}</td></tr>`).join('')}</tbody></table><div class="src">${esc(label)} · ranking on the same scored windows: ${F.ranking.join(' › ')} · ${esc(F.selection)}</div>`;
  el.innerHTML=head('Advanced research','Quantitative models',esc(A.methods))+
  `<div class="settings"><div><small>Market</small><b>US stocks and ETFs</b></div><div><small>Ticker</small><b>${C5.config.ticker}</b></div><div><small>Scenario horizon</small><b>${C5.config.horizon} sessions</b></div><div><small>History through</small><b>${C5.config.cutoff}</b></div><div><small>Price history</small><b>Adjusted closes</b></div><div><small>Simulation seed</small><b>${C5.config.seed}</b></div><div><small>Observations</small><b>${C5.observations} · ${C5.trainPeriod.join(' → ')}</b></div></div>
   <p class="src" style="margin-top:6px">A seed fixes the random draws used in simulated scenarios; the same history, settings and seed produce the same paths. It does not improve accuracy or change the AR(1) or Ridge forecasts. Models need at least 350 completed observations.</p>
   <div class="sub">Research assessment · ${C5.config.ticker} · model history through ${A.history}</div>
   <div class="assess"><div><b>Forecast quality</b><p>${esc(A.assessment.quality)}</p></div><div><b>Risk conditions</b><p>${esc(A.assessment.risk)}</p></div><div><b>Downside context</b><p>${esc(A.assessment.downside)}</p></div></div>
   <div class="sub">Core forecasts · implied simple returns · historical test errors</div>
   <div class="two"><div><div class="kicker">5 sessions</div>${ftab(C5.forecasts[0],'Evaluation '+C5.evaluationPeriods[0].start+' → '+C5.evaluationPeriods[0].end)}</div><div><div class="kicker">20 sessions</div>${ftab(C5.forecasts[1],'Evaluation '+C5.evaluationPeriods[1].start+' → '+C5.evaluationPeriods[1].end)}</div></div>
   <div class="sub">Explore analysis</div>
   ${segs('tab',[['mc','Monte Carlo & bootstrap'],['ret','Return models & calibration'],['vol','GARCH & volatility'],['reg','HMM market regimes'],['tail','Tail risk & exceptions'],['bm','Benchmark & factor eligibility']],tab)}
   <div id="explore" style="margin-top:14px"></div>
   <details class="more"><summary>Core history, settings &amp; full audit<small>${esc(C5.id.slice(0,8))}</small></summary><dl class="audit">${[['Run',C5.id],['Created',C5.created],['Model version',C5.config.modelVersion],['Source',C5.meta.source],['Retrieved',C5.meta.retrievedAt],['Price definition',C5.meta.priceDefinition],['Missing policy',C5.meta.missingPolicy],['Completion policy',C5.meta.completionPolicy],['Parameters',JSON.stringify(C5.parameters)]].map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl></details>`;
  wireSeg(el,'tab',v=>{tab=v;explore()});explore();
}
function explore(){
  const C5=Q.core5,A=Q.advanced,ex=$('#explore'),H=C5.historical;
  if(tab==='mc'){const S=C5.simulation,B=A.bootstrap,bins=B.bins,mxc=Math.max(...bins.counts);
    ex.innerHTML=`<div class="two"><div><div class="kicker">${esc(B.process)} · Monte Carlo</div><div class="trio"><div><small>Lower 5th percentile</small><b class="num">${nf(B.p05[0],2)}</b><span>${B.p05[1]}% vs start</span></div><div><small>Median simulated outcome</small><b class="num">${nf(B.p50[0],2)}</b><span>${B.p50[1]}% vs start</span></div><div><small>Upper 95th percentile</small><b class="num">${nf(B.p95[0],2)}</b><span>${B.p95[1]}% vs start</span></div></div>
      <div class="kicker" style="margin-top:14px">Terminal outcomes · session 5 · ${B.paths.toLocaleString()} paths · ${B.belowStart}% below the starting price</div>
      <svg class="hist" viewBox="0 0 320 120" preserveAspectRatio="none">${bins.counts.map((c,i)=>`<rect x="${i*10+.5}" y="${110-c/mxc*104}" width="9" height="${c/mxc*104}" class="${bins.lo+bins.width*(i+.5)<B.start?'lo':''}"><title>${nf(bins.lo+bins.width*i,2)}–${nf(bins.lo+bins.width*(i+1),2)}: ${c} paths</title></rect>`).join('')}<line x1="${(B.start-bins.lo)/bins.width*10}" x2="${(B.start-bins.lo)/bins.width*10}" y1="0" y2="112" class="refl"/></svg>
      <div class="rng2"><span>${nf(bins.lo,1)}</span><span>Terminal price · USD · counts, not validated probabilities</span><span>${nf(bins.lo+bins.width*32,1)}</span></div></div>
     <div><div class="kicker">IID Gaussian · core model · ${S.paths.toLocaleString()} paths · seed ${S.seed}</div><svg class="lc" id="fan"></svg><div class="ro" id="fanRo"></div>
      <p class="src">${esc(S.process)}</p><p class="src">${esc(S.interpretation)} The dashed starting-price reference is not an expected-price forecast.</p></div></div>
     <details class="more"><summary>Simulation assumptions and exact process</summary><p class="src" style="font-size:13px;padding-bottom:10px">${esc(B.method)}</p></details>`;
    const bands=S.bands.map(b=>[b.session,b.p05,b.p95]);chart($('#fan'),[{pts:S.bands.map(b=>[b.session,b.p50]),cls:'l',name:'median'},...S.selectedPaths.map(p=>({pts:p.map((v,i)=>[i,v]),cls:'pth'}))],{band:bands,refY:S.bands[0].p50,xl:x=>'s'+x,pl:x=>'session '+x,ro:'fanRo',h:260});}
  if(tab==='ret'){const F=C5.forecasts.find(f=>String(f.horizon)===fh),M=F.models.find(m=>m.name===mdl)||F.models[0],mx=Math.max(...C5.forecasts.flatMap(f=>f.models.map(m=>m.rmse)));
    ex.innerHTML=`<div class="two"><div><div class="kicker">RMSE on the same chronological origins · lower is better</div>${C5.forecasts.map(f=>`<div class="lolli"><div class="src">${f.horizon} sessions</div>${f.models.map(m=>`<div class="lr"><span>${m.name}</span><span class="lt"><i style="left:${(m.rmse/mx*100).toFixed(1)}%"></i></span><b class="num">${pp(m.rmse,3)}</b></div>`).join('')}</div>`).join('')}
      <p class="src">${esc(F.directionConvention)}</p><p class="src">${esc(F.intervalConvention)}</p></div>
      <div><div style="display:flex;gap:8px;flex-wrap:wrap">${segs('fh',[['5','5 sessions'],['20','20 sessions']],fh)}${segs('mdl',F.models.map(m=>[m.name,m.name]),M.name)}</div>
      <svg class="lc" id="scoreC"></svg><div class="ro" id="scoreRo"></div><p class="src">${M.scores.length} scored, non-overlapping test windows · prediction (solid) vs realised (dotted) ${f2h(fh)} return · parameters ${esc(JSON.stringify(M.parameters||{}))}</p></div></div>`;
    wireSeg(ex,'fh',v=>{fh=v;explore()});wireSeg(ex,'mdl',v=>{mdl=v;explore()});
    chart($('#scoreC'),[{pts:M.scores.map(s=>['origin '+s[0],s[1]]),cls:'l',name:'predicted'},{pts:M.scores.map(s=>['origin '+s[0],s[2]]),cls:'act',name:'actual'}],{fmt:v=>(v*100).toFixed(2)+'%',zero:true,xl:x=>'',pl:x=>x,ro:'scoreRo',h:240});}
  if(tab==='vol'){ex.innerHTML=`<div class="trio"><div><small>GARCH annualized volatility</small><b class="num">${A.garchVol}%</b><span>lowest historical variance loss on the scored sessions</span></div><div><small>Sample annualized volatility</small><b class="num">${pct(H.annualizedVolatility,2)}</b><span>daily σ ${pct(H.dailySigma,3)} · √252</span></div><div><small>EWMA λ · rolling window</small><b class="num">${C5.parameters.ewmaLambda} · ${C5.parameters.rollingWindow}d</b><span>annualized below</span></div></div>
    <svg class="lc" id="volC"></svg><div class="ro" id="volRo"></div><p class="src">Rolling 20-session and EWMA (λ 0.94) daily volatility, annualized. Weekly points shown. This compares risk estimates, not stock returns.</p>`;
    const an=v=>v*Math.sqrt(252);chart($('#volC'),[{pts:H.rolling.map(p=>[p[0],an(p[1])]),cls:'l',name:'rolling 20d'},{pts:H.ewma.map(p=>[p[0],an(p[1])]),cls:'act',name:'EWMA'}],{fmt:v=>(v*100).toFixed(1)+'%',ro:'volRo',pl:x=>x,h:260});}
  if(tab==='reg'){ex.innerHTML=`<div class="trio"><div><small>HMM higher-variance-state probability</small><b class="num">${A.hmmHighVar}%</b><span>filtered through ${A.history}</span></div><div><small>Interpretation</small><b class="na" style="font-size:15px">Not a recession or loss probability</b><span>a two-state Gaussian HMM on daily returns</span></div><div><small>Daily path</small><b class="na" style="font-size:15px">Retained in the browser study</b><span>the full filtered-state curve and session heatmap live with the advanced archive</span></div></div>
    <p class="src" style="margin-top:10px">The zero-to-one filtered-state curve and the session-tile heatmap of the last 120 probabilities are drawn from the browser-retained advanced study in the live app. This preview carries the latest value only and does not reconstruct the curve.</p>`;}
  if(tab==='tail'){const R=H.risk,R20=Q.core20.historical.risk;ex.innerHTML=`<div class="trio"><div><small>Value at risk · 95% · ${R.horizon} sessions</small><b class="num">${pct(R.var,3)}</b><span>${R.sampleSize} observed returns · ${R.tailCount} in tail</span></div><div><small>Expected shortfall · 95% · ${R.horizon} sessions</small><b class="num">${pct(R.expectedShortfall,3)}</b><span>average of losses at or above VaR</span></div><div><small>Same, ${R20.horizon} sessions</small><b class="num">${pct(R20.var,2)} · ${pct(R20.expectedShortfall,2)}</b><span>VaR · ES, run of ${Q.core20.config.cutoff}</span></div></div>
    <svg class="lc" id="ddC"></svg><div class="ro" id="ddRo"></div><p class="src">${esc(R.sign)} ${esc(R.method)} Drawdown from running peak on the adjusted basis; maximum ${pct(H.maxDrawdown,2)}. Average one-session loss in the worst observed 5% tail: ${A.tailAvgLoss1d}%.</p>`;
    chart($('#ddC'),[{pts:H.drawdown,cls:'dd',name:'drawdown'}],{fmt:v=>(v*100).toFixed(0)+'%',zero:true,ro:'ddRo',pl:x=>x,h:220});}
  if(tab==='bm'){ex.innerHTML=`<p style="max-width:70ch">${esc(A.benchmark)}</p><p class="src" style="margin-top:8px">No benchmark exposure is shown for this study. Unavailable analyses explain what is missing rather than substituting another series.</p>`;}
}
const f2h=h=>h==='5'?'5-session':'20-session';

/* 4. Model accountability */
function accountability(){
  $('#accountability .panel').innerHTML=head('Validation & accountability','Model validation &amp; outcomes.','Eligible fresh core forecasts can be frozen and observed over five or twenty future source sessions. Pending outcomes are never scored as zero.')+
  `<div class="empty-row"><div><b>Prospective results</b><p class="src">No forecasts are registered in this workspace yet. Record eligible forecasts from a completed core run; outcomes appear once the future sessions are published.</p></div><button class="btn-line" disabled title="Runs in the live app">Record eligible forecasts</button><button class="btn-line" disabled>Review published outcomes</button></div>
  <details class="more"><summary>Scope, timing &amp; model eligibility</summary><p class="src" style="font-size:13px;padding-bottom:10px">Historical model comparisons remain retrospective studies, with 90% residual intervals only when at least 20 eligible errors exist. Device clocks and imported provenance are unverified. Advanced forecasts remain retrospective.</p></details>
  <details class="more"><summary>Individual forecasts &amp; retained scores<small>0 registered</small></summary><p class="src" style="padding-bottom:10px">Nothing registered.</p></details>`;
}

/* 5. Valuation sensitivity (your assumptions) */
function valuation(){
  const el=$('#valuation .panel');
  el.innerHTML=head('Valuation sensitivity','Start with the company.','Scenario assumptions are editable and are not market facts. Fundamentals are not inferred from a ticker; enter them from a filing you trust.')+
  `<div class="val"><form id="vform" class="vf">${segs('vm',[['eps','Earnings & exit multiple'],['rev','Revenue, margin & dilution']],'eps')}
    <div class="vgrid">
     <label>Instrument / study label<input name="label" value=""></label><label>Assumptions as of<input name="asof" type="date" value="2026-11-13"></label>
     <label>Entry price · per share<input name="p0" type="number" step="any"></label><label>Years · 1–100<input name="n" type="number" value="5" min="1" max="100"></label>
     <label data-m="eps">Current EPS · per share<input name="eps" type="number" step="any"></label><label data-m="eps">Annual EPS growth · %<input name="g" type="number" step="any" value="8"></label>
     <label data-m="rev" hidden>Base revenue · billions<input name="rev" type="number" step="any"></label><label data-m="rev" hidden>Annual revenue growth · %<input name="gr" type="number" step="any" value="6"></label>
     <label data-m="rev" hidden>Terminal net margin · %<input name="mg" type="number" step="any" value="20"></label><label data-m="rev" hidden>Diluted shares · billions<input name="sh" type="number" step="any"></label>
     <label>Annual dilution / share reduction · %<input name="dil" type="number" step="any" value="0"></label><label>Exit P/E<input name="pe" type="number" step="any" value="20"></label>
     <label>Dividends per share per year<input name="dps" type="number" step="any" value="0"></label><label>Required annual return · %<input name="req" type="number" step="any" value="10"></label>
     <label>Growth stress · ± pp<input name="gs" type="number" step="any" value="3"></label><label>Exit P/E stress · ± %<input name="ps" type="number" step="any" value="20"></label>
     <label class="wide">Optional evidence / source<input name="src" placeholder="e.g. 10-K FY2025, page 31"></label></div>
    <div class="vbtn"><button type="button" class="btn-ink" id="vcalc">Calculate below</button><button type="button" class="btn-line" id="vtest">Load TEST ONLY example</button></div></form>
   <div id="vout"><p class="src">Enter an entry price and the fundamentals for your chosen method. Nothing is filled in for you.</p></div></div>`;
  let method='eps';wireSeg(el,'vm',v=>{method=v;el.querySelectorAll('[data-m]').forEach(l=>l.hidden=l.dataset.m!==method)});
  const f=$('#vform'),num=k=>parseFloat(f.elements[k].value);
  $('#vtest').onclick=()=>{for(const [k,v] of Object.entries({label:'TEST ONLY example',p0:100,n:5,eps:5,g:8,rev:50,gr:6,mg:20,sh:10,dil:0,pe:20,dps:1,req:10,gs:3,ps:20}))f.elements[k].value=v;calc()};
  const value=(g,pe)=>{const n=num('n'),dil=num('dil')/100,dps=num('dps')||0;let epsN;
    if(method==='eps')epsN=num('eps')*Math.pow(1+g/100,n);else epsN=num('rev')*Math.pow(1+g/100,n)*num('mg')/100/num('sh');
    epsN=epsN/Math.pow(1+dil,n);const vN=epsN*pe+dps*n;return {vN,cagr:Math.pow(vN/num('p0'),1/n)-1,epsN}};
  function calc(){const p0=num('p0'),n=num('n'),g=method==='eps'?num('g'):num('gr'),pe=num('pe');
    const need=method==='eps'?['p0','n','eps','g','pe']:['p0','n','rev','gr','mg','sh','pe'];const miss=need.filter(k=>!Number.isFinite(num(k)));
    if(miss.length){$('#vout').innerHTML=`<p class="src">Missing: ${miss.join(', ')}. No values are assumed.</p>`;return}
    const base=value(g,pe),req=num('req')/100,gs=num('gs'),ps=num('ps')/100,G=[g-gs,g,g+gs],P=[pe*(1-ps),pe,pe*(1+ps)];
    $('#vout').innerHTML=`<div class="trio"><div><small>Value after ${n} years</small><b class="num">${nf(base.vN,2)}</b><span>EPS ${nf(base.epsN,2)} × exit P/E ${pe} + dividends</span></div><div><small>Implied annual return</small><b class="num">${pct(base.cagr,2)}</b><span>from entry ${nf(p0,2)}</span></div><div><small>Versus required</small><b class="num ${base.cagr>=req?'up':'dn'}">${base.cagr>=req?'meets':'below'} ${pct(req,1)}</b><span>under these assumptions only</span></div></div>
     <div class="kicker" style="margin-top:14px">Stress grid · implied annual return</div><table class="obs grid3"><thead><tr><th>Growth ↓ / exit P/E →</th>${P.map(x=>`<th>${nf(x,1)}×</th>`).join('')}</tr></thead><tbody>${G.map(gg=>`<tr><td>${nf(gg,1)}%</td>${P.map(pp2=>{const c=value(gg,pp2).cagr;return `<td class="${c>=req?'ok':'no'}">${pct(c,2)}</td>`}).join('')}</tr>`).join('')}</tbody></table>
     <p class="src">${f.elements.label.value?esc(f.elements.label.value)+' · ':''}as of ${esc(f.elements.asof.value)}${f.elements.src.value?' · evidence: '+esc(f.elements.src.value):''}. Simple dividends, no reinvestment; dilution reduces per-share value each year. A mechanical scenario does not establish an investment case.</p>`;}
  $('#vcalc').onclick=calc;
}

/* 6. Investment thesis */
function thesis(){
  $('#thesis .panel').innerHTML=head('Investment lab','Investment thesis','Give an idea a clear argument, evidence and a date to reconsider. Earlier text is retained when you revise.')+
  `<div class="thesis-frame">${[['Assumptions','What must be true for this to work?'],['Evidence','Filings, reports and studies you relied on; link a published report or a completed Quant run.'],['Horizon','How long you expect it to take.'],['Invalidation','What would change your mind, stated before the outcome is known.'],['Review date','When you will return to the evidence.'],['Links','Portfolio (Paper or Real) and instrument, optional.']].map(([t,d],i)=>`<div class="tf"><span class="tn">${String(i+1).padStart(2,'0')}</span><b>${t}</b><p class="src">${d}</p></div>`).join('')}</div>
  <div class="empty-row"><div><b>No theses in this workspace yet</b><p class="src">Capture your assumptions, supporting evidence and what would change your mind. Link a published report without sharing your private thesis.</p></div><button class="btn-ink" disabled title="Opens the editor in the live app">Write your first thesis</button><button class="btn-line" disabled>Use instrument brief in a thesis</button></div>`;
}

/* 7. Research library */
function library(){
  const L=Q.catalogue;$('#library .panel').innerHTML=head('Library','Evidence, within reach.',`Published Longhand Research. ${L.length} reports · latest ${dl(L.map(r=>r.date).sort().at(-1))}. Attach these reports from a thesis or decision. Private records are never sent to Research.`)+
  `<div class="lib">${L.map((r,i)=>`<div class="lr2"><span class="tn">${String(i+1).padStart(2,'0')}</span><span class="lm"><small>${esc(r.category)}${r.ticker?' · '+esc(r.ticker):''} · ${dl(r.date)}</small><a href="https://longhandresearch.github.io/${esc(r.page||'')}" target="_blank" rel="noopener noreferrer"><b>${esc(r.title)} ↗</b></a>${r.blurb?`<p>${esc(r.blurb)}</p>`:''}</span><a class="act" href="#thesis">Use in a thesis</a></div>`).join('')}</div>`;
}

/* 8. Saved research */
function saved(){
  const R=Q.runs;$('#saved .panel').innerHTML=head('Saved research','Retained studies, this workspace.','Searchable archives of core analyses, advanced studies, registered forecasts, manual studies, ticker studies and valuations.')+
  `<input class="filter" placeholder="Search retained research" aria-label="Search retained research" id="sfind">
  <table class="obs" style="margin-top:10px"><thead><tr><th>Created</th><th>Instrument</th><th>Cutoff</th><th>Horizon</th><th>Status</th><th>Run</th></tr></thead><tbody id="srows">${R.slice().reverse().map(r=>`<tr data-q="${esc((r.ticker+' '+r.cutoff+' '+r.stage).toLowerCase())}"><td>${r.created.slice(0,16).replace('T',' ')}</td><td><b>${r.market} · ${r.ticker}</b></td><td>${r.cutoff}</td><td>${r.horizon} sessions</td><td>${esc(r.stage)}${r.cachedFrom?` <span class="src">cached from ${r.cachedFrom.slice(0,8)}</span>`:''}</td><td><code>${r.id.slice(0,8)}</code></td></tr>`).join('')}</tbody></table>
  <div class="arch">${[['Previous analyses',R.length+' core runs'],['Advanced model archive','this browser'],['Saved manual studies','this browser'],['Saved ticker studies','this browser'],['Saved valuations','this browser']].map(([t,s])=>`<div><b>${t}</b><span class="src">${s}</span></div>`).join('')}</div>
  <details class="more"><summary>Original archives &amp; export controls</summary><p class="src" style="padding-bottom:10px">Export this ticker study, export ticker, valuation and advanced archives, and restore each from a file. Exports run in the live app; nothing is downloaded from this preview.</p></details>`;
  $('#sfind').oninput=e=>{const q=e.target.value.toLowerCase();$$('#srows tr').forEach(t=>t.hidden=!!q&&!t.dataset.q.includes(q))};
}

/* 9. Advanced tools: options, bonds */
function N(x){return .5*(1+erf(x/Math.SQRT2))}function erf(x){const s=Math.sign(x);x=Math.abs(x);const t=1/(1+.3275911*x),y=1-((((1.061405429*t-1.453152027)*t+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x);return s*y}
const pdf=x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);
function bs(S,K,T,r,q,v,call){const d1=(Math.log(S/K)+(r-q+v*v/2)*T)/(v*Math.sqrt(T)),d2=d1-v*Math.sqrt(T),dq=Math.exp(-q*T),dr=Math.exp(-r*T);
  const price=call?S*dq*N(d1)-K*dr*N(d2):K*dr*N(-d2)-S*dq*N(-d1);return {price,delta:call?dq*N(d1):dq*(N(d1)-1),gamma:dq*pdf(d1)/(S*v*Math.sqrt(T)),vega:S*dq*pdf(d1)*Math.sqrt(T)/100,
  theta:(call?(-S*dq*pdf(d1)*v/(2*Math.sqrt(T))-r*K*dr*N(d2)+q*S*dq*N(d1)):(-S*dq*pdf(d1)*v/(2*Math.sqrt(T))+r*K*dr*N(-d2)-q*S*dq*N(-d1)))/365,rho:(call?K*T*dr*N(d2):-K*T*dr*N(-d2))/100}}
function bond(F,c,y,n,f){const cf=F*c/f,k=Math.round(n*f);let p=0,mac=0,cx=0;for(let i=1;i<=k;i++){const t=i/f,amt=cf+(i===k?F:0),df=Math.pow(1+y/f,-i);p+=amt*df;mac+=t*amt*df;cx+=amt*df*t*(t+1/f)}mac/=p;return {price:p,mac,mod:mac/(1+y/f),conv:cx/(p*Math.pow(1+y/f,2))}}
function tools(){
  const el=$('#tools .panel');
  el.innerHTML=head('Advanced tools','Calculate. Inspect. Reproduce.','Research toolkit · options, fixed income and portfolio risk. Inputs are yours; nothing is inferred from a stock ticker.')+
  `<div class="two"><div class="box"><div class="kicker">Options · Black–Scholes–Merton</div><form class="tgrid" id="opt">${[['S','Spot',100],['K','Strike',100],['T','Years to expiry',0.5],['r','Risk-free rate %',4.5],['q','Dividend yield %',0],['v','Volatility %',25],['mkt','Market price (for implied vol)','']].map(([k,l,v])=>`<label>${l}<input name="${k}" type="number" step="any" value="${v}"></label>`).join('')}<label>Type<select name="cp"><option value="c">Call</option><option value="p">Put</option></select></label></form><div id="optOut" class="kv"></div></div>
   <div class="box"><div class="kicker">Fixed income · bond price, yield &amp; duration</div><form class="tgrid" id="bnd">${[['F','Face value',100],['c','Coupon % per year',5],['n','Years to maturity',10],['y','Yield % per year',4.86],['f','Coupons per year',2],['px','Price (to solve yield)','']].map(([k,l,v])=>`<label>${l}<input name="${k}" type="number" step="any" value="${v}"></label>`).join('')}</form><div id="bndOut" class="kv"></div></div></div>
  <p class="src" style="margin-top:8px">Standard closed-form European pricing (no early exercise) and annual-compounding-per-period bond maths. Implied volatility and yield are solved by bisection. Portfolio risk and the complete Atlas reference studies run in the live app's research toolkit.</p>
  <details class="more"><summary>Decision calculators · Atlas reference · methods and reviewed repositories</summary><p class="src" style="padding-bottom:10px">Decision calculators (stress, budget, fees), historical Atlas reference studies with the reproducible verified public study, automatic valuation, and advanced manual calculators are kept in the live app with export and restore of calculations and drafts.</p></details>`;
  const of=$('#opt'),bf=$('#bnd');
  const runOpt=()=>{const g=k=>parseFloat(of.elements[k].value),S=g('S'),K=g('K'),T=g('T'),r=g('r')/100,q=g('q')/100,v=g('v')/100,call=of.elements.cp.value==='c';
    if([S,K,T,v].some(x=>!(x>0))){$('#optOut').innerHTML='<p class="src">Spot, strike, time and volatility must be positive.</p>';return}
    const o=bs(S,K,T,r,q,v,call);let iv='';const m=g('mkt');if(m>0){let lo=1e-4,hi=5;for(let i=0;i<100;i++){const mid=(lo+hi)/2;bs(S,K,T,r,q,mid,call).price>m?hi=mid:lo=mid}iv=`<div><small>Implied volatility</small><b class="num">${((lo+hi)/2*100).toFixed(3)}%</b></div>`}
    $('#optOut').innerHTML=[['Price',nf(o.price,4)],['Delta',nf(o.delta,4)],['Gamma',nf(o.gamma,5)],['Vega · per 1 vol pt',nf(o.vega,4)],['Theta · per day',nf(o.theta,4)],['Rho · per 1 pp',nf(o.rho,4)]].map(([k,v])=>`<div><small>${k}</small><b class="num">${v}</b></div>`).join('')+iv};
  const runBnd=()=>{const g=k=>parseFloat(bf.elements[k].value),F=g('F'),c=g('c')/100,n=g('n'),f=g('f');let y=g('y')/100;const px=g('px');let solved='';
    if(px>0){let lo=-.05,hi=1;for(let i=0;i<200;i++){const mid=(lo+hi)/2;bond(F,c,mid,n,f).price>px?lo=mid:hi=mid}y=(lo+hi)/2;solved=`<div><small>Yield to maturity</small><b class="num">${(y*100).toFixed(4)}%</b></div>`}
    const b=bond(F,c,y,n,f);$('#bndOut').innerHTML=solved+[['Price',nf(b.price,4)],['Macaulay duration · years',nf(b.mac,4)],['Modified duration',nf(b.mod,4)],['Convexity',nf(b.conv,3)],['Δ price for +1 bp',nf(-b.mod*b.price/1e4,4)]].map(([k,v])=>`<div><small>${k}</small><b class="num">${v}</b></div>`).join('')};
  of.oninput=runOpt;bf.oninput=runBnd;runOpt();runBnd();
}

function tabs(){
  const T=[['Instrument brief','#brief'],['Compare','#compare'],['Quant models','#models'],['Accountability','#accountability'],['Valuation','#valuation'],['Thesis','#thesis'],['Library','#library'],['Saved research','#saved'],['Advanced tools','#tools']];
  const nav=$('#mtabs');nav.innerHTML=`<span class="kicker">Sheet 04 — details 1–${T.length}</span><div class="seg" role="tablist">${T.map(([t,h],i)=>`<button role="tab" data-h="${h}" class="${i?'':'on'}"><span class="dn">${i+1}</span>${t}</button>`).join('')}</div>`;
  nav.querySelectorAll('button').forEach(b=>b.onclick=()=>{const t=$(b.dataset.h);if(t)window.scrollTo({top:t.getBoundingClientRect().top+scrollY-118,behavior:'smooth'})});
  const secs=T.map(([,h])=>$(h));const spy=()=>{let cur=secs[0];for(const s of secs)if(s.getBoundingClientRect().top<170)cur=s;nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.h==='#'+cur.id))};/* scroll spy replaced by sheet-views.js */
  T.forEach(([,h],i)=>{const d=$(h+' .sec-head>div:first-child');if(!d||d.querySelector('.dbub'))return;const inner=d.innerHTML;d.innerHTML=`<span class="dbub" aria-label="Detail ${i+1} of sheet 04"><b>${i+1}</b><i>04</i></span><div class="ttl">${inner}</div>`;const k=d.querySelector('.kicker');if(k)k.textContent=`Detail ${i+1} · `+k.textContent});
}
function all(){brief();compare();models();accountability();valuation();thesis();library();saved();tools();tabs()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',all):all();
let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(explore,180)});
})();
