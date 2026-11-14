import test from 'node:test';
import assert from 'node:assert/strict';
import {projectMarketSnapshot} from '../scripts/market-adapter.mjs';
import {validatePublicQuote} from '../public-quote-contract.js';
// TEST ONLY synthetic prices. On 14 Nov 2026 the provider began reporting OJ=F as ALTSYMBOL on NYB (ICE Futures) in USX.
const at='2026-11-13T22:00:00.000Z',raw=()=>({chart:{result:[{meta:{symbol:'OJ=F',instrumentType:'ALTSYMBOL',currency:'USX',exchangeName:'NYB',exchangeTimezoneName:'America/New_York',regularMarketPrice:250.5,regularMarketTime:Date.parse('2026-11-13T18:59:59Z')/1000},timestamp:[Date.parse('2026-11-12T18:00:00Z')/1000,Date.parse('2026-11-13T18:00:00Z')/1000],indicators:{quote:[{close:[248.1,250.5]}]}}]}});
test('Orange juice futures with the provider alias keep USX cents and the FUTURE contract class',()=>{const q=projectMarketSnapshot(raw(),'commodities','OJ=F',at);assert.equal(q.price,250.5);assert.equal(q.currency,'USX');assert.equal(q.unit,'US cents / pound');assert.equal(q.instrumentType,'FUTURE');assert.equal(q.sourceInstrumentType,'ALTSYMBOL');assert.equal(q.sourceExchange,'NYB');assert.equal(validatePublicQuote(q,'commodities','OJ=F',at),q);});
test('The OJ allowance rejects another exchange, a USD price (cents are never read as dollars) or another provider type',()=>{for(const fields of [{exchangeName:'NYM'},{currency:'USD'},{instrumentType:'ETF'}]){const r=raw();Object.assign(r.chart.result[0].meta,fields);assert.throws(()=>projectMarketSnapshot(r,'commodities','OJ=F',at));}});
test('Canonical FUTURE orange juice observations remain valid',()=>{const r=raw();r.chart.result[0].meta.instrumentType='FUTURE';assert.equal(projectMarketSnapshot(r,'commodities','OJ=F',at).sourceInstrumentType,'FUTURE');});
