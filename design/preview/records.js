// Sheet 06 Records & Data Sources — every section of the Office Data Sources and Records pages.
(function(){
const D=window.RECORDS;if(!D)return;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nf=v=>Number(v).toLocaleString('en-US');
const head=(kicker,title,lede,right='')=>`<div class="sec-head"><div><div class="kicker">${esc(kicker)}</div><h2>${title}</h2>${lede?`<p>${lede}</p>`:''}</div>${right}</div>`;
const S=D.summary;

/* 1. coverage census */
function coverage(){
  const A=Object.entries(D.areas).sort((a,b)=>b[1].total-a[1].total);
  $('#coverage .panel').innerHTML=head('Coverage · dates · source gaps','Know what is available.',`Inspect missing sources, observation dates and acquisition dates before using a number. A connected or structurally valid source is not an independent accuracy certificate. Checked ${D.checkedAt.slice(0,10)} against the report assembled ${D.generatedAt.replace('T',' ').slice(0,16)} UTC.`)+
  `<div class="tally">${[['Published quotes',`${nf(S.quoted)} / ${nf(S.quoteEntries)}`,`${nf(S.listed)} listed instruments. Listing does not guarantee data.`],['Stock / ETF histories',nf(S.histories),`${nf(S.modelEligible)} meet model cutoff requirements.`],['Connected series',`${nf(S.available)} available`,`${nf(S.unavailable)} unavailable of ${nf(S.series)}.`],['Valuation input eligibility',`${nf(S.earningsEligible)} earnings`,`${nf(S.fcfeEligible)} FCFE · default sensitivity rules; not verified fair values.`]].map(([k,v,n])=>`<div><small>${k}</small><b class="num">${v}</b><span>${n}</span></div>`).join('')}</div>
  <div class="sub">Census by area · ${nf(S.series)} connected series</div>
  <div class="census"><div class="crow head"><span>Area</span><span>Series</span><span>Available · needs attention · unavailable</span><span>Attention</span></div>
  ${A.map(([g,a])=>{const ok=a.available-(a.attention-a.unavailable),att=a.attention-a.unavailable;return `<div class="crow" data-g="${esc(g)}" tabindex="0" role="button" aria-label="Show ${esc(g)} in the dataset ledger"><span><b>${esc(g)}</b></span><span class="num">${nf(a.total)}</span><span class="cen" title="${ok} available without notes, ${att} available but needing attention, ${a.unavailable} unavailable"><i class="ok" style="width:${ok/a.total*100}%"></i><i class="at" style="width:${att/a.total*100}%"></i><i class="un" style="width:${a.unavailable/a.total*100}%"></i></span><span class="num">${nf(a.attention)}${a.unavailable?` <small>${a.unavailable} unavailable</small>`:''}</span></div>`}).join('')}</div>
  <div class="ckey"><span><i class="ok"></i>available, no note</span><span><i class="at"></i>available, needs attention</span><span><i class="un"></i>unavailable</span><span class="src">Click an area to open it in the ledger.</span></div>
  <p class="src" style="margin-top:8px">${esc(D.policy)}</p>`;
  $$('#coverage .crow[data-g]').forEach(r=>{r.onclick=()=>{state.area=r.dataset.g;state.show='attention';state.page=0;ledger();$('#ledger').scrollIntoView({behavior:'smooth'})};r.onkeydown=e=>{if(e.key==='Enter')r.click()}});
}

/* 2. publication ruler */
function publications(){
  const P=D.publications.map(p=>({...p,t:Date.parse(p.publishedAt)})).sort((a,b)=>a.t-b.t),gen=Date.parse(D.generatedAt);
  const t0=Math.floor(Math.min(...P.map(p=>p.t))/6e4/5)*5*6e4,t1=Math.ceil(Math.max(gen,...P.map(p=>p.t))/6e4/5)*5*6e4,X=t=>(t-t0)/(t1-t0)*100;
  const ticks=[];for(let t=t0;t<=t1;t+=6e4)ticks.push(t);
  $('#publications .panel').innerHTML=head('Publication dates & coverage boundaries','Eleven publications, one morning.',`Every public input carries its own publication time. The coverage report was assembled at ${new Date(gen).toISOString().slice(11,16)} UTC on ${D.generatedAt.slice(0,10)}; assembling it is not a new source acquisition.`)+
  `<div class="ruler2"><div class="axis">${ticks.map(t=>{const m=new Date(t).getUTCMinutes();return `<i class="${m%5===0?'maj':''}" style="left:${X(t)}%">${m%5===0?`<span>${new Date(t).toISOString().slice(11,16)}</span>`:''}</i>`}).join('')}</div>
   ${P.map((p,i)=>`<div class="pubrow"><span class="pl">${esc(p.label)}</span><span class="pt"><b style="left:${X(p.t)}%" title="${p.publishedAt}"></b></span><span class="pd num">${p.publishedAt.slice(11,19)}</span></div>`).join('')}
   <div class="pubrow gen"><span class="pl">Coverage report assembled</span><span class="pt"><b style="left:${X(gen)}%"></b></span><span class="pd num">${D.generatedAt.slice(11,19)}</span></div></div>
  <p class="src" style="margin-top:8px">Times are UTC on ${D.generatedAt.slice(0,10)}. Source comparison unavailable: source comparison HTTP 404. A missing report is not a clean source check.</p>`;
}

/* 3. dataset ledger */
const state={show:'attention',area:'All areas',q:'',page:0};
const SHOW=[['attention','Needs attention'],['all','All connected series'],['Unavailable','Unavailable'],['Older acquisition','Older acquisition'],['Older observation','Older observation'],['Stock/ETF model inputs not ready','Stock/ETF model inputs not ready'],['Gap with another connected series','Gap with another connected series']];
function ledger(){
  const el=$('#ledger .panel');const areas=['All areas',...Object.keys(D.areas).sort()];
  const pool=state.show==='all'?[...D.attention,...Object.values(D.healthy).flat()]:D.attention;
  let rows=pool.filter(r=>(state.show==='attention'||state.show==='all'||r.fl.includes(state.show))&&(state.area==='All areas'||r.g===state.area)&&(!state.q||(r.l+' '+r.s+' '+r.src+' '+r.m).toLowerCase().includes(state.q)));
  rows.sort((a,b)=>Number(a.av)-Number(b.av)||a.s.localeCompare(b.s)||a.l.localeCompare(b.l));
  const per=30,pages=Math.max(1,Math.ceil(rows.length/per));state.page=Math.min(state.page,pages-1);const view=rows.slice(state.page*per,state.page*per+per);
  el.innerHTML=head('Dataset ledger','Inspect individual series &amp; gaps.','Different providers remain separate; no provider values are combined.')+
  `<div class="lfilters"><label>Find a dataset<input id="lq" type="search" value="${esc(state.q)}" placeholder="Label, country, source"></label>
   <label>Show<select id="ls">${SHOW.map(([v,t])=>`<option value="${v}" ${v===state.show?'selected':''}>${t}</option>`).join('')}</select></label>
   <label>Area<select id="la">${areas.map(a=>`<option ${a===state.area?'selected':''}>${esc(a)}</option>`).join('')}</select></label></div>
  <div class="src" style="margin:8px 0">${nf(rows.length)} matching source record(s). Showing ${rows.length?state.page*per+1:0}–${Math.min(rows.length,state.page*per+per)}.${state.show==='all'?' This preview carries every record that needs attention plus up to 40 healthy records per area; the live app lists all 9,004.':''}</div>
  <div class="dl">${view.map(r=>`<div class="dr ${r.av?'':'na'}"><span class="dn2"><b>${esc(r.l)}</b><small>${esc(r.s)} · ${esc(r.g)}</small></span>
   <span class="da"><b class="${r.av?'':'dn'}">${r.av?'Available':'Unavailable'}</b><small>${nf(r.n)} numeric observations · ${esc(r.f||'')}${r.u?' · '+esc(r.u):''}</small>${r.why?`<small>${esc(r.why)}</small>`:''}${r.alt?`<small>${r.alt} other connected series for this metric.</small>`:''}${r.cov?`<small>History ${r.cov.history?'published':'not published'} · model ${r.cov.modelReady?'ready':'not ready'} · earnings ${r.cov.earnings?'eligible':'ineligible'} · FCFE ${r.cov.fcfe?'eligible':'ineligible'}</small>`:''}</span>
   <span class="do"><small>${r.ob?'Observed '+esc(r.ob):'No reported observation'}</small><small>Acquired ${esc((r.rt||'').replace('T',' ').slice(0,16))}</small>${r.fl.filter(f=>f!=='Unavailable').map(f=>`<span class="flag">${esc(f)}</span>`).join('')}</span>
   <span class="ds">${esc(r.src)}${r.url?`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Original source ↗</a>`:''}</span></div>`).join('')||'<p class="src">No records match.</p>'}</div>
  <div class="pager"><button class="btn-line" id="lprev" ${state.page?'':'disabled'}>Previous datasets</button><span class="src">Page ${state.page+1} of ${pages}</span><button class="btn-line" id="lnext" ${state.page<pages-1?'':'disabled'}>Next datasets</button></div>
  <p class="src">Age flags use descriptive thresholds (10 days for acquisition; observation thresholds by cadence, measured from the end of the reported period). They do not establish that a scheduled release is late.</p>`;
  let tq;$('#lq').oninput=e=>{clearTimeout(tq);tq=setTimeout(()=>{state.q=e.target.value.trim().toLowerCase();state.page=0;ledger();$('#lq').focus();const v=$('#lq').value;$('#lq').setSelectionRange(v.length,v.length)},180)};
  $('#ls').onchange=e=>{state.show=e.target.value;state.page=0;ledger()};$('#la').onchange=e=>{state.area=e.target.value;state.page=0;ledger()};
  $('#lprev').onclick=()=>{state.page--;ledger()};$('#lnext').onclick=()=>{state.page++;ledger()};
}

/* 4. providers */
function providers(){
  const P=[['Yahoo Finance','US / IDX','Published quotes, daily OHLCV, selected fundamental snapshots','Existing dated publication','Existing public-source pipeline; not a new data licence','Reloads published files; no real-time entitlement'],
   ['Pluang','US / IDX where supplied','Validated JSON / CSV imports; supplied intervals only','Direct Office connection not authorized','Official MCP documented; a separate Office grant and permitted data use remain unresolved','Manual imports only; the chat connector is not an Office background feed'],
   ['Flowless','IDX · local edition','Existing daily-close reference read','Checked only when selected','Owner-operated local source; no new ingestion','Reads the existing local service; no silent Yahoo substitution'],
   ['SEC filings','US · existing filing subset','Annual same-filing evidence where available','Existing dated publication','Official filing evidence; annual is not TTM','Reloads existing evidence files; does not acquire new filings']];
  $('#providers .panel').innerHTML=head('Provider coverage & authorization','Four providers, never spliced.','Pluang’s official MCP is documented. Office has no independent OAuth grant, and persistent-use and rate-limit terms remain unresolved. Imports are inspected on this device. This page never reads accounts or places orders.')+
  `<div class="prov">${P.map(([n,c,cd,st,sn,rf])=>`<div class="pr"><span class="pn"><b>${n}</b><small>${c}</small></span><span><small>Coverage</small>${cd}</span><span><small>Connection / authorization</small><b class="st ${/not authorized/.test(st)?'dn':''}">${st}</b>${sn}</span><span><small>Refresh</small>${rf}<em>No successful source read in this preview session</em></span></div>`).join('')}</div>
  <p class="src" style="margin-top:8px">The official Pluang MCP endpoint is not a grant to this application, a redistribution licence or a streaming-price guarantee.</p>`;
}

/* 5. inspect an instrument or import */
function inspect(){
  const cols=D.csvColumns;
  $('#inspect .panel').innerHTML=head('Inspect an instrument or import','Check a market file before you trust it.','Market data only. Credential and account fields are rejected. Inspection does not retain the file and nothing is uploaded.')+
  `<div class="two"><div><div class="tgrid tg3"><label>Market<select disabled><option>United States</option><option>Indonesia</option></select></label><label>Instrument<input disabled placeholder="AAPL"></label><label>Data provider<select disabled><option>Yahoo Finance</option><option>Pluang</option><option>Flowless</option><option>SEC filings</option></select></label></div>
   <button class="btn-line" disabled title="Reads a source in the live app">Load selected source</button><p class="src" style="margin-top:6px">Select an existing source or inspect an authorized market-only import. No data is loaded from Pluang automatically.</p>
   <div class="sub">CSV template · ${cols.length} columns</div><div class="colist">${cols.map(c=>`<code>${c}</code>`).join('')}</div>
   <button class="btn-line" id="tpl" style="margin-top:10px">Download TEST ONLY CSV template</button><p class="src" style="margin-top:6px">JSON: longhand-market-dataset v1, or longhand-pluang-market-import v1. CSV: one listing / provider / interval, with explicit currency, timezone, completeness and source metadata.</p></div>
   <div><label class="drop" id="drop"><input type="file" id="mfile" accept=".csv,.json,text/csv,application/json"><b>Inspect JSON / CSV market data</b><span class="src">Choose or drop a file. It is read in this browser only.</span></label><div id="insp"></div></div></div>`;
  $('#tpl').onclick=()=>{const row='TEST,US,,USD,manual,'+new Date().toISOString()+',America/New_York,1d,regular,2026-01-02,100,101,99,100.5,1000,true,none,,,TEST ONLY,https://example.com';
    const blob=new Blob([cols.join(',')+'\n'+row+'\n'],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='longhand-market-data-TEST-ONLY-template.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
  const BAD=/pass(word)?|token|secret|api[_-]?key|account|session[_-]?id|cookie|pin\b|otp/i;
  const report=(name,res)=>{$('#insp').innerHTML=`<div class="irep"><div class="kicker">${esc(name)}</div>${res.map(([ok,t])=>`<div class="ir ${ok===true?'ok':ok===false?'bad':'na'}"><span>${ok===true?'✓':ok===false?'✕':'·'}</span>${t}</div>`).join('')}<p class="src">Inspection only. The file is not retained.</p></div>`};
  const inspectText=(name,text)=>{const res=[];
    if(/\.json$/i.test(name)||/^\s*[{[]/.test(text)){let j;try{j=JSON.parse(text)}catch(e){report(name,[[false,'Not valid JSON: '+esc(e.message)]]);return}
      const fmt=j.format||j.metadata?.format;res.push([/longhand-(market-dataset|pluang-market-import)/.test(fmt||''),`Format: ${esc(fmt||'missing')}`]);
      const keys=JSON.stringify(Object.keys(j))+JSON.stringify(Object.keys(j.metadata||{}));res.push([!BAD.test(keys),BAD.test(keys)?'Credential or account fields present — rejected':'No credential or account fields']);
      const obs=j.observations||j.rows||j.data||[];res.push([obs.length>0,`${nf(obs.length)} observation rows`]);report(name,res);return}
    const lines=text.split(/\r?\n/).filter(Boolean),hdr=lines[0].split(',').map(s=>s.trim());
    const missing=cols.filter(c=>!hdr.includes(c)),extra=hdr.filter(c=>!cols.includes(c));res.push([!missing.length,missing.length?`Missing columns: ${missing.map(esc).join(', ')}`:'All template columns present']);
    res.push([!hdr.some(h=>BAD.test(h)),hdr.some(h=>BAD.test(h))?'Credential or account columns present — rejected':'No credential or account columns']);
    if(extra.length)res.push([null,`Extra columns ignored: ${extra.map(esc).join(', ')}`]);
    const rows=lines.slice(1).map(l=>l.split(','));const ix=k=>hdr.indexOf(k);res.push([rows.length>0,`${nf(rows.length)} data rows`]);
    if(ix('date')>=0&&rows.length){const ds=rows.map(r=>r[ix('date')]).filter(Boolean).sort();res.push([true,`Dates ${esc(ds[0])} → ${esc(ds.at(-1))}`]);const dup=ds.length-new Set(ds).size;res.push([!dup,dup?`${dup} duplicate dates`:'No duplicate dates'])}
    for(const k of ['symbol','currency','provider','interval','timezone'])if(ix(k)>=0){const u=[...new Set(rows.map(r=>r[ix(k)]))];res.push([u.length===1,`${k}: ${u.slice(0,3).map(esc).join(', ')}${u.length>1?' — one listing / provider / interval per file':''}`])}
    if(ix('close')>=0){const bad=rows.filter(r=>!(parseFloat(r[ix('close')])>0)).length;res.push([!bad,bad?`${bad} rows without a positive close`:'Every row has a positive close'])}
    report(name,res)};
  const take=f=>{if(!f)return;if(f.size>5e6){report(f.name,[[false,'Larger than 5 MB — not inspected in the preview']]);return}f.text().then(t=>inspectText(f.name,t))};
  $('#mfile').onchange=e=>take(e.target.files[0]);const dz=$('#drop');dz.ondragover=e=>{e.preventDefault();dz.classList.add('over')};dz.ondragleave=()=>dz.classList.remove('over');dz.ondrop=e=>{e.preventDefault();dz.classList.remove('over');take(e.dataTransfer.files[0])};
}

/* 6. official economic sources */
function official(){
  const O=[['Indonesia','BPS Statistics Indonesia','GDP, consumer prices and national statistical releases.','https://www.bps.go.id/en/pressrelease','Browse BPS releases','macro.html#pulse'],['Indonesia','Bank Indonesia','BI-Rate decisions and official exchange-rate references.','https://www.bi.go.id/en/','Check BI-Rate','macro.html#rates'],['United States','Bureau of Labor Statistics','Consumer prices and the official economic release calendar.','https://www.bls.gov/cpi/','Browse CPI releases','macro.html#calendar'],['United States','US Treasury','Daily Treasury par yields by maturity, separate from bond ETF prices.','https://home.treasury.gov/policy-issues/financing-the-government/interest-rate-statistics','Check Treasury rates','markets.html#bonds'],['Euro area','European Central Bank','Official policy rates and monetary-policy announcements.','https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html','Check ECB rates','macro.html#compare'],['Global','World Bank','Annual country indicators; reporting years and availability differ.','https://data.worldbank.org/','Explore World Bank data','macro.html#region']];
  $('#official .panel').innerHTML=head('Official economic sources','Inflation, growth, policy and yields.','Open the issuing institution to check a release. Office coverage and observation dates are shown separately; a source link does not imply every dataset is connected.')+
  `<div class="off">${O.map(([r,n,d,u,ut,inn])=>`<div class="or"><small>${r}</small><b>${n}</b><p>${d}</p><span><a href="${u}" target="_blank" rel="noopener noreferrer">${ut} ↗</a><a href="${inn}">In the Office →</a></span></div>`).join('')}</div>`;
}

/* 7–9. records, backups, vault */
function backup(){
  $('#backup .panel').innerHTML=head('Records · all research archives','Workspace backup &amp; recovery.','One file includes Office records, every completed core run, advanced models, valuations, ticker studies, calculator drafts, saved manual studies, registered predictions, theme, watchlists, retained Data Sources datasets and their saved source studies. Incomplete model requests are retained as audit notes; they never restart on restore.')+
  `<div class="three"><div class="bk"><div class="kicker">Plain backup</div><b>Download workspace backup</b><p class="src">A complete JSON file. Keep older individual exports too.</p><div class="bkb"><button class="btn-ink" disabled title="Downloads in the live app">Download workspace backup ↓</button><button class="btn-line" disabled>Inspect complete backup</button></div></div>
   <div class="bk"><div class="kicker">Encrypted backup</div><b>Protect your backup with a password</b><form class="pw" onsubmit="return false"><label>Password<input type="password" id="pw1" autocomplete="new-password"></label><label>Confirm password<input type="password" id="pw2" autocomplete="new-password"></label></form><div id="pwmsg" class="src">At least 12 characters. There is no password reset.</div><div class="bkb"><button class="btn-ink" id="pwbtn" disabled>Download encrypted backup ↓</button></div><p class="src">Only this file is encrypted. Active browser and SQLite records and earlier plain exports remain unencrypted. The password is not stored or uploaded.</p></div>
   <div class="bk"><div class="kicker">Restore</div><b>Restore to a new workspace</b><p class="src">Restore creates a separate workspace; your active workspace is preserved and activated only after verification. Private file, no upload. Maximum 100 MB before encryption / 200 completed core runs. Public feeds and frozen Atlas reference files are reloaded from their sources.</p><div class="bkb"><button class="btn-line" disabled>Restore to a new workspace</button><button class="btn-line" disabled>Unlock &amp; inspect</button></div></div></div>
  <div class="sub">Export &amp; restore · this workspace</div>
  <div class="counts"><span><b class="num">0</b> portfolios</span><span><b class="num">0</b> theses</span><span><b class="num">0</b> decisions</span><button class="btn-line" disabled>Export records ↓</button><button class="btn-line" disabled>Restore from backup</button></div>
  <p class="src">Exports contain your private records and all linked completed analyses with their datasets, results and hashes. Unlinked runs stay in the Quant archive and can be exported separately. Restore validates the file and asks before replacing existing records.</p>`;
  const a=$('#pw1'),b=$('#pw2'),m=$('#pwmsg');const chk=()=>{const ok=a.value.length>=12&&a.value===b.value;m.textContent=!a.value?'At least 12 characters. There is no password reset.':a.value.length<12?`${12-a.value.length} more character${12-a.value.length===1?'':'s'} needed.`:a.value!==b.value?'The two passwords do not match.':'Ready. In the live app this encrypts the file on this device.';m.className='src '+(ok?'up':'');};a.oninput=chk;b.oninput=chk;
}
function sync(){
  $('#sync .panel').innerHTML=head('Optional · encrypted checkpoint sync','Move a private workspace between devices.','GitHub Pages does not host a private vault. A compatible private service can retain encrypted checkpoints and their revision history; the passphrase decrypts them on this device only.')+
  `<div class="two"><div><div class="statusline"><span class="dot"></span><b>Private service not configured</b><span class="src">No private connection. No records have been uploaded.</span></div>
   <form class="tgrid" onsubmit="return false" style="grid-template-columns:1fr"><label>Private service origin<input disabled placeholder="https://"></label><label>Vault ID<input disabled></label><label>Vault access token<input disabled type="password"></label></form><button class="btn-line" disabled>Connect &amp; inspect latest revision</button></div>
   <div><div class="kicker">How checkpoints behave</div><ul class="rules"><li>Each save creates an immutable checkpoint.</li><li>Revision conflicts stop a save; there is no automatic transaction merge or real-time sync.</li><li>Restoring opens a separate workspace.</li><li>The access token authorizes access to ciphertext; the backup passphrase decrypts it on this device. Neither is saved by the connection form.</li><li>The service cannot reset an encryption passphrase. Keep downloaded backups and your passphrase separately.</li></ul></div></div>`;
}
function vault(){
  $('#vault .panel').innerHTML=head('This workspace','Where your records live.','Records stay on this device unless you explicitly export or save an encrypted checkpoint to a service you connect. This app has no analytics or tracking.')+
  `<div class="three"><div class="bk"><div class="kicker">Stored in this browser</div><p>Portfolios, theses and decisions are saved in local storage under <code>longhand-office.v1</code>. Clearing site data removes those copies and the vault connection identifier. Browser storage is not encrypted or protected by an app login.</p></div>
   <div class="bk"><div class="kicker">Durable local vault</div><p>An explicit migration first retains a browser recovery copy and downloads a complete backup, then creates a new SQLite workspace in <code>%LOCALAPPDATA%\\LonghandOffice\\data\\office.sqlite</code>, outside the OneDrive source folder. Nothing is migrated on page load.</p><button class="btn-line" disabled>Back up &amp; connect local vault</button></div>
   <div class="bk"><div class="kicker">Hosting boundary</div><p>Local access is not secure hosting. The local server listens only on 127.0.0.1. Hosted use requires real authentication, server-enforced user and workspace authorization, TLS, encryption and managed backups.</p></div></div>
  <p class="src" style="margin-top:10px">Your project folder is inside OneDrive; source files and any backups you save there may sync with your OneDrive account. Browser records are not written to that folder by the app.</p>
  <div class="sub">Market source data &amp; studies</div><div class="empty-row"><div><b>No source datasets retained.</b><p class="src">New provider datasets and distinct source studies use a separate, unencrypted device cache (maximum 4 MB). New workspace backups include them; older backups may omit them.</p></div><button class="btn-line" disabled>Export source data &amp; studies ↓</button><button class="btn-line" disabled>Restore source-data backup</button></div>
  <div class="sub">A foundation for the family office</div><p style="max-width:75ch">Treasury and Governance are planned. This release supports Paper simulations, manual Real investment records and the decisions around them. Before private hosting, the app needs server-enforced authentication, access control and an appropriate encrypted data store.</p>`;
}

function tabs(){
  const T=[['Coverage','#coverage'],['Publications','#publications'],['Dataset ledger','#ledger'],['Providers','#providers'],['Inspect & import','#inspect'],['Official sources','#official'],['Backup & recovery','#backup'],['Checkpoint sync','#sync'],['This workspace','#vault']];
  const nav=$('#mtabs');nav.innerHTML=`<span class="kicker">Sheet 06 — details 1–${T.length}</span><div class="seg" role="tablist">${T.map(([t,h],i)=>`<button role="tab" data-h="${h}" class="${i?'':'on'}"><span class="dn">${i+1}</span>${t}</button>`).join('')}</div>`;
  nav.querySelectorAll('button').forEach(b=>b.onclick=()=>{const t=$(b.dataset.h);if(t)window.scrollTo({top:t.getBoundingClientRect().top+scrollY-118,behavior:'smooth'})});
  const secs=T.map(([,h])=>$(h));const spy=()=>{let cur=secs[0];for(const s of secs)if(s.getBoundingClientRect().top<170)cur=s;nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.h==='#'+cur.id))};/* scroll spy replaced by sheet-views.js */
  T.forEach(([,h],i)=>{const d=$(h+' .sec-head>div:first-child');if(!d||d.querySelector('.dbub'))return;const inner=d.innerHTML;d.innerHTML=`<span class="dbub" aria-label="Detail ${i+1} of sheet 06"><b>${i+1}</b><i>06</i></span><div class="ttl">${inner}</div>`;const k=d.querySelector('.kicker');if(k)k.textContent=`Detail ${i+1} · `+k.textContent});
}
const _ledger=ledger;
function all(){coverage();publications();ledger();providers();inspect();official();backup();sync();vault();tabs()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',all):all();
// keep the ledger's detail bubble after re-render
const relabel=()=>{const d=$('#ledger .sec-head>div:first-child');if(d&&!d.querySelector('.dbub')){const inner=d.innerHTML;d.innerHTML=`<span class="dbub" aria-label="Detail 3 of sheet 06"><b>3</b><i>06</i></span><div class="ttl">${inner}</div>`;const k=d.querySelector('.kicker');if(k)k.textContent='Detail 3 · '+k.textContent}};
new MutationObserver(relabel).observe(document.getElementById('ledger'),{childList:true,subtree:true});
})();
