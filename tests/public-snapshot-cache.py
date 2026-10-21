"""Test-only artifact fixtures: no personal files or network requests."""
import importlib.util
import io
import json
import tarfile
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('reuse', Path(__file__).resolve().parents[1] / 'scripts/reuse-public-snapshot.py')
reuse = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reuse)

class PublicSnapshotTests(unittest.TestCase):
    def test_integrity_baseline_copies_only_public_json_with_original_dates(self):
        member=tarfile.TarInfo('data/../../private.sqlite');member.size=4
        archive=self.archive(extras=[(member,b'TEST')])
        source=importlib.util.spec_from_file_location('baseline',Path(__file__).resolve().parents[1]/'scripts/source-baseline.py')
        baseline=importlib.util.module_from_spec(source);source.loader.exec_module(baseline)
        target=Path(self.temp.name)/'isolated-public-baseline';baseline.capture(archive,target)
        self.assertEqual(json.loads((target/'manifest.json').read_text())['publishedAt'],'2026-10-01T00:01:00Z')
        self.assertTrue((target/'history/US-TEST.json').is_file())
        self.assertFalse((Path(self.temp.name)/'private.sqlite').exists())

    def test_integrity_baseline_preserves_exact_macro_bytes_for_audited_retention(self):
        formats={'macro':'longhand-macro','macro-context':'longhand-macro-context','macro-releases':'longhand-macro-releases','macro-extended':'longhand-macro-extended'}
        payloads={key:json.dumps({'format':value,'version':1,'generatedAt':'2026-10-01T00:00:00Z','series':[]}).encode() for key,value in formats.items()}
        extras=[]
        for key,raw in payloads.items():
            member=tarfile.TarInfo('data/'+key+'.json');member.size=len(raw);extras.append((member,raw))
        archive=self.archive(extras=extras)
        source=importlib.util.spec_from_file_location('baseline',Path(__file__).resolve().parents[1]/'scripts/source-baseline.py')
        baseline=importlib.util.module_from_spec(source);source.loader.exec_module(baseline)
        target=Path(self.temp.name)/'macro-baseline';baseline.capture(archive,target)
        for key,raw in payloads.items():self.assertEqual((target/(key+'.json')).read_bytes(),raw)

    def archive(self, edit=None, extras=None):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        path = Path(self.temp.name) / 'test-only.tar'
        entry = dict(file='history/US-TEST.json', ticker='TEST', market='US', currency='USD', retrievedAt='2026-10-01T00:00:00Z')
        files = {'data/manifest.json': dict(format='longhand-public-market-data', version=1, publishedAt='2026-10-01T00:01:00Z', histories=[entry]),
                 'data/market.json': dict(publishedAt='2026-10-01T00:01:00Z', quotes={}),
                 'data/fundamentals.json': dict(format='longhand-public-fundamentals', version=1, records=[dict(name='SYNTHETIC TEST ONLY')]),
                 'data/history/US-TEST.json': dict(metadata={k: entry[k] for k in ('ticker', 'market', 'currency', 'retrievedAt')}, rows=[])}
        if edit:
            edit(files)
        with tarfile.open(path, 'w') as archive:
            for name, value in files.items():
                payload = json.dumps(value).encode()
                member = tarfile.TarInfo('./' + name)
                member.size = len(payload)
                archive.addfile(member, io.BytesIO(payload))
            for member, payload in extras or []:
                archive.addfile(member, io.BytesIO(payload) if payload else None)
        return path

    def test_retains_exact_public_bytes_and_original_dates(self):
        files, manifest = reuse.retained_snapshot(self.archive())
        self.assertEqual(set(files), {'manifest.json', 'market.json', 'fundamentals.json', 'history/US-TEST.json'})
        self.assertEqual(manifest['publishedAt'], '2026-10-01T00:01:00Z')
        self.assertEqual(json.loads(files['market.json'])['publishedAt'], manifest['publishedAt'])

    def test_never_extracts_private_files_scripts_or_traversal(self):
        extras = []
        for name in ['office.sqlite', 'index.html', 'app.js', 'data/../../office.sqlite', '/data/market.json']:
            member = tarfile.TarInfo(name)
            member.size = 4
            extras.append((member, b'TEST'))
        files, _ = reuse.retained_snapshot(self.archive(extras=extras))
        self.assertEqual(len(files), 4)

    def test_symlinks_are_rejected_without_following_a_target(self):
        member = tarfile.TarInfo('data/history/US-OTHER.json')
        member.type = tarfile.SYMTYPE
        member.linkname = '../../office.sqlite'
        with self.assertRaises(ValueError):
            reuse.retained_snapshot(self.archive(extras=[(member, b'')]))

    def test_history_currency_or_vintage_mismatch_rejects(self):
        with self.assertRaises(ValueError):
            reuse.retained_snapshot(self.archive(lambda f: f['data/history/US-TEST.json']['metadata'].update(currency='IDR')))

    def test_incomplete_or_different_publications_reject(self):
        with self.assertRaises(ValueError):
            reuse.retained_snapshot(self.archive(lambda f: f['data/market.json'].update(publishedAt='2026-10-02T00:00:00Z')))
        with self.assertRaises(ValueError):
            reuse.retained_snapshot(self.archive(lambda f: f['data/manifest.json']['histories'][0].update(file='../office.sqlite')))

if __name__ == '__main__':
    unittest.main()
