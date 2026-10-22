"""Synthetic public artifact fixtures; no account records or network calls."""
import importlib.util,io,json,tarfile,tempfile,unittest
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
interface=load('interface_snapshot',root/'scripts/reuse-interface-snapshot.py')

class InterfaceSnapshotTests(unittest.TestCase):
    def fixture(self,change=None,extras=()):
        tmp=tempfile.TemporaryDirectory();self.addCleanup(tmp.cleanup);base=Path(tmp.name)
        entry={'file':'history/US-TEST.json','market':'US','ticker':'TEST','currency':'USD','retrievedAt':'2026-10-01T00:00:00Z'}
        files={'manifest.json':{'format':'longhand-public-market-data','version':1,'publishedAt':'2026-10-01T00:01:00Z','histories':[entry]},'market.json':{'publishedAt':'2026-10-01T00:01:00Z','quotes':{}},'fundamentals.json':{'format':'longhand-public-fundamentals','version':1,'records':[{'label':'SYNTHETIC TEST ONLY'}]},entry['file']:{'metadata':{k:entry[k] for k in ['market','ticker','currency','retrievedAt']},'rows':[]}}
        for name,fmt in interface.FORMATS.items():files[name]={'format':fmt,'version':1,'generatedAt':'2026-10-01T00:00:00Z','label':'SYNTHETIC TEST ONLY'}
        if change:change(files)
        raw={name:json.dumps(value).encode() for name,value in files.items()};archive=base/'public-only.tar'
        with tarfile.open(archive,'w') as package:
            for name,value in raw.items():
                member=tarfile.TarInfo('./data/'+name);member.size=len(value);package.addfile(member,io.BytesIO(value))
            for member,value in extras:package.addfile(member,io.BytesIO(value) if value else None)
        return archive,base/'output',raw
    def test_preserves_exact_public_bytes_and_source_dates(self):
        archive,target,raw=self.fixture();result=interface.reuse_interface(archive,target)
        self.assertEqual(result['sourcePublishedAt'],'2026-10-01T00:01:00Z')
        for name,value in raw.items():self.assertEqual((target/name).read_bytes(),value)
    def test_incomplete_verified_artifact_cannot_publish_an_empty_feed(self):
        archive,target,_=self.fixture(lambda files:files.pop('idx-primary.json'))
        with self.assertRaises(ValueError):interface.reuse_interface(archive,target)
        self.assertFalse(target.exists())
    def test_private_scripts_and_traversal_are_never_copied(self):
        extras=[]
        for name in ['data/../../private.sqlite','app.js','.env','data/private-records.json']:
            member=tarfile.TarInfo(name);member.size=4;extras.append((member,b'TEST'))
        archive,target,raw=self.fixture(extras=extras);interface.reuse_interface(archive,target)
        self.assertEqual(len([p for p in target.rglob('*') if p.is_file()]),len(raw));self.assertFalse((target.parent/'private.sqlite').exists())
    def test_wrong_source_format_is_rejected_before_writing(self):
        archive,target,_=self.fixture(lambda files:files['source-integrity.json'].update(format='PRIVATE-TEST-ONLY'))
        with self.assertRaises(ValueError):interface.reuse_interface(archive,target)
        self.assertFalse(target.exists())
    def test_known_source_symlink_or_duplicate_is_rejected(self):
        for link in [False,True]:
            member=tarfile.TarInfo('data/macro.json');member.size=0
            if link:member.type=tarfile.SYMTYPE;member.linkname='../../private.sqlite'
            archive,target,_=self.fixture(extras=[(member,None)])
            with self.assertRaises(ValueError):interface.reuse_interface(archive,target)
if __name__=='__main__':unittest.main()
