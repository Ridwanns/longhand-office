import {studyDestination,studyThesisSeed} from './workflow-continuity.js';
import {mountMarketDataLab,selectedMarketSource} from './market-data-ui.js';
import {captureResearchAction} from './research-intent.js';
import {RESEARCH_VIEWS,runFromRoute,viewForJump,viewFromRoute,researchRoute,takeMarketInstrument,researchIndex,researchDate} from './research-layout.js';
import {api} from './office-storage.js';
import {listTickerStudies} from './ticker-storage.js';
import {savedAutoValuations} from './auto-valuation-ui.js';
import {listAdvancedStudies} from './advanced-storage.js';
import {continuityList} from './continuity-store.js';
import {syncWorkspaceShell} from './workspace-shell.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={core:'Core analysis',advanced:'Advanced study',predictions:'Registered forecast',valuations:'Company valuation',manual:'Manual study',tickers:'Ticker research'};
let root,observer,frame,readTicket=0,index=[];
const panel=view=>root?.querySelector('[data-lab-pane="'+view+'"]');
const routeView=route=>!/\/view\/|^quant\/section\//.test(route)&&Object.hasOwn(RESEARCH_VIEWS,history.state?.researchView)?history.state.researchView:viewFromRoute(route);
export function showResearchView(view,{push=false,focus=false}={}){
 if(!root?.isConnected||!Object.hasOwn(RESEARCH_VIEWS,view))return;
 const previous=root.dataset.labView;
 if(push){root._missingStudy=null;const route=researchRoute(location.hash.slice(1),view);if(location.hash!=='#'+route){history.replaceState({...history.state,researchView:root.dataset.labView},'',location.href);history.pushState({researchView:view},'',location.pathname+location.search+'#'+route);}syncWorkspaceShell(route);}
 root.dataset.labView=view;
 root.querySelectorAll('[data-lab-pane]').forEach(p=>p.hidden=p.dataset.labPane!==view);
 root.querySelectorAll('a[data-lab-view]').forEach(a=>{if(a.dataset.labView===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');a.href='#'+researchRoute(location.hash.slice(1),a.dataset.labView);});
 root.querySelector('#research-view-menu').value=view;
 const locationLabel=document.querySelector('#office-location');if(locationLabel)locationLabel.textContent=RESEARCH_VIEWS[view];
 if(view==='valuation')root.querySelector('[data-atlas-view=automatic]')?.click();
 if(view==='tools'&&root.querySelector('#atlas-calculator').hidden&&root.querySelector('#atlas-reference').hidden)root.querySelector('[data-atlas-view=calculator]')?.click();
 if(view==='saved')readSavedResearch();
 if(focus){const title=panel(view).querySelector('.lab-section-title');title.focus({preventScroll:true});title.scrollIntoView({block:'start',behavior:'auto'});}
 drawContext();
 if(previous!==view&&view==='models')root.querySelector('#advanced-view')?.dispatchEvent(new Event('change',{bubbles:true}));
}
export function retainResearchLab(route){
 if(!root?.isConnected||!route.startsWith('quant')||studyDestination(route))return false;
 if(selectedMarketSource(route)!==(root.dataset.marketSourceHash||''))return false;
 if(runFromRoute(route)!==(root.querySelector('#quant-run')?.dataset.id||''))return false;
 // An explicit legacy run link must recover its own results after another retained
 // ticker hid the prior model panel, or an independently opened advanced study.
 if(/^quant\/run\/[^/]+$/.test(route)&&(root.querySelector('#quant-results').hidden||root.querySelector('#advanced-output')?._study?.sourceRunId&&root.querySelector('#advanced-output')._study.sourceRunId!==runFromRoute(route)))return false;
 showResearchView(routeView(route),{focus:true});return true;
}
export function releaseResearchLab(){observer?.disconnect();cancelAnimationFrame(frame);readTicket++;root=null;index=[];}
function move(selector,view){const el=root.querySelector(selector);if(el)panel(view).append(el);return el;}
export function mountResearchLab(route){
 const next=document.querySelector('.quant-room');if(!next)return;
 if(root===next&&next.dataset.labMounted)return;
 observer?.disconnect();cancelAnimationFrame(frame);readTicket++;root=next;index=[];root.dataset.labMounted='true';root.classList.add('research-lab');
 const content=root.querySelector('.quant-content'),head=content.querySelector(':scope>.quant-head');
 head.querySelector('h1').textContent='Research Lab';head.querySelector(':scope>p:last-child').textContent='Study the evidence. Keep assumptions and retained research in view.';
 const context=document.createElement('div');context.className='lab-context';context.innerHTML='<strong data-lab-instrument>No instrument selected</strong><div data-lab-source>Choose a ticker in Research overview, or open a retained study.</div><p data-lab-job role="status"></p><details class="lab-source-audit" hidden><summary>Source and study details</summary><div data-lab-source-audit></div></details>';head.after(context);
 const nav=document.createElement('nav');nav.className='research-views';nav.setAttribute('aria-label','Research Lab sections');nav.innerHTML=Object.entries(RESEARCH_VIEWS).map(([key,label])=>'<a href="#'+researchRoute(route,key)+'" data-lab-view="'+key+'">'+label+'</a>').join('');context.after(nav);
 const nextStep=document.createElement('nav');nextStep.className='workflow-links';nextStep.setAttribute('aria-label','Research next steps');nextStep.innerHTML='<button type="button" class="secondary" data-lab-view-next="valuation">Inspect company valuation</button><button type="button" class="secondary" data-lab-use-current>Use displayed study in a thesis</button><a href="#theses">Investment theses</a><a href="#decisions">Decision journal & reviews</a>';context.append(nextStep);
 const mobile=document.createElement('label');mobile.className='research-mobile-view';mobile.innerHTML='Research section<select id="research-view-menu">'+Object.entries(RESEARCH_VIEWS).map(([key,label])=>'<option value="'+key+'">'+label+'</option>').join('')+'</select>';nav.after(mobile);
 for(const [key,label]of Object.entries(RESEARCH_VIEWS)){const p=document.createElement('section');p.dataset.labPane=key;p.id='lab-'+key;p.hidden=true;p.setAttribute('aria-labelledby','lab-title-'+key);p.innerHTML='<h2 class="lab-section-title" id="lab-title-'+key+'" tabindex="-1">'+label+'</h2>';content.append(p);}
 move('.ticker-desk','overview');move('#ticker-summary','overview');move('#stock-comparison','overview');
 move('#quant-run-notice','models');move('.quant-custom','models');move('#quant-launch-status','models');move('#quant-results','models');move('#prediction-desk','models');
 move('#atlas-desk','valuation');root.querySelector('#atlas-desk').open=true;
 const atlasTabs=root.querySelector('.atlas-tabs');panel('tools').append(atlasTabs);move('#atlas-calculator','tools');move('#atlas-reference','tools');move('#research-desk','tools');
 root.querySelector('#lab-title-models').insertAdjacentHTML('afterend','<p data-lab-model-availability role="status">Choose an instrument or open a retained run.</p><details class="lab-model-coverage"><summary>Available methods and data requirements</summary><p>Core methods include AR(1), Ridge, Mean and Zero. Advanced methods cover return forecasts, volatility, market regimes, tail risk and scenarios.</p><p>OLS, KNN, Boosting, GARCH, EWMA and HMM remain available. HAR and Kalman beta require matching source data. Unavailable analyses explain what is missing.</p></details><div class="lab-model-controls"><button type="button" class="secondary" data-lab-jump="ticker">Choose an instrument</button><button type="button" class="secondary" data-lab-jump="core">Core results and audit</button></div>');
 panel('valuation').insertAdjacentHTML('afterbegin','<p class="quiet-note">Observed financial periods and prices are separate from editable scenario assumptions. Earnings and eligible FCFE calculations retain their existing methods and currency. Missing inputs remain unavailable.</p><button type="button" class="secondary" data-lab-saved-kind="valuations">Saved valuation studies</button>');
 panel('tools').insertAdjacentHTML('afterbegin','<p class="quiet-note">Input-driven decision mathematics, options, fixed income and portfolio-risk studies. Atlas reference results remain historical; opening them does not refit a model.</p><div class="lab-tool-links"><button type="button" class="secondary" data-lab-jump="calculator">Decision calculators</button><button type="button" class="secondary" data-lab-jump="research">Options, bonds & portfolio risk</button><button type="button" class="secondary" data-lab-jump="reference">Historical Atlas reference</button></div>');
 panel('thesis').insertAdjacentHTML('beforeend','<div data-lab-thesis></div><div class="lab-tool-links"><button type="button" class="primary" data-lab-thesis-write disabled>Review evidence & write thesis</button><a class="secondary" href="#theses">Open existing investment theses</a><a class="secondary" href="#library">Research Library</a></div><p class="quiet-note">The existing editor retains reports, assumptions, risks, invalidation conditions, reviews and revision history. Opening the editor saves nothing.</p>');
 panel('saved').insertAdjacentHTML('beforeend','<p class="quiet-note">One discovery index over existing archives. No databases are merged. Original inputs, sources, cutoffs, seeds and hashes stay in their original artifacts.</p><div class="lab-saved-controls"><label>Search retained research<input type="search" id="research-saved-query" placeholder="Ticker, study or method"></label><label>Archive<select id="research-saved-kind"><option value="">All research</option>'+Object.entries(labels).map(([key,label])=>'<option value="'+key+'">'+label+'</option>').join('')+'</select></label><button type="button" class="secondary" data-lab-saved-refresh>Refresh index</button></div><p data-lab-saved-status role="status"></p><div id="research-saved-index"></div><details class="lab-original-archives"><summary>Original archives & export controls</summary><div data-lab-original-archives></div></details>');
 const original=root.querySelector('[data-lab-original-archives]');for(const selector of ['#quant-archive','#advanced-archive','#manual-archive']){const el=root.querySelector(selector);if(el)original.append(el.closest('details'));}
 const tickerArchive=root.querySelector('.ticker-retained');if(tickerArchive)original.append(tickerArchive);
 const valuationArchive=root.querySelector('#auto-value-archive');if(valuationArchive)original.append(valuationArchive.closest('details'));
 // Keep the legacy 22-section controls as an optional, collapsed precision navigator.
 const shortcuts=document.createElement('details');shortcuts.className='lab-precision';shortcuts.innerHTML='<summary>Detailed section shortcuts</summary>';root.querySelector('.quant-layout').append(shortcuts);shortcuts.append(root.querySelector('.quant-sidebar'),root.querySelector('.quant-mobile-nav'));
 observer=new MutationObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(drawContext);});for(const selector of ['#ticker-output','#quant-run','#auto-value-output','[data-summary-body]'])observer.observe(root.querySelector(selector),{childList:true,subtree:true});
 const intent=takeMarketInstrument();if(intent&&!runFromRoute(route)&&!studyDestination(route)){root.querySelector('#automatic-ticker').value=intent.market+':'+intent.ticker;root._marketIntent=intent;root._marketOrigin=intent;}
 showResearchView(routeView(route));drawContext();mountMarketDataLab(root,route).then(()=>{if(root?.isConnected)drawContext();});
}
export function finishResearchMount(){const destination=studyDestination(location.hash.slice(1));if(destination){openStudyDestination(destination);return;}const own=root,intent=root?._marketIntent;if(!intent)return;delete root._marketIntent;queueMicrotask(()=>{if(own.isConnected&&own===root&&!runFromRoute(location.hash.slice(1)))own.querySelector('#ticker-form').requestSubmit();});}
function contextFacts(facts,audit=[]){
 const source=root.querySelector('[data-lab-source]'),detail=root.querySelector('[data-lab-source-audit]');
 source.innerHTML=facts.map(([label,value])=>'<span class="lab-fact"><b>'+esc(label)+'</b><span>'+esc(value)+'</span></span>').join('');
 const markup=audit.map(text=>'<p>'+esc(text)+'</p>').join('');
 if(detail.innerHTML!==markup)detail.innerHTML=markup;
 detail.closest('details').hidden=!audit.length;
}
function drawContext(){
 if(!root?.isConnected)return;
 if(root.dataset.marketSourceHash&&root._sourceRecord){
  const d=root._sourceRecord;
  root.querySelector('[data-lab-instrument]').textContent=d.instrument.symbol+' research';
  contextFacts([['Market',d.instrument.market],['Source',d.provider],['Observed',researchDate(d.quote?.observedAt)],['Retrieved',researchDate(d.source.retrievedAt,{time:true})]],[
   'Frozen source '+root.dataset.marketSourceHash,
   'Retrieved '+d.source.retrievedAt+'. Observed '+(d.quote?.observedAt||'not supplied')+'. Existing legacy studies below remain separate.'
  ]);
  root.querySelector('[data-lab-job]').textContent='Review inputs before running models or valuations for this source.';
  root.querySelector('.workflow-links').hidden=true;
  root.querySelector('[data-lab-model-availability]').textContent='Selected source models are above. Original model archives remain available below.';
  return;
 }
 const ticker=root.querySelector('#ticker-output'),study=ticker.hasChildNodes()?ticker._study:null,run=root.querySelector('#quant-run')?._run,valuation=root.querySelector('#auto-value-output'),v=valuation.hasChildNodes()?valuation._study:null;
 const target=root._studyTarget,preferred=target?.kind==='valuations'&&v?.id===target.id?v.fundamental:target?.kind==='advanced'&&root.querySelector('#advanced-output')?._study?.id===target.id?root.querySelector('#advanced-output')._study.source:null;
 const i=preferred||study?.instrument||(run?{ticker:run.config.ticker,market:run.config.market,name:run.dataset?.metadata?.listing||'',currency:run.dataset?.metadata?.currency||''}:null);
 root.querySelector('[data-lab-instrument]').textContent=i?i.ticker+(i.name?' '+i.name:''):'No instrument selected';
 const dates=preferred?'Retained '+labels[target.kind]+' for '+i.ticker+'. Source date '+researchDate(i.cutoff||v?.quote?.marketDate)+'. Other panels may retain separate studies.':study?'Price observed '+researchDate(study.quote?.marketDate||study.quote?.date)+'. Model history through '+researchDate(study.modelCutoff)+'.':run?'Retained run through '+researchDate(run.config.cutoff)+'. '+run.config.basis+' prices.':'Choose a ticker in Research overview, or open a retained study.';
 const advanced=root.querySelector('#advanced-output')?._study,origin=root._marketOrigin;
 root.querySelector('[data-lab-source]').dataset.marketOrigin=origin?JSON.stringify(origin):'';
 if(i){
  const matchingStudy=study?.instrument?.market===i.market&&study?.instrument?.ticker===i.ticker?study:null,matchingValuation=v?.fundamental?.market===i.market&&v?.fundamental?.ticker===i.ticker?v:null;
  const priceDate=preferred&&target.kind==='valuations'?matchingValuation?.quote?.marketDate:matchingStudy?.quote?.marketDate||matchingStudy?.quote?.date;
  const historyDate=preferred?preferred.cutoff:matchingStudy?.modelCutoff||run?.config.cutoff;
  const facts=[['Market',i.market],['Price date',researchDate(priceDate)],['Model history',preferred&&target.kind==='valuations'?'Separate from valuation inputs':researchDate(historyDate)]];
  const audit=[dates];
  if(study?.publishedAt)audit.push('Source publication '+study.publishedAt);
  if(origin?.source)audit.push('Arrived from Markets. Provider '+(origin.source.provider||'unavailable')+'. Observation '+(origin.source.observationDate||'unavailable')+'. This source is separate from retained model inputs.');
  if(v)audit.push('Valuation study for '+v.fundamental.market+' '+v.fundamental.ticker+'. Created '+v.createdAt);
  if(advanced)audit.push('Advanced study for '+advanced.source.market+' '+advanced.source.ticker+'. History through '+advanced.source.cutoff);
  contextFacts(facts,audit);
 }else{root.querySelector('[data-lab-source]').textContent=dates;root.querySelector('.lab-source-audit').hidden=true;}
 root.querySelector('[data-lab-job]').textContent=run?'Core analysis '+run.status+(run.config.ticker!==i?.ticker?' for '+run.config.ticker+' as a separate retained study':''):'';
 root.querySelector('[data-lab-model-availability]').textContent=study&&!study.runId?'Core models unavailable for this selected source study. '+(study.historyError||'No eligible published model cutoff.'):run?'Retained '+run.config.ticker+' analysis '+run.status+'. History through '+researchDate(run.config.cutoff)+'.':'Choose an instrument or open a retained run.';
 const brief=root.querySelector('[data-summary-body]')?._brief,el=root.querySelector('[data-lab-thesis]');
 const use=root.querySelector('[data-lab-use-current]'),view=root.dataset.labView;use.textContent=view==='valuation'?'Use displayed valuation in a thesis':view==='models'&&advanced?'Use displayed advanced study in a thesis':view==='models'?'Use completed core model in a thesis':'Use instrument brief in a thesis';use.disabled=view==='valuation'?!v:view==='models'?(!advanced&&run?.status!=='completed'):view==='overview'?!brief:true;
 el.innerHTML=brief?'<h3>'+esc(brief.instrument.market+' · '+brief.instrument.ticker)+'</h3><p>Evidence is prepared from the existing Investment brief. Review source dates, model cutoff and valuation assumptions before saving.</p><p class="quiet-note">'+esc(dates)+'</p>':'<p>No instrument brief is ready. Choose an instrument in Research overview, or open an existing thesis. No investment argument is generated.</p>';
 root.querySelector('[data-lab-thesis-write]').disabled=!brief;
}
async function readSavedResearch(){
 const own=++readTicket,el=root.querySelector('#research-saved-index'),status=root.querySelector('[data-lab-saved-status]');status.textContent='Reading existing archives…';
 const jobs={core:()=>api('runs'),advanced:listAdvancedStudies,predictions:()=>continuityList('predictions'),valuations:savedAutoValuations,manual:()=>continuityList('manual'),tickers:listTickerStudies};
 const results=await Promise.allSettled(Object.values(jobs).map(fn=>fn()));if(own!==readTicket||!el.isConnected)return;
 const groups={},failed=[];Object.keys(jobs).forEach((key,n)=>{if(results[n].status==='fulfilled')groups[key]=results[n].value;else failed.push(labels[key]+': '+results[n].reason.message);});index=researchIndex(groups);status.textContent=root._missingStudy||index.length+' retained artifacts.'+(failed.length?' Incomplete index — '+failed.join('; '):' Original archives remain separate.');renderSaved();
}
function renderSaved(){if(!root?.isConnected)return;const q=root.querySelector('#research-saved-query').value.trim().toLowerCase(),kind=root.querySelector('#research-saved-kind').value,rows=index.filter(r=>(!kind||r.kind===kind)&&(r.ticker+' '+r.market+' '+r.label+' '+labels[r.kind]).toLowerCase().includes(q)),el=root.querySelector('#research-saved-index');
 el.innerHTML=rows.length?'<p class="quiet-note">'+rows.length+' matches</p><div class="table-wrap" tabindex="0" role="region" aria-label="Saved research index"><table><thead><tr><th>Research</th><th>Instrument and method</th><th>Analysis date</th><th>Seed</th><th>Saved date</th><th></th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+esc(labels[r.kind])+'<small>'+esc(r.status)+'</small></td><td>'+esc(r.market+' '+r.ticker)+'<small>'+esc(r.label)+'</small></td><td>'+esc(researchDate(r.cutoff)||'Not supplied')+'</td><td>'+esc(r.seed??'Not applicable')+'</td><td>'+esc(researchDate(r.date,{time:true}))+'</td><td>'+(r.kind==='core'?'<a href="#quant/run/'+encodeURIComponent(r.id)+'">Open retained run</a>':'<button type="button" class="secondary" data-lab-open-kind="'+r.kind+'" data-lab-open-id="'+esc(r.id)+'">Open</button>')+'<button type="button" class="secondary" data-lab-use-kind="'+r.kind+'" data-lab-use-id="'+esc(r.id)+'">Use in thesis</button></td></tr>').join('')+'</tbody></table></div>':'<p class="quiet-note">'+(index.length?'No retained research matches these filters.':'No saved research in the available archives. No demonstration studies are inserted.')+'</p>';
}
document.addEventListener('office:quant-navigation',e=>{if(root?.isConnected){showResearchView(viewForJump(e.detail.key));const kind={models:'core',advanced:'advanced',valuations:'valuations',tickers:'tickers',manual:'manual'}[e.detail.key];if(kind){root.querySelector('#research-saved-kind').value=kind;renderSaved();}}});
document.addEventListener('click',e=>{
 const a=e.target.closest('a[data-lab-view]');if(a&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey){e.preventDefault();showResearchView(a.dataset.labView,{push:true,focus:true});return;}
 const step=e.target.closest('[data-lab-view-next]');if(step){showResearchView(step.dataset.labViewNext,{push:true,focus:true});return;}
 const evidence=e.target.closest('[data-lab-use-kind],[data-lab-use-current]');if(evidence){useResearchEvidence(evidence);return;}
 const jump=e.target.closest('[data-lab-jump]');if(jump){root?.querySelector('[data-quant-jump="'+jump.dataset.labJump+'"]')?.click();return;}
 if(e.target.closest('[data-lab-thesis-write]')){root?.querySelector('[data-start-investment-flow]')?.click();return;}
 if(e.target.closest('[data-lab-saved-refresh]'))readSavedResearch();
 const savedKind=e.target.closest('[data-lab-saved-kind]');if(savedKind){showResearchView('saved',{push:true,focus:true});root.querySelector('#research-saved-kind').value=savedKind.dataset.labSavedKind;renderSaved();}
 const open=e.target.closest('[data-lab-open-kind]');if(open){const row=index.find(r=>r.kind===open.dataset.labOpenKind&&r.id===open.dataset.labOpenId);if(!row)return;const cfg={advanced:['models','data-advanced-open'],valuations:['valuation','data-auto-value-open'],manual:['tools','data-manual-open'],tickers:['overview','data-ticker-open'],predictions:['models',null]}[row.kind];
  const button=cfg[1]?[...root.querySelectorAll('['+cfg[1]+']')].find(b=>b.getAttribute(cfg[1])===row.id):null;
  if(cfg[1]&&!button){root.querySelector('[data-lab-saved-status]').textContent='Original archive controls are not ready. Refresh the index and retry.';return;}
  showResearchView(cfg[0],{push:true});
  if(button)button.click();
  else root.querySelector('[data-quant-jump=predictions]')?.click();
 }
 // Existing Atlas view buttons continue to control the same original sections.
 const atlas=e.target.closest('[data-atlas-view]');if(atlas&&e.isTrusted){showResearchView(atlas.dataset.atlasView==='automatic'?'valuation':'tools');}
});
document.addEventListener('change',e=>{if(e.target.id==='research-view-menu')showResearchView(e.target.value,{push:true,focus:true});if(e.target.id==='research-saved-kind')renderSaved();});
document.addEventListener('input',e=>{if(e.target.id==='research-saved-query')renderSaved();});
window.addEventListener('hashchange',()=>{if(!root?.isConnected){observer?.disconnect();readTicket++;root=null;}});

// Deep links delegate to existing archive handlers. Reads cannot outlive a newer user action.
async function openStudyDestination(destination){
 const own=root,live=captureResearchAction(own),url=location.href;own._studyTarget=destination;
 await readSavedResearch();
 if(!live()||url!==location.href)return;
 const row=index.find(r=>r.kind===destination.kind&&r.id===destination.id);
 if(!row){own._missingStudy='This study is not in the available archives. Restore its complete backup or choose another retained study. No replacement study was loaded.';showResearchView('saved');own.querySelector('[data-lab-saved-status]').textContent=own._missingStudy;return;}
 const config={advanced:['models','data-advanced-open'],valuations:['valuation','data-auto-value-open'],manual:['tools','data-manual-open'],tickers:['overview','data-ticker-open'],predictions:['models',null]}[row.kind];
 await Promise.all([own.querySelector('#atlas-form')?._draftReady,own.querySelector('#research-form')?._draftReady]);
 if(!live())return;
 showResearchView(config[0]);
 if(config[1]){const button=document.createElement('button');button.type='button';button.hidden=true;button.setAttribute(config[1],row.id);own.append(button);button.click();button.remove();}
 else own.querySelector('[data-quant-jump=predictions]')?.click();
}
async function useResearchEvidence(button){
 const own=root,live=captureResearchAction(button),view=own.dataset.labView;
 try{
  let kind=button.dataset.labUseKind,study;
  if(kind){const row=index.find(r=>r.kind===kind&&r.id===button.dataset.labUseId);if(!row)throw Error('Refresh the saved index before selecting evidence.');study=row.raw;if(kind==='core')study=await api('run/'+encodeURIComponent(row.id));}
  else if(view==='valuation'){kind='valuations';study=own.querySelector('#auto-value-output')?._study;}
  else if(view==='models'){const advanced=own.querySelector('#advanced-output');if(advanced?.hasChildNodes()&&advanced._study){kind='advanced';study=advanced._study;}else{kind='core';study=own.querySelector('#quant-run')?._run;}}
  else {const brief=own.querySelector('[data-summary-body]')?._brief;if(brief){own.querySelector('[data-start-investment-flow]')?.click();return;}kind='core';study=own.querySelector('#quant-run')?._run;}
  if(!live())return;
  const seed=studyThesisSeed(kind,study);
  const brief=own.querySelector('[data-summary-body]')?._brief;if(kind==='valuations'&&brief?.context.valuationStudyId===study.id){seed.context=structuredClone(brief.context);seed.analysisRefs=brief.analysisRef?[structuredClone(brief.analysisRef)]:[];}
  document.dispatchEvent(new CustomEvent('office:research-thesis',{detail:seed}));
 }catch(error){if(live())own.querySelector('[data-lab-job]').textContent=error.message;}
}
document.addEventListener('input',e=>{if(e.target.id==='automatic-ticker'&&root)root._studyTarget=null;});

