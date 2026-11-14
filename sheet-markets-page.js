// Sheet 03 Markets: page markup and mount. Markup from design/preview/markets.html; the header is the Office's own.
import {loadSheetData,hostSheet} from './sheet-host.js';
import {mountMarketsDesks} from './sheet-markets-desks.js';
import {mountMarketsLead} from './sheet-markets-lead.js';
import {mountSheetViews} from './sheet-views.js';
let host=null;
export function marketsSheetPage(){return `<div class="lh-sheet lh-sheet-markets" data-sheet="markets"><nav class="mtabs" id="mtabs" aria-label="Markets desk sections"></nav><div class="lh-sheet-body"><section class="msec lead-sec"><div class="kicker">Sheet 03 · Markets · dated public snapshots, not real time</div><h1 id="mk-head">Markets</h1><p class="dek" id="mk-dek"></p></section><section class="msec" id="indices"><div class="panel glass"></div></section><section class="msec" id="us"><div class="panel glass"></div></section><section class="msec" id="idx"><div class="panel glass"></div></section><section class="msec" id="bonds"><div class="panel glass ust"></div></section><section class="msec" id="bondetf"><div class="panel glass"></div></section><section class="msec" id="commodities"><div class="panel glass"></div></section><section class="msec" id="msources"><div class="panel glass"></div></section></div><div class="lh-sheet-foot"><span>Prices: Yahoo Finance daily closes from the published Office snapshot, completed sessions. Treasury curve: U.S. Department of the Treasury.</span><span>Not investment advice. No orders are placed from the Office.</span></div></div>`;}
export async function mountMarketsSheet(){
 const root=document.querySelector('[data-sheet="markets"]');if(!root)return;host?.stop();host=hostSheet(root);const own=host;
 try{await loadSheetData(['markets-sheet']);}
 catch{if(root.isConnected)root.querySelector('#mk-dek').textContent='The published markets sheet could not be read. No values are shown in its place.';return;}
 if(!root.isConnected||own!==host)return;
 mountMarketsDesks(new URL('./sheet-data/',import.meta.url));mountMarketsLead();mountSheetViews(host.listen,'markets');
}
