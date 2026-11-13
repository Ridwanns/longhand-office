"""Draw the IHSG trading-wall texture from the real overview snapshot (370 daily closes)."""
import json, sys
from PIL import Image, ImageDraw, ImageFont

src, out = sys.argv[1], sys.argv[2]
o = json.load(open(src, encoding="utf-8"))
m = next(x for x in o["markets"] if x["symbol"] == "^JKSE")
h = m["quote"]["history"]
c = [p["close"] for p in h]
W, H, S = 2400, 1100, 2              # draw at 2x then downsample for anti-aliasing
img = Image.new("RGB", (W * S, H * S), (9, 17, 19))
d = ImageDraw.Draw(img)
def font(sz, bold=False):
    for f in (["consolab.ttf", "segoeuib.ttf"] if bold else ["consola.ttf", "segoeui.ttf"]):
        try: return ImageFont.truetype(f, sz * S)
        except OSError: pass
    return ImageFont.load_default()

L, R, T, B = 150, 2280, 210, 960
lo, hi = min(c), max(c)
pad = (hi - lo) * 0.08
ymin, ymax = lo - pad, hi + pad
X = lambda i: (L + (R - L) * i / (len(c) - 1)) * S
Y = lambda v: (B - (B - T) * (v - ymin) / (ymax - ymin)) * S

grid = (30, 52, 56)
for k in range(5):
    v = ymin + (ymax - ymin) * k / 4
    d.line([(L * S, Y(v)), (R * S, Y(v))], fill=grid, width=2 * S)
    d.text(((L - 20) * S, Y(v)), f"{v:,.0f}", fill=(110, 140, 140), font=font(30), anchor="rm")
# month ticks
seen = set()
for i, p in enumerate(h):
    ym = p["date"][:7]
    if ym not in seen and p["date"][5:7] in ("01", "04", "07", "10"):
        seen.add(ym)
        d.line([(X(i), T * S), (X(i), B * S)], fill=grid, width=2 * S)
        d.text((X(i), (B + 30) * S), ym, fill=(110, 140, 140), font=font(28), anchor="mt")

pts = [(X(i), Y(v)) for i, v in enumerate(c)]
peak_i, low_i = c.index(hi), c.index(lo)
# area under line
poly = pts + [(X(len(c) - 1), B * S), (X(0), B * S)]
area = Image.new("RGBA", img.size, (0, 0, 0, 0))
ImageDraw.Draw(area).polygon(poly, fill=(228, 92, 76, 46))
img.paste(area, (0, 0), area)
d = ImageDraw.Draw(img)
d.line(pts[: peak_i + 1], fill=(63, 208, 176), width=6 * S, joint="curve")
d.line(pts[peak_i:], fill=(240, 96, 80), width=6 * S, joint="curve")
for i, col, lab, anc in [(peak_i, (63, 208, 176), f"PEAK {hi:,.0f}  {h[peak_i]['date']}", "lb"),
                         (low_i, (240, 96, 80), f"LOW {lo:,.0f}  {h[low_i]['date']}", "rt")]:
    x, y = pts[i]
    d.ellipse([x - 12 * S, y - 12 * S, x + 12 * S, y + 12 * S], fill=col)
    d.text((x + (16 if anc == "lb" else -16) * S, y + (-18 if anc == "lb" else 20) * S), lab, fill=col, font=font(34, True), anchor=anc)

last = c[-1]
d.text((L * S, 70 * S), "IHSG  ^JKSE", fill=(220, 232, 228), font=font(64, True), anchor="lm")
d.text((L * S, 140 * S), f"{h[0]['date']} - {h[-1]['date']}  ·  {len(c)} daily closes", fill=(110, 140, 140), font=font(30), anchor="lm")
d.text((R * S, 70 * S), f"{last:,.2f}", fill=(220, 232, 228), font=font(72, True), anchor="rm")
d.text((R * S, 140 * S), f"{(last / hi - 1) * 100:+.1f}% from peak", fill=(240, 96, 80), font=font(36, True), anchor="rm")
img = img.resize((W, H), Image.LANCZOS)
img.save(out)
print("saved", out, "peak", hi, h[peak_i]["date"], "low", lo, h[low_i]["date"], "last", last)
