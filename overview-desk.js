// Overview desk: the market schedule, the opening paragraph and the featured chart.
// Every figure is computed from completed daily closes in the published Overview feed (see overviewSession);
// nothing is filled, interpolated or invented. Output is SVG/HTML markup without style attributes, because the
// Pages CSP (style-src 'self') blocks inline styles; colours come from classes.
export const SCHEDULE_WINDOWS=[[21,'1M'],[63,'3M'],[252,'1Y']];
export const FEATURE_WINDOWS=[[63,'3M'],[252,'1Y'],[0,'All']];
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];
export const closes=history=>(Array.isArray(history)?history:[]).filter(r=>typeof r?.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&Number.isFinite(r.close)&&r.close>0);
const extremes=rows=>{let low=rows[0],high=rows[0];for(const r of rows){if(r.close<low.close)low=r;if(r.close>high.close)high=r;}return {low,high};};
export const shortDate=d=>`${Number(d.slice(8,10))} ${MONTHS[Number(d.slice(5,7))-1]}`;
export const longDate=d=>`${shortDate(d)} ${d.slice(0,4)}`;
export const monthYear=d=>`${MONTHS[Number(d.slice(5,7))-1]} ${d.slice(0,4)}`;

// One schedule row: the change over the chosen window, the sparkline points and the 52-week (252-session) range.
export function scheduleRow(history,sessions){
 const c=closes(history);if(c.length<2||!Number.isInteger(sessions)||sessions<1)return null;
 const last=c.at(-1),spark=c.slice(-sessions-1),year=c.slice(-252),{low,high}=extremes(year);
 return {last,previous:c.at(-2),windowStart:spark[0],windowChange:(last.close/spark[0].close-1)*100,windowComplete:c.length>sessions,spark,low,high,rangeSessions:year.length,position:high.close>low.close?(last.close-low.close)/(high.close-low.close):0.5};
}

// Sparkline geometry in a width x height box. Returns the path and the end point.
export function sparkGeometry(points,width=120,height=32){
 const c=closes(points);if(c.length<2)return null;
 const values=c.map(r=>r.close),min=Math.min(...values),max=Math.max(...values),x=i=>i/(c.length-1)*width,y=v=>height-1-(v-min)/((max-min)||1)*(height-2);
 return {d:c.map((r,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(r.close).toFixed(1)).join(''),end:{x:width,y:y(c.at(-1).close)},x,y,points:c};
}

// Facts for the opening paragraph, from IHSG's published history plus the S&P 500 and gold for scale.
export function deskFacts(ihsg,spx,gold){
 const c=closes(ihsg);if(c.length<2)return null;
 const last=c.at(-1),previous=c.at(-2),{low,high}=extremes(c);
 const off=rows=>{const r=closes(rows);if(r.length<2)return null;const {high:h}=extremes(r);return {value:(1-r.at(-1).close/h.close)*100,high:h,last:r.at(-1),first:r[0]};};
 return {last,previous,move:(last.close/previous.close-1)*100,high,low,first:c[0],belowHigh:(1-last.close/high.close)*100,sessionsSinceLow:c.length-1-c.indexOf(low),spx:off(spx),gold:off(gold)};
}

// The featured chart. Returns markup plus the geometry the page needs for the crosshair.
export function featureChart(history,sessions,width,{decimals=2,label='Close'}={}){
 const all=closes(history),c=sessions?all.slice(-sessions-1):all;if(c.length<2)return null;
 const W=Math.max(300,Math.round(width)),H=300,L=8,R=W-64,T=26,B=H-28,values=c.map(r=>r.close),{low,high}=extremes(c),hi=high.close,lo=low.close,pad=(hi-lo)*.1||hi*.01,min=lo-pad,max=hi+pad;
 const X=i=>L+(R-L)*i/(c.length-1),Y=v=>B-(B-T)*(v-min)/(max-min),last=values.at(-1),up=last>=values[0],fmt=v=>v.toLocaleString('en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
 let g='<g class="desk-grid-lines">';for(let k=0;k<=4;k++){const v=min+(max-min)*k/4;g+=`<line x1="${L}" x2="${R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text x="${R+8}" y="${(Y(v)+3).toFixed(1)}">${fmt(v)}</text>`;}g+='</g>';
 // Month ticks; long windows label every third month so the axis stays readable.
 const step=c.length>200?3:1;let prior='';c.forEach((r,i)=>{const ym=r.date.slice(0,7),month=Number(r.date.slice(5,7));if(ym!==prior&&(month-1)%step===0&&i>2)g+=`<text class="desk-month" x="${X(i).toFixed(1)}" y="${H-8}" text-anchor="middle">${MONTHS[month-1]}${month===1?' '+r.date.slice(2,4):''}</text>`;prior=ym;});
 const d=c.map((r,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(r.close).toFixed(1)).join(''),hiI=c.indexOf(high),loI=c.indexOf(low),late=i=>i>c.length*.72;
 g+=`<g class="desk-series ${up?'up':'dn'}"><path class="desk-area" d="${d} L${X(c.length-1).toFixed(1)} ${B} L${X(0).toFixed(1)} ${B}Z"/><path class="desk-line" d="${d}"/></g>`;
 g+=`<line class="desk-peak" x1="${X(hiI).toFixed(1)}" x2="${R}" y1="${Y(hi).toFixed(1)}" y2="${Y(hi).toFixed(1)}"/>`;
 g+=`<circle class="desk-mark" cx="${X(hiI).toFixed(1)}" cy="${Y(hi).toFixed(1)}" r="3.5"/><text class="desk-ann" x="${(X(hiI)+(late(hiI)?-6:6)).toFixed(1)}" y="${(Y(hi)-8).toFixed(1)}" text-anchor="${late(hiI)?'end':'start'}">HIGH ${fmt(hi)} · ${longDate(high.date)}</text>`;
 g+=`<circle class="desk-mark" cx="${X(loI).toFixed(1)}" cy="${Y(lo).toFixed(1)}" r="3.5"/><text class="desk-ann" x="${(X(loI)+(late(loI)?-6:6)).toFixed(1)}" y="${(Y(lo)+16).toFixed(1)}" text-anchor="${late(loI)?'end':'start'}">LOW ${fmt(lo)} · ${longDate(low.date)}</text>`;
 const fromHigh=(last/hi-1)*100;
 if(fromHigh<-0.5)g+=`<g class="desk-drawdown"><line x1="${R-2}" x2="${R-2}" y1="${Y(hi).toFixed(1)}" y2="${Y(last).toFixed(1)}"/><line x1="${R-8}" x2="${R+4}" y1="${Y(hi).toFixed(1)}" y2="${Y(hi).toFixed(1)}"/><line x1="${R-8}" x2="${R+4}" y1="${Y(last).toFixed(1)}" y2="${Y(last).toFixed(1)}"/><text x="${R-12}" y="${((Y(hi)+Y(last))/2+4).toFixed(1)}" text-anchor="end">${fromHigh.toFixed(1)}%</text></g>`;
 g+=`<line class="desk-crosshair" x1="0" x2="0" y1="${T-10}" y2="${B}"/><circle class="desk-crosshair-dot" cx="0" cy="0" r="4"/>`;
 return {svg:`<svg class="desk-feature-plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}: ${c.length} daily closes from ${longDate(c[0].date)} to ${longDate(c.at(-1).date)}">${g}</svg>`,points:c,first:c[0],last:c.at(-1),high,low,change:(last/values[0]-1)*100,fromHigh,X,Y,L,R,W};
}
