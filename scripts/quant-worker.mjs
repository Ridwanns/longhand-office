import {parentPort,workerData} from 'node:worker_threads';
import {analyze} from '../quant-math.js';
import {acquireHistory,hash} from './quant-data.mjs';
try{
 parentPort.postMessage({stage:'Acquiring completed daily history'});
 const dataset=workerData.fixture||await acquireHistory(workerData.config);
 parentPort.postMessage({stage:'Validating observations',observations:dataset.observations.length,dataset});
 const results=analyze(dataset,workerData.config,stage=>parentPort.postMessage({stage}));
 parentPort.postMessage({completed:{dataset,results,resultHash:hash(results),configHash:hash(workerData.config),runtime:process.version}});
}catch(error){parentPort.postMessage({error:error.name==='TimeoutError'?'History acquisition timed out.':error.message});}
