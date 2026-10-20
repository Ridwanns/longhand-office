// Independent macro projections. No stock model, observed release or saved record is changed.
export const MACRO_FORECAST_VERSION='macro-ar1-v1';
export const MACRO_FORECAST_POLICY=Object.freeze({minimum:24,window:40,maxHorizon:8,calibration:12,coverage:.8,phiLimit:.98});
export const quarterIndex=date=>Number(date.slice(0,4))*4+Math.floor((Number(date.slice(5,7))-1)/3);
export const quarterDate=index=>Math.floor(index/4)+'-'+String((index%4)*3+1).padStart(2,'0')+'-01';
export const quarterLabel=index=>Math.floor(index/4)+' Q'+(index%4+1);
const endQuarter=index=>new Date(Date.UTC(Math.floor(index/4),(index%4+1)*3,0)).toISOString().slice(0,10);
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
export function fitMacroAR1(values){
 const p=MACRO_FORECAST_POLICY,rows=values.slice(-p.window);if(rows.length<p.minimum||rows.some(v=>!Number.isFinite(v)))throw Error('At least 24 consecutive numeric quarters are required.');
 const x=rows.slice(0,-1),y=rows.slice(1),mx=mean(x),my=mean(y),xx=x.reduce((s,v)=>s+(v-mx)**2,0),xy=x.reduce((s,v,i)=>s+(v-mx)*(y[i]-my),0),raw=xx>1e-20?xy/xx:0,phi=Math.max(-p.phiLimit,Math.min(p.phiLimit,raw));
 return {intercept:my-phi*mx,phi,rawPhi:raw,clipped:phi!==raw,trainingCount:rows.length,last:rows.at(-1)};
}
export function macroARPath(model,horizon){
 if(!Number.isInteger(horizon)||horizon<1||horizon>MACRO_FORECAST_POLICY.maxHorizon)throw Error('Unsupported macro horizon.');let y=model.last;
 return Array.from({length:horizon},()=>{y=model.intercept+model.phi*y;if(!Number.isFinite(y))throw Error('Non-finite macro projection.');return y;});
}
export function macroErrorRadius(errors){
 if(errors.length<MACRO_FORECAST_POLICY.calibration||errors.some(e=>!Number.isFinite(e)))return null;
 const values=errors.map(Math.abs).sort((a,b)=>a-b),rank=Math.ceil((values.length+1)*MACRO_FORECAST_POLICY.coverage);return rank>values.length?null:values[rank-1];
}
export function evaluateMacroHorizon(values,horizon){
 const p=MACRO_FORECAST_POLICY;if(!Number.isInteger(horizon)||horizon<1||horizon>p.maxHorizon||values.some(v=>!Number.isFinite(v)))throw Error('Invalid macro evaluation input.');const samples=[];
 for(let origin=p.minimum;origin+horizon<=values.length;origin++){
  const prediction=macroARPath(fitMacroAR1(values.slice(0,origin)),horizon).at(-1),actual=values[origin+horizon-1],naive=values[origin-1],seasonal=values[origin-4+(horizon-1)%4];
  // A prior forecast error enters calibration only after its target has resolved.
  const resolved=samples.filter(s=>s.targetIndex<origin).map(s=>s.error),radius=macroErrorRadius(resolved);
  samples.push({originIndex:origin,targetIndex:origin+horizon-1,prediction,actual,error:actual-prediction,naiveError:actual-naive,seasonalError:actual-seasonal,radius,covered:radius===null?null:Math.abs(actual-prediction)<=radius});
 }
 const scored=samples.filter(s=>s.covered!==null),rmse=key=>samples.length?Math.sqrt(mean(samples.map(s=>s[key]**2))):null;
 return {horizon,count:samples.length,rmse:rmse('error'),mae:samples.length?mean(samples.map(s=>Math.abs(s.error))):null,naiveRMSE:rmse('naiveError'),seasonalRMSE:rmse('seasonalError'),radius:macroErrorRadius(samples.map(s=>s.error)),coverageCount:scored.length,empiricalCoverage:scored.length?mean(scored.map(s=>Number(s.covered))):null,samples};
}
export function macroQuarterRows(item,metric,asOf){
 const frequency=item?.spec?.frequency,cutoff=new Date(asOf).toISOString().slice(0,10);
 if(item?.error||item?.spec?.unit!=='% YoY'||!['Q','M'].includes(frequency)||metric==='gdp'&&frequency!=='Q')return [];
 const dates=new Set();let prior='';const rows=[];
 for(const o of item.observations||[]){
  if(typeof o.date!=='string'||!/^\d{4}-(0[1-9]|1[0-2])-01$/.test(o.date)||o.date<=prior||dates.has(o.date)||o.value!==null&&!Number.isFinite(o.value))return [];
  prior=o.date;dates.add(o.date);const month=Number(o.date.slice(5,7)),q=quarterIndex(o.date);
  if(frequency==='Q'&&![1,4,7,10].includes(month))return [];
  if(frequency==='M'&&![3,6,9,12].includes(month)||endQuarter(q)>cutoff||o.releasedAt&&o.releasedAt.slice(0,10)>cutoff)continue;
  rows.push({...o,quarter:q});
 }
 // Never cross a missing quarter or fill a missing value.
 const last=rows.findLastIndex(r=>Number.isFinite(r.value));let suffix=[];for(const row of rows.slice(0,last+1)){if(!Number.isFinite(row.value)){suffix=[];continue;}if(suffix.length&&row.quarter!==suffix.at(-1).quarter+1)suffix=[];suffix.push(row);}return suffix;
}
export function selectMacroForecastSource(readings,metric,asOf){
 return (readings.find(r=>r.key===metric)?.items||[]).filter(s=>s&&!s.error&&Number.isFinite(Date.parse(s.retrievedAt))&&Date.parse(s.retrievedAt)<=asOf&&/^[a-f0-9]{64}$/.test(s.sourceHash||''))
  .map(item=>({item,rows:macroQuarterRows(item,metric,asOf)})).filter(s=>s.rows.length>=MACRO_FORECAST_POLICY.minimum)
  .sort((a,b)=>b.rows.at(-1).quarter-a.rows.at(-1).quarter||(b.item.spec.priority||0)-(a.item.spec.priority||0)||b.rows.length-a.rows.length||a.item.id.localeCompare(b.item.id))[0]||null;
}
export function projectedQuad(growthChange,inflationChange){
 if(!Number.isFinite(growthChange)||!Number.isFinite(inflationChange)||Math.abs(growthChange)<1e-10||Math.abs(inflationChange)<1e-10)return null;
 return growthChange>0?(inflationChange<0?1:2):(inflationChange>0?3:4);
}
export function buildMacroOutlook(readings,{asOf=Date.now(),country}={}){
 if(!Number.isFinite(asOf))throw Error('Invalid projection cutoff.');const start=quarterIndex(new Date(asOf+7*3600000).toISOString()),targets=Array.from({length:4},(_,i)=>start+i),metrics={};
 for(const key of ['gdp','inflation']){
  const selected=selectMacroForecastSource(readings,key,asOf);if(!selected){metrics[key]={available:false,reason:'No single source supplies 24 consecutive reported quarters in the required frequency.'};continue;}
  const {item,rows}=selected,anchor=rows.at(-1),maxHorizon=targets.at(-1)-anchor.quarter;
  if(maxHorizon<1||maxHorizon>MACRO_FORECAST_POLICY.maxHorizon){metrics[key]={available:false,reason:'The connected source is too old for the eight-quarter projection limit.'};continue;}
  const values=rows.map(r=>r.value),model=fitMacroAR1(values),path=macroARPath(model,maxHorizon),evaluations=Array.from({length:maxHorizon},(_,i)=>evaluateMacroHorizon(values,i+1));
  metrics[key]={available:true,source:{id:item.id,name:item.spec.source,url:item.spec.sourceUrl,hash:item.sourceHash,retrievedAt:item.retrievedAt,frequency:item.spec.frequency,method:item.spec.method},anchor,model,history:rows,points:path.map((value,i)=>{const h=i+1,e=evaluations[i];return {quarter:anchor.quarter+h,date:quarterDate(anchor.quarter+h),horizon:h,value,lower:e.radius===null?null:value-e.radius,upper:e.radius===null?null:value+e.radius,evaluation:e};}),olderAcquisition:asOf-Date.parse(item.retrievedAt)>10*86400000,modelBasisBehindLatest:!!readings.find(r=>r.key===key)?.item?.latest&&quarterIndex(readings.find(r=>r.key===key).item.latest.date)>anchor.quarter};
 }
 const valueAt=(m,q)=>m.available?(m.points.find(p=>p.quarter===q)?.value??m.history.find(p=>p.quarter===q)?.value??null):null;
 const quarters=targets.map(q=>{const gdp=valueAt(metrics.gdp,q),inflation=valueAt(metrics.inflation,q),priorGDP=valueAt(metrics.gdp,q-1),priorInflation=valueAt(metrics.inflation,q-1),growthChange=gdp===null||priorGDP===null?null:gdp-priorGDP,inflationChange=inflation===null||priorInflation===null?null:inflation-priorInflation;return {quarter:q,date:quarterDate(q),period:quarterLabel(q),gdp,inflation,priorGDP,priorInflation,growthChange,inflationChange,quad:projectedQuad(growthChange,inflationChange)};});
 return {format:'longhand-macro-outlook',version:1,modelVersion:MACRO_FORECAST_VERSION,asOf:new Date(asOf).toISOString(),country,policy:MACRO_FORECAST_POLICY,metrics,quarters,method:'Fixed AR(1) OLS, last 40 quarters, minimum 24. Slope limited to ±0.98; intercept recomputed after limiting. GDP YoY and quarter-end CPI YoY are modelled separately. Empirical 80% absolute-error bands by horizon, minimum 12 resolved errors. Current-vintage rolling-origin diagnostics, not a real-time-vintage backtest. No consensus or monthly activity input is inferred.'};
}
