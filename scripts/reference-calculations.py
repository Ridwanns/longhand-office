"""Independent Decimal reference. Does not import the JavaScript ledger."""
from decimal import Decimal, ROUND_HALF_UP
import json

D = Decimal
microunit = D('0.000001')
cash, quantity, cost, fees, profit = D(10000), D(0), D(0), D(0), D(0)
trades = [('Buy',100,20,10), ('Buy',50,24,5), ('Sell',60,30,6), ('Sell',30,18,3)]
rows=[]
for side,q,p,f in trades:
    q,p,f=map(D,(q,p,f))
    if side=='Buy':
        debit=q*p+f
        cash-=debit
        cost+=debit
        quantity+=q
        realized=D(0)
    else:
        proceeds=q*p-f
        released=(cost*q/quantity).quantize(microunit,rounding=ROUND_HALF_UP)
        realized=proceeds-released
        cash+=proceeds
        cost-=released
        quantity-=q
        profit+=realized
    fees+=f
    rows.append({k:str(v) for k,v in dict(side=side,cash=cash,quantity=quantity,cost=cost,fee=f,realized=realized).items()})
assert cash==D(9116) and quantity==D(60) and cost==D(1286) and fees==D(24) and profit==D(402)
print(json.dumps({'reference':'Python Decimal; independent of model.js','trades':rows,'final':{k:str(v) for k,v in dict(cash=cash,quantity=quantity,cost=cost,fees=fees,realized=profit,average_cost=(cost/quantity).quantize(microunit,rounding=ROUND_HALF_UP)).items()}},indent=2))
