// Read-only: detail of one saved core run in the isolated TEST workspace (port 4174).
import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync(process.env.LOCALAPPDATA + '/LonghandOffice/test-data/office.sqlite', { readOnly: true });
const r = db.prepare('select body from jobs where id=?').get(process.argv[2] || 'ccc89b32-a133-405f-9517-3cd521e64311');
const b = JSON.parse(r.body), R = b.results;
const f0 = R.forecasts[0];
console.log('forecast keys', Object.keys(f0));
console.log('model[0]', JSON.stringify(f0.models[0]).slice(0, 600));
console.log('ranking', JSON.stringify(f0.ranking).slice(0, 400));
console.log('audit[0]', JSON.stringify(f0.audit[0]).slice(0, 300));
console.log('sim keys', Object.keys(R.simulation));
for (const k of Object.keys(R.simulation)) { const v = R.simulation[k]; console.log(' sim.' + k, Array.isArray(v) ? `[${v.length}] ` + JSON.stringify(v[0]).slice(0, 160) : JSON.stringify(v).slice(0, 160)) }
console.log('results keys', Object.keys(R));
for (const k of Object.keys(R)) if (!['historical', 'forecasts', 'simulation'].includes(k)) console.log(' ', k, JSON.stringify(R[k]).slice(0, 300));
