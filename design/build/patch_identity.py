"""Apply the Longhand identity layer to every sheet: redrawn nib logo + favicon, display font, identity.css, quad fill token."""
import os, re, urllib.parse
D = os.path.join(os.path.dirname(__file__), '..', 'preview')
NIB = ('<path d="M15.9 6.5 L20.3 9.2 C20.5 12.4 20.3 14.9 19.3 17.1 C18.5 18.9 17.3 20.8 16 23.1 C14.7 20.8 13.5 18.9 12.7 17.1 C11.7 14.9 11.5 12.4 11.6 9.4 Z" fill="#18332a"/>'
       '<circle cx="16" cy="14.9" r="0.95" fill="#18332a" stroke="#f3efe6" stroke-width="0.6"/>'
       '<path d="M16 16.1V22.2" stroke="#f3efe6" stroke-width="0.55" stroke-linecap="round"/>'
       '<path d="M11.1 24.9c1.6-.75 3.25-.75 4.9 0s3.25.75 4.9 0" fill="none" stroke="#18332a" stroke-width="0.65" stroke-linecap="round"/>')
LOGO = f'<svg class="logo" viewBox="0 0 32 32" role="img" aria-label="Longhand"><circle cx="16" cy="16" r="16" fill="#f3efe6"/>{NIB}</svg>'
FAV = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#f3efe6"/>' + NIB + '</svg>'
FAVLINK = '<link rel="icon" href="data:image/svg+xml,' + urllib.parse.quote(FAV, safe='/:=') + '">'
FONT_OLD = 'family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&'
FONT_NEW = 'family=Schibsted+Grotesk:wght@400;500;600;700&'
for f in ['index.html', 'macro.html', 'markets.html', 'research.html', 'portfolio.html', 'records.html']:
    p = os.path.join(D, f); s = open(p, encoding='utf-8').read()
    s, n1 = re.subn(r'<svg class="logo" viewBox="0 0 32 32"[^>]*>.*?</svg>', LOGO, s, count=1, flags=re.S)
    s, n2 = re.subn(r'<link rel="icon" href="data:image/svg\+xml,[^"]*">', FAVLINK, s, count=1)
    s = s.replace(FONT_OLD, FONT_NEW)
    if 'identity.css' not in s:
        s = s.replace('</head>', '<link rel="stylesheet" href="identity.css">\n</head>', 1)
    open(p, 'w', encoding='utf-8').write(s)
    print(f, n1, n2, 'Schibsted' in s)
p = os.path.join(D, 'macro-sections.js'); s = open(p, encoding='utf-8').read()
s2 = re.sub(r"""fill="\$\{o\.active===(\d)\?'rgba\(196,81,63,\.08\)':'none'\}\"""", r"""style="fill:${o.active===\1?'var(--accent-soft)':'none'}\"""", s)
print('quad fills', s.count('rgba(196,81,63,.08)'), '->', s2.count('rgba(196,81,63,.08)'))
open(p, 'w', encoding='utf-8').write(s2)
