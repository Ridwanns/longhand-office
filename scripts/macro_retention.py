"""Exact continuity check against JSON from a preceding successful Pages artifact.
This proves preservation, not a new acquisition or agreement with today's source.
"""
import datetime

ANNOTATIONS = {'refreshError', 'refreshAttemptAt', 'retainedFromGeneratedAt'}

def retained_match(item, baseline, generated_at):
    assert isinstance(item.get('refreshError'), str) and 0 < len(item['refreshError']) <= 240, 'Missing refresh failure'
    def stamp(value):
        return datetime.datetime.fromisoformat(value.replace('Z', '+00:00'))
    assert stamp(item['retrievedAt']) <= stamp(item['refreshAttemptAt']) <= stamp(generated_at), 'Invalid retained timestamps'
    assert item['retainedFromGeneratedAt'] == baseline['generatedAt'], 'Baseline publication differs'
    assert stamp(baseline['generatedAt']) <= stamp(generated_at), 'Baseline is newer'
    original = next((s for s in baseline['series'] if s['id'] == item['id']), None)
    assert original and not original.get('error') and any(isinstance(o.get('value'), (float, int)) for o in original['observations']), 'No verified baseline observations'
    clean = lambda value: {k: v for k, v in value.items() if k not in ANNOTATIONS}
    assert clean(item) == clean(original), 'Retained values, identity, hash or original timestamps changed'
    return True
