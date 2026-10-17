import test from 'node:test';
import assert from 'node:assert/strict';
import {WORKSPACES,WORKSPACE_PAGES,navigationState,findDestinations,sectionDestination} from '../workspace-navigation.js';

test('four workspaces preserve their existing landing routes',()=>{
 assert.deepEqual(WORKSPACES.map(w=>[w.label,w.route]),[['Overview','#overview'],['Markets','#market/us'],['Research Lab','#quant'],['Portfolio','#portfolios']]);
 assert.equal(new Set(WORKSPACE_PAGES.map(p=>p.id)).size,WORKSPACE_PAGES.length);
});
test('legacy destinations, nested macro and retained run routes retain their workspace',()=>{
 for(const [route,group] of [['overview','overview'],['market','markets'],['market/us','markets'],['market/idx','markets'],['market/bonds','markets'],['market/commodities','markets'],['market/macro/eu/markets','markets'],['quant','research'],['quant/run/retained-id','research'],['theses','research'],['library','research'],['portfolios','portfolio'],['portfolios/real','portfolio'],['portfolio/retained-id','portfolio'],['decisions','portfolio']])assert.equal(navigationState(route).workspace.id,group,route);
 assert.equal(navigationState('portfolio/retained-id','real').page.id,'real');
 assert.equal(navigationState('records').page.id,'records');
 assert.equal(navigationState('records').workspace,null);
});
test('finder aliases resolve to real existing controls or working navigation routes',()=>{
 for(const word of ['Valuation','Quant','Forecast','Options','Research','Portfolio','Backup','DCF','Greeks','theme','restore','Pluang','CSV','Data Sources'])assert.ok(findDestinations(word).length,word);
 assert.deepEqual(findDestinations('macro').map(p=>p.route),['#market/macro']);
 assert.equal(findDestinations('no-such-page-test-only').length,0);
 assert.ok(findDestinations('saved valuations').some(p=>p.id==='valuations'));
 assert.ok(WORKSPACE_PAGES.every(p=>p.action==='appearance'||/^#(?:overview|market(?:\/.*)?|quant(?:\/section\/\w+)?|portfolios(?:\/real)?|theses|library|decisions|records|data-sources)$/.test(p.route)));
});
test('section links use existing Quant jump keys, with no dynamic or executable targets',()=>{
 const keys=new Set(['ticker','valuation','models','research','predictions','manual','advanced','valuations','tickers','calculator','reference']);
 for(const p of WORKSPACE_PAGES.filter(p=>p.section)){assert.ok(keys.has(p.section));assert.equal(sectionDestination(p.route.slice(1)).section,p.section);}
 assert.equal(sectionDestination('quant/run/retained-id'),undefined);
 assert.equal(sectionDestination('quant/section/__proto__'),undefined);
});
