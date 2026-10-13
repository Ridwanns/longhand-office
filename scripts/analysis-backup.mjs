import {validateAnalysis as validateContract} from '../analysis-contract.js';
import {hash} from './quant-data.mjs';
export function validateAnalysis(r){return validateContract(r,hash);}
