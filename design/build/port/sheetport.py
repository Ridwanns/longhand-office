"""Shared helpers for porting design-preview sheets into the Office: CSS scoping and file writing."""
import io, re
rd = lambda p: io.open(p, encoding='utf-8').read()
def wr(p, s):
    # inline styles become data-css: the sheet host applies them through the CSSOM (the CSP blocks style attributes)
    if p.endswith('.js'): s = s.replace(' style="', ' data-css="')
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
def rep(s, a, b, count=1):
    assert s.count(a) == count, (a[:100], s.count(a)); return s.replace(a, b)
DROP = re.compile(r'^(header|nav|nav a|footer|\.tabbar|\.sp|\.brand|\.finder|body\s*>|\.lamp|\.liquid|\.orbit|\.ruler)\b')
def split_sel(sel):
    out, depth, cur = [], 0, ''
    for ch in sel:
        if ch in '([': depth += 1
        if ch in ')]': depth -= 1
        if ch == ',' and depth == 0: out.append(cur); cur = ''
        else: cur += ch
    out.append(cur); return [x.strip() for x in out if x.strip()]
def scope_sel(s, P):
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'^main\b', '.lh-sheet-body', s)
    for pre in ('html:root[data-theme="dark"]', ':root[data-theme="dark"]', 'html[data-theme="dark"]', 'html[data-theme=dark]', ':root[data-theme=dark]'):
        if s.startswith(pre):
            rest = s[len(pre):]
            if rest.startswith(' body'): rest = rest[5:]
            rest = re.sub(r'^ main\b', ' .lh-sheet-body', rest)
            return 'html[data-theme=dark] ' + P + rest
    for pre in ('html:root body', 'html:root', ':root body', ':root', 'body'):
        if s == pre or s.startswith(pre + ' ') or (s.startswith(pre + ':') and pre != 'body'):
            return P + re.sub(r'^ main\b', ' .lh-sheet-body', s[len(pre):])
    if DROP.match(s): return None
    return P + ' ' + s
def scope_block(css, P):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    out, i = [], 0
    while i < len(css):
        j = css.find('{', i)
        if j < 0: break
        head = css[i:j].strip(); depth, k = 1, j + 1
        while depth:
            if css[k] == '{': depth += 1
            elif css[k] == '}': depth -= 1
            k += 1
        body = css[j + 1:k - 1]
        if head.startswith(('@media', '@supports', '@container')):
            inner = scope_block(body, P)
            if inner.strip(): out.append(head + '{' + inner + '}')
        elif head.startswith('@keyframes'):
            out.append(head.replace('@keyframes in', '@keyframes lhs-in') + '{' + body + '}')
        elif head.startswith(('@font-face', '@import')):
            pass
        else:
            sels = [x for x in (scope_sel(s, P) for s in split_sel(head)) if x]
            if sels:
                body = re.sub(r'animation:\s*in\b', 'animation:lhs-in', body)
                body = re.sub(r'(animation[^;]*?)\bin (\.\d|\d)', r'\1lhs-in \2', body)
                out.append(','.join(sels) + '{' + body.strip() + '}')
        i = k
    return '\n'.join(out)
def bindings(P):
    return ('\n/* live identity bindings */\n'
            f'{P}{{--display:var(--lh-display);--body:var(--lh-body);--mono:var(--lh-mono);--cond:var(--lh-body);font-family:var(--lh-body);color:var(--ink);background:none!important;display:block}}\n'
            f'{P} h1{{font-family:var(--lh-display)!important;font-weight:450;letter-spacing:-.02em}}\n'
            f'{P} h2,{P} h3{{font-family:var(--lh-display)!important;font-weight:520;letter-spacing:-.01em}}\n'
            f'{P} a{{text-decoration:none}}\n'
            f'{P} .lh-sheet-foot{{display:flex;flex-wrap:wrap;gap:6px 18px;max-width:1520px;margin:0 auto;padding:6px 28px 30px;font-size:11px;color:var(--ink3)}}\n')
