import {MODEL_VERSION} from './quant-math.js';
export const validId=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(x);
export const validDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!isNaN(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
export function configFor(input){
 if(!input||!['US','IDX'].includes(input.market))throw Error('Choose US or IDX.');
 let ticker=String(input.ticker||'').trim().toUpperCase();ticker=input.market==='IDX'?ticker.replace(/\.JK$/,''):ticker.replace('.','-');
 if(!(input.market==='US'?/^[A-Z]{1,6}(?:-[A-Z])?$/:/^[A-Z]{4}$/).test(ticker))throw Error('Invalid supported equity / ETF ticker.');
 if(!validDate(input.cutoff)||input.cutoff>new Date().toISOString().slice(0,10))throw Error('Choose a valid cutoff no later than today UTC.');
 if(![5,20].includes(Number(input.horizon)))throw Error('Horizon must be 5 or 20 observed trading sessions.');
 const basis=input.basis||'adjusted';if(!['raw','adjusted'].includes(basis))throw Error('Choose raw or adjusted closes.');
 const seed=Number(input.seed??20261013);if(!Number.isInteger(seed)||seed<1||seed>4294967295)throw Error('Seed must be an integer from 1 through 4294967295.');
 return {ticker,market:input.market,cutoff:input.cutoff,horizon:Number(input.horizon),basis,seed,modelVersion:MODEL_VERSION};
}
