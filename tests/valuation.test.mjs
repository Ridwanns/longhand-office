import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {valuation,validate,validateValuation} from '../model.js';
const sample=JSON.parse(await readFile(new URL('../valuation-example.json',import.meta.url),'utf8'));
const copy=()=>structuredClone(sample.portfolios[0]);
const asOf='2026-10-12';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} differs from ${b}`);

test('independent supplied-price example: total 5163, unrealized 127, largest 20.143328%',()=>{
 const v=valuation(copy(),asOf);assert.equal(v.total,5163);assert.equal(v.cashBalance,3223);assert.equal(v.complete,true);
 assert.deepEqual(v.rows.map(r=>[r.symbol,r.quantity,r.cost,r.marketValue,r.unrealized]),[['ALPHA',8,808,1040,232],['BETA',20,1005,900,-105]]);
 near(v.rows[0].weight,1040/5163*100);near(v.rows[1].weight,900/5163*100);assert.equal(v.largest.symbol,'ALPHA');near(v.largest.weight,1040/5163*100);
 assert.equal(v.buckets[0].pricedHoldings,1940);assert.equal(v.rows.reduce((n,r)=>n+r.unrealized,0),127);
});
test('a missing price remains null and suppresses complete total and concentration',()=>{
 const p=copy();p.valuations.pop();const v=valuation(p,asOf);assert.equal(v.rows[1].marketValue,null);assert.equal(v.rows[1].unrealized,null);assert.equal(v.total,null);assert.equal(v.complete,false);assert.equal(v.largest,null);assert.equal(v.missing,1);assert.equal(v.buckets[0].subtotal,4263);assert.ok(v.rows.every(r=>r.weight===null));
});
test('outdated prices retain dated values but suppress a complete total and weights',()=>{
 const p=copy();p.valuations[0].date='2026-08-20';const v=valuation(p,asOf);assert.equal(v.outdated,1);assert.equal(v.rows[0].state,'outdated');assert.equal(v.rows[0].marketValue,1040);assert.equal(v.total,null);assert.equal(v.buckets[0].subtotal,5163);assert.ok(v.rows.every(r=>r.weight===null));
});
test('30 days is current, 31 days is outdated',()=>{
 const p=copy();p.valuations[0].date='2026-09-12';assert.equal(valuation(p,asOf).rows[0].state,'current');p.valuations[0].date='2026-09-11';assert.equal(valuation(p,asOf).rows[0].state,'outdated');
});
test('currency buckets are never added or used for cross-currency unrealized P/L',()=>{
 const p=copy();p.valuations[1].currency='EUR';const v=valuation(p,asOf);assert.equal(v.total,null);assert.equal(v.largest,null);assert.equal(v.currencyMismatch,1);assert.equal(v.rows[1].unrealized,null);assert.deepEqual(v.buckets.map(b=>[b.currency,b.subtotal]),[['USD',4263],['EUR',900]]);near(v.rows[0].weight,1040/4263*100);assert.equal(v.rows[1].weight,100);assert.ok(v.rows[1].weightBasis.includes('EUR priced holdings only'));
});
test('unknown cash permits only a priced-holdings subtotal',()=>{
 const p=copy();delete p.openingCash;const v=valuation(p,asOf);assert.equal(v.total,null);assert.equal(v.cashBalance,null);assert.equal(v.buckets[0].subtotal,1940);assert.equal(v.largest,null);assert.ok(v.rows.every(r=>r.weight===null));
});
test('explicit zero price is distinct from missing price',()=>{
 const p=copy();p.valuations[0].price=0;const v=valuation(p,asOf);assert.equal(v.complete,true);assert.equal(v.rows[0].marketValue,0);assert.equal(v.rows[0].unrealized,-808);assert.equal(v.total,4123);assert.equal(v.rows[0].weight,0);assert.equal(v.largest.symbol,'BETA');
});
test('zero total does not divide by zero or invent concentration',()=>{
 const p=copy();p.transactions.pop();p.openingCash=2015;p.valuations.forEach(q=>q.price=0);const v=valuation(p,asOf);assert.equal(v.total,0);assert.equal(v.largest,null);assert.ok(v.rows.every(r=>r.weight===null));
});
test('future prices are not used before their date',()=>{
 const v=valuation(copy(),'2026-10-11');assert.equal(v.total,null);assert.equal(v.missing,2);assert.equal(v.rows[0].state,'future');assert.equal(v.rows[0].marketValue,null);assert.equal(v.buckets[0].subtotal,3223);
});
test('latest eligible price wins by date; same-date ties use recorded order',()=>{
 const p=copy();p.valuations.push({...p.valuations[0],id:'earlier',date:'2026-10-10',price:111});assert.equal(valuation(p,asOf).rows[0].quote.price,130);p.valuations.push({...p.valuations[0],id:'same-day-new',price:140});assert.equal(valuation(p,asOf).rows[0].quote.price,140);p.valuations.push({...p.valuations[0],id:'future',date:'2026-10-13',price:900});assert.equal(valuation(p,asOf).rows[0].quote.price,140);
});
test('historical assessment excludes future trades and uses historical recorded cost',()=>{
 const p=copy();p.valuations.push({id:'history-price',symbol:'ALPHA',date:'2026-10-01',price:110,currency:'USD',source:''});const v=valuation(p,'2026-10-01');assert.equal(v.rows.length,1);assert.equal(v.rows[0].quantity,10);assert.equal(v.rows[0].cost,1010);assert.equal(v.rows[0].unrealized,90);assert.equal(v.cashBalance,3990);assert.equal(v.total,5090);
});
test('cash-only portfolio has no position concentration and needs no prices',()=>{
 const p=copy();p.transactions=[];p.valuations=[];const v=valuation(p,asOf);assert.equal(v.total,5000);assert.equal(v.rows.length,0);assert.equal(v.largest,null);
});
test('closed holdings retain price history but do not require valuation prices',()=>{
 const p=copy();p.transactions.push({id:'close-a',symbol:'ALPHA',date:'2026-10-04',side:'Sell',quantity:8,price:100,fee:0,note:'TEST'}, {id:'close-b',symbol:'BETA',date:'2026-10-04',side:'Sell',quantity:20,price:50,fee:0,note:'TEST'});p.valuations=[];const v=valuation(p,asOf);assert.equal(v.rows.length,0);assert.equal(v.complete,true);assert.equal(v.total,5023);
});
test('fractional quantity and price multiplication uses decimal arithmetic',()=>{
 const p={currency:'USD',openingCash:1,transactions:[{id:'fractional',symbol:'F',date:asOf,side:'Buy',quantity:0.3,price:0.1,fee:0.01,note:'TEST'}],valuations:[{id:'fractional-price',symbol:'F',date:asOf,price:0.2,currency:'USD',source:''}]};const v=valuation(p,asOf);assert.equal(v.rows[0].marketValue,0.06);assert.equal(v.rows[0].unrealized,0.02);assert.equal(v.total,1.02);
});
test('old backups and valuation analysis do not mutate stored records',()=>{
 const d=structuredClone(sample);delete d.portfolios[0].valuations;const before=JSON.stringify(d);validate(d);valuation(d.portfolios[0],asOf);assert.equal(JSON.stringify(d),before);assert.equal(valuation(d.portfolios[0],asOf).missing,2);
});
test('valuation history and linked records survive backup round-trip',()=>assert.deepEqual(validate(JSON.parse(JSON.stringify(sample))),sample));
for(const [label,changes] of [['negative price',{price:-1}],['NaN price',{price:NaN}],['infinite price',{price:Infinity}],['invalid currency',{currency:'US'}],['lowercase currency',{currency:'usd'}],['invalid date',{date:'2026-02-31'}],['unknown instrument',{symbol:'UNKNOWN'}],['excess precision',{price:0.0000001}],['oversized source',{source:'x'.repeat(1001)}]]){
 test('rejects valuation '+label,()=>assert.throws(()=>validateValuation({...copy().valuations[0],...changes},copy())));
}
test('invalid or duplicate valuation records are rejected during restore',()=>{
 const d=structuredClone(sample);d.portfolios[0].valuations[0].price=-1;assert.throws(()=>validate(d));d.portfolios[0].valuations[0].price=130;d.portfolios[0].valuations[0].id=d.portfolios[0].transactions[0].id;assert.throws(()=>validate(d),/Duplicate/);
});
