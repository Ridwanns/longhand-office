// Read-only official observations. No rates are applied to holdings or model assumptions.
export const TREASURY_SOURCE='https://home.treasury.gov/policy-issues/financing-the-government/interest-rate-statistics';
export const TREASURY_TENORS=['1 Mo','2 Mo','3 Mo','6 Mo','1 Yr','2 Yr','3 Yr','5 Yr','7 Yr','10 Yr','20 Yr','30 Yr'];
export function validateOfficialRates(value){
 if(value?.format!=='longhand-official-rates'||value.version!==1||value.provider!=='us-treasury'||value.sourceUrl!==TREASURY_SOURCE||value.unit!=='percent per year'||!Number.isFinite(Date.parse(value.retrievedAt)))throw Error('Invalid official rate provenance.');
 if(value.error){if(typeof value.error!=='string'||value.error.length>240||value.observations?.length)throw Error('Invalid unavailable rate record.');return value;}
 if(!/^[a-f0-9]{64}$/.test(value.sourceHash)||!Array.isArray(value.observations)||!value.observations.length||value.observations.length>400)throw Error('Invalid official rate observations.');
 const received=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value.retrievedAt));let previous='';
 for(const row of value.observations){if(!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||new Date(row.date+'T00:00:00Z').toISOString().slice(0,10)!==row.date||row.date<=previous||row.date>received||!row.rates)throw Error('Invalid or unordered official observation date.');previous=row.date;
  for(const tenor of TREASURY_TENORS){const n=row.rates[tenor];if(n!==null&&(typeof n!=='number'||!Number.isFinite(n)||n< -5||n>100))throw Error('Invalid or missing official yield.');}
  if(!TREASURY_TENORS.some(t=>row.rates[t]!==null))throw Error('Empty yield observation.');
 }
 return value;
}
export function treasurySpread(row,long='10 Yr',short='2 Yr'){
 const a=row?.rates?.[long],b=row?.rates?.[short];return typeof a==='number'&&typeof b==='number'?Math.round((a-b)*10000)/100:null;
}
