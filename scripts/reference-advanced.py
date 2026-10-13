"""Independent NumPy checks of Office JS models, with synthetic test-only prices.

Run with Python + NumPy. No market requests, personal files or Office records.
"""
import datetime as dt
import json
import math
import random
import subprocess
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parents[1]
rng = random.Random(402)
prices, rows, day = [], [], dt.date(2019, 1, 2)
price = 100.0
while len(rows) < 700:
    if day.weekday() < 5:
        price *= math.exp(rng.gauss(.0003, .011) + .002 * math.sin(len(rows) * .19))
        prices.append(price)
        rows.append(dict(date=day.isoformat(), price=price))
    day += dt.timedelta(days=1)
source = dict(ticker='TEST', market='US', currency='USD', basis='adjusted',
              cutoff=rows[-1]['date'], provider='SYNTHETIC TEST ONLY — NOT MARKET DATA',
              retrievedAt='2026-10-01T00:00:00Z', rows=rows)
js = """import {readFileSync} from 'node:fs';
import {advancedFeatures,fitAdvancedForecast,analyzeAdvanced} from './advanced-math.js';
const s=JSON.parse(readFileSync(0,'utf8')),p=s.rows.map(r=>r.price),x=advancedFeatures(p);
console.log(JSON.stringify({features:x,fit:fitAdvancedForecast(p,x,600,20,252),
result:analyzeAdvanced(s,{horizon:20,seed:7})}));"""
out = subprocess.run(['node', '--input-type=module', '-e', js], cwd=root,
                     input=json.dumps(source), capture_output=True, text=True,
                     check=True, timeout=45)
actual = json.loads(out.stdout)
p = np.array(prices)
r = np.diff(np.log(p))
gain, loss = np.maximum(np.diff(p), 0), np.maximum(-np.diff(p), 0)
g, l = gain[:14].mean(), loss[:14].mean()
rsi = np.zeros(len(p))
rsi[14] = 100 - 100 / (1 + g / l) if l else 100 if g else 50
for t in range(15, len(p)):
    g, l = (13*g + gain[t-1])/14, (13*l + loss[t-1])/14
    rsi[t] = 100 - 100/(1 + g/l) if l else 100 if g else 50
features = np.array([[*[math.log(p[t]/p[t-h]) for h in (1, 5, 20, 60)],
                      r[t-20:t].std(ddof=1), r[t-60:t].std(ddof=1),
                      p[t]/p[t-49:t+1].mean()-1, p[t]/p[t-199:t+1].mean()-1,
                      rsi[t]/100, p[t]/p[t-199:t+1].max()-1]
                     for t in range(200, len(p))])
checks = []
def close(name, a, b, tolerance=1e-9):
    np.testing.assert_allclose(a, b, rtol=tolerance, atol=tolerance, err_msg=name)
    checks.append(name)
close('all ten features at every eligible origin', actual['features'][200:], features)
origins = np.arange(200, 581)
X = features[origins-200]
y = np.log(p[origins+20]/p[origins])
means, scales = X.mean(axis=0), X.std(axis=0)
scales[scales <= 1e-12] = 1
z, query = (X-means)/scales, (features[600-200]-means)/scales
ridge = np.linalg.solve(z.T@z + 10*np.eye(10), z.T@(y-y.mean()))
ols = np.linalg.lstsq(z, y-y.mean(), rcond=None)[0]
pred = actual['fit']['predictions']
close('Ridge QR vs independent NumPy normal-equation solver', pred['Ridge'], y.mean()+query@ridge)
close('OLS QR vs independent NumPy least-squares solver', pred['OLS'], y.mean()+query@ols)
distance = np.square(z-query).sum(axis=1)
nearest = np.argsort(distance, kind='stable')[:50]
close('KNN-50 standardized distance and mean target', pred['KNN50'], y[nearest].mean())
close('Mean matured cumulative labels', pred['Mean'], y.mean())
result = actual['result']
params = result['volatility']['parameters']
h = params['backcast']*10000
likelihood = []
for t, value in enumerate(r*100):
    if t:
        h = params['omega']*10000 + params['alpha']*(r[t-1]*100)**2 + params['beta']*h
    likelihood.append(.5*(math.log(h)+value*value/h))
close('GARCH fitted objective in percent-squared units', params['objective'], np.mean(likelihood))
next_h = (params['omega']*10000 + params['alpha']*(r[-1]*100)**2 + params['beta']*h)/10000
close('GARCH next-session variance recurrence', result['volatility']['current']['garch'], next_h)
for risk in result['risk']:
    losses = 1 - p[1:]/p[:-1]
    var = np.quantile(losses, risk['confidence'])
    close(f"VaR {risk['confidence']}", risk['var'], var)
    close(f"ES {risk['confidence']}", risk['es'], losses[losses >= var].mean())
for forecast in result['forecasts']:
    for model in forecast['models']:
        valid = [row for row in forecast['rows'] if row['predictions'][model['name']] is not None]
        if not valid:
            continue
        error = np.array([row['predictions'][model['name']] - math.log(p[row['target']]/p[row['origin']]) for row in valid])
        close(f"{forecast['horizon']} session {model['name']} RMSE", model['rmse'], np.sqrt(np.mean(error**2)))
        close(f"{forecast['horizon']} session {model['name']} MAE", model['mae'], np.abs(error).mean())
print(json.dumps(dict(passed=len(checks), checks=checks, data='SYNTHETIC TEST ONLY; no private records accessed')))
