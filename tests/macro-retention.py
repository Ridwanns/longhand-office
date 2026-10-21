"""Synthetic continuity checks only; no network or personal records."""
import importlib.util,copy,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('retention',Path(__file__).resolve().parents[1]/'scripts/macro_retention.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class RetentionChecks(unittest.TestCase):
    def fixture(self):
        original={'id':'TEST ONLY','sourceHash':'a'*64,'retrievedAt':'2026-10-20T12:00:00Z','unit':'%','sourceUpdated':'2026-10-19','sourceNotes':'TEST ONLY','observations':[{'date':'2026-09-01','value':2,'status':'provisional','sourceFlag':'p'}]}
        baseline={'generatedAt':'2026-10-20T13:00:00Z','series':[original]}
        item={**copy.deepcopy(original),'refreshError':'TEST ONLY maintenance','refreshAttemptAt':'2026-10-21T12:00:00Z','retainedFromGeneratedAt':baseline['generatedAt']}
        return item,baseline,'2026-10-21T13:00:00Z'
    def test_exact_old_record_is_continuity_not_new_source_confirmation(self):
        self.assertTrue(module.retained_match(*self.fixture()))
    def test_value_hash_date_units_notes_and_status_mutations_reject(self):
        for key,value in [('sourceHash','b'*64),('retrievedAt','2026-10-20T13:00:00Z'),('unit','USD'),('sourceUpdated','2026-10-20'),('sourceNotes','changed')]:
            item,base,now=self.fixture();item[key]=value
            with self.assertRaises(AssertionError):module.retained_match(item,base,now)
        item,base,now=self.fixture();item['observations'][0]['status']='reported'
        with self.assertRaises(AssertionError):module.retained_match(item,base,now)
    def test_missing_baseline_or_future_attempt_rejects(self):
        item,base,now=self.fixture();base['series']=[]
        with self.assertRaises(AssertionError):module.retained_match(item,base,now)
        item,base,now=self.fixture();item['refreshAttemptAt']='2026-10-22T00:00:00Z'
        with self.assertRaises(AssertionError):module.retained_match(item,base,now)
    def test_repeated_retention_strips_only_explicit_annotations(self):
        item,base,now=self.fixture();base['series'][0].update(refreshError='old attempt',refreshAttemptAt='2026-10-20T13:00:00Z',retainedFromGeneratedAt='2026-10-20T12:00:00Z')
        self.assertTrue(module.retained_match(item,base,now))
if __name__=='__main__':unittest.main()
