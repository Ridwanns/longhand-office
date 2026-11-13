"""Paint equirectangular globe textures (GDP, CPI) from the Office atlas values.
Natural Earth 1:110m geometry from macro-map-data.js (viewBox 0 0 1000 500, equirectangular)."""
import json, re, sys, math
from PIL import Image, ImageDraw

src, outdir = sys.argv[1], sys.argv[2]
data = json.load(open(src, encoding="utf-8"))
W, H = 4096, 2048
SX, SY = W / 1000, H / 500

def rings(d):
    out, cur = [], []
    for cmd, xs, ys in re.findall(r"([MLZ])\s*(?:(-?[\d.]+),(-?[\d.]+))?", d):
        if cmd == "M":
            if len(cur) > 2: out.append(cur)
            cur = [(float(xs) * SX, float(ys) * SY)]
        elif cmd == "L":
            cur.append((float(xs) * SX, float(ys) * SY))
        elif cmd == "Z":
            if len(cur) > 2: out.append(cur)
            cur = []
    if len(cur) > 2: out.append(cur)
    return out

def area_centroid(r):
    a = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(r, r[1:] + r[:1]):
        f = x0 * y1 - x1 * y0; a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f
    a *= 0.5
    if abs(a) < 1e-9: return 0, r[0]
    return abs(a), (cx / (6 * a), cy / (6 * a))

PAL = {
  "light": dict(ocean=(233, 226, 210), grat=(205, 196, 176), land=(214, 206, 190), border=(120, 108, 88), hatch=(60, 52, 40)),
}
BINS = {
  "gdp": [(-1e9, 0, (190, 92, 72)), (0, 2, (222, 196, 146)), (2, 4, (150, 170, 120)), (4, 1e9, (62, 110, 92))],
  "cpi": [(-1e9, 2, (176, 196, 186)), (2, 4, (224, 200, 140)), (4, 8, (208, 138, 84)), (8, 1e9, (150, 62, 50))],
}
def colour(ind, v):
    for lo, hi, c in BINS[ind]:
        if lo <= v < hi: return c

P = PAL["light"]
geo = {c["id"]: rings(c["d"]) for c in data["countries"]}
names = {c["id"]: c["name"] for c in data["countries"]}
cent = {}
for cid, rs in geo.items():
    best = max((area_centroid(r) for r in rs), key=lambda t: t[0])
    x, y = best[1]
    cent[cid] = (round(x / W * 360 - 180, 3), round(90 - y / H * 180, 3))
cent["SGP"] = (103.82, 1.35)

for ind in ("gdp", "cpi"):
    vals = {r[0]: r for r in data["atlas"][ind]}
    img = Image.new("RGB", (W, H), P["ocean"])
    d = ImageDraw.Draw(img)
    for lon in range(-180, 181, 15):       # graticule
        x = (lon + 180) / 360 * W
        d.line([(x, 0), (x, H)], fill=P["grat"], width=3 if lon % 90 == 0 else 1)
    for lat in range(-75, 76, 15):
        y = (90 - lat) / 180 * H
        d.line([(0, y), (W, y)], fill=P["grat"], width=3 if lat == 0 else 1)
    hatch_mask = Image.new("L", (W, H), 0); hm = ImageDraw.Draw(hatch_mask)
    for cid, rs in geo.items():
        r = vals.get(cid)
        fill = colour(ind, r[2]) if r else P["land"]
        for ring in rs:
            d.polygon(ring, fill=fill)
            if r and r[6]: hm.polygon(ring, fill=255)
    if "SGP" in vals:                       # too small for 1:110m geometry: draw a marker
        lon, lat = cent["SGP"]; x, y = (lon + 180) / 360 * W, (90 - lat) / 180 * H
        d.ellipse([x - 9, y - 9, x + 9, y + 9], fill=colour(ind, vals["SGP"][2]), outline=P["border"], width=2)
        if vals["SGP"][6]: hm.ellipse([x - 9, y - 9, x + 9, y + 9], fill=255)
    hatch = Image.new("RGB", (W, H), P["hatch"])
    lines = Image.new("L", (W, H), 0); ld = ImageDraw.Draw(lines)
    for k in range(-H, W, 14):              # 45-degree drafting hatch for stale observations
        ld.line([(k, H), (k + H, 0)], fill=150, width=2)
    from PIL import ImageChops
    img.paste(hatch, (0, 0), ImageChops.multiply(hatch_mask, lines))
    for cid, rs in geo.items():
        for ring in rs:
            d.line(ring + [ring[0]], fill=P["border"], width=2)
    img.save(f"{outdir}/globe-{ind}.png")
    print("texture", ind, len(vals))

json.dump({"centroids": cent, "names": names}, open(f"{outdir}/globe-centroids.json", "w"))
print("centroids", len(cent))
