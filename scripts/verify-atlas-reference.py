"""Independent arithmetic/chronology checks of the owner's pinned public studies.

Reads only anonymous public data; never reads or writes Office records.
Reconciles retained scores and covariance/replay; does not claim to refit models.
"""
import gzip
import hashlib
import json
import math
import statistics
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
COMMIT = 'c08ae40a4fb7295b006aec05914857689c0d3e4c'
SOURCES = {'quant-snapshot.json.gz': '8be7adad041d2fcf6553b5cf12b2f80ce5a61bfa7bc7407fca6f58c8ea7317a6',
           'focused-portfolio.json.gz': '832e91146080883f57fb84dc7509819bc402c3f5cc78f44eb61ef63a465141d9'}
checks = 0


def verify(ok, description):
    global checks
    if not ok:
        raise AssertionError(description)
    checks += 1


def near(actual, expected, description):
    verify(math.isfinite(actual) and abs(actual-expected) <= max(1e-10, abs(expected)*1e-8), description)


def percentile(values, p):
    values = sorted(values)
    index = (len(values)-1)*p
    left = int(index)
    return values[left]+(values[min(left+1, len(values)-1)]-values[left])*(index-left)


def source(file, fingerprint):
    local = ROOT / '.tools/market-atlas-reference' / file
    raw = local.read_bytes() if local.exists() else urlopen(
        f'https://raw.githubusercontent.com/Ridwanns/market-atlas/{COMMIT}/data/{file}', timeout=60).read()
    verify(hashlib.sha256(raw).hexdigest() == fingerprint, file+' source hash')
    data = json.loads(gzip.decompress(raw))
    verify(data['cutoff'] == '2026-09-30' and data['schema_version'] == 1, file+' version/cutoff')
    return data


original, focused = [source(file, fingerprint) for file, fingerprint in SOURCES.items()]
assets = dict(original['assets'])
for id_, asset in focused['assets'].items():
    if id_ in assets:
        verify(assets[id_] == asset, id_+' identical shared retained study')
    assets[id_] = asset

for id_, asset in assets.items():
    history = asset['summary']['history']
    prices = {row['date']: row['close'] for row in history}
    verify(list(prices) == sorted(prices) and len(prices) == len(history), id_+' ordered unique prices')
    verify(all(math.isfinite(v) and v > 0 for v in prices.values()), id_+' genuine positive prices')
    for forecast in asset['forecasts']:
        records = forecast['records']
        verify(len(records) == forecast['observations'], id_+' scored count')
        for row in records:
            verify(row['last_training_target'] <= row['origin'] < row['target'] <= asset['cutoff'], id_+' matured chronological target')
            near(row['actual'], math.log(prices[row['target']]/prices[row['origin']]), id_+' realized source log return')
        for model, score in forecast['scores'].items():
            errors = [row['actual']-row['predictions'][model] for row in records]
            near(score['rmse'], math.sqrt(statistics.fmean(e*e for e in errors)), id_+' '+model+' RMSE')
            near(score['mae'], statistics.fmean(abs(e) for e in errors), id_+' '+model+' MAE')
            near(score['direction_accuracy'], statistics.fmean((row['actual'] > 0) == (row['predictions'][model] > 0) for row in records), id_+' '+model+' up/non-up')
            calibrated = [row for row in records if row['intervals90'][model] is not None]
            verify(score['interval_observations'] == len(calibrated), id_+' '+model+' interval count')
            if calibrated:
                near(score['coverage90'], statistics.fmean(row['intervals90'][model][0] <= row['actual'] <= row['intervals90'][model][1] for row in calibrated), id_+' '+model+' interval coverage')
            else:
                verify(score['coverage90'] is None, id_+' '+model+' missing interval stays null')
    values = list(prices.values())
    returns = [values[i]/values[i-1]-1 for i in range(1, len(values))]
    for confidence, risk in asset['risk']['current'].items():
        losses = [-r for r in returns[-risk['window']:]]
        threshold = percentile(losses, float(confidence))
        near(risk['var'], threshold, id_+' simple-loss VaR')
        tail = [v for v in losses if v >= threshold]
        near(risk['es'], statistics.fmean(tail), id_+' ES')
        verify(risk['tail_count'] == len(tail), id_+' tail count')

for name, data in [('original', original), ('focused', focused)]:
    portfolio = data['portfolios']
    ids = portfolio['ids']
    series = {id_: {r['date']: r['close'] for r in assets[id_]['summary']['history']} for id_ in ids}
    dates = sorted(set.intersection(*(set(s) for s in series.values())))[-253:]
    returns = [[series[id_][dates[i]]/series[id_][dates[i-1]]-1 for id_ in ids] for i in range(1, len(dates))]
    covariance = [[statistics.covariance([r[i] for r in returns], [r[j] for r in returns]) for j in range(len(ids))] for i in range(len(ids))]
    shrunk = [[v if i == j else .9*v for j, v in enumerate(row)] for i, row in enumerate(covariance)]
    for i in range(len(ids)):
        for j in range(len(ids)):
            near(portfolio['covariance_daily'][i][j], shrunk[i][j], name+' covariance/shrinkage')
    for style, study in portfolio['styles'].items():
        weights = [study['weights'][id_] for id_ in ids]
        near(sum(weights), 1, name+' '+style+' weights')
        variance = sum(weights[i]*shrunk[i][j]*weights[j] for i in range(len(ids)) for j in range(len(ids)))
        near(study['annual_volatility'], math.sqrt(variance*252), name+' '+style+' annual volatility')
        for i, id_ in enumerate(ids):
            near(study['risk_contributions'][id_], weights[i]*sum(shrunk[i][j]*weights[j] for j in range(len(ids)))/variance, name+' variance contribution')
        nav = 1
        for i, (daily, row) in enumerate(zip(returns, study['records'])):
            growth = 1+sum(w*r for w, r in zip(weights, daily))
            drift = [w*(1+r)/growth for w, r in zip(weights, daily)]
            trade = sum(abs(w-d) for w, d in zip(weights, drift))
            entry = 1 if i == 0 else 0
            expected = growth*(1-entry*.001)*(1-trade*.001)-1
            near(row['return'], expected, name+' costed replay return')
            nav *= 1+expected
            near(row['nav'], nav, name+' costed replay NAV')

print(json.dumps({'checks': checks, 'assets': len(assets), 'cutoff': original['cutoff'],
                  'modelFamilies': len(original['model_families']), 'failures': 0,
                  'scope': 'Independent retained score, source-return, chronology, risk, covariance and costed-replay arithmetic; no fresh advanced refit.'}))
