// Chart typography is measured in screen pixels, independent of SVG viewBox scale.
// This changes presentation only: coordinates, source values and model inputs are untouched.
export const CHART_LABEL_PIXELS=11;
const charts='.scientific-plot>svg,.context-chart-plot>svg,.latest-cycle-plot>svg,.context-cycle>svg,svg.macro-data-chart,.outlook-chart>svg';
export function fitChartTypography(svg){
 if(!svg.isConnected||!svg.getBoundingClientRect().width)return;
 const matrix=svg.getScreenCTM(),scale=matrix&&Math.hypot(matrix.a,matrix.b);
 if(!Number.isFinite(scale)||scale<=0)return;
 for(const text of svg.querySelectorAll('text'))text.style.setProperty('font-size',CHART_LABEL_PIXELS/scale+'px','important');
}
export function mountChartTypography(root=document){
 const observed=new Set();let frame;
 const sizing=new ResizeObserver(entries=>entries.forEach(e=>fitChartTypography(e.target)));
 const discover=()=>{frame=null;for(const svg of observed)if(!root.contains(svg)){sizing.unobserve(svg);observed.delete(svg);}for(const svg of root.querySelectorAll(charts)){if(!observed.has(svg)){observed.add(svg);sizing.observe(svg);}fitChartTypography(svg);}};
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(discover);};
 const tree=new MutationObserver(schedule);tree.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open']});discover();
 return ()=>{if(frame)cancelAnimationFrame(frame);tree.disconnect();sizing.disconnect();observed.clear();};
}
