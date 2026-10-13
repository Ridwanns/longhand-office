import test from 'node:test';
import assert from 'node:assert/strict';
import {retainEntryHistory} from '../research-history.js';
import {validate,empty} from '../model.js';
const t=()=>({id:'TEST-thesis',title:'TEST ONLY original title',symbol:'AAPL',assumptions:'Original assumptions',evidence:'Original evidence',risks:'Original risks',reviewDate:'2026-10-12',status:'Researching',reports:['TEST-report']});
test('new entries retain original prose; later explicit edits append previous text without changing original',()=>{const first=retainEntryHistory(t());const edited=structuredClone(first);edited.assumptions='Changed assumptions';retainEntryHistory(edited,first);assert.equal(edited.originalEntry.assumptions,'Original assumptions');assert.equal(edited.entryRevisions[0].entry.assumptions,'Original assumptions');assert.equal(first.entryRevisions.length,0);const d=empty();d.theses.push(edited);assert.deepEqual(validate(JSON.parse(JSON.stringify(d))),d);});
test('legacy entry captured on first explicit edit without pretending its original creation time is known',()=>{const legacy=t(),edited={...legacy,evidence:'New evidence'};retainEntryHistory(edited,legacy);assert.equal(edited.originalEntry.evidence,'Original evidence');assert.equal(legacy.originalEntry,undefined);});

