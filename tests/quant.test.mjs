import test from 'node:test';
import assert from 'node:assert/strict';
import {historical,fitRidge,fitAR,forecast,simulate,analyze} from '../quant-math.js';
import {configFor,normalizeHistory,hash} from '../scripts/quant-data.mjs';
import {fixture} from './quant-fixture.mjs';
const ds=fixture(),prices=ds.observations.map(x=>x.price),r=historical(prices).returns,config=configFor({ticker:'AAPL',market:'US',cutoff:'2026-10-12',horizon:5});
test('independent four-price example: max drawdown -25%, sample log volatility, 95% VaR and ES',()=>{
 const h=historical([100,120,90,108]);assert.equal(h.maxDrawdown,-.25);
 const rs=[Math.log(1.2),Math.log(.75),Math.log(1.2)],m=(rs[0]+rs[1]+rs[2])/3,s=Math.sqrt(rs.reduce((a,x)=>a+(x-m)**2,0)/2);
 assert.ok(Math.abs(h.annualizedVolatility-s*Math.sqrt(252))<1e-12);
 assert.ok(Math.abs(h.risk.var-.205)<1e-12);assert.ok(Math.abs(h.risk.expectedShortfall-.25)<1e-12);assert.equal(h.risk.sampleSize,3);
});
test('AR and Ridge fit do not change when all future returns are replaced',()=>{
 const origin=350,changed=[...r];for(let i=origin+1;i<changed.length;i++)changed[i]=9;
 for(const h of [5,20]){assert.deepEqual(fitRidge(r,origin,h),fitRidge(changed,origin,h));assert.deepEqual(fitAR(r,origin,h),fitAR(changed,origin,h));}
});
test('Ridge preprocessing uses only matured training feature rows',()=>{
 const o=350,h=20,fit=fitRidge(r,o,h);assert.equal(fit.training.lastLabelEnd,o);assert.equal(fit.training.lastOrigin,o-h);
 const manual=[];for(let i=19;i+h<=o;i++)manual.push(r[i]);
 assert.ok(Math.abs(fit.parameters.means[0]-manual.reduce((a,x)=>a+x,0)/manual.length)<1e-15);
});
test('forecast audit purges immature labels and scores non-overlapping future target windows',()=>{
 for(const h of [5,20]){const f=forecast(r,h);f.audit.forEach((a,i)=>{assert.ok(a.ridgeLastLabelEnd<=a.origin);assert.ok(a.arLastLabelEnd<=a.origin);if(i)assert.equal(a.origin,f.audit[i-1].targetEnd);});
 const scores=f.models[0].scores;assert.ok(scores.length>0);scores.forEach(x=>assert.ok(Math.abs(x.actual-r.slice(x.origin+1,x.origin+h+1).reduce((a,v)=>a+v,0))<1e-12));
 assert.equal(f.models.find(m=>m.name==='Zero').zeroPredictions,scores.length);assert.equal(f.models.find(m=>m.name==='Zero').directionAccuracy,0);}
});
test('interval requires 20 eligible errors; larger horizons expose unavailable intervals',()=>{const f=forecast(r,20);assert.ok(f.models.every(m=>m.count<20&&m.interval===null));});
test('seeded simulation reproduces exactly and responds to seed and price changes',()=>{assert.deepEqual(simulate(prices,5,42),simulate(prices,5,42));assert.notEqual(hash(simulate(prices,5,42)),hash(simulate(prices,5,43)));assert.notEqual(hash(simulate(prices,5,42)),hash(simulate(prices.map(x=>x*2),5,42)));});
test('minimum history and missing prices fail honestly',()=>{assert.throws(()=>analyze(fixture('TEST',100),config),/Insufficient history/);const bad=fixture();bad.observations[1].price=0;assert.throws(()=>analyze(bad,config),/Invalid/);});
test('supported config is validated before acquisition with no arbitrary proxy inputs',()=>{for(const x of [{ticker:'https://x'},{ticker:'^GSPC'},{market:'FX'},{horizon:1},{seed:0},{cutoff:'2026-02-30'},{basis:'invented'}])assert.throws(()=>configFor({...config,...x}));assert.equal(configFor({...config,ticker:'brk.b'}).ticker,'BRK-B');});
test('cutoff excludes later and incomplete sessions without substituting missing closes',()=>{
 const rows=[{date:'2026-10-01',rawClose:100,adjustedClose:90},{date:'2026-10-02',rawClose:null,adjustedClose:null},{date:'2026-10-05',rawClose:110,adjustedClose:99},{date:'2026-10-06',rawClose:120,adjustedClose:108,complete:false}];
 const d=normalizeHistory(rows,{...config,cutoff:'2026-10-06',basis:'adjusted'},{});assert.equal(d.observations.length,1);assert.equal(d.observations[0].price,99);assert.equal(d.metadata.excludedSegmentRows,1);assert.equal(d.metadata.omissions.length,2);
});
test('material >10-calendar-day gap starts a new segment and duplicate dates reject',()=>{const rows=[{date:'2026-01-01',rawClose:1},{date:'2026-02-01',rawClose:2}];const d=normalizeHistory(rows,{...config,basis:'raw'},{});assert.equal(d.observations.length,1);assert.throws(()=>normalizeHistory([rows[0],rows[0]],{...config,basis:'raw'},{}),/Duplicate/);});
test('missing latest completed close does not silently shift the analysis to an older session',()=>{assert.throws(()=>normalizeHistory([{date:'2026-10-01',rawClose:100},{date:'2026-10-02',rawClose:null}],{...config,basis:'raw'},{}),/Latest completed session 2026-10-02/);});
test('same dataset/config yields identical analysis hash and parameters',()=>assert.equal(hash(analyze(ds,config)),hash(analyze(ds,config))));
