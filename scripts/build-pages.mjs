import {copyFile,mkdir,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),dest=path.join(root,'dist','pages');
// Explicit static allowlist: no application modules, private records, backend,
// tests, validation artifacts or databases are packaged for Pages.
const files=[['pages/index.html','index.html'],['pages/preview.js','preview.js'],['pages/preview.css','preview.css'],['style.css','style.css'],['rooms.css','rooms.css'],['theme.js','theme.js'],['building.svg','building.svg'],['catalogue.json','catalogue.json']];
await mkdir(dest,{recursive:true});
const allowed=new Set(files.map(([,name])=>name));
for(const existing of await readdir(dest))if(!allowed.has(existing)||!(await stat(path.join(dest,existing))).isFile())throw Error('Unexpected file in Pages output. Use a fresh output folder before publishing: '+existing);
for(const [source,name] of files)await copyFile(path.join(root,source),path.join(dest,name));
console.log('Built a read-only design preview: '+files.length+' explicitly allowed static files. No private records or local app modules included.');
