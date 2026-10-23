import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const allowed=new Set([...readFileSync('scripts/serve.mjs','utf8').matchAll(/'([a-z0-9-]+\.(?:js|css|svg|json|html))'/g)].map(m=>m[1]));
const reference=/(?:from\s*|import\s*\(\s*|import\s+|href=|src=|new URL\()['"]\.?\/?([a-z0-9-]+\.(?:js|css|svg))['"]/g;
test('Every frontend file reachable from index.html is served by the local static allowlist',()=>{
 const seen=new Set(),queue=['index.html'];
 while(queue.length){const file=queue.pop();if(seen.has(file)||!existsSync(file))continue;seen.add(file);for(const m of readFileSync(file,'utf8').matchAll(reference))queue.push(m[1]);}
 assert.ok(seen.size>100);assert.deepEqual([...seen].filter(f=>!allowed.has(f)),[]);
});
