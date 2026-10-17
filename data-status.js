import {researchDate} from './research-layout.js';
export function dataState({available=true,observedAt,modelReady=true,hasFundamentals=true,now=Date.now(),staleDays=3}={}){
 const t=Date.parse(observedAt?.length===10?observedAt+'T00:00:00Z':observedAt);
 if(!available)return {kind:'missing',label:'Unavailable',detail:'No substitute observation was used.'};
 if(!Number.isFinite(t)||t>now+300000)return {kind:'unverified',label:'Date unverified',detail:'Observation timing cannot be verified.'};
 const age=Math.max(0,Math.floor((now-t)/86400000));
 return {kind:age>staleDays?'outdated':'snapshot',label:age>staleDays?'Outdated snapshot':'Dated snapshot',detail:'Observation '+observedAt+'. Not real-time.'+(age>staleDays?' Over '+staleDays+' calendar days old.':'')+(modelReady===false?' Insufficient eligible model history.':'')+(hasFundamentals===false?' Fundamentals unavailable.':'')};
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function dataBadge(options){const s=dataState(options),detail=options?.observedAt?s.detail.replace('Observation '+options.observedAt+'.','Observed '+researchDate(options.observedAt)+'.'):s.detail;return `<span class="data-state data-state-${s.kind}" title="${esc(s.detail)}">${s.label}</span>${options?.modelReady===false?'<span class="data-state">Insufficient history</span>':''}${options?.hasFundamentals===false?'<span class="data-state">Missing fundamentals</span>':''}<span class="data-state-detail">${esc(detail)}</span>`;}
