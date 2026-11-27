import test from 'node:test';
import assert from 'node:assert/strict';
import {periodEnd,nextReleaseDue,acquisitionOld,readingOutdated} from '../source-freshness.js';
const at=s=>Date.parse(s+'T12:00:00Z');
test('period ends follow the frequency, daily readings end on their own date',()=>{
 assert.equal(periodEnd('2026-07-01','Q'),'2026-09-30');assert.equal(periodEnd('2026-07-01','Q',2),'2026-12-31');
 assert.equal(periodEnd('2026-09-01','M'),'2026-09-30');assert.equal(periodEnd('2026-12-01','M',2),'2027-01-31');
 assert.equal(periodEnd('2025-12-31','A'),'2025-12-31');assert.equal(periodEnd('2026-09-15','D'),'2026-09-15');
});
test('the next release is due one period later with the same publication lag plus a week',()=>{
 // Indonesia GDP Q3 2026, released 5 Nov: Q4 is due 36 days after 31 Dec, plus 7
 assert.equal(nextReleaseDue({date:'2026-07-01',releasedAt:'2026-11-05'},'Q'),'2027-02-12');
 // consumer confidence September 2026, released 8 Oct: October is due 15 Nov
 assert.equal(nextReleaseDue({date:'2026-09-01',releasedAt:'2026-10-08'},'M'),'2026-11-15');
 assert.equal(nextReleaseDue({date:'2026-09-01'},'M'),null);assert.equal(nextReleaseDue({date:'2026-09-15',releasedAt:'2026-09-16'},'D'),null);
 assert.equal(nextReleaseDue({date:'2026-09-01',releasedAt:'2026-08-01'},'M'),null);
});
test('a reviewed release is not outdated because its review is older than ten days',()=>{
 const gdp={latest:{date:'2026-07-01',releasedAt:'2026-11-05'},frequency:'Q',retrievedAt:'2026-11-08T09:30:00Z',reviewed:true,limitDays:210,now:at('2026-11-27')};
 assert.equal(readingOutdated(gdp),false);
 assert.equal(readingOutdated({...gdp,now:at('2027-02-13')}),true);
 // the same reading from an automatic source that stopped refreshing is outdated
 assert.equal(readingOutdated({...gdp,reviewed:false}),true);
 assert.equal(readingOutdated({...gdp,reviewed:false,retrievedAt:'2026-11-25T00:00:00Z'}),false);
});
test('a reviewed release is outdated once its next release is due, or when its period is too old',()=>{
 const cci={latest:{date:'2026-09-01',releasedAt:'2026-10-08'},frequency:'M',retrievedAt:'2026-11-08T09:35:00Z',reviewed:true,limitDays:75};
 assert.equal(readingOutdated({...cci,now:at('2026-11-15')}),false);assert.equal(readingOutdated({...cci,now:at('2026-11-16')}),true);
 // a late secondary release date never hides a period that is older than the frequency allows
 assert.equal(readingOutdated({latest:{date:'2026-08-01',releasedAt:'2026-10-06'},frequency:'M',reviewed:true,limitDays:75,now:at('2026-11-27')}),true);
 // without a release date only the period age applies
 assert.equal(readingOutdated({latest:{date:'2026-09-15'},frequency:'D',reviewed:true,limitDays:14,now:at('2026-11-27')}),true);
 assert.equal(readingOutdated({latest:{date:'2026-11-20'},frequency:'D',reviewed:true,limitDays:14,now:at('2026-11-27')}),false);
});
test('acquisition age only applies to automatic sources',()=>{
 assert.equal(acquisitionOld('2026-11-01T00:00:00Z',{now:at('2026-11-27')}),true);
 assert.equal(acquisitionOld('2026-11-01T00:00:00Z',{reviewed:true,now:at('2026-11-27')}),false);
 assert.equal(acquisitionOld('not a date',{now:at('2026-11-27')}),false);
});
test('the Macro headline counts only current, comparable readings and names the rest',async()=>{
 const {comparableReadings}=await import('../sheet-macro-map.js');
 const rows=[{iso:'IDN',v:5.47,f:'Q',stale:0},{iso:'CAN',v:-0.05,f:'Q',stale:1},{iso:'MMR',v:-2.01,f:'A',stale:0},{iso:'FRA',v:-0.1,f:'Q',stale:0}];
 const {current,left}=comparableReadings(rows);
 assert.deepEqual(current.map(r=>r.iso),['IDN','FRA']);assert.deepEqual(left.map(r=>r.iso),['CAN','MMR']);
 assert.equal(current.filter(r=>r.v<0).length,1);
});
