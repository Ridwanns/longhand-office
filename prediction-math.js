export const PREDICTION_VERSION='longhand-prospective-1.0.0';
const iso=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
export function exchangeClock(at,market){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:market==='IDX'?'Asia/Jakarta':'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(at)),p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return {date:p.year+'-'+p.month+'-'+p.day,minutes:Number(p.hour)*60+Number(p.minute)};}
export function registrationEligibility(run,at=new Date().toISOString()){
 if(run?.status!=='completed')return 'Complete a core analysis first.';
 if(run.created&&Date.parse(run.created)>Date.parse(at)||run.dataset?.metadata?.retrievedAt&&Date.parse(run.dataset.metadata.retrievedAt)>Date.parse(at))return 'Model or source was created after the registration time. Backdated registration is rejected.';
 const cutoff=run.dataset?.observations?.at(-1)?.date,clock=exchangeClock(at,run.config.market),age=(Date.parse(clock.date)-Date.parse(cutoff))/86400000;
 if(!iso(cutoff)||age<0||age>4||run.dataset.metadata.lastCompletedSession!==cutoff)return 'Source history is too old or incomplete for prospective registration.';
 for(let d=Date.parse(cutoff)+86400000;d<Date.parse(clock.date);d+=86400000){const day=new Date(d).getUTCDay();if(day!==0&&day!==6)return 'An intervening weekday has passed. Use the latest completed source session; historical forecasts cannot be registered prospectively.';}
 const weekday=new Date(clock.date+'T00:00:00Z').getUTCDay();
 if(clock.date>cutoff&&weekday!==0&&weekday!==6&&clock.minutes>=(run.config.market==='IDX'?540:570))return 'A later trading session may already have started. Wait for a publication containing the latest completed session.';
 return null;
}
export function createPrediction(run,horizon,at=new Date().toISOString(),id=crypto.randomUUID()){
 const reason=registrationEligibility(run,at);if(reason)throw Error(reason);const f=run.results.forecasts.find(f=>f.horizon===horizon);if(!f||![5,20].includes(horizon))throw Error('Unsupported prediction horizon.');
 return {format:'longhand-prospective-prediction',version:1,mathVersion:PREDICTION_VERSION,id,registeredAt:at,coreRunId:run.id,coreResultHash:run.resultHash,market:run.config.market,ticker:run.config.ticker,currency:run.dataset.metadata.currency,basis:run.config.basis,cutoff:run.dataset.observations.at(-1).date,basePrice:run.dataset.observations.at(-1).price,horizon,forecasts:f.models.map(m=>({name:m.name,logReturn:m.prediction,interval:m.interval?{lower:m.interval.lower,upper:m.interval.upper}:null})),status:'pending',outcome:null};
}
export function predictionOutcome(p,history,checkedAt=new Date().toISOString()){
 if(!Number.isFinite(Date.parse(checkedAt))||Date.parse(checkedAt)>Date.now()+300000||Date.parse(checkedAt)<Date.parse(p.registeredAt)||!Number.isFinite(Date.parse(history?.metadata?.retrievedAt))||Date.parse(history.metadata.retrievedAt)>Date.parse(checkedAt)+300000)throw Error('Future or invalid outcome acquisition/check timestamp.');
 if(history?.metadata?.ticker!==p.ticker||history.metadata.market!==p.market||history.metadata.currency!==p.currency||!Array.isArray(history.rows))throw Error('Outcome source identity or currency differs.');
 const priceKey=p.basis==='adjusted'?'adjustedClose':'rawClose',rows=history.rows.filter(r=>r.complete===true),anchor=rows.find(r=>r.date===p.cutoff),clock=exchangeClock(p.registeredAt,p.market);
 if(!anchor||!Number.isFinite(anchor[priceKey])||Math.abs(anchor[priceKey]-p.basePrice)>p.basePrice*1e-8)throw Error('Recorded price basis changed or anchor is missing. Outcome withheld; inspect corporate-action revisions.');
 const future=rows.filter(r=>r.date>p.cutoff);if(future.length<p.horizon)return null;
 const selected=future.slice(0,p.horizon);let previous=p.cutoff;
 for(const r of selected){if(!iso(r.date)||r.date<=previous||Date.parse(r.date)-Date.parse(previous)>10*86400000||!Number.isFinite(r[priceKey])||r[priceKey]<=0)throw Error('Missing, unordered or invalid outcome observations.');previous=r.date;}
 const first=selected[0].date;if(first<clock.date||first===clock.date&&clock.minutes>=(p.market==='IDX'?540:570))throw Error('Registration was after the first outcome session began. No prospective score assigned.');
 const date=selected.at(-1).date;if(date>exchangeClock(checkedAt,p.market).date)throw Error('Future outcome data rejected.');
 const actual=Math.log(selected.at(-1)[priceKey]/p.basePrice),sign=v=>Math.abs(v)<=1e-12?0:Math.sign(v);
 return {checkedAt,date,endPrice:selected.at(-1)[priceKey],actualLogReturn:actual,sourceRetrievedAt:history.metadata.retrievedAt,rows:selected.map(r=>({date:r.date,price:r[priceKey]})),scores:p.forecasts.map(f=>({name:f.name,error:actual-f.logReturn,absoluteError:Math.abs(actual-f.logReturn),directionMatched:sign(actual)===sign(f.logReturn),intervalCovered:f.interval?actual>=f.interval.lower&&actual<=f.interval.upper:null}))};
}
export function validatePrediction(p){if(p?.format!=='longhand-prospective-prediction'||p.version!==1||p.mathVersion!==PREDICTION_VERSION||!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(p.id)||!Number.isFinite(Date.parse(p.registeredAt))||Date.parse(p.registeredAt)>Date.now()+300000||!['US','IDX'].includes(p.market)||p.currency!==(p.market==='US'?'USD':'IDR')||!['raw','adjusted'].includes(p.basis)||!iso(p.cutoff)||!Number.isFinite(p.basePrice)||p.basePrice<=0||![5,20].includes(p.horizon)||!['pending','settled'].includes(p.status)||!Array.isArray(p.forecasts)||p.forecasts.length!==4||p.forecasts.map(f=>f.name).sort().join(',')!=='AR1,Mean,Ridge,Zero'||p.forecasts.some(f=>!Number.isFinite(f.logReturn)||f.interval&&(!Number.isFinite(f.interval.lower)||!Number.isFinite(f.interval.upper)||f.interval.lower>f.interval.upper)))throw Error('Invalid prospective prediction record.');if(p.status==='pending'&&p.outcome!==null||p.status==='settled'&&!p.outcome)throw Error('Inconsistent prediction outcome.');return p;}
