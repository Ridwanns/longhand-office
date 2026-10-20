"""Independent standard-library calculations over actual acquired macro histories.
Does not import JavaScript or use generated predictions as forecast inputs.
"""
import json
import math
from pathlib import Path

data = json.loads(Path('.tools/macro-outlook-audit.json').read_text(encoding='utf-8'))
checks = 0

def equal(a, b):
    global checks
    checks += 1
    if a is None or b is None:
        assert a is b, (a, b)
    else:
        assert math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-9), (a, b)

def fit(values):
    values = values[-40:]
    x, y = values[:-1], values[1:]
    xbar, ybar = sum(x) / len(x), sum(y) / len(y)
    variance = sum((v-xbar)**2 for v in x)
    covariance = sum((a-xbar)*(b-ybar) for a, b in zip(x, y))
    raw = covariance / variance if variance > 1e-20 else 0
    phi = min(.98, max(-.98, raw))
    return ybar-phi*xbar, phi, values[-1]

def prediction(values, horizon):
    intercept, phi, value = fit(values)
    for _ in range(horizon):
        value = intercept + phi*value
    return value

def radius(errors):
    if len(errors) < 12:
        return None
    ordered = sorted(map(abs, errors))
    rank = math.ceil((len(ordered)+1)*.8)
    return ordered[rank-1] if rank <= len(ordered) else None

for case in data['cases']:
    values = case['values']
    intercept, phi, last = fit(values)
    equal(case['model']['intercept'], intercept)
    equal(case['model']['phi'], phi)
    equal(case['model']['last'], last)
    for point in case['points']:
        h = point['horizon']
        central = prediction(values, h)
        equal(point['value'], central)
        rows = []
        for origin in range(24, len(values)-h+1):
            actual = values[origin+h-1]
            predicted = prediction(values[:origin], h)
            prior_errors = [r['error'] for r in rows if r['target'] < origin]
            band = radius(prior_errors)
            rows.append({'origin': origin, 'target': origin+h-1,
                         'actual': actual, 'prediction': predicted,
                         'error': actual-predicted,
                         'naive': actual-values[origin-1],
                         'seasonal': actual-values[origin-4+(h-1) % 4],
                         'radius': band,
                         'covered': None if band is None else abs(actual-predicted) <= band})
        e = point['evaluation']
        equal(e['count'], len(rows))
        for expected, actual in zip(rows, e['samples']):
            for py, js in [('origin', 'originIndex'), ('target', 'targetIndex'),
                           ('actual', 'actual'), ('prediction', 'prediction'),
                           ('error', 'error'), ('naive', 'naiveError'),
                           ('seasonal', 'seasonalError'), ('radius', 'radius')]:
                equal(expected[py], actual[js])
        for name, key in [('rmse', 'error'), ('naiveRMSE', 'naive'), ('seasonalRMSE', 'seasonal')]:
            equal(e[name], math.sqrt(sum(r[key]**2 for r in rows)/len(rows)) if rows else None)
        equal(e['mae'], sum(abs(r['error']) for r in rows)/len(rows) if rows else None)
        width = radius([r['error'] for r in rows])
        equal(e['radius'], width)
        equal(point['lower'], central-width if width is not None else None)
        equal(point['upper'], central+width if width is not None else None)
        covered = [r['covered'] for r in rows if r['covered'] is not None]
        equal(e['coverageCount'], len(covered))
        equal(e['empiricalCoverage'], sum(covered)/len(covered) if covered else None)

print(json.dumps({'independent_checks': checks, 'source_cases': len(data['cases']),
                  'failures': 0, 'scope': 'Macro AR1, same-target benchmarks, resolved-error calibration, bands and coverage. Current-vintage inputs; not prospective skill.'}))
