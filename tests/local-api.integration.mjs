import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
// Test requests hit the real isolated loopback server; no portfolio writes.
const base='http://127.0.0.1:4174';
test('local MSN directory and routes enforce same origin, bounded symbols and backend file isolation',async()=>{
 const dir=await fetch(base+'/api/market/idx-msn/symbols');assert.equal(dir.status,200);const list=await dir.json();assert.equal(list.tickers.length,896);assert.ok(list.tickers.includes('BBCA')&&list.tickers.includes('ADRO'));assert.equal(dir.headers.get('access-control-allow-origin'),null);
 for(const headers of [{Origin:'https://foreign.example'},{'Sec-Fetch-Site':'cross-site'}])assert.equal((await fetch(base+'/api/market/idx-msn/read?symbol=BBCA',{headers})).status,403);
 for(const symbol of ['','../secret','AAPL.US','ABC'])assert.equal((await fetch(base+'/api/market/idx-msn/read?symbol='+encodeURIComponent(symbol))).status,400);
 assert.equal((await fetch(base+'/api/market/idx-msn/read?symbol=ZZZZ')).status,404);
 assert.equal((await fetch(base+'/api/market/idx-msn/read?symbol=BBCA',{method:'POST'})).status,405);
 for(const path of ['/scripts/idx-msn-adapter.mjs','/scripts/idx-msn-symbols.tsv','/.tools/idx-cli-review/quotes.json','/api/market/idx-msn/proxy?url=https://foreign.example'])assert.equal((await fetch(base+path)).status,404);
});
test('local API requires same origin and fresh token for mutations',async()=>{
 const status=await fetch(base+'/api/local/status');assert.equal(status.status,200);const {token}=await status.json();
 for(const headers of [{},{Origin:base},{Origin:'https://foreign.example','X-Office-Token':token},{Origin:base,'X-Office-Token':'invalid'}]){
  const r=await fetch(base+'/api/local/workspace',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({id:'invalid'})});assert.equal(r.status,403);
 }
 const invalid=await fetch(base+'/api/local/workspace',{method:'POST',headers:{Origin:base,'Content-Type':'application/json','X-Office-Token':token},body:'{"id":"invalid","revision":0,"data":{}}'});assert.equal(invalid.status,400);
 assert.equal((await fetch(base+'/api/local/status',{headers:{Origin:'https://foreign.example'}})).status,403);
});
test('unknown backup envelopes reject, with no mutation or misleading legacy fallback',async()=>{const {token}=await fetch(base+'/api/local/status').then(r=>r.json()),headers={Origin:base,'Content-Type':'application/json','X-Office-Token':token};for(const extra of [{format:'another-application',formatVersion:2},{formatVersion:2},{format:'longhand-office-backup',formatVersion:999}]){const r=await fetch(base+'/api/local/validate-backup',{method:'POST',headers,body:JSON.stringify({version:1,portfolios:[],theses:[],decisions:[],...extra})});assert.equal(r.status,400);assert.match((await r.json()).error,/Incompatible/);}});
test('starting a second server cannot reopen jobs or change the running server session',async()=>{const before=await fetch(base+'/api/local/status').then(r=>r.json());const outcome=await new Promise((resolve,reject)=>{const p=spawn(process.execPath,['scripts/serve.mjs','--port','4174'],{cwd:process.cwd(),windowsHide:true});let output='';p.stdout.on('data',d=>output+=d);p.stderr.on('data',d=>output+=d);p.on('error',reject);p.on('exit',code=>resolve({code,output}));});assert.equal(outcome.code,1);assert.match(outcome.output,/already running/);const after=await fetch(base+'/api/local/status').then(r=>r.json());assert.equal(after.token,before.token);});
test('host-header rebinding and unsupported methods/routes are rejected',async()=>{
 const status=await new Promise((resolve,reject)=>{const req=http.get(base+'/api/local/status',{headers:{Host:'foreign.example:4174'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);});assert.equal(status,403);
 assert.equal((await fetch(base+'/api/local/status',{method:'DELETE'})).status,405);
 assert.equal((await fetch(base+'/api/local/proxy?url=https://foreign.example')).status,404);
 const malformed=await new Promise((resolve,reject)=>{const req=http.get({hostname:'127.0.0.1',port:4174,path:'//',headers:{Host:'127.0.0.1:4174'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);});assert.equal(malformed,400);assert.equal((await fetch(base+'/api/local/status')).status,200);
});
