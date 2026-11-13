"""Keep the contact shadow under the globe stand, fade the rest of the shadow-catcher veil.
Only semi-transparent pixels (shadow) are touched; the opaque globe and stand are left alone."""
import sys, glob, math
from PIL import Image
import numpy as np

for path in sorted(glob.glob(sys.argv[1])):
    im = Image.open(path).convert("RGBA")
    a = np.asarray(im).astype(np.float32)
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    cx, cy, rx, ry = 0.5 * w, 0.875 * h, 0.27 * w, 0.06 * h
    d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
    fall = np.clip(1.6 - d, 0, 1)                    # 1 near the base, 0 beyond ~1.6 radii
    fall = fall * fall * (3 - 2 * fall)              # smoothstep
    alpha = a[..., 3]
    shadow = alpha < 235
    alpha[shadow] = alpha[shadow] * fall[shadow]
    a[..., 3] = alpha
    Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(path, "WEBP", quality=84)
print("faded", len(glob.glob(sys.argv[1])))
