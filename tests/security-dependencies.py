import importlib.util
import io
import json
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('security_audit', 'scripts/audit-python-dependencies.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class DependencySecurityTests(unittest.TestCase):
    def fetch(self, data):
        with patch.object(audit.urllib.request, 'urlopen', return_value=io.BytesIO(json.dumps(data).encode())):
            return audit.check_package(('synthetic-test-only', '1.0'))

    def test_clean_requires_confirmed_identity_and_explicit_empty_advisories(self):
        self.assertEqual(self.fetch({'info': {'name': 'synthetic_test_only', 'version': '1.0'}, 'vulnerabilities': []})['advisories'], [])
        for data in [{'info': {'name': 'wrong', 'version': '1.0'}, 'vulnerabilities': []}, {'info': {'name': 'synthetic-test-only', 'version': '1.0'}}]:
            self.assertIn('error', self.fetch(data))

    def test_network_failure_is_unknown_not_clean(self):
        with patch.object(audit.urllib.request, 'urlopen', side_effect=TimeoutError('Synthetic test timeout')):
            self.assertIn('error', audit.check_package(('synthetic-test-only', '1.0')))

    def test_aliases_deduplicate_and_withdrawn_advisories_do_not_trigger(self):
        result = self.fetch({'info': {'name': 'synthetic-test-only', 'version': '1.0'}, 'vulnerabilities': [
            {'id': 'GHSA-TEST-ONLY-0001', 'aliases': ['PYSEC-TEST-1'], 'fixed_in': ['1.1']},
            {'id': 'PYSEC-TEST-1', 'aliases': ['GHSA-TEST-ONLY-0001'], 'fixed_in': ['1.1']},
            {'id': 'WITHDRAWN-TEST-ONLY', 'withdrawn': '2026-10-23'},
        ]})
        self.assertEqual(len(result['advisories']), 1)
        self.assertEqual(result['advisories'][0]['id'], 'GHSA-TEST-ONLY-0001')


if __name__ == '__main__':
    unittest.main()
