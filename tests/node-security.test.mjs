import test from 'node:test';
import assert from 'node:assert/strict';
import {assertPatchedNode} from '../scripts/node-security.mjs';
test('Local services and publication require the patched supported 24.x LTS baseline',()=>{
 for(const version of ['24.22.1','24.22.2','24.23.0'])assert.equal(assertPatchedNode(version),version);
 for(const version of ['24.19.0','24.22.0','22.23.4','25.0.0','26.12.1','24.22.1-unknown','invalid'])assert.throws(()=>assertPatchedNode(version),/patched Node.js/);
});
