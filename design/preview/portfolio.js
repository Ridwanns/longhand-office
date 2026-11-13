// Sheet 05 Portfolio — every section of the Office portfolio, journal and review pages.
// The worked ledger is an EXAMPLE in Paper, priced with real published closes; it is not the user's record.
(function(){
const K=window.MARKETS;const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nf=(v,d=2)=>v==null||!Number.isFinite(v)?'—':v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=(v,d=2)=>v==null||!Number.isFinite(v)?'—':(v>=0?'+':'−')+Math.abs(v*100).toFixed(d)+'%';
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];const dl=d=>`${+d.slice(8,10)} ${MON[+d.slice(5,7)-1]} ${d.slice(0,4)}`;
const head=(kicker,title,lede,right='')=>`<div class="sec-head"><div><div class="kicker">${esc(kicker)}</div><h2>${title}</h2>${lede?`<p>${lede}</p>`:''}</div>${right}</div>`;
// priced at the latest completed close in the snapshot (each holding shows its own session date)
const ASOF=[...(window.MARKETS?.us||[]),...(window.MARKETS?.idx||[])].map(x=>x.date).filter(Boolean).sort().at(-1)||new Date().toISOString().slice(0,10);
// Example ledgers (Paper). Prices are filled from published raw closes on each date.
const EX=[
 {id:'ex-usd',name:'Example · Paper · US equities & Treasuries',currency:'USD',opened:'2026-01-05',flows:[['2026-01-05','Opening cash',50000],['2026-04-01','Deposit',5000],['2026-09-15','Withdrawal',-3000]],
  trades:[['2026-01-06','BUY','AAPL','us_AAPL',40,1],['2026-02-10','BUY','MSFT','us_MSFT',20,1],['2026-03-16','BUY','TLT','TLT',100,1],['2026-06-15','SELL','AAPL','us_AAPL',10,1],['2026-07-14','BUY','NVDA','us_NVDA',30,1]]},
 {id:'ex-idr',name:'Example · Paper · Indonesian equities',currency:'IDR',opened:'2026-02-02',flows:[['2026-02-02','Opening cash',100000000]],
  trades:[['2026-02-03','BUY','BBCA','idx_BBCA',3000,25000],['2026-05-12','BUY','BBRI','idx_BBRI',5000,25000],['2026-08-18','SELL','BBCA','idx_BBCA',1000,25000]]}];
const cache={};const load=f=>cache[f]||(cache[f]=fetch('mk/'+f+'.json').then(r=>r.json()));
const closeOn=(d,date)=>{const rows=d.d;let best=null;for(const r of rows){if(r[0]<=date)best=r;else break}return best?{date:best[0],raw:best.length>2&&best[2]!=null?best[2]:best[1]}:null};

async function build(P){
  const files=[...new Set(P.trades.map(t=>t[3]))],data=Object.fromEntries(await Promise.all(files.map(async f=>[f,await load(f)])));
  const tx=P.trades.map(([date,side,sym,f,q,fee])=>{const c=closeOn(data[f],date);return {date,side,sym,f,q,fee,price:c.raw,session:c.date}});
  const events=[...P.flows.map(([date,type,amt])=>({date,kind:'flow',type,amt})),...tx.map(t=>({date:t.date,kind:'tx',...t}))].sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.kind==='flow'?-1:1);
  let cash=0;const pos={};let realized=0,fees=0;const journal=[];
  for(const e of events){if(e.kind==='flow'){cash+=e.amt;journal.push({...e,cash});continue}
    const p=pos[e.sym]||(pos[e.sym]={q:0,cost:0,f:e.f});
    if(e.side==='BUY'){const gross=e.q*e.price;cash-=gross+e.fee;p.cost+=gross+e.fee;p.q+=e.q;fees+=e.fee;journal.push({...e,gross,cash,avg:p.cost/p.q})}
    else{const avg=p.cost/p.q,proceeds=e.q*e.price-e.fee,basis=avg*e.q;cash+=proceeds;p.cost-=basis;p.q-=e.q;fees+=e.fee;const rp=proceeds-basis;realized+=rp;journal.push({...e,gross:e.q*e.price,cash,avg,realized:rp})}}
  const holdings=Object.entries(pos).filter(([,p])=>p.q>0).map(([sym,p])=>{const c=closeOn(data[p.f],ASOF);const mv=p.q*c.raw;return {sym,q:p.q,avg:p.cost/p.q,cost:p.cost,price:c.raw,session:c.date,mv,upl:mv-p.cost}});
  const mvTotal=holdings.reduce((a,h)=>a+h.mv,0);holdings.forEach(h=>h.w=h.mv/(mvTotal+cash));
  // value at any date = cash + holdings at raw close (for TWR boundaries)
  const valueAt=date=>{let c=0;const q={};for(const e of events){if(e.date>date)break;if(e.kind==='flow')c+=e.amt;else{if(e.side==='BUY'){c-=e.q*e.price+e.fee;q[e.sym]=(q[e.sym]||0)+e.q}else{c+=e.q*e.price-e.fee;q[e.sym]-=e.q}}}
    let v=c;for(const [s,n] of Object.entries(q)){if(!n)continue;const f=P.trades.find(t=>t[2]===s)[3];v+=n*closeOn(data[f],date).raw}return v};
  const ext=P.flows.slice(1);const bounds=[];let prev={date:P.flows[0][0],v:P.flows[0][2]};let link=1;
  for(const [date,type,amt] of ext){const before=valueAt(date)-amt;const r=before/prev.v-1;link*=1+r;bounds.push({start:prev.date,end:date,v0:prev.v,v1:before,r,type,amt});prev={date,v:before+amt}}
  const endV=mvTotal+cash,rl=endV/prev.v-1;link*=1+rl;bounds.push({start:prev.date,end:ASOF,v0:prev.v,v1:endV,r:rl,type:'Assessment',amt:0});
  const cfs=[...P.flows.map(([d,,a])=>[d,-a]),[ASOF,endV]];const t0=new Date(cfs[0][0]);const yf=d=>(new Date(d)-t0)/(365.25*864e5);
  const npv=r=>cfs.reduce((s,[d,a])=>s+a/Math.pow(1+r,yf(d)),0);let lo=-.99,hi=10;for(let i=0;i<200;i++){const m=(lo+hi)/2;npv(m)>0?lo=m:hi=m}
  return {P,tx,journal,holdings,cash,realized,fees,mvTotal,endV,twr:link-1,mwr:(lo+hi)/2,bounds,cfs,years:yf(ASOF),contrib:P.flows.reduce((a,f)=>a+f[2],0)};
}

function groups(L){
  $('#groups .panel').innerHTML=head('Portfolio','Paper and Real, kept in separate groups.','Paper tests an approach with simulated cash and transactions. Real holds manual records of your actual investments. There is no brokerage connection or order execution.')+
  `<div class="pgroups"><div class="pg"><div class="kicker">Paper · simulation</div><b class="num">${L.length}</b><span>example portfolios in this preview</span><button class="btn-line" disabled>＋ Create paper portfolio</button></div>
   <div class="pg"><div class="kicker">Real · actual investments</div><b class="num">0</b><span>Real is empty. Create a portfolio, then enter actual transactions from your own records.</span><button class="btn-ink" disabled>＋ Create real portfolio</button></div></div>
  <div class="steps">${[['Create a portfolio','Name, currency and (for Paper) simulated opening cash.'],['Record buy or sell','Ticker, quantity, your price and fees.'],['Review positions','Cash, holdings and valuation on a dated close.']].map(([t,d],i)=>`<div><span class="tn">${i+1}</span><b>${t}</b><p class="src">${d}</p></div>`).join('')}</div>
  <div class="exbanner"><b>Example</b> The two ledgers below are worked examples in Paper so every view has something to show. They are not your records, and trade prices are the published raw closes on each trade date.</div>`;
}
function holdings(L){
  $('#holdings .panel').innerHTML=head('Holdings & valuation',`Recorded holdings, valued on ${dl(ASOF)}.`,'Weighted-average cost includes fees. Cost, realised trading profit and unrealised P/L are kept separate. Each currency stands alone.',`<label class="asof">Assessment date<input type="date" value="${ASOF}" disabled></label>`)+
  L.map(b=>`<div class="pf"><div class="pfh"><div><div class="kicker">${esc(b.P.currency)} · opened ${dl(b.P.opened)}</div><h3>${esc(b.P.name)}</h3></div>
    <div class="pfs"><div><small>Total value</small><b class="num">${nf(b.endV,0)}</b></div><div><small>Cash</small><b class="num">${nf(b.cash,0)}</b></div><div><small>Unrealised P/L</small><b class="num ${b.holdings.reduce((a,h)=>a+h.upl,0)>=0?'up':'dn'}">${nf(b.holdings.reduce((a,h)=>a+h.upl,0),0)}</b></div><div><small>Realised trading P/L</small><b class="num ${b.realized>=0?'up':'dn'}">${nf(b.realized,0)}</b></div><div><small>Net contributions</small><b class="num">${nf(b.contrib,0)}</b></div></div></div>
    <table class="obs ht"><thead><tr><th>Holding</th><th>Quantity</th><th>Avg cost incl. fees</th><th>Cost basis</th><th>Ledger price</th><th>Market value</th><th>Unrealised P/L</th><th>Weight</th></tr></thead><tbody>
    ${b.holdings.map(h=>`<tr><td><b>${h.sym}</b></td><td>${nf(h.q,0)}</td><td>${nf(h.avg,b.P.currency==='IDR'?0:2)}</td><td>${nf(h.cost,0)}</td><td>${nf(h.price,b.P.currency==='IDR'?0:2)} <span class="src">${h.session}</span></td><td>${nf(h.mv,0)}</td><td class="${h.upl>=0?'up':'dn'}">${nf(h.upl,0)} <span class="src">${pct(h.upl/h.cost)}</span></td><td><span class="wbar"><i style="width:${(h.w*100).toFixed(1)}%"></i></span>${(h.w*100).toFixed(1)}%</td></tr>`).join('')}
    <tr class="cashrow"><td>Cash</td><td colspan="4"></td><td>${nf(b.cash,0)}</td><td></td><td>${(b.cash/b.endV*100).toFixed(1)}%</td></tr></tbody></table></div>`).join('')+
  `<details class="more"><summary>Currency breakdown &amp; concentration</summary><div class="cur">${L.map(b=>`<div><small>${b.P.currency}</small><b class="num">${nf(b.endV,0)}</b><span class="src">largest holding ${b.holdings.slice().sort((x,y)=>y.w-x.w)[0].sym} ${(b.holdings.slice().sort((x,y)=>y.w-x.w)[0].w*100).toFixed(1)}%</span></div>`).join('')}</div><p class="src" style="padding-bottom:10px">USD and IDR totals are shown side by side and never added together. No exchange rate is invented to consolidate them.</p></details>
  <details class="more"><summary>How valuation is calculated</summary><p class="src" style="font-size:13px;padding-bottom:10px">Market value = quantity × the published raw close on or before the assessment date. Weighted-average cost adds fees to purchases; a sale realises proceeds minus fees minus average cost × quantity. Raw closes exclude dividends. Value minus contributions is never presented as a percentage return.</p></details>`;
}
function journal(L){
  $('#journal .panel').innerHTML=head('Transaction journal','Every trade, with its cost calculation.','Your prices and fees. Each sale shows the average cost it consumed and the trading profit it realised.')+
  L.map(b=>`<div class="kicker" style="margin-top:12px">${esc(b.P.name)}</div><table class="obs jt"><thead><tr><th>Date</th><th>Type</th><th>Instrument</th><th>Quantity</th><th>Price</th><th>Fees</th><th>Gross</th><th>Avg cost after</th><th>Realised</th><th>Cash after</th></tr></thead><tbody>
   ${b.journal.map(j=>j.kind==='flow'?`<tr class="flow"><td>${j.date}</td><td>${esc(j.type)}</td><td colspan="7" class="src">external cash flow</td><td>${nf(j.cash,0)}</td></tr>`:`<tr><td>${j.date}</td><td><b class="${j.side==='BUY'?'':'dn'}">${j.side}</b></td><td>${j.sym}</td><td>${nf(j.q,0)}</td><td>${nf(j.price,b.P.currency==='IDR'?0:2)}</td><td>${nf(j.fee,0)}</td><td>${nf(j.gross,0)}</td><td>${nf(j.avg,b.P.currency==='IDR'?0:2)}</td><td class="${(j.realized||0)>=0?'up':'dn'}">${j.realized!=null?nf(j.realized,0):''}</td><td>${nf(j.cash,0)}</td></tr>`).join('')}</tbody></table>`).join('')+
  `<details class="more"><summary>Transaction details &amp; cost calculations</summary><p class="src" style="font-size:13px;padding-bottom:10px">No shorting, no automatic corporate-action trade changes, no broker synchronisation, no tax-lot accounting and no FX conversion. Legacy records with older trade precision remain supported.</p></details>`;
}
function income(L){
  $('#income .panel').innerHTML=head('Capital and income','Deposits, withdrawals and dividends, dated.','External flows are recorded separately from trades. They mark the boundaries that time-weighted return needs.')+
  `<table class="obs"><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Currency</th><th>Instrument</th><th>Note</th></tr></thead><tbody>${L.flatMap(b=>b.P.flows.map(f=>`<tr><td>${f[0]}</td><td>${f[1]}</td><td>${nf(f[2],0)}</td><td>${b.P.currency}</td><td>—</td><td class="src">${esc(b.P.name)}</td></tr>`)).join('')}</tbody></table>
  <p class="src" style="margin-top:8px">No dividends are recorded in these examples; amounts are never assumed. Dividends you receive are entered with their date and currency.</p>
  <details class="more"><summary>FX execution evidence</summary><p class="src" style="padding-bottom:10px">When cash moves between currencies, the executed rate is recorded as evidence with its source. Nothing in these examples converts currency.</p></details>`;
}
function pricing(L){
  $('#pricing .panel').innerHTML=head('Published daily closes','Price your recorded holdings.','Choose a published close for each holding. The original raw close and the ledger price are shown with their session, so a stale price is visible.')+
  `<table class="obs"><thead><tr><th>Holding</th><th>Original raw close</th><th>Ledger price</th><th>Session / acquisition</th><th>Portfolio</th></tr></thead><tbody>${L.flatMap(b=>b.holdings.map(h=>`<tr><td><b>${h.sym}</b></td><td>${nf(h.price,b.P.currency==='IDR'?0:4)}</td><td>${nf(h.price,b.P.currency==='IDR'?0:2)} ${b.P.currency}</td><td>${h.session}${h.session<ASOF?' <span class="flag">older session</span>':''}</td><td class="src">${esc(b.P.name)}</td></tr>`)).join('')}</tbody></table>`;
}
function performance(L){
  $('#performance .panel').innerHTML=head('Performance · dated capital','Return, cash flows &amp; FX.','Time-weighted return links subperiods split at each external flow; money-weighted return solves the internal rate of return on investor cash flows.')+
  L.map(b=>`<div class="pf"><div class="pfh"><div><div class="kicker">${b.P.currency}</div><h3>${esc(b.P.name)}</h3></div><div class="pfs"><div><small>TWR · ${b.bounds.length} linked subperiods</small><b class="num ${b.twr>=0?'up':'dn'}">${pct(b.twr)}</b></div><div><small>MWR · annualised IRR</small><b class="num ${b.mwr>=0?'up':'dn'}">${pct(b.mwr)}</b></div><div><small>Span</small><b class="num">${b.years.toFixed(2)} y</b></div></div></div>
   <div class="two"><div><div class="kicker">TWR subperiods</div><table class="obs"><thead><tr><th>Start</th><th>Subperiod end</th><th>Value at start</th><th>Value before flow</th><th>Subperiod return</th></tr></thead><tbody>${b.bounds.map(x=>`<tr><td>${x.start}</td><td>${x.end} <span class="src">${esc(x.type)}</span></td><td>${nf(x.v0,0)}</td><td>${nf(x.v1,0)}</td><td class="${x.r>=0?'up':'dn'}">${pct(x.r)}</td></tr>`).join('')}</tbody></table></div>
    <div><div class="kicker">MWR investor cash flows</div><table class="obs"><thead><tr><th>Date</th><th>Investor amount</th></tr></thead><tbody>${b.cfs.map(([d,a])=>`<tr><td>${d}</td><td>${nf(a,0)}</td></tr>`).join('')}</tbody></table></div></div></div>`).join('')+
  `<p class="src">Example computation: each boundary is valued at the published raw close on that date. In the live app TWR and MWR stay unavailable until every external-flow boundary has a complete dated valuation that you confirm, under a documented policy. Raw closes exclude dividends. No FX reconciliation is needed because neither example converts currency.</p>`;
}
function reconcile(L){
  const b=L[0];$('#reconcile .panel').innerHTML=head('Statement reconciliation','Match cash &amp; share quantities.','Compare a closing statement with the ledger. Differences are shown, never silently corrected.')+
  `<table class="obs"><thead><tr><th>Holding</th><th>Statement quantity</th><th>Ledger quantity</th><th>Difference</th></tr></thead><tbody>${b.holdings.map(h=>`<tr><td><b>${h.sym}</b></td><td>${nf(h.q,0)}</td><td>${nf(h.q,0)}</td><td>0</td></tr>`).join('')}<tr><td>Cash · ${b.P.currency}</td><td>${nf(b.cash,2)}</td><td>${nf(b.cash,2)}</td><td>0.00</td></tr></tbody></table>
  <p class="src" style="margin-top:8px">Example: the statement column mirrors the ledger to show the layout. With your own statement, any non-zero difference is listed for you to resolve.</p>
  <details class="more"><summary>Recorded share-ratio events</summary><p class="src" style="padding-bottom:10px">Splits and other share-ratio events are recorded explicitly; they never change past trades automatically. None in these examples.</p></details>
  <details class="more"><summary>Compare a closing statement</summary><p class="src" style="padding-bottom:10px">Enter the statement date, quantities and cash from your broker statement to retain a dated review.</p></details>`;
}
function decisions(L){
  const aapl=L[0].tx.find(t=>t.sym==='AAPL'&&t.side==='BUY');
  $('#decisions .panel').innerHTML=head('Decision room','The decision journal.','Preserve what you knew, what you expected and what happened next. Earlier text is retained when you add a review.')+
  `<div class="sub">Review queue · return to the reasoning</div>
  <div class="queue"><div class="qi"><span class="qd">1 Dec 2026</span><span><b>Review · AAPL purchase</b><small>Example decision · ${L[0].P.name}</small></span><span class="flag">due in 18 days</span></div></div>
  <div class="sub">Journal</div>
  <article class="dec"><div class="dech"><span class="tn">EXAMPLE</span><b>Buy 40 AAPL at ${nf(aapl.price,2)} USD</b><span class="src">${aapl.date} · Paper · linked thesis: none</span></div>
   <div class="decg"><div><small>Original expectation</small><p>Written before the outcome is known: what you expected, over what horizon, and what would prove it wrong.</p></div><div><small>What you knew</small><p>Evidence at the time: the dated brief, a completed core run, a published report.</p></div><div><small>Thesis reviews</small><p class="src">None yet.</p></div><div><small>Outcome reviews</small><p class="src">Due 1 Dec 2026.</p></div></div>
   <details class="more"><summary>Retained original entry</summary><p class="src" style="padding-bottom:10px">Revisions never overwrite the original entry; each prior text is kept with the time it was captured.</p></details></article>
  <div class="empty-row" style="margin-top:12px"><div><b>Remember the reasoning, not just the result.</b><p class="src">Record a decision before the outcome is known. Set a review date and return later to reflect.</p></div><button class="btn-ink" disabled>＋ Record a decision</button></div>`;
}
function tabs(){
  const T=[['Paper & Real','#groups'],['Holdings','#holdings'],['Journal','#journal'],['Capital & income','#income'],['Pricing','#pricing'],['Performance','#performance'],['Reconciliation','#reconcile'],['Decisions','#decisions']];
  const nav=$('#mtabs');nav.innerHTML=`<span class="kicker">Sheet 05 — details 1–${T.length}</span><div class="seg" role="tablist">${T.map(([t,h],i)=>`<button role="tab" data-h="${h}" class="${i?'':'on'}"><span class="dn">${i+1}</span>${t}</button>`).join('')}</div>`;
  nav.querySelectorAll('button').forEach(b=>b.onclick=()=>{const t=$(b.dataset.h);if(t)window.scrollTo({top:t.getBoundingClientRect().top+scrollY-118,behavior:'smooth'})});
  const secs=T.map(([,h])=>$(h));const spy=()=>{let cur=secs[0];for(const s of secs)if(s.getBoundingClientRect().top<170)cur=s;nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.h==='#'+cur.id))};/* scroll spy replaced by sheet-views.js */
  T.forEach(([,h],i)=>{const d=$(h+' .sec-head>div:first-child');if(!d||d.querySelector('.dbub'))return;const inner=d.innerHTML;d.innerHTML=`<span class="dbub" aria-label="Detail ${i+1} of sheet 05"><b>${i+1}</b><i>05</i></span><div class="ttl">${inner}</div>`;const k=d.querySelector('.kicker');if(k)k.textContent=`Detail ${i+1} · `+k.textContent});
}
(async()=>{const L=await Promise.all(EX.map(build));window.__PF=L;groups(L);holdings(L);journal(L);income(L);pricing(L);performance(L);reconcile(L);decisions(L);tabs()})();
})();
