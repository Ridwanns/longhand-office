import {MODEL_VERSION} from '../quant-math.js';
import {configFor,hash,validId} from './quant-data.mjs';
const isDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const finite=Number.isFinite,integer=Number.isSafeInteger,text=x=>typeof x==='string'&&x.length<=20000;
const near=(a,b)=>finite(a)&&finite(b)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b));
export function validateAnalysis(r){
 const bad=()=>{throw Error('Analysis backup is incomplete, incompatible, or its hashes do not match.');};
 if(!r||!validId(r.id)||r.status!=='completed'||!r.dataset||!r.results||r.results.modelVersion!==MODEL_VERSION||!integer(r.version)||r.version<1)bad();
 const config=configFor(r.config);if(hash(config)!==r.configHash||hash(r.config)!==r.configHash||hash(r.results)!==r.resultHash)bad();
 const d=r.dataset,m=d.metadata,o=d.observations,v=r.results;
 if(!Array.isArray(o)||o.length<350||o.length>10000||hash(o)!==d.dataHash||!m||m.ticker!==config.ticker||m.requestedCutoff!==config.cutoff||m.basis!==config.basis||m.currency!==(config.market==='US'?'USD':'IDR')||!['EQUITY','ETF'].includes(m.instrumentType)||!text(m.listing)||!text(m.timezone)||!Array.isArray(m.omissions)||!Array.isArray(d.excludedSegment)||!text(m.source)||!text(m.priceDefinition)||!text(m.missingPolicy)||!integer(m.excludedSegmentRows)||m.excludedSegmentRows<0||!finite(Date.parse(m.retrievedAt)))bad();
 const selected=config.basis==='adjusted'?'adjustedClose':'rawClose';
 if(o.some((x,i)=>!x||!isDate(x.date)||x.date>config.cutoff||!finite(x.price)||x.price<=0||x.price!==x[selected]||i&&x.date<=o[i-1].date)||m.lastCompletedSession!==o.at(-1).date)bad();
 const h=v.historical,n=o.length,returns=n-1;
 if(v.observations!==n||!h||!Array.isArray(h.returns)||h.returns.length!==returns||h.returns.some(x=>!finite(x))||!Array.isArray(h.drawdowns)||h.drawdowns.length!==n||h.drawdowns.some(x=>!finite(x)||x>1e-12||x< -1)||!Array.isArray(h.rolling)||h.rolling.length!==returns||h.rolling.some((x,i)=>i<19?x!==null:!finite(x)||x<0)||!Array.isArray(h.ewma)||h.ewma.length!==returns||h.ewma.some(x=>!finite(x)||x<0)||!finite(h.annualizedVolatility)||h.annualizedVolatility<0||!finite(h.maxDrawdown)||!finite(h.mean)||!finite(h.dailySigma)||h.annualization!==252||h.rollingWindow!==20||h.ewmaLambda!==.94)bad();
 if(!h.risk||h.risk.confidence!==.95||h.risk.horizon!==config.horizon||h.risk.sampleSize!==returns-config.horizon+1||!integer(h.risk.tailCount)||h.risk.tailCount<1||h.risk.tailCount>h.risk.sampleSize||!finite(h.risk.var)||!finite(h.risk.expectedShortfall)||!text(h.risk.sign)||!text(h.risk.method))bad();
 for(let i=0;i<returns;i++)if(!near(h.returns[i],Math.log(o[i+1].price/o[i].price)))bad();
 if(!Array.isArray(v.trainPeriod)||v.trainPeriod[0]!==o[0].date||v.trainPeriod[1]!==o.at(-1).date||!Array.isArray(v.evaluationPeriods)||v.evaluationPeriods.length!==2||!v.parameters||!Array.isArray(v.forecasts)||v.forecasts.length!==2||new Set(v.forecasts.map(f=>f?.horizon)).size!==2)bad();
 for(const f of v.forecasts){
  if(![5,20].includes(f.horizon)||!Array.isArray(f.models)||f.models.length!==4||new Set(f.models.map(x=>x?.name)).size!==4||!Array.isArray(f.audit)||!Array.isArray(f.ranking)||f.ranking.length!==4||new Set(f.ranking).size!==4||!f.ranking.every(name=>['AR1','Ridge','Zero','Mean'].includes(name))||!text(f.selection)||!text(f.intervalConvention)||!text(f.directionConvention))bad();
  const period=v.evaluationPeriods.find(p=>p?.horizon===f.horizon);
  if(!period||!isDate(period.start)||!isDate(period.end)||!integer(f.firstEvaluationOrigin)||!integer(f.lastEvaluationOrigin))bad();
  for(const x of f.models){
   if(!['AR1','Ridge','Zero','Mean'].includes(x.name)||!finite(x.prediction)||!near(x.priceReturn,Math.expm1(x.prediction))||!integer(x.count)||x.count<1||!finite(x.rmse)||x.rmse<0||!finite(x.mae)||x.mae<0||!finite(x.directionAccuracy)||x.directionAccuracy<0||x.directionAccuracy>1||!integer(x.zeroPredictions)||x.zeroPredictions<0||x.zeroPredictions>x.count||!Array.isArray(x.scores)||x.scores.length!==x.count||f.audit.length!==x.count||!x.parameters||!x.training)bad();
   if(x.count>=20){if(!x.interval||x.interval.level!==.9||x.interval.errors!==x.count||!finite(x.interval.lower)||!finite(x.interval.upper)||x.interval.lower>x.interval.upper)bad();}else if(x.interval!==null)bad();
   for(let i=0;i<x.scores.length;i++){
    const s=x.scores[i],a=f.audit[i];
    if(!s||!integer(s.origin)||s.origin<19||!integer(s.targetEnd)||s.targetEnd!==s.origin+f.horizon||s.targetEnd>=returns||i&&s.origin!==x.scores[i-1].targetEnd||!finite(s.prediction)||!finite(s.actual)||!near(s.error,s.actual-s.prediction)||!a||a.origin!==s.origin||a.targetEnd!==s.targetEnd||!integer(a.ridgeLastLabelEnd)||a.ridgeLastLabelEnd>s.origin||!integer(a.arLastLabelEnd)||a.arLastLabelEnd>s.origin||!integer(a.trainingLabels)||a.trainingLabels<150)bad();
    if(!near(s.actual,h.returns.slice(s.origin+1,s.targetEnd+1).reduce((sum,x)=>sum+x,0)))bad();
   }
   if(x.scores[0].origin!==f.firstEvaluationOrigin||x.scores.at(-1).origin!==f.lastEvaluationOrigin)bad();
  }
 }
 const sim=v.simulation,positive=x=>finite(x)&&x>0,ordered=x=>x.every(positive)&&x.every((a,i)=>!i||a>=x[i-1]);
 if(!sim||sim.seed!==config.seed||sim.horizon!==config.horizon||sim.paths!==1000||!finite(sim.dailyMean)||!finite(sim.dailySigma)||sim.dailySigma<0||!text(sim.process)||!text(sim.interpretation)||!Array.isArray(sim.bands)||sim.bands.length!==config.horizon+1||sim.bands.some((b,i)=>!b||b.session!==i||!ordered([b.p05,b.p25,b.p50,b.p75,b.p95]))||!Array.isArray(sim.selectedPaths)||sim.selectedPaths.length!==12||sim.selectedPaths.some(p=>!Array.isArray(p)||p.length!==config.horizon+1||p[0]!==o.at(-1).price||p.some(x=>!positive(x)))||!sim.terminal||!ordered([sim.terminal.p05,sim.terminal.p50,sim.terminal.p95])||!Array.isArray(sim.terminal.bins)||sim.terminal.bins.length!==30)bad();
 if(sim.terminal.bins.some(b=>!b||!positive(b.lower)||!positive(b.upper)||b.lower>b.upper||!integer(b.count)||b.count<0)||sim.terminal.bins.reduce((sum,b)=>sum+b.count,0)!==sim.paths)bad();
 return r;
}
