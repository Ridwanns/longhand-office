import {CONTEXT_COUNTRIES} from './macro-context-contract.js';
import {ASEAN_COUNTRIES} from './macro-contract.js';

export const MACRO_DESK_SECTIONS={overview:'Briefing',economy:'Economy',rates:'Rates',markets:'Cross market',sources:'Evidence'};
export function macroEconomy(selection){
 if(Object.hasOwn(CONTEXT_COUNTRIES,selection.economy))return selection.economy;
 return selection.region==='us'?'USA':selection.region==='eu'?'EMU':selection.region==='global'?'WLD':selection.region==='asean'?(Object.hasOwn(ASEAN_COUNTRIES,selection.country)?selection.country:'IDN'):'IDN';
}
export function macroDeskRoute(country,view='overview'){
 if(!Object.hasOwn(CONTEXT_COUNTRIES,country)||!Object.hasOwn(MACRO_DESK_SECTIONS,view))return null;
 const region={IDN:'id',USA:'us',EMU:'eu',WLD:'global'}[country]||(Object.hasOwn(ASEAN_COUNTRIES,country)?'asean':'global');
 return '#market/macro/'+region+'/'+view+(['IDN','USA','EMU','WLD'].includes(country)?'':'/'+country);
}
export function syncMacroScope(parent,country){
 const monitor=parent.closest('.macro-monitor');if(!monitor||!Object.hasOwn(CONTEXT_COUNTRIES,country))return;
 monitor.dataset.economy=country;const heading=monitor.querySelector('.macro-page-title h1');if(heading&&parent.dataset.view==='economy')heading.textContent=CONTEXT_COUNTRIES[country]+' macro';
 const control=monitor.querySelector('[data-macro-scope] select');if(control&&[...control.options].some(option=>option.value===country))control.value=country;
 monitor.querySelectorAll('[data-macro-destination]').forEach(link=>link.href=macroDeskRoute(country,link.dataset.macroDestination));
 const evidence=monitor.querySelector('.context-heading>a');if(evidence)evidence.href=macroDeskRoute(country,'sources');
 const view=parent.dataset.view||'overview',url=macroDeskRoute(country,view);
 const parts=location.hash.replace(/^#/,'').split('/'),current=macroEconomy({region:parts[2],country:parts[4],economy:Object.hasOwn(CONTEXT_COUNTRIES,parts[4])?parts[4]:null});
 if(url&&country!==current)history.replaceState({...history.state},'',url);
 parent.querySelector('#macro-atlas')?._selectEconomy?.(country);
}
