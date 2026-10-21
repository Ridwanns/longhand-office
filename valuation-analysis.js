// Derived reading aids only. Original studies, inputs and engine versions are unchanged.
import {equityDcfIdr} from './idr-valuation.js';
import {AtlasMath} from './atlas-math.js';
const finite=v=>typeof v==='number'&&Number.isFinite(v);
export function annualFcfeInput(text){
 if(typeof text!=='string'||!text.trim())throw Error('Enter one annual FCFE amount per line.');
 const lines=text.trim().split(/\r?\n/);
 if(lines.length>100)throw Error('Supply at most 100 annual FCFE amounts.');
 if(lines.some(v=>!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/.test(v.trim())))throw Error('Use one amount per line, a dot for decimals and no commas or thousands separators.');
 const values=lines.map(v=>Number(v.trim()));
 if(values.some(v=>!finite(v)))throw Error('Every annual FCFE must be finite.');
 return values;
}
export function earningsDiagnostics(result){
 if(!result||!['IDR','USD'].includes(result.currency)||!finite(result.price)||result.price<=0||!Number.isInteger(result.settings?.years)||result.settings.years<1||!finite(result.settings.requiredReturn)||result.settings.requiredReturn<=-1)throw Error('Matching valuation price, currency, horizon and required return are needed.');
 const {years,requiredReturn}=result.settings;
 return result.rows.map(row=>{
  const gap=value=>finite(value)&&finite(value/result.price-1)?value/result.price-1:null;
  const needed=finite(result.currentPe)&&result.currentPe>0&&finite(row.exitPe)&&row.exitPe>0?(1+requiredReturn)*Math.exp((Math.log(result.currentPe)-Math.log(row.exitPe))/years)-1:null;
  return {name:row.name,terminalPrice:row.terminalPrice,discountedEntry:row.discountedEntry,priceCagr:row.priceCagr,terminalPriceGap:gap(row.terminalPrice),entryGap:gap(row.discountedEntry),requiredEpsGrowth:finite(needed)?needed:null};
 });
}
export function fcfeDiagnostics(currency,input){
 if(!['IDR','USD'].includes(currency)||input?.currency!==currency)throw Error('FCFE analysis requires a matching declared currency.');
 const suffix=currency==='IDR'?'Idr':'Usd',engine=currency==='IDR'?equityDcfIdr:AtlasMath.equityDcf,base=engine(input);
 if(!base.ok)return null;
 const valueKey='valuePerShare'+suffix,pvKey='presentValue'+suffix,flowKey='fcfePerShare'+suffix;
 const normalized={currency,listingBasis:'quoted-share',cashFlowType:'FCFE',['fcfePerShareForecast'+suffix]:base.path.map(r=>r[flowKey])};
 const rates=[-.02,-.01,0,.01,.02].map(delta=>input.costOfEquity+delta),growth=[-.01,-.005,0,.005,.01].map(delta=>input.terminalGrowth+delta);
 const cells=rates.map((costOfEquity,i)=>growth.map((terminalGrowth,j)=>{
  const r=engine({...normalized,costOfEquity,terminalGrowth});
  return {costOfEquity,terminalGrowth,value:r.ok?r[valueKey]:null,status:r.status,reason:r.errors.join(' '),central:i===2&&j===2};
 }));
 return {currency,costOfEquity:input.costOfEquity,terminalGrowth:input.terminalGrowth,spread:input.costOfEquity-input.terminalGrowth,years:base.path.length,value:base[valueKey],pvForecast:base['pvForecast'+suffix],pvTerminal:base['pvTerminal'+suffix],terminalValue:base['terminalValue'+suffix],terminalShare:base.terminalValueShare,path:base.path.map(r=>({year:r.year,fcfe:r[flowKey],presentValue:r[pvKey]})),rates,growth,cells};
}
