import {createHash} from 'node:crypto';
// Version the changed macro UI dependency graph, without rewriting financial modules,
// worker mathematics, JSON acquisition URLs, page paths or personal-storage keys.
const macroModules=/(['"])(\.{1,2}\/(?:macro-chart|macro-ui|macro-atlas|macro-context-contract|macro-context-math|macro-context-ui|macro-releases-contract|macro-releases-ui|market-view)\.js)\1/g;
export function versionMacroAssets(input){
 const entries=Object.entries(input).sort(([a],[b])=>a.localeCompare(b)),version=createHash('sha256').update(JSON.stringify(entries)).digest('hex').slice(0,16),assets={};
 for(const [file,source]of entries){let text=source;if(file.endsWith('.js'))text=text.replace(macroModules,(_,quote,url)=>quote+url+'?office='+version+quote);
  if(file==='index.html'){if(!text.includes('src="app.js"'))throw Error('Pages entrypoint changed before macro asset versioning.');text=text.replace('src="app.js"','src="app.js?office='+version+'"').replace('src="theme.js"','src="theme.js?office='+version+'"').replace(/href="([^"?]+\.css)"/g,(_,url)=>'href="'+url+'?office='+version+'"').replace('</head>','<meta name="office-macro-assets" content="'+version+'"></head>');}
  assets[file]=text;
 }
 return {version,assets};
}
