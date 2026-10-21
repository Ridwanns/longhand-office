// Nominal IDR per listed share throughout. No FX conversion or sourced inputs are implied.
export const IDR_DCF_VERSION='longhand-idr-fcfe-1.0.0';
export function equityDcfIdr(input={}){
 const finite=v=>typeof v==='number'&&Number.isFinite(v),errors=[],empty={currency:'IDR',valuePerShareIdr:null,pvForecastIdr:null,terminalValueIdr:null,pvTerminalIdr:null,terminalValueShare:null,path:[]};
 const result=(status,values=empty)=>({ok:status==='ok',status,errors,...values});
 if(input.currency!=='IDR'||input.listingBasis!=='quoted-share'||input.cashFlowType!=='FCFE')errors.push('Declare IDR, quoted-share units and FCFE explicitly.');
 if(!finite(input.costOfEquity)||input.costOfEquity<=0)errors.push('Supply a positive nominal IDR cost of equity.');
 if(!finite(input.terminalGrowth)||input.terminalGrowth<=-1||input.terminalGrowth>=input.costOfEquity)errors.push('Terminal growth must exceed -100% and remain below the IDR cost of equity.');
 let forecast=input.fcfePerShareForecastIdr;
 if(forecast!==undefined){
  if(input.fcfePerShareIdr!==undefined||input.fcfeGrowth!==undefined||input.years!==undefined)errors.push('Choose explicit annual FCFE or base/growth/years, not both.');
  if(!Array.isArray(forecast)||!forecast.length||forecast.length>100||forecast.some(v=>!finite(v)))errors.push('Supply 1–100 finite annual FCFE amounts in IDR per share.');
 }else{
  if(!finite(input.fcfePerShareIdr)||!finite(input.fcfeGrowth)||input.fcfeGrowth< -1||!Number.isInteger(input.years)||input.years<1||input.years>100)errors.push('Supply base FCFE in IDR per share, per-share growth of at least -100%, and 1–100 whole years.');
  if(!errors.length)forecast=Array.from({length:input.years},(_,i)=>input.fcfePerShareIdr*(1+input.fcfeGrowth)**(i+1));
 }
 if(errors.length)return result('invalid');
 if(forecast.at(-1)<=0){errors.push('A positive sustainable terminal FCFE is required; no positive perpetuity is invented.');return result('loss-making');}
 const path=forecast.map((fcfePerShareIdr,i)=>({year:i+1,fcfePerShareIdr,presentValueIdr:fcfePerShareIdr/(1+input.costOfEquity)**(i+1)})),pvForecastIdr=path.reduce((n,r)=>n+r.presentValueIdr,0),terminalValueIdr=forecast.at(-1)*(1+input.terminalGrowth)/(input.costOfEquity-input.terminalGrowth),pvTerminalIdr=terminalValueIdr/(1+input.costOfEquity)**forecast.length,valuePerShareIdr=pvForecastIdr+pvTerminalIdr;
 if(![...forecast,...path.map(r=>r.presentValueIdr),pvForecastIdr,terminalValueIdr,pvTerminalIdr,valuePerShareIdr].every(finite)){errors.push('The supplied assumptions overflow this model.');return result('invalid');}
 if(valuePerShareIdr<=0){errors.push('These cash flows do not produce a positive equity value.');return result('unavailable',{...empty,path});}
 return result('ok',{currency:'IDR',valuePerShareIdr,pvForecastIdr,terminalValueIdr,pvTerminalIdr,terminalValueShare:pvTerminalIdr/valuePerShareIdr,path});
}
