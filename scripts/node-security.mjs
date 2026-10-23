import {pathToFileURL} from 'node:url';

// October 21, 2026 security release: Brotli RCE, TLS checks and compromised CA removal.
// Update this baseline after reviewing https://nodejs.org/en/blog/vulnerability/.
export function assertPatchedNode(version=process.versions.node){
 const match=/^(\d+)\.(\d+)\.(\d+)$/.exec(version);
 if(!match||Number(match[1])!==24||Number(match[2])<22||Number(match[2])===22&&Number(match[3])<1)throw Error('Longhand requires patched Node.js 24 LTS, version 24.22.1 or newer in the 24.x line. Update Node before starting local services or collecting public data.');
 return version;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){assertPatchedNode();console.log('Node security baseline passed: '+process.versions.node);}
