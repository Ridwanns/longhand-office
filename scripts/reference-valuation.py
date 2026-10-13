"""Independent Decimal check; no JavaScript model is imported."""
from decimal import Decimal as D
import json
cash=D(5000)-(D(10)*D(100)+D(10))-(D(20)*D(50)+D(5))+(D(2)*D(120)-D(2))
alpha_cost=(D(10)*D(100)+D(10))*D(8)/D(10)
beta_cost=D(20)*D(50)+D(5)
alpha=D(8)*D(130)
beta=D(20)*D(45)
total=cash+alpha+beta
assert (cash,alpha_cost,beta_cost,alpha,beta,total)==(D(3223),D(808),D(1005),D(1040),D(900),D(5163))
assert alpha-alpha_cost==D(232) and beta-beta_cost==D(-105)
result={'reference':'Python Decimal, independent of model.js','cash':str(cash),'alpha_market_value':str(alpha),'beta_market_value':str(beta),'alpha_unrealized':str(alpha-alpha_cost),'beta_unrealized':str(beta-beta_cost),'total_usd':str(total),'alpha_weight_pct':str(alpha/total*100),'beta_weight_pct':str(beta/total*100),'missing_beta_known_subtotal_usd':str(cash+alpha),'mixed_currency_subtotals':{'USD':str(cash+alpha),'EUR':str(beta)}}
print(json.dumps(result,indent=2))
