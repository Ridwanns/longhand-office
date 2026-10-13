"""Independent verification: Python statistics + Cholesky, not the JS solver.
Reads one public-data run from isolated localhost:4174. No portfolio records.
"""
import json, math, statistics, urllib.request, argparse, re
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('--run',default='1e064819-d043-44f6-9ad9-61e9b03c7ec5')
args=parser.parse_args()
RUN=args.run
assert re.fullmatch(r'[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}',RUN),'Use a saved run UUID.'
j=json.load(urllib.request.urlopen('http://127.0.0.1:4174/api/local/run/'+RUN,timeout=10))
p=[o['price'] for o in j['dataset']['observations']]
r=[math.log(b/a) for a,b in zip(p,p[1:])]
checks=[]
def same(name,a,b,tol=1e-10):
 assert math.isclose(a,b,abs_tol=tol,rel_tol=tol),(name,a,b)
 checks.append({'name':name,'expected':a,'actual':b,'passed':True})
def q(a,prob):
 a=sorted(a);index=(len(a)-1)*prob;lo=int(index)
 return a[lo]+(a[min(lo+1,len(a)-1)]-a[lo])*(index-lo)
hist=j['results']['historical']
same('sample annualized log volatility',statistics.stdev(r)*math.sqrt(252),hist['annualizedVolatility'])
peak=p[0];dd=[]
for value in p:
 peak=max(peak,value);dd.append(value/peak-1)
same('maximum drawdown',min(dd),hist['maxDrawdown'])
h=hist['risk']['horizon'];loss=[-math.expm1(math.fsum(r[i-h:i])) for i in range(h,len(r)+1)]
threshold=q(loss,.95)
same('historical VaR interpolated 95% simple loss',threshold,hist['risk']['var'])
same('historical ES at or beyond VaR',statistics.mean(x for x in loss if x>=threshold),hist['risk']['expectedShortfall'])
same('last rolling20 sample annual volatility',statistics.stdev(r[-20:])*math.sqrt(252),hist['rolling'][-1])
ew=r[0]**2
for value in r:ew=.94*ew+.06*value**2
same('EWMA zero-mean second moment annual volatility',math.sqrt(252*ew),hist['ewma'][-1])
def feature(i):
 window=r[i-19:i+1]
 return [r[i-k] for k in range(5)]+[statistics.mean(window),statistics.stdev(window)]
def ridge(h):
 origin=len(r)-1
 x=[feature(i) for i in range(19,origin-h+1)]
 y=[math.fsum(r[i+1:i+h+1]) for i in range(19,origin-h+1)]
 means=[statistics.mean(col) for col in zip(*x)]
 scales=[math.sqrt(statistics.mean((row[c]-means[c])**2 for row in x)) or 1 for c in range(7)]
 z=[[1]+[(row[c]-means[c])/scales[c] for c in range(7)] for row in x]
 a=[[math.fsum(row[c]*row[k] for row in z)+(1 if c==k and c>0 else 0) for k in range(8)] for c in range(8)]
 b=[math.fsum(row[c]*value for row,value in zip(z,y)) for c in range(8)]
 # Independent positive-definite Cholesky factorization + triangular solves.
 l=[[0.0]*8 for _ in range(8)]
 for i in range(8):
  for k in range(i+1):
   value=a[i][k]-math.fsum(l[i][m]*l[k][m] for m in range(k))
   l[i][k]=math.sqrt(value) if i==k else value/l[k][k]
 v=[0.0]*8
 for i in range(8):v[i]=(b[i]-math.fsum(l[i][k]*v[k] for k in range(i)))/l[i][i]
 coef=[0.0]*8
 for i in reversed(range(8)):coef[i]=(v[i]-math.fsum(l[k][i]*coef[k] for k in range(i+1,8)))/l[i][i]
 f=[1]+[(feature(origin)[c]-means[c])/scales[c] for c in range(7)]
 return math.fsum(a*b for a,b in zip(coef,f))
for forecast in j['results']['forecasts']:
 h=forecast['horizon'];by={m['name']:m for m in forecast['models']}
 same(str(h)+'-session Ridge prediction / independent Cholesky',ridge(h),by['Ridge']['prediction'])
 x,y=r[:-1],r[1:];xm,ym=statistics.mean(x),statistics.mean(y)
 phi=math.fsum((a-xm)*(b-ym) for a,b in zip(x,y))/math.fsum((a-xm)**2 for a in x)
 intercept=ym-phi*xm;future=r[-1];prediction=0
 for _ in range(h):future=intercept+phi*future;prediction+=future
 same(str(h)+'-session AR conditional forecast',prediction,by['AR1']['prediction'])
 for m in forecast['models']:
  errors=[s['actual']-s['prediction'] for s in m['scores']]
  same(str(h)+' '+m['name']+' scored RMSE',math.sqrt(statistics.mean(x*x for x in errors)),m['rmse'])
  same(str(h)+' '+m['name']+' scored MAE',statistics.mean(abs(x) for x in errors),m['mae'])
  same(str(h)+' '+m['name']+' matured scored count',len(errors),m['count'])
 for audit in forecast['audit']:
  assert audit['ridgeLastLabelEnd']<=audit['origin'] and audit['arLastLabelEnd']<=audit['origin']
receipt={'runId':RUN,'ticker':j['config']['ticker'],'source':j['dataset']['metadata']['source'],'observations':len(p),'checks':checks,'method':'Python statistics; independent Cholesky Ridge solver; no private records read.'}
Path('validation/quant-independent-results.json').write_text(json.dumps(receipt,indent=2),encoding='utf8')
print(json.dumps({'passed':len(checks),'ticker':receipt['ticker'],'observations':len(p)}))
