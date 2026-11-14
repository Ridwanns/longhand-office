import io, re, sys, os
repo = sys.argv[1]; P = lambda *a: os.path.join(repo, *a)
html = io.open(P('design', 'preview', 'macro.html'), encoding='utf-8').read()
body = html[html.index('<nav class="mtabs"'):html.index('<footer>')]
body = body.replace('<main class="sheet" id="top">', '<div class="sheet" id="top">').replace('</main>', '</div>')
assert '`' not in body and '${' not in body
foot = ('<div class="lh-sheet-foot"><span>Latest values: computed with the Office&rsquo;s own atlas code from the published snapshot. History: the series named under each chart.</span>'
        '<span>Colour shows magnitude, not an investment signal. Hatching marks an observation the Office flags as outdated.</span>'
        '<span>Geometry: Natural Earth 1:110m; Singapore drawn as a dot.</span></div>')
js = ("// Sheet 02 Macro: the page markup and its mount. Markup from design/preview/macro.html; the header is the Office's own.\n"
      "import {loadSheetData,hostSheet} from './sheet-host.js';\n"
      "import {mountMacroMap} from './sheet-macro-map.js';\n"
      "import {mountMacroSections} from './sheet-macro-sections.js';\n"
      "import {calendar} from './sheet-macro-calendar.js';\n"
      "let host=null;\n"
      "export function macroSheetPage(){return `<div class=\"lh-sheet lh-sheet-macro\" data-sheet=\"macro\">" + re.sub(r'\n\s*', '', body) + foot + "</div>`;}\n"
      "export async function mountMacroSheet(){\n"
      " const root=document.querySelector('[data-sheet=\"macro\"]');if(!root)return;host?.stop();host=hostSheet(root);const own=host;\n"
      " try{await loadSheetData(['countries','macro-sheet','cycles','calendar']);}\n"
      " catch{if(root.isConnected){root.querySelector('#headline').textContent='Macro data is unavailable right now.';root.querySelector('#dek').textContent='The published macro sheet could not be read. No values are shown in its place.';}return;}\n"
      " if(!root.isConnected||own!==host)return;\n"
      " // sections first: the map's country dossier uses their cycle chip\n"
      " mountMacroSections(host.listen);mountMacroMap(host.listen);calendar(root.querySelector('#calendar'));\n"
      "}\n")
io.open(P('sheet-macro-page.js'), 'w', encoding='utf-8', newline='\n').write(js)
print('page', len(js))
