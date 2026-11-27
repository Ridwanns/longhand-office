// When is a reading outdated? The answer depends on how the reading was acquired.
// - An automatic source is re-acquired on every refresh. If its retrieval is more than ten days old, the pipeline
//   stopped, so it is outdated whatever its period.
// - A reviewed source is a release someone checked by hand. Its retrieval date is the review date and says nothing
//   about whether a newer release exists. It is outdated once the next release is due: one period after the latest,
//   with the same publication lag the latest release had (release date minus period end), plus a week of grace.
// Both are also outdated when the period itself is older than the frequency's limit, as before.
const DAY=86400000,GRACE_DAYS=7,ACQUISITION_DAYS=10;
const MONTHS={M:1,Q:3,A:12};
const day=s=>Date.parse(String(s).slice(0,10)+'T00:00:00Z');
// last calendar day of the period that starts on `date` (YYYY-MM-DD); daily and event readings end on their own date
export function periodEnd(date,frequency,periods=1){
 const months=MONTHS[frequency];if(!months)return String(date).slice(0,10);
 const d=new Date(day(date));const start=frequency==='A'?Date.UTC(d.getUTCFullYear(),0,1):Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1);
 const s=new Date(start);return new Date(Date.UTC(s.getUTCFullYear(),s.getUTCMonth()+months*periods,0)).toISOString().slice(0,10);
}
// The day by which the next release should be out, or null when the latest reading carries no usable release date.
export function nextReleaseDue(latest,frequency){
 if(!MONTHS[frequency]||!latest?.date||!latest.releasedAt)return null;
 const end=day(periodEnd(latest.date,frequency)),lag=day(latest.releasedAt)-end;
 if(!Number.isFinite(lag)||lag<0||lag>400*DAY)return null;
 return new Date(day(periodEnd(latest.date,frequency,2))+lag+GRACE_DAYS*DAY).toISOString().slice(0,10);
}
export function acquisitionOld(retrievedAt,{reviewed=false,now=Date.now()}={}){
 return !reviewed&&Number.isFinite(Date.parse(retrievedAt))&&now-Date.parse(retrievedAt)>ACQUISITION_DAYS*DAY;
}
// latest: {date, releasedAt?}; limitDays: the period-age limit for this frequency
export function readingOutdated({latest,frequency,retrievedAt,reviewed=false,limitDays,now=Date.now()}){
 if(!latest?.date)return false;
 const periodOld=Number.isFinite(limitDays)&&now-day(periodEnd(latest.date,frequency))>limitDays*DAY;
 if(periodOld)return true;
 if(!reviewed)return acquisitionOld(retrievedAt,{now});
 const due=nextReleaseDue(latest,frequency);return !!due&&now>day(due)+DAY-1;
}
