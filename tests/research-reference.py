"""Independent Python stdlib benchmarks against the actual browser math module."""
import json
import math
import statistics
import subprocess
from pathlib import Path

module = Path(__file__).resolve().parents[1] / 'research-math.js'
cases = []
expected = []
def add(name, input_, values):
    cases.append({'name':name,'input':input_})
    expected.append(values)

for kind in ['call','put']:
    for S,K,T,r,q,v in [(100,100,1,.05,0,.2),(80,100,.5,.03,.01,.35),(120,90,2,-.01,.02,.3)]:
        root=math.sqrt(T);d1=(math.log(S/K)+(r-q+v*v/2)*T)/(v*root);d2=d1-v*root
        cdf=lambda z: .5*math.erfc(-z/math.sqrt(2))
        price=S*math.exp(-q*T)*cdf(d1)-K*math.exp(-r*T)*cdf(d2) if kind=='call' else K*math.exp(-r*T)*cdf(-d2)-S*math.exp(-q*T)*cdf(-d1)
        add('europeanOption',dict(spot=S,strike=K,years=T,rate=r,dividend=q,volatility=v,type=kind),{'price':price})
# Three published TF Quant Finance README option_price example values.
for spot,volatility,value in [(3,2,2.04806848),(4,.1,1.00020297),(5,.4,2.07303131)]:
    add('europeanOption',dict(spot=spot,strike=3,years=1,rate=0,dividend=0,volatility=volatility,type='call'),{'price':value})
for frequency in [1,2,4,12]:
    face=1000;coupon=.04;years=3;y=.07
    discounted=[(face*coupon/frequency+(face if k==years*frequency else 0))/(1+y/frequency)**k for k in range(1,years*frequency+1)]
    price=sum(discounted);duration=sum(k/frequency*pv for k,pv in enumerate(discounted,1))/price
    add('fixedCouponBond',dict(face=face,coupon=coupon,years=years,frequency=frequency,yield_=y),{'price':price,'macaulayYears':duration})
    cases[-1]['input']['yield']=cases[-1]['input'].pop('yield_')
    add('bondYield',dict(face=face,coupon=coupon,years=years,frequency=frequency,price=price),{'yield':y})

script="const fs=await import('node:fs');const {pathToFileURL}=await import('node:url');const m=await import(pathToFileURL(process.argv[1]));const c=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(JSON.stringify(c.map(x=>m[x.name](x.input))));"
run=subprocess.run(['node','--input-type=module','-e',script,str(module)],input=json.dumps(cases),text=True,capture_output=True,timeout=30,check=True)
actual=json.loads(run.stdout);checks=0
for result,values in zip(actual,expected):
    for key,want in values.items():
        assert abs(result[key]-want)<max(1e-8,abs(want)*1e-9),(key,result[key],want)
        checks+=1
print(json.dumps({'independent_checks':checks,'cases':len(cases),'failures':0,'scope':'Python erfc option prices, TF source benchmark fixtures, discounted cash flows and yield recovery; no installed SDK or licensed API claim.'}))
