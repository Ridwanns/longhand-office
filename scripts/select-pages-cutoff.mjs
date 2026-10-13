import {normalizeHistory} from './quant-data.mjs';
// A choice displayed to the user, never a silent replacement of their cutoff.
export function selectModelCutoff(input,config){
 const candidates=input.rows.filter(r=>r.complete&&Number.isFinite(r.adjustedClose)&&r.adjustedClose>0&&r.date<=config.cutoff).slice(-60).reverse();
 for(const row of candidates){const d=normalizeHistory(input.rows,{...config,cutoff:row.date},input.metadata);if(d.observations.length>=350)return {modelCutoff:row.date,modelObservations:d.observations.length};}
 return {modelCutoff:null,modelObservations:0};
}
