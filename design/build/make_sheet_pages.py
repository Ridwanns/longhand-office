"""Create research.html (Sheet 04) and portfolio.html (Sheet 05) from the shared Macro shell."""
import os
D = os.path.join(os.path.dirname(__file__), '..', 'preview')
src = open(os.path.join(D, 'macro.html'), encoding='utf-8').read()
shell = src[:src.index('</header>') + len('</header>')]
NAV_OLD = '<a class="on" href="macro.html">Macro</a><a href="markets.html">Markets</a><a href="research.html">Research Lab</a><a href="portfolio.html">Portfolio</a><a href="records.html">Records</a>'
assert NAV_OLD in shell, 'nav'
THEME = '''<script>
function setTheme(t){document.documentElement.dataset.theme=t;try{localStorage.setItem('lh-theme',t)}catch(e){}}
document.getElementById('theme').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
(function(){let t='light';try{t=localStorage.getItem('lh-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}setTheme(t)})();
</script>'''

def page(fname, title, nav_on, sections, kicker, h1, dek, scripts, footer):
    s = shell.replace('<title>Longhand Office — Sheet 02 Macro</title>', f'<title>Longhand Office — {title}</title>')
    nav = '<a href="macro.html">Macro</a><a href="markets.html">Markets</a>' + \
          ('<a class="on" href="research.html">Research Lab</a>' if nav_on == 'research' else '<a href="research.html">Research Lab</a>') + \
          ('<a class="on" href="portfolio.html">Portfolio</a>' if nav_on == 'portfolio' else '<a href="portfolio.html">Portfolio</a>') +           ('<a class="on" href="records.html">Records</a>' if nav_on == 'records' else '<a href="records.html">Records</a>')
    s = s.replace(NAV_OLD, nav)
    s = s.replace('<link rel="stylesheet" href="macro-sections.css">', '<link rel="stylesheet" href="macro-sections.css">\n<link rel="stylesheet" href="markets.css">\n<link rel="stylesheet" href="research.css">')
    body = f'''
<nav class="mtabs" id="mtabs" aria-label="{title} sections"></nav>
<main>
  <section class="msec lead-sec"><div class="kicker">{kicker}</div><h1>{h1}</h1><p class="dek">{dek}</p></section>
{''.join(f'  <section class="msec" id="{i}"><div class="panel glass"></div></section>{chr(10)}' for i in sections)}</main>
<footer>{footer}</footer>
{''.join(f'<script src="{x}"></script>{chr(10)}' for x in scripts)}<script src="office-ui.js"></script>
{THEME}
</body>
</html>
'''
    open(os.path.join(D, fname), 'w', encoding='utf-8').write(s + body)
    print(fname, len(s + body))

page('research.html', 'Sheet 04 Research Lab', 'research',
     ['brief', 'compare', 'models', 'accountability', 'valuation', 'thesis', 'library', 'saved', 'tools'],
     'Sheet 04 · Research Lab · study the evidence, keep assumptions in view',
     'Study the evidence. Keep assumptions and retained research in view.',
     'The worked example is the AAPL study retained in the isolated test workspace on 13 Nov 2026: real model output, not an illustration. Your own studies replace it in the live app.',
     ['atlas.js', 'markets-sheet.js', 'research-sheet.js', 'research.js'],
     '<span>Design preview — not the live app.</span><span>Model output: Longhand core model 1.0.0, test-workspace run, read-only.</span><span>History describes the past. Model bands are assumptions, not guaranteed probabilities. Not investment advice.</span>')

page('portfolio.html', 'Sheet 05 Portfolio', 'portfolio',
     ['groups', 'holdings', 'journal', 'income', 'pricing', 'performance', 'reconcile', 'decisions'],
     'Sheet 05 · Portfolio · manual records, Paper and Real kept apart',
     'Your records, kept apart and priced honestly.',
     'Real holds your actual investments, entered by hand. Paper holds simulations. The worked ledger below is a clearly labelled example in Paper, priced with the latest published closes in the snapshot; it is not your record.',
     ['markets-sheet.js', 'portfolio.js'],
     '<span>Design preview — not the live app.</span><span>No brokerage connection. The app never places orders.</span><span>Currencies are never consolidated through invented exchange rates.</span>')

page('records.html', 'Sheet 06 Records & Data Sources', 'records',
     ['coverage', 'publications', 'ledger', 'providers', 'inspect', 'official', 'backup', 'sync', 'vault'],
     'Sheet 06 · Records & Data Sources · know the evidence, keep a copy',
     'Choose the evidence before running the analysis.',
     'Every number in the Office comes from a dated public source or from your own records. This sheet shows what is connected, what is missing or old, and how your records are kept, backed up and restored.',
     ['records-sheet.js', 'records.js'],
     '<span>Design preview — not the live app.</span><span>Coverage: Office public-data report, attention rules identical to the app.</span><span>No analytics or tracking. Nothing on this sheet uploads a file.</span>')
