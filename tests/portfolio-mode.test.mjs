import test from 'node:test';
import assert from 'node:assert/strict';
import {empty,validate,ledger} from '../model.js';
const portfolio={id:'legacy',name:'TEST ONLY — legacy paper',currency:'USD',openingCash:1000,transactions:[]};
test('legacy portfolio remains unchanged, including absent mode',()=>{const data={...empty(),portfolios:[structuredClone(portfolio)]},before=JSON.stringify(data);validate(data);assert.equal(JSON.stringify(data),before);assert.equal(data.portfolios[0].mode,undefined);});
test('paper and real types survive export restore alongside linked decisions',()=>{const data={...empty(),portfolios:[{...portfolio,mode:'paper'},{...portfolio,id:'real',name:'TEST ONLY — real-type fixture',mode:'real'}],decisions:[{id:'d',title:'TEST ONLY',date:'2026-10-13',reviewDate:'2026-11-13',rationale:'',expected:'',outcome:'',thesisId:'',portfolioId:'real',reports:[],status:'Open'}]};assert.deepEqual(validate(JSON.parse(JSON.stringify(data))),data);});
test('unknown or malformed portfolio modes are rejected',()=>{for(const mode of ['live','Paper',null,1,{}])assert.throws(()=>validate({...empty(),portfolios:[{...portfolio,mode}]}),/mode/);});
test('classification does not change transaction calculations',()=>{const transactions=[{id:'buy',date:'2026-10-13',side:'Buy',symbol:'TEST',quantity:2,price:100,fee:1,note:'TEST ONLY'}];assert.deepEqual(ledger({...portfolio,mode:'real',transactions}),ledger({...portfolio,mode:'paper',transactions}));});
