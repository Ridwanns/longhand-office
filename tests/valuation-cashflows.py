import sys,unittest,importlib.util
from pathlib import Path
import pandas as pd
spec=importlib.util.spec_from_file_location('collector',Path(__file__).parents[1]/'scripts/collect-valuation-cashflows.py');collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector)
class CashFlowChecks(unittest.TestCase):
    def setUp(self):
        self.period=pd.Timestamp('2025-12-31');self.cash=pd.DataFrame({self.period:{'OperatingCashFlow':1000.,'CapitalExpenditure':-200.,'NetIssuancePaymentsOfDebt':100.}});self.income=pd.DataFrame({self.period:{'DilutedAverageShares':100.}})
    def test_signed_components(self):
        r=collector.project_cashflow(self.cash,self.income,self.period,'USD');self.assertEqual((r['cfo']+r['capex']+r['netBorrowing'])/r['dilutedAverageShares'],9.)
    def test_missing_debt_is_not_zero(self):
        with self.assertRaises(ValueError):collector.project_cashflow(self.cash.drop('NetIssuancePaymentsOfDebt'),self.income,self.period,'USD')
    def test_positive_capex_rejects(self):
        self.cash.loc['CapitalExpenditure',self.period]=200.
        with self.assertRaises(ValueError):collector.project_cashflow(self.cash,self.income,self.period,'USD')
    def test_different_share_period_rejects(self):
        with self.assertRaises(ValueError):collector.project_cashflow(self.cash,self.income.rename(columns={self.period:pd.Timestamp('2024-12-31')}),self.period,'USD')
if __name__=='__main__':unittest.main()
