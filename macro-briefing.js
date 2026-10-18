import {CONTEXT_COUNTRIES} from './macro-context-contract.js';
import {releaseCandidates,releaseHistory,releaseSummary} from './macro-releases-ui.js';
import {rateCandidates,extendedSummary} from './macro-extended-ui.js';
import {nativeMacroChart,macroDateLabel,macroPointChange} from './macro-chart.js';
import {contextWindow} from './macro-context-math.js';
import {macroDeskRoute} from './macro-navigation.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=value=>new Intl.NumberFormat('en-GB',{minimumFractionDigits:1,maximumFractionDigits:2}).format(value);
const frequency={D:'Daily',W:'Weekly',M:'Monthly',Q:'Quarterly',A:'Annual',E:'Decision dates'};
export function briefingReadings({releases,legacy,extended,context,country,now=Date.now()}){
 return [['gdp','Growth','gdp'],['inflation','Inflation','inflation'],['policy','Policy instrument','policy'],['yield','Government yield','yield']].map(([key,label,metric])=>{
  const items=['gdp','inflation'].includes(key)?releaseCandidates(releases,legacy,country,metric,extended):rateCandidates(extended,context,country,metric);
  const item=items.find(s=>s.latest)||null,summary=['gdp','inflation'].includes(key)?releaseSummary(item,now):extendedSummary(item,now);
  return {key,label,item,summary,items};
 });
}
export function renderMacroBriefing(sources,{width=900,range='10y',errors=[]}={}){
 const {country}=sources,name=CONTEXT_COUNTRIES[country]||country,readings=briefingReadings(sources),available=readings.filter(r=>r.item);
 const chartWidth=width>=800?Math.max(240,(width-24)/2):Math.max(240,width);
 const evidence=macroDeskRoute(country,'sources'),economy=macroDeskRoute(country,'economy');
 const reading=r=>{
  const {item,label,summary}=r;if(!item)return `<div data-briefing-metric="${r.key}"><dt>${label}</dt><dd class="briefing-unavailable">Not connected</dd><p>No verified series connected for this economy.</p></div>`;
  const {spec,latest}=item,unit=['gdp','inflation'].includes(r.key)?'% YoY':'%';
  return `<div data-briefing-metric="${r.key}"><dt>${label}</dt><dd>${num(latest.value)}<small>${unit}</small></dd><p>${esc(macroDateLabel(latest.date,spec.frequency))}<span>${frequency[spec.frequency]||esc(spec.frequency)}</span></p>${summary.outdated?'<p class="briefing-flag">Older observation or acquisition</p>':''}${latest.status==='estimate'||latest.status==='provisional'?'<p class="briefing-flag">'+esc(latest.status==='estimate'?'Estimate':'Provisional')+'</p>':''}${summary.laterMissing?'<p class="briefing-flag">Later supplied period not reported</p>':''}<a href="${esc(spec.sourceUrl||spec.url)}" target="_blank" rel="noopener noreferrer">${esc(spec.source)}</a></div>`;
 };
 const chart=r=>{
  if(!r.item)return `<section class="briefing-history"><h4>${r.label}</h4><p>No verified history connected. No substitute values are plotted.</p></section>`;
  const selected=releaseHistory(r.items),rows=contextWindow(selected.observations,range),split=selected.id!==r.item.id;
  return `<section class="briefing-history" data-briefing-history="${r.key}"><div class="briefing-question"><p class="eyebrow">${r.key==='gdp'?'THE REAL ECONOMY':'THE PRICE LEVEL'}</p><h4>${r.key==='gdp'?'How has growth changed?':'How has inflation changed?'}</h4></div>${nativeMacroChart(rows,{width:chartWidth,height:240,title:selected.spec.title,unit:'% YoY',frequency:selected.spec.frequency,bars:r.key==='gdp'})}<p class="briefing-chart-source">${esc(selected.spec.source)}${split?' <span class="briefing-flag">History uses a separate source or basis. Latest reading above is not appended.</span>':''}</p></section>`;
 };
 return `<section class="longhand-briefing" aria-label="Longhand macro briefing"><header class="briefing-opening"><div><p class="eyebrow">LONGHAND RESEARCH DESK</p><h3>${esc(name)}<small>Economic briefing</small></h3></div><p>Latest connected observations.<br> Original periods and sources retained.</p></header><dl class="briefing-readings" aria-label="Four macro observations">${readings.map(reading).join('')}</dl>${errors.filter(Boolean).map(message=>'<p class="macro-warning">'+esc(message)+' Independent dated observations remain available.</p>').join('')}<div class="briefing-workspace"><div class="briefing-charts">${readings.slice(0,2).map(chart).join('')}</div></div><nav class="briefing-research-actions" aria-label="Continue macro research"><span>Continue research</span><a href="${economy}">Economic history</a><a href="#quant">Research Lab</a><a href="#theses">Investment theses</a><a href="#decisions">Decision journal</a></nav><p class="briefing-workflow-note">Observations are not automatically added to a thesis or decision.</p><section class="briefing-release-notes" aria-label="What the observations say"><div><p class="eyebrow">OBSERVATION NOTES</p><h4>What changed in the data</h4><p>Comparisons describe recorded observations. They are not news, consensus surprises or causal explanations.</p></div><ul>${available.map(({item,key,label})=>`<li><span>${label}</span><p>${esc(macroPointChange(item.observations,item.observations.indexOf(item.latest),item.spec.frequency,item.spec.unit||'% YoY'))}</p><small>${esc(item.spec.title)}<br>${esc(macroDateLabel(item.latest.date,item.spec.frequency))}</small></li>`).join('')||'<li>No verified observations available for this economy.</li>'}</ul></section><footer class="briefing-footer"><span>${available.length} of 4 indicators connected. Each keeps its own source and reporting period.</span><a href="${evidence}">Inspect the evidence</a></footer></section>`;
}
