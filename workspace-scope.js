export function workspaceScope(){const q=new URLSearchParams(location.search),s=q.get('restored-workspace')||q.get('test-workspace')||'';if(s&&!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(s))throw Error('Invalid workspace identifier.');return s;}
export function restoredScope(){return new URLSearchParams(location.search).get('restored-workspace')||'';}
export function preferenceKey(base){return base+(restoredScope()?'.'+restoredScope():'');}
