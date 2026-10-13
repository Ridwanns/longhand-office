import {DatabaseSync} from 'node:sqlite';
import path from 'node:path';
import {writeFileSync} from 'node:fs';
import {validateAnalysis} from './analysis-backup.mjs';
const results=[];
for(const dir of ['data','test-data']){
 const db=new DatabaseSync(path.join(process.env.LOCALAPPDATA,'LonghandOffice',dir,'office.sqlite'),{readOnly:true});
 const rows=db.prepare("SELECT body FROM jobs WHERE status='completed'").all();
 for(const row of rows)validateAnalysis(JSON.parse(row.body));
 results.push({environment:dir,completedAnalyses:rows.length,allCompatibleWithStricterValidation:true});db.close();
}
writeFileSync('validation/audit-saved-runs-results.json',JSON.stringify({results},null,2));console.log(JSON.stringify({results}));
