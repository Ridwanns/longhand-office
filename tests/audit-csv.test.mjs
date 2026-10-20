import test from 'node:test';
import assert from 'node:assert/strict';
import {auditCsv} from '../scripts/audit-csv.mjs';
test('Independent audit CSV keeps quoted units and removes BOM only for parsing',()=>{const raw='\uFEFF"Series ID",GCPIAGYPM\r\nUnits,"Index, September 2025 = 100"\r\n';assert.deepEqual(auditCsv(raw),[['Series ID','GCPIAGYPM'],['Units','Index, September 2025 = 100']]);assert.equal(raw.charCodeAt(0),0xFEFF);});
test('Independent audit CSV preserves escaped quotes, multiline labels and missing cells',()=>{assert.deepEqual(auditCsv('Name,Value\n"A ""quoted""\nlabel",\nDate,2'),[['Name','Value'],['A "quoted"\nlabel',''],['Date','2']]);});
test('Malformed audit CSV cannot silently change column alignment',()=>{for(const raw of ['"unterminated','"closed"junk,1','unquoted"quote,2'])assert.throws(()=>auditCsv(raw));});
