import {runMarketStudy,validateMarketStudy} from './market-data-research.js';
self.onmessage=async({data})=>{try{const study=data.study?await validateMarketStudy(data.study,data.dataset):await runMarketStudy(data.dataset,data.options,message=>self.postMessage({stage:message}));self.postMessage({study});}catch(error){self.postMessage({error:error.message});}};
