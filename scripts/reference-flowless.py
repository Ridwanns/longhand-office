"""Independent Decimal calculation for the TEST ONLY portfolio; no market fetching."""
from decimal import Decimal as D
import json

quantity, purchase_price, fee, opening_cash = D('100'), D('5500'), D('5500'), D('1000000')
# Raw BBCA close separately checked against the owner's read-only DB on 12 October 2026.
observed_close = D('5950')
cost = quantity * purchase_price + fee
cash = opening_cash - cost
market_value = quantity * observed_close
total = cash + market_value
print(json.dumps({
    'label': 'TEST ONLY — synthetic transaction, independently verified source close',
    'remainingCost': str(cost), 'cash': str(cash), 'marketValue': str(market_value),
    'unrealized': str(market_value-cost), 'total': str(total),
    'largestPercent': str(market_value/total*100),
}, indent=2))
