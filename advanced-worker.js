import {analyzeAdvanced} from './advanced-math.js';
self.onmessage=({data})=>{try{const result=analyzeAdvanced(data.source,data.settings,stage=>postMessage({stage}));postMessage({result});}catch(error){postMessage({error:error.message});}};
