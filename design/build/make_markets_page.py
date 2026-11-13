"""Create design/preview/markets.html, reusing the Macro sheet's head and header so all sheets share one shell."""
import os, re
D = os.path.join(os.path.dirname(__file__), '..', 'preview')
src = open(os.path.join(D, 'macro.html'), encoding='utf-8').read()
head_end = src.index('</header>') + len('</header>')
shell = src[:head_end]
shell = shell.replace('<title>Longhand Office — Sheet 02 Macro</title>', '<title>Longhand Office — Sheet 03 Markets</title>')
shell = shell.replace('<a class="on" href="macro.html">Macro</a><a href="#">Markets</a>', '<a href="macro.html">Macro</a><a class="on" href="markets.html">Markets</a>')
shell = shell.replace('Find page or country', 'Find page or instrument')
shell = shell.replace('<link rel="stylesheet" href="macro-sections.css">', '<link rel="stylesheet" href="macro-sections.css">\n<link rel="stylesheet" href="markets.css">')
assert 'markets.css' in shell and 'Sheet 03' in shell
body = '''
<nav class="mtabs" id="mtabs" aria-label="Markets desk sections"></nav>
<main>
  <section class="msec lead-sec"><div class="kicker">Sheet 03 · Markets · dated public snapshots, not real time</div>
    <h1 id="mk-head">Markets</h1><p class="dek" id="mk-dek"></p></section>
  <section class="msec" id="indices"><div class="panel glass"></div></section>
  <section class="msec" id="us"><div class="panel glass"></div></section>
  <section class="msec" id="idx"><div class="panel glass"></div></section>
  <section class="msec" id="bonds"><div class="panel glass ust"></div></section>
  <section class="msec" id="bondetf"><div class="panel glass"></div></section>
  <section class="msec" id="commodities"><div class="panel glass"></div></section>
  <section class="msec" id="msources"><div class="panel glass"></div></section>
</main>
<footer><span>Design preview — not the live app.</span><span>Prices: Yahoo Finance daily closes via the Office snapshot; Treasury curve: U.S. Department of the Treasury.</span><span>Not investment advice. No orders are placed.</span></footer>
<script src="atlas.js"></script>
<script src="markets-sheet.js"></script>
<script src="markets.js"></script>
<script src="markets-lead.js"></script>
<script src="office-ui.js"></script>
<script>
function setTheme(t){document.documentElement.dataset.theme=t;try{localStorage.setItem('lh-theme',t)}catch(e){}}
document.getElementById('theme').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
(function(){let t='light';try{t=localStorage.getItem('lh-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}setTheme(t)})();
</script>
</body>
</html>
'''
open(os.path.join(D, 'markets.html'), 'w', encoding='utf-8').write(shell + body)
print('markets.html written', len(shell + body))
