// Tiny declarative state machines. Pure data + pure functions, no dependencies, safe in browser, worker and Node.
// A machine names every state and every legal move so the lifecycle is readable, testable and enforceable in one place.
export function defineMachine(name,transitions){
 const table=Object.freeze(Object.fromEntries(Object.entries(transitions).map(([from,to])=>[from,Object.freeze([...to])])));
 const states=Object.freeze(Object.keys(table));
 for(const [from,to] of Object.entries(table))for(const next of to)if(!Object.hasOwn(table,next))throw Error(name+': "'+from+'" lists unknown state "'+next+'".');
 const can=(from,to)=>Object.hasOwn(table,from)&&table[from].includes(to);
 return Object.freeze({
  name,states,transitions:table,can,
  isTerminal:state=>Object.hasOwn(table,state)&&table[state].length===0,
  // Throws a precise, greppable error; returns `to` so callers can write `job.status=machine.assert(job.status,'running')`.
  assert(from,to){if(!can(from,to))throw Error(name+': illegal transition "'+from+'" -> "'+to+'". Allowed from "'+from+'": '+((table[from]||[]).join(', ')||'none')+'.');return to;}
 });
}
