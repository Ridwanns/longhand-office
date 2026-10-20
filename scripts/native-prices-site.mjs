// This workflow republishes only an already verified public site plus price JSON.
// No Git data branch, force push, personal records or model refit is involved.
import {execFileSync} from 'node:child_process';
import {appendFile,mkdir,readFile,writeFile} from 'node:fs/promises';
const repo=process.env.GITHUB_REPOSITORY;
if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo||''))throw Error('Missing workflow repository.');
const api=route=>JSON.parse(execFileSync('gh',['api','repos/'+repo+'/'+route],{encoding:'utf8'}));
const output=async ready=>appendFile(process.env.GITHUB_OUTPUT,'ready='+ready+'\n');
const active=()=>api('actions/workflows/pages.yml/runs?per_page=20').workflow_runs.some(r=>r.status!=='completed');
const main=()=>api('commits/main').sha;
const expected=process.env.GITHUB_EVENT_NAME==='workflow_run'?JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8')).workflow_run.head_sha:process.env.GITHUB_SHA;
const mode=process.argv[2];
if(mode==='restore'){
 if(main()!==expected||active()){console.log('Interface release pending or revision changed; price-only publication skipped.');await output(false);}
 else{
  const runs=['pages.yml','prices.yml'].flatMap(name=>api('actions/workflows/'+name+'/runs?status=success&per_page=5').workflow_runs).filter(r=>r.head_sha===expected).sort((a,b)=>b.id-a.id);
  let found=false;for(const run of runs){const artifact=api('actions/runs/'+run.id+'/artifacts').artifacts.find(a=>a.name==='github-pages'&&!a.expired);if(!artifact)continue;
   await mkdir('.tools/native-site',{recursive:true});execFileSync('gh',['run','download',String(run.id),'--repo',repo,'--name','github-pages','--dir','.tools/native-site'],{stdio:'inherit'});
   await mkdir('dist/office',{recursive:true});execFileSync('tar',['-xf','.tools/native-site/artifact.tar','-C','dist/office','--no-same-owner','--no-same-permissions'],{stdio:'inherit'});
   await writeFile('.tools/native-site/source.json',JSON.stringify({sha:expected,run:run.id}));found=true;break;
  }await output(found);if(!found)console.log('No verified site artifact for this revision; wait for the interface publication.');
 }
}else if(mode==='check'){
 const source=JSON.parse(await readFile('.tools/native-site/source.json','utf8'));await output(source.sha===expected&&main()===expected&&!active());
}else if(mode==='final'){
 // A new interface commit must never be overwritten by an older price-only run.
 await output(main()===expected&&!active());
}else throw Error('Unknown native site publication mode.');
