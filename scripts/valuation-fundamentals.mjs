import {screenerInstrument} from './screener-quotes.mjs';
const finite=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
export function projectValuationFundamental(entry,market){
 const i=screenerInstrument(entry,market),q=entry?.quote;if(!i)return null;
 return {...i,provider:'yahoo',retrievedAt:entry.retrievedAt,financialCurrency:typeof q.financialCurrency==='string'?q.financialCurrency:null,epsTtm:finite(q.epsTrailingTwelveMonths),epsForward:finite(q.epsForward),bookValue:finite(q.bookValue),dividendTtm:finite(q.trailingAnnualDividendRate),providerTrailingPe:finite(q.trailingPE),sharesOutstanding:finite(q.sharesOutstanding),fiscalPeriodEnd:null,cashflow:null,cashflowError:'Detailed annual cash flows are not published for this instrument.'};
}
