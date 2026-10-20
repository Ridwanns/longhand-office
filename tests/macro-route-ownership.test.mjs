import test from 'node:test';
import assert from 'node:assert/strict';
import {syncMacroScope} from '../macro-navigation.js';
test('Delayed macro draw cannot rewrite another workspace or a newer macro route',()=>{
 const priorLocation=globalThis.location,priorHistory=globalThis.history;let writes=0;
 globalThis.history={state:{},replaceState(){writes++;}};
 try{for(const [hash,isConnected,scope]of [['#quant',true,'#market/macro/us/overview'],['#market/macro/id/economy',true,'#market/macro/us/overview'],['#market/macro/us/overview',false,'#market/macro/us/overview']]){globalThis.location={hash};syncMacroScope({isConnected,_scopeRoute:scope,closest(){throw Error('Stale desk must stop before DOM mutation.');}},'USA');}assert.equal(writes,0);}finally{globalThis.location=priorLocation;globalThis.history=priorHistory;}
});
test('An active macro desk may update its own country selection and retain ownership',()=>{
 const priorLocation=globalThis.location,priorHistory=globalThis.history;globalThis.location={hash:'#market/macro/us/economy'};let written;
 globalThis.history={state:{},replaceState(_,__,url){written=url;globalThis.location.hash=url;}};
 const monitor={dataset:{},querySelector:()=>null,querySelectorAll:()=>[]},parent={isConnected:true,_scopeRoute:location.hash,dataset:{view:'economy'},closest:()=>monitor,querySelector:()=>null};
 try{syncMacroScope(parent,'EMU');assert.equal(written,'#market/macro/eu/economy');assert.equal(parent._scopeRoute,written);assert.equal(monitor.dataset.economy,'EMU');}finally{globalThis.location=priorLocation;globalThis.history=priorHistory;}
});
