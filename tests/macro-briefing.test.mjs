import test from 'node:test';
import assert from 'node:assert/strict';
import {macroEconomy,macroDeskRoute,MACRO_DESK_SECTIONS} from '../macro-navigation.js';
import {CONTEXT_COUNTRIES} from '../macro-context-contract.js';
import {EXTENDED_SERIES} from '../macro-extended-contract.js';
import {briefingReadings,renderMacroBriefing} from '../macro-briefing.js';

test('Shared macro scope retains legacy routes and gives every connected economy a reloadable route',()=>{
 assert.equal(macroDeskRoute('IDN','rates'),'#market/macro/id/rates');
 assert.equal(macroDeskRoute('MYS','overview'),'#market/macro/asean/overview/MYS');
 assert.equal(macroDeskRoute('CHN','economy'),'#market/macro/global/economy/CHN');
 assert.equal(macroEconomy({region:'global',economy:'KOR'}),'KOR');
 assert.equal(macroEconomy({region:'global'}),'WLD');
 for(const country of Object.keys(CONTEXT_COUNTRIES))for(const view of Object.keys(MACRO_DESK_SECTIONS))assert.match(macroDeskRoute(country,view),/^#market\/macro\//);
 for(const country of ['<script>','AFG',null])assert.equal(macroDeskRoute(country),null);
 assert.equal(macroDeskRoute('USA','<script>'),null);
});
test('Briefing is a read-only presentation of the existing source selection, including zero and missing coverage',()=>{
 const id='bis-CHE-policy-D',spec=EXTENDED_SERIES[id],sources={country:'CHE',extended:{series:[{id,frequency:'D',unit:spec.unit,sourceUrl:spec.sourceUrl,retrievedAt:'2026-10-18T12:00:00Z',observations:[{date:'2026-10-16',value:0,status:'reported'}]}]}},before=JSON.stringify(sources);
 const readings=briefingReadings(sources);assert.equal(readings.find(r=>r.key==='policy').item.latest.value,0);assert.equal(readings.find(r=>r.key==='yield').item,null);
 const html=renderMacroBriefing(sources);assert.match(html,/0\.0/);assert.match(html,/Not connected/);assert.match(html,/1 of 4 indicators connected/);assert.match(html,/not automatically added/);assert.equal(JSON.stringify(sources),before);
});
test('Briefing never invents changes for a one-point national release or fills a missing history',()=>{
 const sources={country:'CHN',extended:{series:[{id:'review-CHN-inflation',retrievedAt:'2026-10-18T12:00:00Z',observations:[{date:'2026-09-01',value:.9,status:'reported'}]}]}};
 const html=renderMacroBriefing(sources);assert.match(html,/Previous consecutive observation unavailable/);assert.match(html,/0\.9/);assert.match(html,/No verified history connected/);assert.doesNotMatch(html,/consensus was|buy signal|risk-on score/i);
});
test('Untrusted source notes and errors remain escaped in the briefing',()=>{
 const html=renderMacroBriefing({country:'IDN'},{errors:['TEST ONLY <img src=x onerror=alert(1)>']});assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);
});
