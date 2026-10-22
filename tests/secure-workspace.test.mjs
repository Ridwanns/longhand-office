import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeWorkspaceValue,decodeWorkspaceValue,deriveWorkspaceKey,encryptWorkspaceSnapshot,decryptWorkspaceSnapshot,validateWorkspaceEnvelope,checkWorkspacePassword} from '../secure-workspace-crypto.js';
const password='SYNTHETIC TEST ONLY vault passphrase 2026';
test('Device vault codec preserves undefined, sparse arrays, negative zero, dates and binary data',()=>{
 const a=new Array(3);a[1]=undefined;a[2]='TEST ONLY';const raw={missing:undefined,array:a,zero:-0,time:new Date('2026-10-22T00:00:00Z'),binary:new Uint16Array([1,65535]),integer:123456789123456789n};
 const copy=decodeWorkspaceValue(encodeWorkspaceValue(raw));assert.deepEqual(copy,raw);assert.ok(Object.hasOwn(copy,'missing'));assert.ok(!(0 in copy.array));assert.ok(1 in copy.array);assert.ok(Object.is(copy.zero,-0));
});
test('Untrusted vault object keys cannot pollute prototypes and malformed tags reject',()=>{
 const raw=Object.fromEntries([['__proto__',{testOnly:'sentinel'}],['constructor','TEST ONLY']]);const copy=decodeWorkspaceValue(encodeWorkspaceValue(raw));assert.ok(Object.hasOwn(copy,'__proto__'));assert.equal(Object.getPrototypeOf(copy),Object.prototype);assert.equal({}.testOnly,undefined);
 for(const value of [['longhand-lossless',1,['o',[['a',1],['a',2]]]],['longhand-lossless',1,['a',2,[[3,'bad']]]],['longhand-lossless',1,['unknown']]])assert.throws(()=>decodeWorkspaceValue(JSON.stringify(value)));
 const cycle={};cycle.self=cycle;assert.throws(()=>encodeWorkspaceValue(cycle));assert.throws(()=>encodeWorkspaceValue(new Map()));assert.throws(()=>encodeWorkspaceValue({invalid:Infinity}));
});
test('Vault requires a strong-length passphrase and bounded encoded payload',()=>{
 for(const p of ['', 'short', ' '.repeat(20),'a'.repeat(1025)])assert.throws(()=>checkWorkspacePassword(p));assert.equal(checkWorkspacePassword(password),password);
});
test('Authenticated encrypted snapshots use fresh IVs and a nonextractable key',async()=>{
 const context=await deriveWorkspaceKey(password);assert.equal(context.key.extractable,false);await assert.rejects(crypto.subtle.exportKey('raw',context.key));
 const settings={...context,vaultId:crypto.randomUUID(),revision:1},data={private:'SYNTHETIC PRIVATE SENTINEL',ownUndefined:undefined},a=await encryptWorkspaceSnapshot(data,settings),b=await encryptWorkspaceSnapshot(data,settings);
 assert.notEqual(a.iv,b.iv);assert.notEqual(a.ciphertext,b.ciphertext);assert.ok(!JSON.stringify(a).includes('SYNTHETIC PRIVATE'));assert.deepEqual(await decryptWorkspaceSnapshot(a,context.key),data);validateWorkspaceEnvelope(a);
 for(const mutate of [e=>e.revision++,e=>e.vaultId=crypto.randomUUID(),e=>e.updatedAt='2026-10-22T01:00:00.000Z',e=>e.ciphertext=(e.ciphertext[0]==='A'?'B':'A')+e.ciphertext.slice(1)]){const bad=structuredClone(a);mutate(bad);await assert.rejects(decryptWorkspaceSnapshot(bad,context.key));}
 const wrong=await deriveWorkspaceKey('SYNTHETIC TEST ONLY wrong password',new Uint8Array(Buffer.from(a.salt,'base64')));await assert.rejects(decryptWorkspaceSnapshot(a,wrong.key));
 for(const mutate of [e=>e.kdf.iterations=1,e=>e.iv='AAAA',e=>e.extra='unknown']){const bad=structuredClone(a);mutate(bad);assert.throws(()=>validateWorkspaceEnvelope(bad));}
});
