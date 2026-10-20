import test from 'node:test';
import assert from 'node:assert/strict';
import {versionMacroAssets} from '../scripts/pages-asset-version.mjs';
const fixture=()=>({'index.html':'<head><link rel="stylesheet" href="macro-context.css"></head><script src="theme.js"></script><script type="module" src="app.js"></script>', 'app.js':"import {mountMacro} from './macro-ui.js';\nconst KEY='longhand-office.browser.records.'+new URL('.',location.href).pathname+'v1';",'macro-ui.js':"import './macro-atlas.js';import './market-view.js';import './macro-context-ui.js';",'macro-atlas.js':"import './macro-context-ui.js';",'macro-chart.js':"import './macro-context-math.js';",'macro-context-ui.js':"import './macro-chart.js';import './macro-context-contract.js';import './macro-context-math.js';fetch(new URL('./data/macro-context.json',import.meta.url),{cache:'no-store'});",'macro-context-math.js':"import './macro-context-contract.js';",'macro-context-contract.js':'export const version=1;','quant-math.js':"import './quant-contract.js';export const result=x=>x*x;",'quant-contract.js':'export const version=1;','macro-context.css':'.macro-context{color:inherit}'});
test('Macro asset versioning is deterministic, input-order independent and does not mutate sources',()=>{const input=fixture(),before=JSON.stringify(input),a=versionMacroAssets(input),b=versionMacroAssets(Object.fromEntries(Object.entries(input).reverse()));assert.equal(a.version,b.version);assert.equal(JSON.stringify(input),before);assert.match(a.version,/^[a-f0-9]{16}$/);});
test('The entrypoint and every shared macro dependency use the same release query',()=>{const {version,assets}=versionMacroAssets(fixture());assert.ok(assets['index.html'].includes('app.js?office='+version));assert.ok(assets['index.html'].includes('macro-context.css?office='+version));for(const file of ['app.js','macro-ui.js','macro-atlas.js','macro-context-ui.js','macro-context-math.js']){assert.ok(assets[file].includes('?office='+version));assert.equal((assets[file].match(/(?:macro-chart|macro-ui|macro-atlas|macro-context-contract|macro-context-math|macro-context-ui|market-view)\.js['"]/g)||[]).length,0);}});
test('Financial module bytes, acquisition URLs and personal storage addresses are preserved',()=>{const input=fixture(),{assets}=versionMacroAssets(input);for(const file of ['quant-math.js','quant-contract.js'])assert.equal(assets[file],input[file]);assert.ok(assets['app.js'].includes("const KEY='longhand-office.browser.records.'+new URL('.',location.href).pathname+'v1';"));assert.ok(assets['macro-context-ui.js'].includes("new URL('./data/macro-context.json',import.meta.url)"));const base='https://example.com/longhand-office/';assert.equal(new URL('./data/macro-context.json',new URL('macro-context-ui.js?office=123',base)).href,base+'data/macro-context.json');});
test('A code or style change creates a new asset identity while identical releases keep it',()=>{const input=fixture(),first=versionMacroAssets(input);input['macro-context.css']+='\nbody{color:red}';assert.notEqual(versionMacroAssets(input).version,first.version);assert.equal(versionMacroAssets(fixture()).version,first.version);});
test('Missing entrypoint rejects rather than silently shipping a mixed cached release',()=>{assert.throws(()=>versionMacroAssets({...fixture(),'index.html':'<head></head>'}));});

test('Workspace UI imports share the release identity while model code stays unchanged',()=>{
 const input={...fixture(),'research-lab.js':"import './workspace-shell.js';import './market-data-ui.js';",'workspace-shell.js':"import './workspace-navigation.js';",'workspace-navigation.js':'export const pages=[];','market-data-ui.js':"import './quant-math.js';"};
 input['app.js']+="\nimport './research-lab.js';import './workspace-shell.js';import './market-data-ui.js';";
 const {version,assets}=versionMacroAssets(input);
 for(const file of ['app.js','research-lab.js','workspace-shell.js'])assert.doesNotMatch(assets[file],/(?:workspace-shell|workspace-navigation|research-lab|market-data-ui)\.js['"]/);
 assert.ok(assets['research-lab.js'].includes('workspace-shell.js?office='+version));
 assert.equal(assets['quant-math.js'],input['quant-math.js']);
 assert.equal(assets['market-data-ui.js'],input['market-data-ui.js']);
});

test('The application versions the Markets bridge so a cached bridge cannot pin an older macro graph',()=>{
 const input={...fixture(),'market-terminal.js':"import './macro-ui.js';import './market-view.js';import './market-catalogue.js';"};
 input['app.js']+="\nimport './market-terminal.js';";
 const {version,assets}=versionMacroAssets(input);
 assert.ok(assets['app.js'].includes("'./market-terminal.js?office="+version+"'"));
 for(const name of ['macro-ui','market-view','market-catalogue'])assert.ok(assets['market-terminal.js'].includes("'./"+name+".js?office="+version+"'"));
});

test('New performance, accountability and vault modules share their installed backup module identity',()=>{
 const names=['private-vault-ui','private-vault-client','complete-backup','performance-ui','portfolio-performance','model','model-accountability','prediction-ui','prediction-math','research-layout','market-data-storage','quarterly-regime'];
 const input=fixture();input['app.js']+='\n'+names.map(n=>`import './${n}.js';`).join('');for(const n of names)input[n+'.js']="import './complete-backup.js';import './model.js';";
 const {version,assets}=versionMacroAssets(input);for(const n of names)assert.ok(assets['app.js'].includes(`./${n}.js?office=${version}`));
 for(const n of names)assert.ok(assets[n+'.js'].includes(`./complete-backup.js?office=${version}`));
 assert.equal(assets['quant-math.js'],input['quant-math.js']);
});
