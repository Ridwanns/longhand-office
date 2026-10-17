// Motion changes opacity/position only. Values, axes and observations are never tweened.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),active=new Set(),owners=new WeakMap();
export function revealOffice(node,{distance=4,duration=180}={}){
 if(!node?.isConnected)return;owners.get(node)?.cancel();
 if(reduced.matches||!node.animate)return;
 const animation=node.animate([{opacity:.45,transform:'translateY('+distance+'px)'},{opacity:1,transform:'translateY(0)'}],{duration,easing:'cubic-bezier(.2,.65,.3,1)'});
 owners.set(node,animation);active.add(animation);const finish=()=>active.delete(animation);animation.onfinish=finish;animation.oncancel=finish;
}
reduced.addEventListener('change',()=>{if(reduced.matches)for(const animation of active)animation.cancel();});
