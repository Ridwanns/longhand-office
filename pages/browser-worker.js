import {analyze} from './quant-math.js';
import {prepareHistory} from './quant-history.js';
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))).map(x=>x.toString(16).padStart(2,'0')).join('');
self.onmessage=async({data:{config,input,codeHash}})=>{try{
 const dataset=prepareHistory(input.rows,config,{...input.metadata,computation:'Browser Web Worker; retained published retrieval vintage'});dataset.dataHash=await hash(dataset.observations);postMessage({dataset,stage:'Completed observations retained'});
 const results=analyze(dataset,config,stage=>postMessage({stage}));postMessage({completed:true,dataset,results,configHash:await hash(config),resultHash:await hash(results),codeHash});
}catch(error){postMessage({error:error.message});}};
