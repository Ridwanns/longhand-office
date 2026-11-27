import {overviewPortfolioSummary,overviewReviewQueue,buildAlignedMarketComparison} from './overview-data.js';
import {validateOverviewFeed,OVERVIEW_MARKETS,overviewSession} from './overview-contract.js';
import {synchronizedQuarterlyRegime} from './quarterly-regime.js';
import {readNativePrices,selectNativePrice} from './native-prices.js';
import {validatePublicQuote} from './public-quote-contract.js';
import {marketComparisonChart,bindMarketComparison} from './overview-chart.js';
import {SCHEDULE_WINDOWS,FEATURE_WINDOWS,scheduleRow,sparkGeometry,deskFacts,featureChart,shortDate,longDate,monthYear} from './overview-desk.js';
import {deskModelMarkup,mountDeskModel,setRoomSubtitle} from './overview-model.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(x,d=2)=>Number.isFinite(x)?new Intl.NumberFormat('en-GB',{maximumFractionDigits:d,minimumFractionDigits:d}).format(x):'Unavailable';
const signed=(x,d=2)=>(x>0?'+':'')+num(x,d);
const labelDate=x=>x?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(x.slice(0,10)+'T00:00:00Z')):'Date unavailable';
const intradayTime=q=>{try{return new Intl.DateTimeFormat('en-US',{timeZone:q.exchangeTimezoneName||'America/New_York',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZoneName:'short'}).format(new Date(q.timestamp));}catch{return '';}};
let feedCache=null,feedPromise=null,mode='real',currencyChoice='',economy='IDN',range=90,ticket=0,stopSizing,stopModel,windowSessions=63,featureSessions=0,featured='macro:^JKSE';
const decimals=spec=>spec.category==='bonds'?2:0;
const pct=x=>Number.isFinite(x)?(x>0?'+':x<0?'\u2212':'')+num(Math.abs(x))+'%':'\u2014';
const tone=x=>x>0?'up':x<0?'dn':'flat';
const logo='<svg class="desk-logo" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#f3efe6"/><path d="M15.9 6.5 L20.3 9.2 C20.5 12.4 20.3 14.9 19.3 17.1 C18.5 18.9 17.3 20.8 16 23.1 C14.7 20.8 13.5 18.9 12.7 17.1 C11.7 14.9 11.5 12.4 11.6 9.4 Z" fill="#18332a"/></svg>';
const modeLabel=()=>mode==='real'?'Real':'Paper';
const groupRoute=()=>mode==='real'?'#portfolios/real':'#portfolios';
const tabs=(values,current,attr)=>values.map(([v,label])=>`<button type="button" ${attr}="${v}" aria-pressed="${String(v)===String(current)}">${label}</button>`).join('');
const section=(label,title,action)=>`<header class="command-section-head"><div><p class="eyebrow">${label}</p><h2>${title}</h2></div>${action||''}</header>`;
export function overviewAllocation(group,asOf){
 if(!group?.complete||!Number.isFinite(group.nav)||group.nav<=0)return '';
 const colors=['#81b7a2','#ce9d71','#8ea8cc','#b6a0c9','#c3b976','#7bb5bd'];
 const pieces=[...group.positions.map(p=>({name:p.symbol,value:p.marketValue})),{name:'Cash',value:group.cash}].filter(p=>Number.isFinite(p.value)&&p.value>0);
 if(!pieces.length)return '';
 let angle=-Math.PI/2;
 const slices=pieces.map((p,i)=>{const weight=p.value/group.nav,end=angle+weight*2*Math.PI,startX=120+102*Math.cos(angle),startY=120+102*Math.sin(angle),endX=120+102*Math.cos(end),endY=120+102*Math.sin(end),shape=weight>=1-1e-12?'<circle cx="120" cy="120" r="102"/>':`<path d="M120 120 L${startX} ${startY} A102 102 0 ${weight>0.5?1:0} 1 ${endX} ${endY} Z"/>`;angle=end;return `<g fill="${colors[i%colors.length]}"><title>${esc(p.name)}: ${num(weight*100)}%, ${num(p.value)} ${esc(group.currency)}</title>${shape}</g>`;}).join('');
 return `<section class="command-portfolio-pie" aria-label="Portfolio allocation"><div class="command-pie-visual"><svg viewBox="0 0 240 240" role="img" aria-label="Portfolio allocation in ${esc(group.currency)}, including cash"><title>Portfolio allocation · ${esc(group.currency)}</title>${slices}<circle class="command-pie-hole" cx="120" cy="120" r="70"/><text class="command-pie-label" x="120" y="108" text-anchor="middle">PORTFOLIO VALUE</text><text class="command-pie-total" x="120" y="135" text-anchor="middle">${num(group.nav)}</text><text class="command-pie-currency" x="120" y="154" text-anchor="middle">${esc(group.currency)}</text></svg></div><div class="command-pie-detail"><header><div><p class="eyebrow">YOUR ALLOCATION</p><h2>Portfolio composition</h2></div><a href="${groupRoute()}">View portfolio ↗</a></header><ul>${pieces.map((p,i)=>`<li><svg class="command-pie-dot" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="5" fill="${colors[i%colors.length]}"/></svg><strong>${esc(p.name)}</strong><span>${num(p.value)} <small>${esc(group.currency)}</small></span><b>${num(p.value/group.nav*100,1)}%</b></li>`).join('')}</ul><p class="command-pie-caption">${labelDate(asOf)} · Recorded values, including cash.</p></div></section>`;
}
export function commandCenterPage(asOf){return `<div class="command-center desk">
<div class="desk-stage"><div class="desk-lead"><header class="command-heading desk-hero"><p class="desk-kicker">Sheet 01 · Overview · <span data-desk-close>${labelDate(asOf)}</span></p><h1 data-desk-headline>IHSG at the close</h1><p class="desk-dek" data-desk-dek>Reading the published closes…</p></header>
<section class="desk-schedule desk-glass" aria-labelledby="desk-schedule-title"><header class="desk-schedule-head"><h2 class="desk-kicker" id="desk-schedule-title">Market schedule</h2><div class="desk-seg" role="group" aria-label="Schedule window">${tabs(SCHEDULE_WINDOWS,windowSessions,'data-desk-window')}</div></header><div class="desk-table-wrap"><table class="desk-table"><thead><tr><th scope="col">Market</th><th scope="col">Last</th><th scope="col">1D</th><th scope="col" data-desk-window-label>${SCHEDULE_WINDOWS.find(w=>w[0]===windowSessions)[1]}</th><th scope="col" class="desk-spark-col">Daily closes</th><th scope="col" class="desk-range-col">52-wk range</th></tr></thead><tbody data-command-prices role="status"><tr><td colspan="6">Reading published prices…</td></tr></tbody></table></div><p class="desk-asof" data-desk-asof>Daily closes, completed sessions only. Not real time.</p></section></div>
<figure class="desk-model">${deskModelMarkup({research:'Research Lab',records:'Records & backups',screen:'Markets',portfolio:'Portfolios'})}<figcaption class="desk-titleblock desk-glass"><div><small>Project</small><strong>${logo}Longhand Office</strong></div><div><small>Sheet</small><strong>01 Overview</strong></div><div><small>Data</small><strong data-desk-data-date>${labelDate(asOf)}</strong></div><div><small>Sources</small><strong><a href="#data-sources">Yahoo Finance · US Treasury · official releases</a></strong></div></figcaption></figure></div>
<section class="desk-feature desk-glass" aria-labelledby="desk-feature-title"><header class="desk-feature-head"><div class="desk-feature-title"><p class="desk-kicker" data-desk-feature-kicker>Featured · daily closes</p><h2 id="desk-feature-title" data-desk-feature-name>IHSG</h2></div><div class="desk-stat"><small>Last close</small><b data-desk-feature-last>—</b></div><div class="desk-stat"><small data-desk-feature-window-label>Change</small><b data-desk-feature-change>—</b></div><div class="desk-stat"><small>From window high</small><b data-desk-feature-high>—</b></div><div class="desk-seg" role="group" aria-label="Featured chart window">${tabs(FEATURE_WINDOWS,featureSessions,'data-desk-feature-window')}</div></header><div class="desk-feature-chart" data-desk-feature-chart></div><p class="desk-readout" data-desk-readout aria-live="polite">Point at the chart to read a date. Choose a market in the schedule to feature it here.</p></section>
<section class="desk-cards" aria-label="Rates, macro regime and portfolio"><article class="desk-card desk-glass" data-desk-rates><p class="desk-kicker">Rates · US Treasury par yields · <span data-desk-ust-date>—</span></p><h2 data-desk-ust-head>Reading the Treasury curve…</h2><div class="desk-spread"><b data-desk-spread>—</b><span>10-year minus 2-year</span></div><div class="desk-curve-box" data-desk-curve></div></article><article class="desk-card desk-glass"><div class="desk-card-head"><p class="desk-kicker" data-desk-regime-kicker>Macro regime</p><div class="desk-seg" role="group" aria-label="Macro economy">${tabs([['IDN','Indonesia'],['USA','United States']],economy,'data-command-economy')}</div></div><div data-command-regime role="status"><p class="command-regime-reading">Reading comparable economic releases…</p></div><a class="desk-go" data-command-macro-link href="#macro">Open Macro →</a></article><article class="desk-card desk-glass"><p class="desk-kicker">Portfolio · room 02</p><h2 data-desk-vault-head>Nothing in the vault yet.</h2><div class="desk-vault-row"><div class="desk-crop" data-desk-crop aria-hidden="true"></div><div><p data-desk-vault-text>No Real or Paper portfolio is recorded in this workspace. Value, P&amp;L and allocation appear here once one is.</p><a class="desk-go" data-desk-vault-link href="#portfolios">Record a portfolio →</a></div></div></article></section>
<div class="desk-grid"><section class="command-panel command-markets">${section('MARKET INTELLIGENCE','Price comparison','<a href="#markets">Markets ↗</a>')}<div class="command-comparison-heading"><span>Price change <small>common dates</small></span><div class="command-tabs" role="group" aria-label="Market comparison range">${tabs([[30,'1M'],[90,'3M'],[365,'1Y']],range,'data-command-range')}</div></div><div data-command-comparison></div><div class="command-context-row" data-command-context></div></section>
</div>
<section class="command-portfolio desk-vault" aria-labelledby="desk-vault-title"><header><div class="desk-vault-title"><p class="desk-kicker">Portfolio · room 02</p><h2 id="desk-vault-title">Your vault</h2></div><div class="command-tabs" role="group" aria-label="Portfolio group">${tabs([['real','Real'],['paper','Paper']],mode,'data-command-mode')}</div><label class="command-currency">Currency<select data-command-currency aria-label="Portfolio summary currency"><option>Not selected</option></select></label><span class="command-subtle">Recorded valuations · ${labelDate(asOf)}</span></header><div data-command-summary></div></section>
<div class="desk-lower"><section class="command-panel command-allocation-panel command-composition"><div data-command-allocation></div></section><section class="command-panel command-risk">${section('PORTFOLIO OVERSIGHT','Risk and decisions','<a href="#decisions">Journal ↗</a>')}<div data-command-risk></div><div data-command-reviews></div></section></div>
<footer class="command-footer"><p data-command-data-status role="status">Checking published observations…</p><nav aria-label="Workspace information"><a href="#data-sources">Data Sources</a><a href="#records">Records</a><a href="#about">About Longhand</a></nav></footer></div>`;}
function renderPrivate(root,data,asOf){
 const summary=overviewPortfolioSummary(data,asOf,mode),groups=summary.groups;
 if(!groups.some(g=>g.currency===currencyChoice))currencyChoice=groups.find(g=>g.currency==='IDR')?.currency||groups[0]?.currency||'';
 const group=groups.find(g=>g.currency===currencyChoice),select=root.querySelector('[data-command-currency]');select.innerHTML=groups.length?groups.map(g=>`<option value="${esc(g.currency)}" ${g.currency===currencyChoice?'selected':''}>${esc(g.currency)}</option>`).join(''):'<option value="">No portfolios</option>';select.disabled=groups.length<2;
 root.querySelectorAll('[data-command-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.commandMode===mode)));
 const count=groups.reduce((n,g)=>n+g.portfolioCount,0);setRoomSubtitle(root,'portfolio',count?count+' '+modeLabel()+' portfolio'+(count===1?'':'s'):modeLabel()+' portfolio · empty');
 const reviews=overviewReviewQueue(data,asOf),due=reviews.filter(r=>r.due),largest=group?.largestPosition;
 // the preview's portfolio card: both groups counted, the selected group's value when it is complete
 const real=overviewPortfolioSummary(data,asOf,'real').groups.reduce((n,g)=>n+g.portfolioCount,0),paper=overviewPortfolioSummary(data,asOf,'paper').groups.reduce((n,g)=>n+g.portfolioCount,0),vaultHead=root.querySelector('[data-desk-vault-head]');
 if(vaultHead){const total=real+paper,text=root.querySelector('[data-desk-vault-text]'),link=root.querySelector('[data-desk-vault-link]');
  if(!total){vaultHead.textContent='Nothing in the vault yet.';text.textContent='No Real or Paper portfolio is recorded in this workspace. Value, P&L and allocation appear here once one is.';link.textContent='Record a portfolio \u2192';link.href='#portfolios';}
  else{vaultHead.textContent=`${real} Real and ${paper} Paper portfolio${total===1?'':'s'} in the vault.`;text.textContent=group?.nav!==null&&group?.nav!==undefined?`${modeLabel()} NAV ${num(group.nav)} ${group.currency}; ${group.completeCount} of ${group.portfolioCount} fully valued. Groups and currencies are kept apart.`:'Value, P&L and allocation appear once every holding has a price and the cash balance is known.';link.textContent='Open portfolios \u2192';link.href=groupRoute();}}
 const item=(title,value,detail,extra='')=>`<article><h3>${title}</h3><strong ${extra}>${value}</strong><p>${detail}</p></article>`;
 root.querySelector('[data-command-summary]').innerHTML='<div class="command-kpis">'+item(modeLabel()+' portfolio NAV',group?.nav!==null&&group?.nav!==undefined?`${num(group.nav)} <small>${esc(group.currency)}</small>`:group?'Needs valuation':'No '+modeLabel()+' records',group?`${group.completeCount} of ${group.portfolioCount} portfolios fully valued`:`<a href="${groupRoute()}">Add your portfolio ↗</a>`)+item('Unrealized P&L',group?.unrealizedPnl!==null&&group?.unrealizedPnl!==undefined?`${signed(group.unrealizedPnl)} <small>${esc(group.currency)}</small>`:'Not calculated',group?.unrealizedPnl!==null&&group?.unrealizedPnl!==undefined?'Open positions against recorded cost':'Requires complete prices and matching currency')+item('Largest holding',largest?`${num(largest.weight*100,1)}<small>%</small>`:'Not calculated',largest?esc(largest.symbol)+' of selected-currency NAV':group?.complete&&group.positionCount===0?'Cash only. No open holdings.':'Requires a fully valued portfolio')+item('Reviews due',String(due.length),due.length?`<a href="${esc(due[0].href)}">${esc(due[0].title)} ↗</a>`:'No overdue or due reviews')+'</div>'+(group?.incompleteCount?'<p class="command-inline-note">'+group.incompleteCount+' '+modeLabel()+' portfolio(s) need prices, matching currency or a known cash balance. Totals are withheld.</p>':'');
 root.querySelector('[data-command-allocation]').innerHTML=overviewAllocation(group,asOf)||'<h2>Portfolio composition</h2><p class="command-empty">'+(group?'Complete recorded prices and cash to see your allocation.':'Add '+modeLabel()+' records to see your allocation.')+' <a href="'+groupRoute()+'">Open portfolios ↗</a></p>';
 root.querySelector('[data-command-risk]').innerHTML=group?.positions?.length&&group.nav!==null?'<div class="command-allocation"><h3>Recorded allocation <span>'+esc(group.currency)+'</span></h3><ul>'+[...group.positions].sort((a,b)=>b.weight-a.weight).slice(0,4).map(p=>'<li><span>'+esc(p.symbol)+'</span><meter min="0" max="1" value="'+p.weight+'" aria-label="'+esc(p.symbol)+' weight"></meter><strong>'+num(p.weight*100,1)+'%</strong></li>').join('')+'</ul><p>Weights include recorded cash in NAV. Historical risk studies are in <a href="#quant/section/research">Research Lab</a>.</p></div>':'<p class="command-empty">'+(group?.complete&&group.positionCount===0?'Cash only. No open holdings.':group?'Allocation is available after all holdings are valued.':'Add '+modeLabel()+' records to see your allocation.')+' <a href="'+groupRoute()+'">Open portfolios ↗</a></p>';
 root.querySelector('[data-command-reviews]').innerHTML='<h3 class="command-small-heading">Next reviews</h3>'+(reviews.length?'<ul class="command-review-list">'+reviews.slice(0,3).map(r=>'<li><a href="'+esc(r.href)+'">'+esc(r.title)+'</a><span class="'+(r.due?'command-due':'')+'">'+(r.due?'Due ':'')+labelDate(r.reviewDate)+'</span></li>').join('')+'</ul>':'<p class="command-empty">No scheduled reviews. <a href="#decisions">Record a decision ↗</a></p>');
}
function renderMarkets(root,quotes){
 const published=i=>feedCache.markets[i]?.quote,history=i=>published(i)?overviewSession(published(i)).history:[];
 root.querySelector('[data-desk-window-label]').textContent=SCHEDULE_WINDOWS.find(w=>w[0]===windowSessions)[1];
 root.querySelectorAll('[data-desk-window]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.deskWindow)===windowSessions)));
 const body=root.querySelector('[data-command-prices]');body.classList.toggle('desk-enter',!body.dataset.filled);body.dataset.filled='1';
 body.innerHTML=OVERVIEW_MARKETS.map((spec,i)=>{const item=quotes[i],q=item?.quote,key=spec.category+':'+spec.symbol,name=`<th scope="row"><a class="desk-market" href="${spec.route}">${esc(spec.label)}</a><span class="desk-unit">${esc(q?.unit||'')}</span></th>`;
  if(!q)return `<tr class="command-market-card desk-unavailable">${name}<td colspan="5">Unavailable</td></tr>`;
  const stale=Date.now()-Date.parse(q.timestamp)>7*86400000,session=overviewSession(q),row=scheduleRow(history(i),windowSessions),spark=row&&sparkGeometry(row.spark,120,32),d=decimals(spec);
  return `<tr class="command-market-card${key===featured?' is-featured':''}" data-desk-row="${key}">${name}<td class="desk-last-cell"><strong class="desk-last">${num(q.price,q.price>=1000?0:2)}</strong><time datetime="${esc(q.timestamp)}">${labelDate(q.marketDate||q.timestamp)}${session.intraday?' · '+esc(('Intraday '+intradayTime(q)).trim().replaceAll(' ',' ')):''}${stale?' · Older observation':''}</time></td><td class="desk-chg ${q.change?tone(q.change.percent):''}">${q.change?`${pct(q.change.percent)}<small>vs ${shortDate(q.change.referenceDate)}</small>`:'<small>Change unavailable</small>'}</td><td class="desk-chg ${row?tone(row.windowChange):''}">${row?pct(row.windowChange)+(row.windowComplete?'':'<small>since '+shortDate(row.windowStart.date)+'</small>'):'—'}</td><td class="desk-spark-col">${spark?`<button type="button" class="desk-spark" data-desk-feature-key="${key}" aria-pressed="${key===featured}" aria-label="Feature ${esc(spec.label)}: closes ${longDate(row.windowStart.date)} to ${longDate(row.last.date)}"><svg viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true"><path class="desk-spark-line ${tone(row.windowChange)}" d="${spark.d}"/><circle class="desk-spark-dot ${tone(row.windowChange)}" cx="${spark.end.x}" cy="${spark.end.y.toFixed(1)}" r="2.4"/></svg></button>`:''}</td><td class="desk-range-col">${row?`<div class="desk-rbar" data-desk-position="${row.position.toFixed(4)}" title="Range of the last ${row.rangeSessions} completed sessions"><i></i></div><div class="desk-rlab"><span>${num(row.low.close,d)}</span><span>${num(row.high.close,d)}</span></div>`:''}</td></tr>`;}).join('');
 // CSP-safe positioning: the range marker is placed through the CSSOM, never an inline style attribute.
 root.querySelectorAll('[data-desk-position]').forEach(bar=>{bar.querySelector('i').style.left=`calc(${(Number(bar.dataset.deskPosition)*100).toFixed(1)}% - 1px)`;});
 const ihsg=history(0),spx=history(1),facts=deskFacts(ihsg,spx,history(3)),dekNode=root.querySelector('[data-desk-dek]');
 if(facts){const f=facts,off=x=>x&&Number.isFinite(x.value)?num(x.value,1)+'%':null,spxOff=off(f.spx),goldOff=off(f.gold);
  const lowNote=f.low.date>f.high.date?(f.sessionsSinceLow===0?', and this is its lowest close since that high. ':`, ${f.sessionsSinceLow} session${f.sessionsSinceLow===1?'':'s'} after its lowest close (${num(f.low.close,0)} on ${shortDate(f.low.date)}). `):'. ';
  // the preview's headline: the distance from the peak, the figure underlined with the nib's wave
  const month=d=>['January','February','March','April','May','June','July','August','September','October','November','December'][Number(d.slice(5,7))-1]+(d.slice(0,4)!==f.last.date.slice(0,4)?' '+d.slice(0,4):'');
  root.querySelector('[data-desk-headline]').innerHTML=f.belowHigh<0.5?`IHSG is at its <span class="fig">highest</span> close since ${monthYear(f.first.date)}.`:`IHSG is <span class="fig">${Math.round(f.belowHigh)}%</span> below its ${month(f.high.date)} peak.`;
  const lowPart=f.low.date>f.high.date?`, ${f.sessionsSinceLow===0?'its lowest close in the published history':f.sessionsSinceLow+' session'+(f.sessionsSinceLow===1?'':'s')+' after its lowest close in the published history ('+num(f.low.close,0)+' on '+shortDate(f.low.date)+')'}`:'';
  dekNode.innerHTML=`It closed at <b>${num(f.last.close,0)}</b> on ${shortDate(f.last.date)}, ${f.move>=0?'up':'down'} ${num(Math.abs(f.move))}%${lowPart}. The peak was ${num(f.high.close,0)} on ${shortDate(f.high.date)}`+(f.high.date.slice(0,4)!==f.last.date.slice(0,4)?' '+f.high.date.slice(0,4):'')+`. `+(spxOff&&goldOff?`For scale: the S&amp;P 500 is ${spxOff} off its high, gold ${goldOff}.`:'');}
 else dekNode.textContent='The published IHSG history is unavailable, so no summary is computed.';
 const j=ihsg.at(-1)?.date,u=spx.at(-1)?.date;root.querySelector('[data-desk-close]').textContent=j&&u?(j===u?'close of '+labelDate(j):'IDX close '+labelDate(j)+' · US close '+labelDate(u)):'publication '+labelDate(feedCache.marketPublishedAt);
 if(j||u)root.querySelector('[data-desk-data-date]').textContent=labelDate([j,u].filter(Boolean).sort().at(-1));
 root.querySelector('[data-desk-asof]').textContent=`Daily closes from the Overview publication of ${labelDate(feedCache.marketPublishedAt)}, completed sessions only. “Last” is the latest source price, marked Intraday while its session was trading. Not real time.`+(root._liveAt?` On this computer “Last” is re-read from the source every minute while this page is open; last read ${new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(root._liveAt)}. The time under each price is the source's own.`:'');
 setRoomSubtitle(root,'screen',feedCache.markets.filter(m=>m.quote).length+' markets on the schedule');
 renderFeature(root);
 // The comparison plots closes, so a bar still trading at retrieval is left out.
 const eligible=feedCache.markets.filter(m=>m.quote).map(m=>({m,observations:overviewSession(m.quote).history})).filter(({observations})=>Date.now()-Date.parse(observations.at(-1)?.date)>0&&Date.now()-Date.parse(observations.at(-1)?.date)<7*86400000).map(({m,observations})=>({key:m.category+':'+m.symbol,label:OVERVIEW_MARKETS.find(s=>s.category===m.category&&s.symbol===m.symbol).label,observations}));
 const end=eligible.flatMap(s=>s.observations).map(o=>o.date).sort().at(-1),start=end?new Date(Date.parse(end)-range*86400000).toISOString().slice(0,10):undefined,result=buildAlignedMarketComparison(eligible,{start});
 const target=root.querySelector('[data-command-comparison]');
 // Name the real reason: when every series is older than a week the problem is the snapshot's age, not the selection.
 const newest=feedCache.markets.filter(m=>m.quote).map(m=>overviewSession(m.quote).history.at(-1)?.date).filter(Boolean).sort().at(-1);
 const reason=eligible.length<2&&newest?'The latest published closes ('+labelDate(newest)+') are more than a week old. Refresh the market data to compare them.':result.reason||'At least two current series are required.';
 target.innerHTML=result.available&&result.series.length>=2?marketComparisonChart(result,target.clientWidth):'<p class="command-empty">Comparable source history is unavailable. '+esc(reason)+'</p>';
 if(result.available&&result.series.length>=2)bindMarketComparison(target,result);
 root.querySelector('[data-command-context]').innerHTML=feedCache.context.filter(c=>!feedCache.yieldCurve||c.key!=='UST10Y').map(c=>'<a href="'+(c.key==='UST10Y'?'#market/bonds':'#market/macro/id/markets')+'"><span>'+esc(c.label)+'</span><strong>'+num(c.value,c.key==='USDIDR'?0:2)+' <small>'+esc(c.unit)+'</small></strong><time>'+labelDate(c.date)+'</time></a>').join('');
 root.querySelectorAll('[data-command-range]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.commandRange)===range)));
 renderRates(root);
}
function renderFeature(root){
 const target=root.querySelector('[data-desk-feature-chart]');if(!target||!feedCache)return;
 const index=Math.max(0,OVERVIEW_MARKETS.findIndex(s=>s.category+':'+s.symbol===featured)),spec=OVERVIEW_MARKETS[index],q=feedCache.markets[index]?.quote,d=decimals(spec);
 root.querySelectorAll('[data-desk-feature-window]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.deskFeatureWindow)===featureSessions)));
 root.querySelectorAll('[data-desk-feature-key]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.deskFeatureKey===featured)));
 root.querySelectorAll('[data-desk-row]').forEach(r=>r.classList.toggle('is-featured',r.dataset.deskRow===featured));
 root.querySelector('[data-desk-feature-name]').textContent=spec.label;
 const chart=q&&featureChart(overviewSession(q).history,featureSessions,target.clientWidth||900,{decimals:d,label:spec.label});
 if(!chart){target.innerHTML='<p class="command-empty">No published daily closes for this market.</p>';return;}
 target.innerHTML=chart.svg;
 const set=(k,v,cls)=>{const e=root.querySelector(`[data-desk-feature-${k}]`);e.textContent=v;if(cls!==undefined)e.className=cls;};
 set('kicker',`Featured · ${chart.points.length} daily closes · ${longDate(chart.first.date)} to ${longDate(chart.last.date)}`);
 set('last',num(chart.last.close,d));set('window-label',featureSessions?FEATURE_WINDOWS.find(w=>w[0]===featureSessions)[1]+' change':'Since '+monthYear(chart.first.date));
 set('change',pct(chart.change),tone(chart.change));set('high',num(chart.fromHigh,1)+'%',chart.fromHigh<0?'dn':'flat');
 const svg=target.querySelector('svg'),line=svg.querySelector('.desk-crosshair'),dot=svg.querySelector('.desk-crosshair-dot'),readout=root.querySelector('[data-desk-readout]'),c=chart.points;
 const read=e=>{const box=svg.getBoundingClientRect(),px=(e.clientX-box.left)/box.width*chart.W,i=Math.round(Math.min(1,Math.max(0,(px-chart.L)/(chart.R-chart.L)))*(c.length-1)),x=chart.X(i),y=chart.Y(c[i].close),peak=Math.max(...c.slice(0,i+1).map(r=>r.close));
  line.setAttribute('x1',x);line.setAttribute('x2',x);dot.setAttribute('cx',x);dot.setAttribute('cy',y);svg.classList.add('inspecting');
  readout.innerHTML=`<span>${longDate(c[i].date)}</span><span>close <b>${num(c[i].close,d)}</b></span><span>vs window start <b class="${tone(c[i].close/c[0].close-1)}">${pct((c[i].close/c[0].close-1)*100)}</b></span><span>from running high <b class="${c[i].close<peak?'dn':'flat'}">${num((c[i].close/peak-1)*100,1)}%</b></span>`;};
 svg.addEventListener('pointermove',read);svg.addEventListener('pointerdown',read);svg.addEventListener('pointerleave',()=>svg.classList.remove('inspecting'));
}
const MONTH_SHORT=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];
const QUAD_TEXT={1:'growth up, inflation easing',2:'growth up, inflation rising',3:'growth down, inflation rising',4:'growth down, inflation easing'};
function renderMacro(root){
 root.querySelectorAll('[data-command-economy]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.commandEconomy===economy)));
 const readings=feedCache.macro.find(m=>m.country===economy).readings.map(r=>({...r,item:r.items.find(s=>s.latest&&!s.error)})),r=synchronizedQuarterlyRegime(readings),name=economy==='IDN'?'Indonesia':'United States',tag=economy==='IDN'?'ID':'US';
 root.querySelector('[data-desk-regime-kicker]').textContent='Macro regime · '+name+(r.available?' · matched quarter '+r.period:'');
 // the preview's rows: the national release series behind the regime (latest reported values, oldest first)
 const pick=k=>readings.find(x=>x.key===k)?.item,obs=(it,n)=>(it?.observations||[]).filter(o=>Number.isFinite(o.value)).slice(-n);
 const g=obs(pick('gdp'),3),c=obs(pick('inflation'),2),policy=pick('policy'),q=d=>'Q'+(Math.floor((Number(d.slice(5,7))-1)/3)+1),m=d=>MONTH_SHORT[Number(d.slice(5,7))-1];
 const cells=[[3,'growth down · inflation up'],[2,'growth up · inflation up'],[4,'growth down · inflation down'],[1,'growth up · inflation down']];
 root.querySelector('[data-command-regime]').innerHTML=`<h2>${r.available?(r.quad?`Quad ${r.quad}: ${QUAD_TEXT[r.quad]}.`:'On an axis: one rate is unchanged.'):'No comparable quarter yet.'}</h2><div class="desk-quad">${cells.map(([n,t])=>`<div class="${r.available&&r.quad===n?'on':''}"><b>QUAD ${n}${r.available&&r.quad===n?' · '+tag:''}</b>${t}</div>`).join('')}</div><div class="desk-gdp command-regime-reading">${g.length?`<div><small>GDP ${g.map(o=>q(o.date)).join(' → ')}</small><strong>${g.map((o,i)=>i===g.length-1&&g.length>1?`<span class="${o.value>=g.at(-2).value?'up':'dn'}">${num(o.value)}%</span>`:num(o.value)+(i===g.length-1?'%':'')).join(' → ')}</strong></div>`:''}${c.length?`<div><small>CPI ${c.map(o=>m(o.date)).join(' → ')}</small><strong>${c.map((o,i)=>num(o.value)+(i===c.length-1?'%':'')).join(' → ')}</strong></div>`:''}${policy?.latest&&Number.isFinite(policy.latest.value)?`<div><small>${economy==='IDN'?'BI rate':'Policy rate'}</small><strong>${num(policy.latest.value)}%</strong></div>`:''}</div>${r.available?'':'<p class="command-empty">'+esc(r.reason)+'</p>'}`;
}
// the preview's rates card: a sentence for the curve's shape, the 10Y - 2Y spread and the curve, tenors spaced by square root of years
function renderRates(root){
 const c=feedCache.yieldCurve,box=root.querySelector('[data-desk-curve]');if(!box)return;
 if(!c){root.querySelector('[data-desk-ust-head]').textContent='The Treasury curve is unavailable.';box.innerHTML='';return;}
 const pts=c.points.filter(p=>Number.isFinite(p.value)),at=y=>pts.find(p=>p.years===y)?.value,sp=c.spreadBp;
 root.querySelector('[data-desk-ust-date]').textContent=labelDate(c.date);
 root.querySelector('[data-desk-ust-head]').textContent=!Number.isFinite(sp)?'Not every tenor is published for this date.':sp>0?(at(30)!=null&&at(20)!=null&&at(30)<at(20)?'Upward sloping to 20 years, slightly lower at 30.':'The curve is upward sloping beyond two years.'):sp<0?'The 2-to-10-year curve is inverted.':'The 2-to-10-year curve is flat.';
 const spread=root.querySelector('[data-desk-spread]');spread.textContent=Number.isFinite(sp)?(sp>0?'+':sp<0?'−':'')+Math.abs(sp)+' bp':'—';spread.className=sp>=0?'up':'dn';
 if(pts.length<2){box.innerHTML='';return;}
 const W=Math.max(260,Math.round(box.clientWidth||520)),H=190,vals=pts.map(p=>p.value),mn=Math.floor((Math.min(...vals)-.15)*10)/10,mx=Math.ceil((Math.max(...vals)+.15)*10)/10,X=y=>44+Math.sqrt(y/30)*(W-70),Y=v=>160-(v-mn)/(mx-mn)*140,ticks=[0,1,2].map(i=>Math.round((mn+(mx-mn)*(i+.5)/3)*10)/10);
 box.innerHTML=`<svg class="desk-curve" viewBox="0 0 ${W} ${H}" role="img" aria-label="US Treasury par yield curve on ${labelDate(c.date)}"><g class="desk-curve-axis">${ticks.map(v=>`<line x1="44" x2="${W-10}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text x="0" y="${(Y(v)+3).toFixed(1)}">${v.toFixed(1)}%</text>`).join('')}</g><path class="desk-curve-line" d="${pts.map((p,i)=>(i?'L':'M')+X(p.years).toFixed(1)+' '+Y(p.value).toFixed(1)).join('')}"/>${pts.map(p=>`<circle cx="${X(p.years).toFixed(1)}" cy="${Y(p.value).toFixed(1)}" r="3.5"/><text class="desk-curve-value" x="${X(p.years).toFixed(1)}" y="${(Y(p.value)-10).toFixed(1)}" text-anchor="middle">${p.value.toFixed(2)}</text><text class="desk-tenor" x="${X(p.years).toFixed(1)}" y="184" text-anchor="middle">${p.years}Y</text>`).join('')}<text x="${W-10}" y="14" text-anchor="end">tenor axis: square root of years</text></svg>`;
}
// the vault room, cropped from the finished model (the portfolio anchor), as on the preview's portfolio card
function vaultCrop(root){
 const crop=root.querySelector('[data-desk-crop]');if(!crop)return;const theme=document.documentElement.dataset.theme==='dark'?'dark':'light',ax=0.6013+0.035,ay=0.6952-0.075;
 crop.style.backgroundImage=`url("${new URL('./model/build-'+theme+'-final.webp',import.meta.url).href}")`;crop.style.backgroundSize='400% auto';
 crop.style.backgroundPosition=`${((4*ax-0.5)/3*100).toFixed(2)}% ${(((8/3)*ay-0.5)/(5/3)*100).toFixed(2)}%`;
}

async function readFeed(){if(feedCache)return feedCache;if(!feedPromise)feedPromise=(async()=>{const response=await fetch(new URL('./data/overview.json',import.meta.url),{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Overview publication unavailable.');const text=await response.text();if(text.length>1200000)throw Error('Overview publication exceeds limit.');return feedCache=validateOverviewFeed(JSON.parse(text));})().finally(()=>{feedPromise=null;});return feedPromise;}
// Local edition only: while the Overview is open and visible, the four headline prices are re-read every minute through
// the local server's own source read (/api/market/category/price). A quote replaces the shown one only when its source
// time is newer (selectNativePrice), and every quote is validated first. Charts keep plotting completed closes only.
// The Pages edition has no local server, so it never polls.
export const LIVE_PRICE_MS=60000;
const localEdition=()=>typeof location!=='undefined'&&['127.0.0.1','localhost'].includes(location.hostname);
let stopLive=null;
export async function readLiveQuote(market,{fetcher=fetch}={}){
 const r=await fetcher('/api/market/category/price?category='+encodeURIComponent(market.category)+'&symbol='+encodeURIComponent(market.symbol),{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('Live source read unavailable (HTTP '+r.status+').');
 const quote=await r.json();validatePublicQuote(quote,market.category,market.symbol,quote.retrievedAt);
 return {generatedAt:quote.retrievedAt,quotes:{[market.category+':'+market.symbol]:{quote}}};
}
function startLivePrices(root,own){
 stopLive?.();if(!localEdition())return;
 let busy=false;
 const tick=async()=>{
  if(!root.isConnected||own!==ticket){stop();return;}
  if(document.hidden||busy||!feedCache)return;busy=true;
  try{
   const current=root._quotes||feedCache.markets;
   const next=await Promise.all(feedCache.markets.map(async(m,i)=>{try{return selectNativePrice(current[i],await readLiveQuote(m),m.category,m.symbol).item;}catch{return current[i];}}));
   if(root.isConnected&&own===ticket){root._quotes=next;root._liveAt=Date.now();renderMarkets(root,next);}
  }finally{busy=false;}
 };
 const onVisible=()=>{if(!document.hidden)tick();};
 const timer=setInterval(tick,LIVE_PRICE_MS);document.addEventListener('visibilitychange',onVisible);
 const stop=()=>{clearInterval(timer);document.removeEventListener('visibilitychange',onVisible);if(stopLive===stop)stopLive=null;};
 stopLive=stop;tick();
}
export async function mountCommandCenter(data,asOf){
 const root=document.querySelector('.command-center');if(!root)return;const own=++ticket;
 stopSizing?.();stopModel?.();stopModel=mountDeskModel(root);vaultCrop(root);
 const cropTheme=new MutationObserver(()=>{if(!root.isConnected){cropTheme.disconnect();return;}vaultCrop(root);});cropTheme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 let lastWidth=0,resizeFrame;
 const sizing=new ResizeObserver(entries=>{const width=Math.round(entries[0].contentRect.width);if(!root.isConnected){sizing.disconnect();return;}if(width===lastWidth)return;lastWidth=width;cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(root.isConnected&&feedCache)renderMarkets(root,root._quotes||feedCache.markets);});});sizing.observe(root.querySelector('[data-command-comparison]'));
 stopSizing=()=>{sizing.disconnect();cancelAnimationFrame(resizeFrame);};
 renderPrivate(root,data,asOf);
 root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-command-mode')){mode=b.dataset.commandMode;currencyChoice='';renderPrivate(root,data,asOf);}if(b.hasAttribute('data-command-economy')&&feedCache){economy=b.dataset.commandEconomy;renderMacro(root);}if(b.hasAttribute('data-command-range')&&feedCache){range=Number(b.dataset.commandRange);renderMarkets(root,root._quotes||feedCache.markets);}if(b.hasAttribute('data-desk-window')&&feedCache){windowSessions=Number(b.dataset.deskWindow);renderMarkets(root,root._quotes||feedCache.markets);}if(b.hasAttribute('data-desk-feature-window')&&feedCache){featureSessions=Number(b.dataset.deskFeatureWindow);renderFeature(root);}if(b.hasAttribute('data-desk-feature-key')&&feedCache){featured=b.dataset.deskFeatureKey;renderFeature(root);}});
 root.addEventListener('click',e=>{const row=e.target.closest('[data-desk-row]');if(!row||e.target.closest('a,button')||!feedCache)return;featured=row.dataset.deskRow;renderFeature(root);});
 root.querySelector('[data-command-currency]').addEventListener('change',e=>{currencyChoice=e.target.value;renderPrivate(root,data,asOf);});
 try{await readFeed();if(!root.isConnected||own!==ticket)return;renderMarkets(root,feedCache.markets);renderMacro(root);root.querySelector('[data-command-data-status]').textContent='Dated source snapshots. Market publication '+labelDate(feedCache.marketPublishedAt)+'.';
  const quotes=await Promise.all(feedCache.markets.map(async m=>selectNativePrice(m,await readNativePrices(m.category,m.symbol),m.category,m.symbol).item));if(root.isConnected&&own===ticket){root._quotes=quotes;renderMarkets(root,quotes);startLivePrices(root,own);}
 }catch{if(!root.isConnected)return;root.querySelector('[data-command-prices]').innerHTML='<p class="command-empty">Published market data unavailable. <a href="#market/us">Open Markets</a></p>';root.querySelector('[data-command-regime]').textContent='Macro publication unavailable. No regime inferred.';root.querySelector('[data-command-data-status]').textContent='Source publication could not be loaded. Your records remain available.';}
}
