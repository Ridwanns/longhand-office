import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {defineMachine} from '../state-machine.js';
import {JOB_LIFECYCLE,WORKSPACE_MODE} from '../machines.js';
test('machines reject transitions to unknown states and report legal moves',()=>{
 assert.throws(()=>defineMachine('bad',{a:['ghost']}),/unknown state "ghost"/);
 const m=defineMachine('t',{a:['b'],b:[]});
 assert.equal(m.assert('a','b'),'b');assert.ok(m.isTerminal('b'));assert.ok(!m.isTerminal('a'));
 assert.throws(()=>m.assert('b','a'),/illegal transition "b" -> "a"\. Allowed from "b": none/);
 assert.equal(m.can('nope','a'),false);
});
test('job lifecycle allows only the documented moves',()=>{
 for(const [from,to] of [['queued','running'],['queued','cancelled'],['running','completed'],['running','failed'],['running','cancelled'],['running','queued']])assert.ok(JOB_LIFECYCLE.can(from,to),from+'->'+to);
 for(const [from,to] of [['completed','running'],['failed','queued'],['cancelled','running'],['queued','completed'],['completed','cancelled']])assert.ok(!JOB_LIFECYCLE.can(from,to),from+'->'+to);
 for(const s of ['completed','failed','cancelled'])assert.ok(JOB_LIFECYCLE.isTerminal(s));
});
test('every job status written by the queue and store is a declared state',()=>{
 const src=readFileSync(new URL('../scripts/quant-jobs.mjs',import.meta.url),'utf8');
 for(const [, to] of src.matchAll(/lifecycle\.(?:assert|can)\([^,]+,'([a-z]+)'\)/g))assert.ok(JOB_LIFECYCLE.states.includes(to),to);
 assert.ok(!/\.status\s*=\s*'/.test(src.replace(/status:cached\?'completed':'queued'/,'')),'job status must change only through the lifecycle machine');
});
test('workspace mode literals in secure-workspace.js are all declared states',()=>{
 const src=readFileSync(new URL('../secure-workspace.js',import.meta.url),'utf8');
 const used=new Set([...src.matchAll(/\bmode\s*=\s*'([a-z]+)'/g),...src.matchAll(/\?'(locked|inactive|vault|guest)':'(locked|inactive|vault|guest)'/g)].flatMap(m=>m.slice(1)));
 assert.ok(used.size>=3);for(const s of used)assert.ok(WORKSPACE_MODE.states.includes(s),s);
 assert.ok(WORKSPACE_MODE.can('locked','vault')&&WORKSPACE_MODE.can('vault','locked')&&!WORKSPACE_MODE.can('guest','vault'));
});
