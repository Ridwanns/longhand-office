// Sheet 06 Records & Data Sources: page markup and mount. Markup from design/preview/records.html; the header is the Office's own.
// The Office's working backup, checkpoint-sync and vault components are rendered (hidden) with the page so their own
// mounts run unchanged, then moved into the sheet's sections. Nothing about how they save, restore or export changes.
import {loadSheetData,hostSheet} from './sheet-host.js';
import {mountRecordsSections} from './sheet-records-sections.js';
import {mountSheetViews} from './sheet-views.js';
let host=null;
export function recordsSheetPage(live){return `<div class="lh-sheet lh-sheet-records" data-sheet="records"><nav class="mtabs" id="mtabs" aria-label="Sheet 06 Records & Data Sources sections"></nav><div class="lh-sheet-body"><section class="msec lead-sec"><div class="kicker">Sheet 06 · Records & Data Sources · know the evidence, keep a copy</div><h1>Choose the evidence before running the analysis.</h1><p class="dek">Every number in the Office comes from a dated public source or from your own records. This sheet shows what is connected, what is missing or old, and how your records are kept, backed up and restored.</p></section><section class="msec" id="coverage"><div class="panel glass"></div></section><section class="msec" id="publications"><div class="panel glass"></div></section><section class="msec" id="ledger"><div class="panel glass"></div></section><section class="msec" id="providers"><div class="panel glass"></div></section><section class="msec" id="inspect"><div class="panel glass"></div></section><section class="msec" id="official"><div class="panel glass"></div></section><section class="msec" id="backup"><div class="panel glass"></div></section><section class="msec" id="sync"><div class="panel glass"></div></section><section class="msec" id="vault"><div class="panel glass"></div></section></div><div class="lh-sheet-foot"><span>Coverage: the Office public-data report, with the same attention rules as Data Sources.</span><span>No analytics or tracking. Nothing on this sheet uploads your records.</span></div></div><div class="lh-live-holder" hidden>${live}</div>`;}
const PLACE={backup:[['.complete-backup',true],['.records-panel > section:nth-of-type(2)',false]],sync:[['.private-vault-panel',true]],vault:[['.records-panel > section:nth-of-type(1)',false],['.vault-panel',false],['.workspace-health',false],['.records-panel > section:nth-of-type(3)',false]]};
function placeLive(root){
 const holder=root.parentElement.querySelector('.lh-live-holder');if(!holder)return;
 for(const [name,parts] of Object.entries(PLACE)){const slot=root.querySelector(`[data-embed="${name}"]`);if(!slot)continue;
  // the sheet's heading already says what the component's own intro says
  for(const [selector,intro] of parts){const el=holder.querySelector(selector);if(!el)continue;if(intro)el.classList.add('lh-intro-hidden');slot.append(el);}
  if(!slot.children.length)slot.innerHTML='<p class="src">This part of the workspace is not available in this edition of the Office.</p>';}
}
export async function mountRecordsSheet(){
 const root=document.querySelector('[data-sheet="records"]');if(!root)return;host?.stop();host=hostSheet(root);const own=host;
 try{await loadSheetData(['records-sheet']);}
 catch{if(root.isConnected){const holder=root.parentElement.querySelector('.lh-live-holder');if(holder)holder.hidden=false;root.querySelector('.lead-sec .dek').textContent='The published coverage report could not be read. Your backup and vault tools are below.';}return;}
 if(!root.isConnected||own!==host)return;
 mountRecordsSections();placeLive(root);mountSheetViews(host.listen,'records');
}
