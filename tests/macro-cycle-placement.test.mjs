import test from 'node:test';
import assert from 'node:assert/strict';
import {macroCycleQuad} from '../macro-context-ui.js';
test('Quad labels describe the signs of existing annual changes without changing values',()=>{for(const [growthChange,inflationChange,q]of [[1,-1,1],[1,1,2],[-1,1,3],[-1,-1,4]]){const point={growthChange,inflationChange},before=JSON.stringify(point);assert.equal(macroCycleQuad(point),q);assert.equal(JSON.stringify(point),before);}});
test('Exact zero and missing changes remain unclassified rather than forcing a quad',()=>{for(const point of [{growthChange:0,inflationChange:1},{growthChange:1,inflationChange:0},{growthChange:null,inflationChange:2},{growthChange:NaN,inflationChange:2},null])assert.equal(macroCycleQuad(point),null);});
