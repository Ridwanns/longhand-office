// Independent, dependency-free implementation. All returns are decimal log returns.
export const MODEL_VERSION='longhand-core-1.0.0';
export const MIN_OBSERVATIONS=350;
export const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
export const variance=a=>{if(a.length<2)return 0;const m=mean(a);return a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1);};
export function quantile(a,p){const s=[...a].sort((a,b)=>a-b),x=(s.length-1)*p,i=Math.floor(x);return s[i]+(s[Math.min(i+1,s.length-1)]-s[i])*(x-i);}
export function historical(prices,horizon=1){
 const returns=prices.slice(1).map((p,i)=>Math.log(p/prices[i])),mu=mean(returns),sigma=Math.sqrt(variance(returns));
 let peak=prices[0],ew=returns[0]**2;
 const drawdowns=prices.map(p=>{peak=Math.max(peak,p);return p/peak-1;});
 const rolling=returns.map((_,i)=>i<19?null:Math.sqrt(variance(returns.slice(i-19,i+1)))*Math.sqrt(252));
 const ewma=returns.map(r=>{ew=.94*ew+.06*r*r;return Math.sqrt(ew*252);});
 const sums=[];for(let i=horizon;i<=returns.length;i++)sums.push(returns.slice(i-horizon,i).reduce((s,x)=>s+x,0));
 const losses=sums.map(r=>1-Math.exp(r)),threshold=quantile(losses,.95),tail=losses.filter(l=>l>=threshold);
 return {returns,mean:mu,dailySigma:sigma,annualizedVolatility:sigma*Math.sqrt(252),annualization:252,drawdowns,maxDrawdown:Math.min(...drawdowns),rolling,rollingWindow:20,ewma,ewmaLambda:.94,risk:{confidence:.95,horizon,sampleSize:losses.length,var:threshold,expectedShortfall:mean(tail),tailCount:tail.length,sign:'Positive values mean loss; negative values mean a gain at this quantile.',method:'Overlapping historical observed-session simple losses; linear-interpolated 95th percentile, ES averages losses at or above it.'}};
}
function solve(A,b){A=A.map((r,i)=>[...r,b[i]]);for(let i=0;i<b.length;i++){let pivot=i;for(let j=i+1;j<b.length;j++)if(Math.abs(A[j][i])>Math.abs(A[pivot][i]))pivot=j;[A[i],A[pivot]]=[A[pivot],A[i]];if(Math.abs(A[i][i])<1e-14)throw Error('Singular fit.');const d=A[i][i];A[i]=A[i].map(v=>v/d);for(let j=0;j<b.length;j++)if(j!==i){const f=A[j][i];A[j]=A[j].map((v,k)=>v-f*A[i][k]);}}return A.map(r=>r.at(-1));}
const feature=(r,i)=>[...r.slice(i-4,i+1).reverse(),mean(r.slice(i-19,i+1)),Math.sqrt(variance(r.slice(i-19,i+1)))];
export function fitRidge(r,origin,h,alpha=1){
 // r[i] is the return ending at price observation i+1.
 // Labels ending at origin are mature. No later returns enter preprocessing.
 const X=[],y=[],origins=[];for(let i=19;i+h<=origin;i++){X.push(feature(r,i));y.push(r.slice(i+1,i+h+1).reduce((s,x)=>s+x,0));origins.push(i);}
 if(X.length<150)throw Error('Insufficient matured training labels.');
 const means=X[0].map((_,j)=>mean(X.map(x=>x[j]))),scales=means.map((m,j)=>Math.sqrt(mean(X.map(x=>(x[j]-m)**2)))||1);
 const standardized=X.map(x=>[1,...x.map((v,j)=>(v-means[j])/scales[j])]),n=8,A=Array.from({length:n},()=>Array(n).fill(0)),b=Array(n).fill(0);
 standardized.forEach((x,i)=>{for(let j=0;j<n;j++){b[j]+=x[j]*y[i];for(let k=0;k<n;k++)A[j][k]+=x[j]*x[k];}});
 for(let j=1;j<n;j++)A[j][j]+=alpha;
 const coefficients=solve(A,b),f=[1,...feature(r,origin).map((v,j)=>(v-means[j])/scales[j])];
 return {prediction:f.reduce((s,v,j)=>s+v*coefficients[j],0),parameters:{alpha,means,scales,coefficients},training:{firstOrigin:origins[0],lastOrigin:origins.at(-1),lastLabelEnd:origins.at(-1)+h,labels:X.length}};
}
export function fitAR(r,origin,h){
 const x=r.slice(0,origin),y=r.slice(1,origin+1),xm=mean(x),ym=mean(y);
 const den=x.reduce((s,v)=>s+(v-xm)**2,0),phi=den?x.reduce((s,v,i)=>s+(v-xm)*(y[i]-ym),0)/den:0,intercept=ym-phi*xm;
 let current=r[origin],prediction=0;for(let i=0;i<h;i++){current=intercept+phi*current;prediction+=current;}
 return {prediction,parameters:{phi,intercept},training:{firstOrigin:0,lastOrigin:origin-1,lastLabelEnd:origin,labels:x.length}};
}
const sign=x=>Math.abs(x)<=1e-12?0:Math.sign(x);
export function forecast(r,h){
 const first=Math.max(220,Math.floor(r.length*.6)),scores={AR1:[],Ridge:[],Zero:[],Mean:[]},audit=[];
 for(let o=first;o+h<r.length;o+=h){
  const truth=r.slice(o+1,o+h+1).reduce((s,x)=>s+x,0),ar=fitAR(r,o,h),ridge=fitRidge(r,o,h);
  const predictions={AR1:ar.prediction,Ridge:ridge.prediction,Zero:0,Mean:mean(r.slice(0,o+1))*h};
  for(const [name,prediction] of Object.entries(predictions))scores[name].push({origin:o,targetEnd:o+h,prediction,actual:truth,error:truth-prediction});
  audit.push({origin:o,targetEnd:o+h,ridgeLastLabelEnd:ridge.training.lastLabelEnd,arLastLabelEnd:ar.training.lastLabelEnd,trainingLabels:ridge.training.labels});
 }
 const o=r.length-1,ar=fitAR(r,o,h),ridge=fitRidge(r,o,h),final={AR1:ar,Ridge:ridge,Zero:{prediction:0,parameters:{}},Mean:{prediction:mean(r)*h,parameters:{dailyMean:mean(r)}}};
 const models=Object.entries(scores).map(([name,rows])=>{
  const n=rows.length,error=rows.map(x=>x.error),prediction=final[name].prediction;
  return {name,prediction,priceReturn:Math.expm1(prediction),rmse:n?Math.sqrt(mean(error.map(e=>e*e))):null,mae:n?mean(error.map(Math.abs)):null,directionAccuracy:n?rows.filter(x=>sign(x.prediction)===sign(x.actual)).length/n:null,count:n,zeroPredictions:rows.filter(x=>sign(x.prediction)===0).length,interval:n>=20?{level:.9,lower:prediction+quantile(error,.05),upper:prediction+quantile(error,.95),errors:n}:null,parameters:final[name].parameters,training:final[name].training||{lastLabelEnd:o,labels:r.length},scores:rows};
 });
 const ranking=[...models].filter(m=>m.count).sort((a,b)=>a.rmse-b.rmse).map(m=>m.name);
 return {horizon:h,firstEvaluationOrigin:first,lastEvaluationOrigin:audit.at(-1)?.origin??null,models,audit,ranking,selection:'Ranking is retrospective on this evaluation sample. It is not an unbiased test of a selected strategy or a validated trading edge.',directionConvention:'Three signs: negative, zero (absolute log return <= 1e-12), positive. A zero forecast matches only a zero realized return.',intervalConvention:'90% empirical residual interval using matured expanding-origin out-of-sample errors from this retrospective sample; at least 20 errors. No coverage guarantee or prospective calibration.'};
}
export function simulate(prices,h,seed,paths=1000){
 const r=prices.slice(1).map((p,i)=>Math.log(p/prices[i])),mu=mean(r),sigma=Math.sqrt(variance(r));let state=seed>>>0||1;
 const uniform=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return ((state>>>0)+.5)/4294967296;};
 const normal=()=>Math.sqrt(-2*Math.log(uniform()))*Math.cos(2*Math.PI*uniform());
 const all=Array.from({length:paths},()=>{const a=[prices.at(-1)];for(let i=0;i<h;i++){const next=a.at(-1)*Math.exp(mu+sigma*normal());if(!Number.isFinite(next)||next<=0)throw Error('Scenario prices exceed the supported numerical range. Inspect history and adjustment basis.');a.push(next);}return a;});
 const terminal=all.map(p=>p.at(-1)),lo=Math.min(...terminal),hi=Math.max(...terminal),width=(hi-lo)/30||1;
 const bins=Array.from({length:30},(_,i)=>({lower:lo+i*width,upper:lo+(i+1)*width,count:0}));terminal.forEach(x=>bins[Math.min(29,Math.floor((x-lo)/width))].count++);
 return {seed,paths,horizon:h,dailyMean:mu,dailySigma:sigma,process:'IID Gaussian daily log returns; sample mean and sample standard deviation over all eligible observations. No jumps, serial dependence, regime changes or parameter uncertainty.',interpretation:'Percentiles describe this assumed simulation, not validated forecast probabilities.',bands:Array.from({length:h+1},(_,i)=>({session:i,p05:quantile(all.map(p=>p[i]),.05),p25:quantile(all.map(p=>p[i]),.25),p50:quantile(all.map(p=>p[i]),.5),p75:quantile(all.map(p=>p[i]),.75),p95:quantile(all.map(p=>p[i]),.95)})),selectedPaths:all.slice(0,12),terminal:{p05:quantile(terminal,.05),p50:quantile(terminal,.5),p95:quantile(terminal,.95),bins}};
}
export function analyze(dataset,config,stage=()=>{}){
 if(dataset.observations.length<MIN_OBSERVATIONS)throw Error('Insufficient history: '+dataset.observations.length+' eligible observations; '+MIN_OBSERVATIONS+' required.');
 const prices=dataset.observations.map(o=>o.price);if(prices.some(p=>!Number.isFinite(p)||p<=0))throw Error('Invalid non-positive history.');
 stage('Historical risk');const hist=historical(prices,config.horizon);
 if(hist.returns.some(r=>!Number.isFinite(r))||![hist.annualizedVolatility,hist.risk.var,hist.risk.expectedShortfall].every(Number.isFinite))throw Error('History produces non-finite returns or risk estimates. Inspect price scale and adjustment basis.');
 stage('Chronological model evaluation');const forecasts=[5,20].map(h=>forecast(hist.returns,h));
 stage('Seeded scenario simulation');const simulation=simulate(prices,config.horizon,config.seed);
 return {modelVersion:MODEL_VERSION,historical:hist,forecasts,simulation,observations:prices.length,trainPeriod:[dataset.observations[0].date,dataset.observations.at(-1).date],evaluationPeriods:forecasts.map(f=>({horizon:f.horizon,start:dataset.observations[f.firstEvaluationOrigin+1]?.date,end:dataset.observations[(f.lastEvaluationOrigin??0)+f.horizon+1]?.date??null})),parameters:{annualization:252,rollingWindow:20,ewmaLambda:.94,ridgeAlpha:1,minimumTrainingLabels:150,evaluationStart:'max(220, floor(return count * .6))',evaluationStep:'horizon; nonoverlapping target intervals',intervalMinErrors:20,varConfidence:.95,simulationPaths:1000}};
}
