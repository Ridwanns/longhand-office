const day=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const text=(s,n)=>typeof s==='string'&&s.trim().length>0&&s.length<=n;
const amount=x=>Number.isFinite(x)&&x>0&&x<=Number.MAX_SAFE_INTEGER/1e6;
const near=(a,b)=>Math.abs(a-b)<=Math.max(5e-7,8*Number.EPSILON*Math.max(Math.abs(a),Math.abs(b)));
function fraction(x){const [mantissa,exp='0']=String(x).split('e'),places=(mantissa.split('.')[1]?.length||0)-Number(exp),digits=BigInt(mantissa.replace('.',''));return places<0?[digits*10n**BigInt(-places),1n]:[digits,10n**BigInt(places)];}
export function executionNetReceipt(debit,rate,fee){const [a,b]=fraction(debit),[c,d]=fraction(rate),[e,f]=fraction(fee),den=b*d,gross=(a*c*1000000n+den/2n)/den;if(e*1000000n%f!==0n)throw Error('Execution fee supports at most six decimals in the received currency.');return Number(gross-e*1000000n/f)/1000000;}
export function validateSplit(a,p){
 if(!a||!text(a.id,100)||a.type!=='Split'||!day(a.date)||!text(a.symbol,30)||!p.transactions.some(t=>t.symbol===a.symbol)||!Number.isSafeInteger(a.numerator)||a.numerator<1||a.numerator>1000000||!Number.isSafeInteger(a.denominator)||a.denominator<1||a.denominator>1000000||a.numerator===a.denominator||!text(a.source,1000)||typeof a.note!=='string'||a.note.length>20000||!Number.isSafeInteger(a.sequence)||a.sequence<1)throw Error('Record a dated split with an existing holding, positive integer new/old share ratio, sequence and statement source.');
 if((p.corporateActions||[]).some(b=>b.id!==a.id&&b.symbol===a.symbol&&b.date===a.date))throw Error('A share-ratio event is already recorded for this holding/date. Reconcile the existing event instead of applying another split.');
 if([...p.transactions.map((t,i)=>({...t,sequence:t.sequence??i+1})),...(p.cashFlows||[]).map((f,i)=>({...f,sequence:f.sequence??p.transactions.length+i+1}))].some(t=>t.date===a.date&&t.sequence===a.sequence))throw Error('Split sequence collides with another same-date event. Preserve an explicit economic order.');
 return a;
}
// This is evidence for an already recorded single-currency cash leg. It never
// infers an execution rate from a market reference or creates another account.
export function validateExecutionFx(f,p){
 const e=f.fxExecution;if(e===undefined)return f;
 if(!['Deposit','Withdrawal'].includes(f.type)||!e||!day(e.date)||e.date!==f.date||!/^[A-Z]{3}$/.test(e.fromCurrency)||!/^[A-Z]{3}$/.test(e.toCurrency)||e.fromCurrency===e.toCurrency||!amount(e.fromAmount)||!amount(e.rate)||!amount(e.toAmount)||!Number.isFinite(e.fee)||e.fee<0||e.fee>Number.MAX_SAFE_INTEGER/1e6||!text(e.source,1000))throw Error('FX execution needs the same cash-flow date, two currencies, positive debit/net receipt/rate, received-currency fee and a statement source.');
 const net=executionNetReceipt(e.fromAmount,e.rate,e.fee);
 if(!Number.isFinite(net)||!near(net,e.toAmount)||f.type==='Deposit'&&(e.toCurrency!==p.currency||f.amount!==e.toAmount)||f.type==='Withdrawal'&&(e.fromCurrency!==p.currency||f.amount!==e.fromAmount))throw Error('FX execution does not reconcile: net receipt = debit × execution rate (decimal half-up to 6 places) − received-currency fee, and the native cash leg must match.');
 return f;
}
export function validateStatement(s,p){
 if(!s||s.format!=='longhand-portfolio-statement'||s.version!==1||!text(s.id,100)||s.portfolioId!==p.id||s.currency!==p.currency||!day(s.date)||s.date>new Date().toISOString().slice(0,10)||!text(s.source,1000)||!Number.isFinite(s.cash)||s.cash<0||s.cash>Number.MAX_SAFE_INTEGER/1e6||typeof s.ledgerFingerprint!=='string'||s.ledgerFingerprint.length>8000000||!Number.isFinite(Date.parse(s.recordedAt))||Date.parse(s.recordedAt)>Date.now()+300000||!Array.isArray(s.positions)||s.positions.length>1000)throw Error('Statement reconciliation needs a dated closing statement, native cash balance, complete positions and source.');
 const seen=new Set();for(const r of s.positions){if(!text(r.symbol,30)||seen.has(r.symbol)||!Number.isFinite(r.quantity)||r.quantity<0||r.quantity>Number.MAX_SAFE_INTEGER/1e6)throw Error('Use unique exact ledger symbols and nonnegative statement quantities.');seen.add(r.symbol);}return s;
}
