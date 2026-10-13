import test from 'node:test';
import assert from 'node:assert/strict';
import {empty,validate,holdings,ledger,checkTransaction} from '../model.js';
const buy={id:'tx1',date:'2026-10-01',symbol:'TEST',side:'Buy',quantity:10,price:100,fee:2,note:'User supplied simulation'};
test('backup round trip keeps linked thesis and reviewed decision',()=>{const d=empty();d.portfolios.push({id:'p',name:'Paper',currency:'IDR',transactions:[buy]});d.theses.push({id:'t',title:'An idea',symbol:'TEST',status:'Draft',assumptions:'a',evidence:'e',risks:'r',reviewDate:'2026-11-01',reports:['public-report']});d.decisions.push({id:'d',title:'Wait',date:'2026-10-01',reviewDate:'2026-11-01',rationale:'r',expected:'e',outcome:'Reviewed',thesisId:'t',status:'Reviewed',reports:['public-report']});assert.deepEqual(validate(JSON.parse(JSON.stringify(d))),d);});
test('holdings distinguish remaining cost from net cash outlay',()=>{const p={transactions:[buy,{...buy,id:'tx2',side:'Sell',quantity:4,price:110,fee:1}]};assert.deepEqual(holdings(p),[{symbol:'TEST',quantity:6,outlay:563,cost:601.2,averageCost:100.2,fees:3,realized:38.2}]);});
test('rejects overselling and backdated sales before first purchase',()=>{const p={transactions:[buy]};assert.throws(()=>checkTransaction(p,{...buy,side:'Sell',quantity:11}));assert.throws(()=>checkTransaction(p,{...buy,date:'2026-09-01',side:'Sell',quantity:1}));assert.doesNotThrow(()=>checkTransaction(p,{...buy,side:'Sell',quantity:10,date:'2026-10-02'}));});
test('rejects malformed backups, nonfinite figures and broken thesis links',()=>{assert.throws(()=>validate({version:2}));const d=empty();d.portfolios=[{id:'p',name:'Paper',currency:'USD',transactions:[{...buy,price:Infinity}]}];assert.throws(()=>validate(d));d.portfolios[0].transactions[0].price=100;d.decisions=[{id:'d',title:'Buy',date:'2026-10-01',reviewDate:'2026-11-01',rationale:'',expected:'',outcome:'',thesisId:'missing',status:'Open',reports:[]}];assert.throws(()=>validate(d));});

const transaction=(id,date,side,quantity,price,fee,symbol='TEST')=>({id,date,side,quantity,price,fee,symbol,note:'TEST ONLY — independently calculated prices'});
const example={id:'test-portfolio',name:'TEST ONLY — weighted-average example',currency:'USD',openingCash:10000,transactions:[transaction('a','2026-10-01','Buy',100,20,10),transaction('b','2026-10-02','Buy',50,24,5),transaction('c','2026-10-03','Sell',60,30,6),transaction('d','2026-10-04','Sell',30,18,3)]};

test('independent whole-share example: cash 9116, cost 1286, profit 402, fees 24',()=>{
 const r=ledger(example);
 assert.equal(r.cashBalance,9116);assert.equal(r.realized,402);assert.equal(r.fees,24);assert.equal(r.netCashFlow,-884);
 assert.deepEqual(r.entries.map(e=>e.cashBalance),[7990,6785,8579,9116]);
 assert.deepEqual(r.entries.map(e=>e.realized),[0,0,508,-106]);
 assert.deepEqual(r.holdings,[{symbol:'TEST',quantity:60,cost:1286,averageCost:21.433333,outlay:884,fees:24,realized:402}]);
 assert.equal(r.cashBalance+r.holdings[0].cost-example.openingCash,r.realized);
});
test('full liquidation clears cost and results in cash 10612 and realized profit 612',()=>{
 const r=checkTransaction(example,transaction('e','2026-10-05','Sell',60,25,4));
 assert.equal(r.cashBalance,10612);assert.equal(r.realized,612);assert.equal(r.fees,28);assert.equal(r.holdings[0].quantity,0);assert.equal(r.holdings[0].cost,0);
});
test('fractional quantities conserve cost and avoid binary arithmetic drift',()=>{
 const p={openingCash:1,transactions:[transaction('a','2026-10-01','Buy',0.3,0.1,0.01),transaction('b','2026-10-02','Sell',0.1,0.2,0.001)]};
 const r=ledger(p);assert.equal(r.cashBalance,0.979);assert.equal(r.holdings[0].quantity,0.2);assert.equal(r.holdings[0].cost,0.026667);assert.equal(r.realized,0.005667);
 const final=checkTransaction(p,transaction('c','2026-10-03','Sell',0.2,0.2,0.001));
 assert.equal(final.cashBalance,1.018);assert.equal(final.realized,0.018);assert.equal(final.fees,0.012);assert.equal(final.holdings[0].cost,0);
});
test('zero opening cash differs from unrecorded opening cash',()=>{
 assert.equal(ledger({transactions:[]}).cashBalance,null);
 assert.equal(ledger({openingCash:0,transactions:[]}).cashBalance,0);
 assert.throws(()=>checkTransaction({openingCash:0,transactions:[]},buy),/Insufficient/);
 assert.equal(ledger({transactions:[buy]}).cashBalance,null);
});
test('cash availability includes fees and rejects historically unfunded backdated purchases',()=>{
 assert.throws(()=>checkTransaction({openingCash:1000,transactions:[]},buy),/Insufficient/);
 assert.doesNotThrow(()=>checkTransaction({openingCash:1002,transactions:[]},buy));
 assert.throws(()=>checkTransaction(example,transaction('x','2026-09-30','Buy',400,20,0)),/Insufficient/);
});
test('instruments do not share quantities or cost bases',()=>{
 const r=checkTransaction(example,transaction('x','2026-10-05','Buy',10,5,1,'OTHER'));
 assert.equal(r.cashBalance,9065);assert.equal(r.holdings.find(p=>p.symbol==='OTHER').cost,51);assert.equal(r.holdings.find(p=>p.symbol==='TEST').quantity,60);
 assert.throws(()=>checkTransaction(example,transaction('x','2026-10-05','Sell',1,5,0,'OTHER')),/exceeds/);
});
for(const [label,changes] of [['negative quantity',{quantity:-1}],['zero quantity',{quantity:0}],['negative price',{price:-1}],['zero new price',{price:0}],['negative fee',{fee:-1}],['infinite price',{price:Infinity}],['NaN fee',{fee:NaN}],['empty symbol',{symbol:' '}],['impossible date',{date:'2026-02-31'}],['excess precision',{quantity:0.0000001}],['input out of range',{price:1e15}]]){
 test('rejects '+label,()=>assert.throws(()=>checkTransaction({transactions:[]}, {...buy,...changes})));
}
test('fractional oversell is rejected exactly, without a tolerance loophole',()=>assert.throws(()=>checkTransaction({transactions:[{...buy,quantity:0.3}]},{...buy,id:'sell',side:'Sell',quantity:0.300001}),/exceeds/));
test('same-day trades follow their recorded order',()=>{
 assert.doesNotThrow(()=>checkTransaction({transactions:[buy]},{...buy,id:'sell',side:'Sell'}));
 assert.throws(()=>ledger({transactions:[{...buy,id:'sell',side:'Sell'},buy]}),/exceeds/);
});
test('old backups preserve missing optional fields and higher precision without rewriting',()=>{
 const d=empty();d.portfolios.push({id:'legacy',name:'Legacy',currency:'USD',transactions:[{...buy,quantity:1.12345678}]});
 const before=JSON.stringify(d);assert.equal(validate(d),d);assert.equal(JSON.stringify(d),before);assert.equal(ledger(d.portfolios[0]).cashBalance,null);assert.equal(ledger(d.portfolios[0]).holdings[0].quantity,1.12345678);
});
test('new portfolio links survive backup round trip and missing portfolios are rejected',()=>{
 const d=empty();d.portfolios.push(example);d.decisions.push({id:'decision',title:'TEST decision',date:'2026-10-01',reviewDate:'2026-10-12',rationale:'Test',expected:'Test',outcome:'Test',thesisId:'',portfolioId:example.id,status:'Reviewed',reports:[]});
 assert.deepEqual(validate(JSON.parse(JSON.stringify(d))),d);d.decisions[0].portfolioId='missing';assert.throws(()=>validate(d),/portfolio link/);
});
test('invalid restored oversales and duplicate transaction IDs are rejected',()=>{
 const d=empty();d.portfolios=[structuredClone(example)];d.portfolios[0].transactions.push(transaction('invalid','2026-10-05','Sell',61,25,0));assert.throws(()=>validate(d),/exceeds/);
 d.portfolios[0].transactions.pop();d.portfolios[0].transactions[1].id=d.portfolios[0].transactions[0].id;assert.throws(()=>validate(d),/transaction/);
});
