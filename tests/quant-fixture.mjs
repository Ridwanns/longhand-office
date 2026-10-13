import {hash} from '../scripts/quant-data.mjs';
export function fixture(ticker='TEST',count=600){
 const observations=[];let date=new Date('2023-01-02T00:00:00Z'),price=100;
 while(observations.length<count){if(![0,6].includes(date.getUTCDay())){const i=observations.length;price*=Math.exp(.0003+.012*Math.sin(i*.41)+.006*Math.cos(i*.17));observations.push({date:date.toISOString().slice(0,10),price,rawClose:price,adjustedClose:price,timestamp:null,volume:1000});}date.setUTCDate(date.getUTCDate()+1);}
 return {metadata:{ticker,listing:'TEST ONLY',instrumentType:'EQUITY',currency:'USD',timezone:'America/New_York',source:'SYNTHETIC TEST FIXTURE — NOT MARKET DATA',sourceUrl:'test fixture',retrievedAt:'2026-10-12T00:00:00Z',requestedCutoff:'2026-10-12',lastCompletedSession:observations.at(-1).date,basis:'adjusted',priceDefinition:'Synthetic verification only.',missingPolicy:'No missing fixture rows.',omissions:[],segmentBreaks:[],excludedSegmentRows:0},observations,excludedSegment:[],dataHash:hash(observations)};
}
