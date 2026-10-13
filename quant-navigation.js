// In-page navigation only. No record writes, model requests or route replacement.
const sections=[
 {group:'Study',key:'ticker',label:'Ticker & source',target:'#ticker-form'},
 {group:'Analysis',key:'scenarios',label:'Scenarios',view:'scenarios'},
 {group:'Analysis',key:'returns',label:'Return models',view:'returns'},
 {group:'Analysis',key:'volatility',label:'Volatility · GARCH / HAR',view:'volatility'},
 {group:'Analysis',key:'regimes',label:'Market regimes · HMM',view:'regimes'},
 {group:'Analysis',key:'risk',label:'Tail risk · VaR / ES',view:'risk'},
 {group:'Analysis',key:'exposures',label:'Benchmark exposure',view:'exposures'},
 {group:'Analysis',key:'core',label:'Core model details',target:'.advanced-core-audit',requiresCore:true},
 {group:'Decision tools',key:'valuation',label:'Company valuation',target:'#atlas-automatic',atlas:'automatic'},
 {group:'Decision tools',key:'calculator',label:'Decision calculators',target:'#atlas-calculator',atlas:'calculator'},
 {group:'Decision tools',key:'research',label:'Options, bonds & portfolio',target:'#research-form'},
 {group:'Decision tools',key:'reference',label:'Atlas reference studies',target:'#atlas-reference',atlas:'reference'},
 {group:'Saved work',key:'models',label:'Saved model runs',target:'#quant-archive'},
 {group:'Saved work',key:'advanced',label:'Advanced model archive',target:'#advanced-archive'},
 {group:'Saved work',key:'valuations',label:'Saved valuations',target:'#auto-value-archive',atlas:'automatic'},
 {group:'Saved work',key:'tickers',label:'Saved ticker studies',target:'#ticker-archive'}
];
const office=[['#overview','The Office'],['#market/us','Market data'],['#portfolios','Paper portfolios'],['#portfolios/real','Real portfolios'],['#theses','Investment theses'],['#decisions','Decision journal'],['#library','Research library'],['#records','Office records & backups']];
const groups=[...new Set(sections.map(s=>s.group))];
let root,observer,frame,scrollFrame,lockedUntil=0;
export function quantNavigation(){return `<aside class="quant-sidebar" aria-label="Study navigator"><p class="eyebrow">INVESTMENT DESK</p><p class="quant-nav-asset" data-quant-nav-asset>No ticker selected</p><nav class="quant-nav-list" aria-label="Quant Lab sections">${groups.map(group=>'<div class="quant-nav-group"><p>'+group+'</p>'+sections.filter(s=>s.group===group).map(s=>'<button type="button" data-quant-jump="'+s.key+'"'+(s.view||s.requiresCore?' disabled title="Analyse a ticker first"':'')+(s.key==='ticker'?' aria-current="location"':'')+'>'+s.label+'</button>').join('')+'</div>').join('')}</nav><details class="quant-office-links"><summary>Office spaces</summary>${office.map(([href,label])=>'<a href="'+href+'">'+label+'</a>').join('')}</details><p class="quant-nav-help">Model sections unlock after an analysis completes.</p></aside><div class="quant-mobile-nav"><label for="quant-jump-menu">Navigate study <span data-quant-nav-asset>No ticker selected</span></label><select id="quant-jump-menu" aria-label="Navigate Quant Lab">${groups.map(group=>'<optgroup label="'+group+'">'+sections.filter(s=>s.group===group).map(s=>'<option value="'+s.key+'"'+(s.view||s.requiresCore?' disabled':'')+'>'+s.label+'</option>').join('')+'</optgroup>').join('')}<optgroup label="Office spaces">${office.map(([href,label])=>'<option value="office:'+href+'">'+label+'</option>').join('')}</optgroup></select></div>`;}
function available(){return !!root?.querySelector('#advanced-view')&&!root.querySelector('#quant-results')?.hidden;}
function coreAvailable(){return !!root?.querySelector('.advanced-core-audit')&&!root.querySelector('#quant-results')?.hidden;}
function setActive(key){if(!root?.isConnected)return;root.dataset.navigation=key;root.querySelectorAll('[data-quant-jump]').forEach(b=>{if(b.dataset.quantJump===key)b.setAttribute('aria-current','location');else b.removeAttribute('aria-current');});const menu=root.querySelector('#quant-jump-menu');if(menu&&sections.some(s=>s.key===key))menu.value=key;}
function sync(){if(!root?.isConnected){observer?.disconnect();observer=null;root=null;return;}const ready=available(),core=coreAvailable(),output=root.querySelector('#advanced-output'),ticker=root.querySelector('#ticker-output'),study=ready?output?._study:null,source=ticker?.hasChildNodes()?ticker._study:null,asset=study?study.source.market+' · '+study.source.ticker:source?source.instrument.market+' · '+source.instrument.ticker:'No ticker selected';root.querySelectorAll('[data-quant-nav-asset]').forEach(el=>{if(el.textContent!==asset)el.textContent=asset;});root.querySelectorAll('[data-quant-jump]').forEach(b=>{const item=sections.find(s=>s.key===b.dataset.quantJump);b.disabled=!!item.view&&!ready||!!item.requiresCore&&!core;});root.querySelectorAll('#quant-jump-menu option').forEach(o=>{const item=sections.find(s=>s.key===o.value);o.disabled=!!item?.view&&!ready||!!item?.requiresCore&&!core;});const help=root.querySelector('.quant-nav-help'),message=ready?'Choose a section. Results stay on this page.':core?'Core results are available. Advanced sections appear when ready.':'Analyse a ticker to unlock model sections.';if(help.textContent!==message)help.textContent=message;if(!ready&&sections.find(s=>s.key===root.dataset.navigation)?.view)setActive('ticker');}
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(sync);}
function ancestors(target){for(let p=target;p&&p!==root;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;}
function offset(){const mobile=root?.querySelector('.quant-mobile-nav');return mobile&&getComputedStyle(mobile).display!=='none'?mobile.getBoundingClientRect().height+16:22;}
function go(key){if(!root?.isConnected)return;if(key.startsWith('office:')){location.hash=key.slice(7);return;}const item=sections.find(s=>s.key===key);if(!item)return;if(item.view&&!available()||item.requiresCore&&!coreAvailable()){root.querySelector('#automatic-ticker')?.focus();return;}document.dispatchEvent(new CustomEvent('office:quant-navigation',{detail:{key}}));
 if(item.atlas)root.querySelector('[data-atlas-view="'+item.atlas+'"]')?.click();
 let target;if(item.view){const select=root.querySelector('#advanced-view');if(select.value!==item.view){select.value=item.view;select.dispatchEvent(new Event('change',{bubbles:true}));}target=root.querySelector('#advanced-view-output');}else target=root.querySelector(item.target);if(!target)return;ancestors(target);lockedUntil=performance.now()+400;setActive(key);target.classList.add('quant-jump-target');if(!target.hasAttribute('tabindex'))target.tabIndex=-1;target.setAttribute('aria-label',item.label);(key==='ticker'?root.querySelector('#automatic-ticker'):target).focus({preventScroll:true});window.scrollTo({top:Math.max(0,target.getBoundingClientRect().top+scrollY-offset()),behavior:'auto'});
}
function followScroll(){if(!root?.isConnected||performance.now()<lockedUntil)return;const line=offset()+20,advanced=root.querySelector('#advanced-study');if(available()&&advanced){const r=advanced.getBoundingClientRect();if(r.top<=line&&r.bottom>line){setActive(root.querySelector('#advanced-view').value);return;}}
 const candidates=sections.filter(s=>s.target).map(s=>({s,el:root.querySelector(s.target)})).filter(x=>x.el&&x.el.getClientRects().length&&x.el.closest('details:not([open])')===null).map(x=>({...x,r:x.el.getBoundingClientRect()})).filter(x=>x.r.top<=line&&x.r.bottom>0).sort((a,b)=>b.r.top-a.r.top);if(candidates[0])setActive(candidates[0].s.key);
}
export function mountQuantNavigation(){const next=document.querySelector('.quant-room');if(!next)return;if(root!==next){observer?.disconnect();root=next;lockedUntil=0;setActive('ticker');observer=new MutationObserver(schedule);observer.observe(root.querySelector('.quant-content'),{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','open']});}schedule();}
document.addEventListener('click',e=>{const button=e.target.closest('[data-quant-jump]');if(button&&!button.disabled)go(button.dataset.quantJump);});
document.addEventListener('change',e=>{if(e.target.id==='quant-jump-menu')go(e.target.value);if(e.target.id==='advanced-view')setActive(e.target.value);});
window.addEventListener('scroll',()=>{cancelAnimationFrame(scrollFrame);scrollFrame=requestAnimationFrame(followScroll);},{passive:true});
window.addEventListener('hashchange',schedule);
