// An archive read must never replace a more recent interaction or another view.
let revision=0;
const advance=()=>{revision++;};
for(const event of ['click','input','change'])document.addEventListener(event,e=>{
 if(e.target?.closest?.('.quant-room'))advance();
},true);
window.addEventListener('hashchange',advance);
window.addEventListener('popstate',advance);
export function captureResearchAction(anchor){
 const own=++revision,root=anchor?.closest('.quant-room'),url=location.href;
 return ()=>own===revision&&!!anchor?.isConnected&&!!root?.isConnected&&root===document.querySelector('.quant-room')&&location.href===url;
}
