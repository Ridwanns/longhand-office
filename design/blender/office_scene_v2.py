"""Longhand Office architectural model, v2.
Run headless:  blender -b --factory-startup -P office_scene_v2.py   (env: OUT_DIR, MODE=light|dark, FRAMES, SAMPLES, SCREEN)
Or inside a live Blender with CFG={...} in globals (builds the scene, no render)."""
import bpy, bmesh, math, json, os
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

CFG = globals().get("CFG", {})
env = lambda k, d: CFG.get(k, os.environ.get(k, d))
OUT = env("OUT_DIR", ".")
MODE = env("MODE", "light")
FRAMES = int(env("FRAMES", 13))          # turntable frames
ARC = float(env("ARC", 30))              # +/- degrees of orbit
SAMPLES = int(env("SAMPLES", 64))
SCREEN = env("SCREEN", os.path.join(OUT, "ihsg-screen.png"))
DO_RENDER = CFG.get("RENDER", True)
RES = (int(env("RES_X", 1500)), int(env("RES_Y", 1000)))
dark = MODE == "dark"

if bpy.app.background:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
else:
    sname = "LonghandOffice-v2-" + MODE
    if sname in bpy.data.scenes:
        old = bpy.data.scenes[sname]
        for o in list(old.objects): bpy.data.objects.remove(o, do_unlink=True)
        bpy.data.scenes.remove(old)
    scene = bpy.data.scenes.new(sname)
    bpy.context.window.scene = scene

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple([x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c] + [1.0])

_m = {}
def mat(name, col, rough=0.7, metal=0.0, emit=None, strength=0.0, image=None):
    if name in _m: return _m[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = lin(col)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = lin(emit)
        b.inputs["Emission Strength"].default_value = strength
    if image:
        tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = bpy.data.images.load(image)
        nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
        nt.links.new(tex.outputs["Color"], b.inputs["Emission Color"])
        b.inputs["Emission Strength"].default_value = strength
        b.inputs["Roughness"].default_value = 0.25
    _m[name] = m; return m

def finish(o, m, bev):
    o.data.materials.append(m)
    if bev:
        md = o.modifiers.new("bev", "BEVEL"); md.width = bev; md.segments = 2; md.limit_method = 'ANGLE'
    return o

def box(name, x0, y0, z0, x1, y1, z1, m, bev=0.015):
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0+x1)/2, (y0+y1)/2, (z0+z1)/2))
    o = bpy.context.object; o.name = name; o.scale = (abs(x1-x0), abs(y1-y0), abs(z1-z0))
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, m, bev)

def cyl(name, x, y, z0, h, r, m, verts=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=(x, y, z0 + h/2))
    o = bpy.context.object; o.name = name; bpy.ops.object.shade_smooth()
    return finish(o, m, 0)

def cone(name, x, y, z, r1, r2, h, m):
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=r1, radius2=r2, depth=h, location=(x, y, z))
    o = bpy.context.object; o.name = name; bpy.ops.object.shade_smooth()
    return finish(o, m, 0)

def ball(name, x, y, z, r, m, sub=3):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=r, location=(x, y, z))
    o = bpy.context.object; o.name = name; bpy.ops.object.shade_smooth()
    return finish(o, m, 0)

# ---------------- palette: desaturated set, one saturated focus (the screen) ----------------
WALL   = mat("wall",   "#2a2d33" if dark else "#efebe3", 0.9)
WALLIN = mat("wallin", "#30343b" if dark else "#f5f2ec", 0.92)
FLOOR  = mat("floor",  "#3b342c" if dark else "#d8c8aa", 0.55)
SLAB   = mat("slab",   "#1f2227" if dark else "#e4ded2", 0.85)
BOARD  = mat("board",  "#2b2620" if dark else "#cdb994", 0.8)       # MDF model board
BOARDE = mat("boarde", "#1d1a16" if dark else "#a8946f", 0.8)
MODEL  = mat("model",  "#4a4d52" if dark else "#f4f1ea", 0.85)      # white model figures / trees
GRAPH  = mat("graph",  "#15171a" if dark else "#3b3f45", 0.5)
OAK    = mat("oak",    "#7d6147" if dark else "#b89570", 0.5)
STEEL  = mat("steel",  "#8b939b", 0.32, 0.85)
GOLD   = mat("gold",   "#cfa653", 0.28, 1.0)
GLASS  = mat("glass",  "#7fa4ad" if dark else "#c4d8db", 0.06)
FRAME  = mat("frame",  "#22252a" if dark else "#5b6066", 0.5)
OLIVE  = mat("olive",  "#4f5d45" if dark else "#8e9a7c", 0.7)
OLIVE2 = mat("olive2", "#45523d" if dark else "#a3ad92", 0.7)
CLOTH  = mat("cloth",  "#6e5a4f" if dark else "#a48d7e", 0.85)
PAPER  = mat("paper",  "#d9d4c8" if dark else "#fbf8f1", 0.9)
MON    = mat("mon",    "#0c1416", 0.3, emit="#3fd0b0", strength=0.6 if dark else 0.25)
LAMPE  = mat("lampe",  "#fff1d0", 0.3, emit="#ffd9a0", strength=25 if dark else 2.0)
SCREEN_M = mat("screen", "#000000", image=SCREEN, strength=4.0 if dark else 1.6)
BOOKS = [mat(f"book{i}", c, 0.75) for i, c in enumerate(
    ["#6f5a50", "#55616b", "#8a7b5a", "#5f6a59", "#6b6370", "#c9c1b2"] if not dark else
    ["#4a3c35", "#38414a", "#5c513a", "#3f4a3b", "#47414c", "#7d776b"])]

W, D, H, T = 12.0, 8.0, 3.0, 0.3
GAP = 2.6
F1 = T + H + GAP

# ---------------- model board + shadow catcher ----------------
box("board", -3.2, -3.6, -0.32, 15.2, 11.2, 0.0, BOARD, 0.02)
box("board_edge", -3.2, -3.6, -0.5, 15.2, 11.2, -0.32, BOARDE, 0.0)
bpy.ops.mesh.primitive_plane_add(size=120, location=(6, 4, -0.5))
catcher = bpy.context.object; catcher.name = "shadow_catcher"; catcher.is_shadow_catcher = True
box("path", 7.2, -3.6, 0.0, 8.8, 0.0, 0.02, SLAB, 0.0)
# model trees: a tapered trunk carrying a faceted cluster of crowns, like cut-foam trees on a presentation model
LEAF  = mat("leaf",  "#3c4a3e" if dark else "#9fb093", 0.92)
LEAF2 = mat("leaf2", "#465446" if dark else "#b7c4aa", 0.92)
TRUNK = mat("trunk", "#4d4237" if dark else "#8b7865", 0.8)
def facet(name, x, y, z, r, m, sq=1.0, sub=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=(x, y, z))
    o = bpy.context.object; o.name = name; o.scale = (1, 1, sq); bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.shade_flat(); return finish(o, m, 0)
CROWN = [(0.0, 0.0, 1.78, 0.60, 0.92), (0.36, 0.08, 1.55, 0.42, 0.9), (-0.32, 0.16, 1.6, 0.44, 0.9),
         (0.06, -0.34, 1.52, 0.4, 0.88), (-0.04, 0.06, 2.18, 0.4, 0.95)]
def tree(i, tx, ty, s):
    bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=0.06*s, radius2=0.025*s, depth=1.5*s, location=(tx, ty, 0.75*s))
    o = bpy.context.object; o.name = f"stick{i}"; finish(o, TRUNK, 0)
    for k, (dx, dy, dz, r, sq) in enumerate(CROWN):
        facet(f"crown{i}_{k}", tx + dx*s, ty + dy*s, dz*s, r*s, LEAF if k % 2 == 0 else LEAF2, sq)
def shrub(i, tx, ty, s):
    for k, (dx, dy, r) in enumerate([(0, 0, 0.34), (0.3, 0.12, 0.26), (-0.24, 0.1, 0.24)]):
        facet(f"shrub{i}_{k}", tx + dx*s, ty + dy*s, r*s*0.8, r*s, LEAF2 if k else LEAF, 0.8)
for i, (tx, ty, s) in enumerate([(-1.7, 9.4, 1.0), (13.6, 9.7, 0.85), (-2.0, 1.2, 0.8), (13.8, -2.2, 0.95), (4.2, -2.6, 0.6), (11.0, -2.9, 0.5)]):
    tree(i, tx, ty, s)
for i, (tx, ty, s) in enumerate([(6.3, -1.4, 0.9), (9.8, -1.2, 0.8), (-2.4, 5.2, 1.0), (14.2, 3.6, 0.9)]):
    shrub(10 + i, tx, ty, s)

def figure(name, x, y, z, rot=0.0, sit=False):
    hgt = 1.15 if sit else 1.62
    cyl(name+"_body", x, y, z + (0.45 if sit else 0), hgt-0.45-(0.0 if sit else 0.1), 0.16, MODEL, 20)
    ball(name+"_head", x, y, z + hgt + (0.0 if not sit else 0.05), 0.13, MODEL)

for lvl, z in enumerate([0.0, F1]):
    zt = z + T
    box(f"slab{lvl}", -0.2, -0.2, z, W+0.2, D+0.2, zt, SLAB, 0.03)
    box(f"floor{lvl}", 0, 0, zt, W, D, zt+0.02, FLOOR, 0)
    box(f"back{lvl}", -0.2, D, zt, W+0.2, D+0.25, zt+H, WALL, 0.02)
    box(f"left{lvl}", -0.2, 0, zt, 0.05, D, zt+H, WALL, 0.02)
    box(f"partA{lvl}", 5.95, 0, zt, 6.05, 3.0, zt+H, WALLIN, 0.01)
    box(f"partB{lvl}", 5.95, 4.6, zt, 6.05, D, zt+H, WALLIN, 0.01)
    box(f"partC{lvl}", 5.95, 3.0, zt+2.3, 6.05, 4.6, zt+H, WALLIN, 0.01)
    for wx in (7.0, 9.4) if lvl == 0 else (6.8, 9.2):
        box(f"glass{lvl}_{wx}", wx, D-0.01, zt+0.9, wx+1.6, D+0.01, zt+2.5, GLASS, 0)
        for (a, b, c_, d_) in [(wx-0.05, wx+0.0, zt+0.85, zt+2.55), (wx+1.6, wx+1.65, zt+0.85, zt+2.55),
                               (wx+0.775, wx+0.825, zt+0.9, zt+2.5)]:
            box(f"mul{lvl}_{wx}_{a}", a, D-0.04, c_, b, D-0.0, d_, FRAME, 0)
        for zz in (zt+0.85, zt+2.5):
            box(f"sill{lvl}_{wx}_{zz}", wx-0.05, D-0.04, zz, wx+1.65, D, zz+0.05, FRAME, 0)
    for lx in (3.0, 9.0):                                   # pendant lamps
        cyl(f"cord{lvl}_{lx}", lx, 4.0, zt+H-0.9, 0.9, 0.012, GRAPH, 8)
        cone(f"shade{lvl}_{lx}", lx, 4.0, zt+H-1.0, 0.38, 0.06, 0.28, GRAPH)
        cyl(f"bulb{lvl}_{lx}", lx, 4.0, zt+H-1.15, 0.02, 0.3, LAMPE, 32)

for (cx, cy) in [(-0.05, D+0.05), (W+0.05, D+0.05), (-0.05, -0.05)]:   # columns carry the lifted floor
    cyl(f"col{cx}{cy}", cx, cy, T+H, GAP, 0.09, STEEL, 16)

# ---------------- Markets (ground, left) ----------------
z = T
bpy.ops.mesh.primitive_plane_add(size=1, location=(0.08, 2.75, z+2.15))
scr = bpy.context.object; scr.name = "ihsg_screen"
scr.scale = (4.15, 1.9, 1); scr.rotation_euler = (math.radians(90), 0, math.radians(90))
bpy.ops.object.transform_apply(rotation=True, scale=True)
scr.data.materials.append(SCREEN_M)
box("screen_bezel", 0.05, 0.62, z+1.15, 0.07, 4.88, z+3.15, GRAPH, 0.01)
for i, (dx, dy) in enumerate([(2.0, 4.6), (2.0, 1.6), (3.9, 4.6), (3.9, 1.6)]):
    box(f"desk{i}", dx, dy, z+0.72, dx+1.5, dy+1.0, z+0.77, OAK, 0.008)
    for ly in (dy+0.08, dy+0.86):
        box(f"dleg{i}{ly}", dx+0.1, ly, z, dx+1.4, ly+0.05, z+0.72, GRAPH, 0)
    for k in range(2):
        my = dy + 0.12 + k*0.42
        box(f"mon{i}{k}", dx+0.12, my, z+0.95, dx+0.16, my+0.38, z+1.22, MON, 0.004)
        box(f"monst{i}{k}", dx+0.16, my+0.17, z+0.77, dx+0.2, my+0.21, z+0.95, GRAPH, 0)
    box(f"chair{i}", dx+0.75, dy+0.3, z+0.45, dx+1.2, dy+0.75, z+0.5, GRAPH, 0.02)
    box(f"chairb{i}", dx+1.15, dy+0.3, z+0.5, dx+1.2, dy+0.75, z+0.95, GRAPH, 0.02)
    cyl(f"chairp{i}", dx+0.97, dy+0.52, z, 0.45, 0.03, STEEL, 10)
figure("fig_markets", 1.25, 3.0, z, sit=False)
figure("fig_trader", 3.0+1.0, 1.6+0.52, z, sit=True)

# ---------------- Portfolio (ground, right) ----------------
box("vault", 8.4, D-1.35, z, 11.4, D-0.05, z+2.5, STEEL, 0.05)
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.9, depth=0.16, location=(9.9, D-1.43, z+1.25), rotation=(math.pi/2, 0, 0))
o = bpy.context.object; bpy.ops.object.shade_smooth(); finish(o, GRAPH, 0)
bpy.ops.mesh.primitive_torus_add(major_radius=0.32, minor_radius=0.03, location=(9.9, D-1.53, z+1.25), rotation=(math.pi/2, 0, 0))
o = bpy.context.object; bpy.ops.object.shade_smooth(); finish(o, GOLD, 0)
for a in range(3):
    ang = a * math.pi / 3
    box(f"spoke{a}", 9.9-0.32*math.cos(ang)-0.02, D-1.55, z+1.25-0.32*math.sin(ang), 9.9+0.32*math.cos(ang)+0.02, D-1.51, z+1.25+0.32*math.sin(ang), GOLD, 0).rotation_euler.y = 0
box("ptable", 7.5, 2.0, z+0.74, 10.9, 4.0, z+0.79, OAK, 0.01)
for lx, ly in [(7.65, 2.15), (10.7, 2.15), (7.65, 3.8), (10.7, 3.8)]:
    box(f"ptleg{lx}{ly}", lx, ly, z, lx+0.07, ly+0.07, z+0.74, GRAPH, 0)
for i, n in enumerate([5, 8, 3, 11, 6]):      # coin stacks: a small bar chart of gold
    for k in range(n):
        cyl(f"coin{i}_{k}", 8.0+i*0.55, 3.0, z+0.79+k*0.055, 0.045, 0.19, GOLD, 24)
for p in range(4):
    box(f"ledger{p}", 9.9, 2.3+p*0.012, z+0.79+p*0.01, 10.6, 2.8, z+0.8+p*0.01, PAPER, 0)
figure("fig_vault", 9.2, D-2.4, z)

# ---------------- Research Lab (upper, left) ----------------
z = F1 + T
for s in range(3):
    y0s, y1s = 1.0+s*2.1, 2.9+s*2.1
    sx = 0.06
    box(f"shback{s}", sx, y0s, z, sx+0.06, y1s, z+2.4, OAK, 0.005)
    for (ya, yb) in [(y0s, y0s+0.05), (y1s-0.05, y1s)]:
        box(f"shside{s}{ya}", sx, ya, z, sx+0.5, yb, z+2.4, OAK, 0.005)
    for r in range(5):
        box(f"shboard{s}{r}", sx, y0s, z+0.08+r*0.58, sx+0.5, y1s, z+0.12+r*0.58, OAK, 0.004)
    for r in range(4):
        zz = z+0.12+r*0.58; y = y0s+0.07; k = 0
        while y < y1s-0.12:
            th = 0.07 + ((k*37 + r*11 + s*5) % 5) * 0.022
            hh = 0.3 + ((k*13 + r*7) % 4) * 0.045
            lean = 0.0
            box(f"bk{s}{r}{k}", sx+0.08, y, zz, sx+0.44, y+th, zz+hh, BOOKS[(k*3+r+s) % 6], 0)
            y += th + 0.012; k += 1
box("labtable", 2.2, 2.4, z+0.74, 5.0, 5.0, z+0.79, OAK, 0.01)
for lx, ly in [(2.35, 2.55), (4.8, 2.55), (2.35, 4.8), (4.8, 4.8)]:
    box(f"ltleg{lx}{ly}", lx, ly, z, lx+0.07, ly+0.07, z+0.74, GRAPH, 0)
cyl("globebase", 3.0, 3.5, z+0.79, 0.04, 0.22, GRAPH, 24)
cyl("globestem", 3.0, 3.5, z+0.83, 0.5, 0.025, STEEL, 10)
ball("globe", 3.0, 3.5, z+1.66, 0.4, mat("globe", "#41657a" if not dark else "#2c4553", 0.45))
bpy.ops.mesh.primitive_torus_add(major_radius=0.46, minor_radius=0.015, location=(3.0, 3.5, z+1.66), rotation=(0.4, 0.3, 0))
o = bpy.context.object; finish(o, STEEL, 0)
for i, (px, py, ang) in enumerate([(3.9, 3.0, 0.2), (4.2, 4.1, -0.3), (2.6, 2.7, 0.6)]):
    box(f"paper{i}", px, py, z+0.79, px+0.42, py+0.3, z+0.795, PAPER, 0).rotation_euler.z = ang
box("whiteboard", 1.0, D-0.06, z+0.95, 5.2, D-0.02, z+2.45, mat("wb", "#fbfbf8" if not dark else "#bdbab2", 0.25), 0.01)
for i in range(5):
    box(f"wbl{i}", 1.3, D-0.07, z+2.15-i*0.24, 1.3+0.7+((i*29) % 5)*0.5, D-0.065, z+2.18-i*0.24, GRAPH, 0)
figure("fig_research", 2.2, D-1.2, z)

# ---------------- Records (upper, right) ----------------
for i in range(5):
    cx = 6.6 + i*0.95
    box(f"cab{i}", cx, D-0.9, z, cx+0.85, D-0.08, z+1.45, OLIVE if i % 2 == 0 else OLIVE2, 0.02)
    for d_ in range(3):
        box(f"pull{i}{d_}", cx+0.3, D-0.92, z+0.35+d_*0.42, cx+0.55, D-0.9, z+0.39+d_*0.42, STEEL, 0)
box("sofa", 7.4, 0.9, z, 10.2, 1.85, z+0.42, CLOTH, 0.07)
box("sofab", 7.4, 0.7, z+0.42, 10.2, 1.05, z+0.92, CLOTH, 0.07)
box("ctable", 8.2, 2.3, z+0.38, 9.5, 3.0, z+0.42, OAK, 0.01)
cyl("ctleg", 8.85, 2.65, z, 0.38, 0.05, GRAPH, 12)
box("safe", 10.9, 3.4, z, 11.7, 4.2, z+0.85, GRAPH, 0.03)
figure("fig_records", 9.0, D-1.6, z)

# ---------------- lighting ----------------
world = bpy.data.worlds.new("w"); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = lin("#10131a" if dark else "#f1ede6")
bg.inputs[1].default_value = 0.4 if dark else 0.55
bpy.ops.object.light_add(type='SUN', location=(0, 0, 30))
sun = bpy.context.object; sun.name = "key_sun"
sun.data.angle = math.radians(7)
sun.data.energy = 0.9 if dark else 4.0
sun.data.color = (0.62, 0.72, 1.0) if dark else (1.0, 0.94, 0.86)
sun.rotation_euler = (math.radians(48), 0, math.radians(-62))     # key from camera-left, high
bpy.ops.object.light_add(type='AREA', location=(-6, -10, 12))
fill = bpy.context.object; fill.name = "fill"
fill.data.energy = 420 if dark else 700; fill.data.size = 14
fill.data.color = (0.7, 0.78, 1.0) if dark else (0.95, 0.97, 1.0)
fill.rotation_euler = (math.radians(55), 0, math.radians(-30))
if dark:
    for lvl, zz in enumerate([T+H-1.25, F1+T+H-1.25]):
        for lx in (3.0, 9.0):
            bpy.ops.object.light_add(type='SPOT', location=(lx, 4.0, zz))
            sp = bpy.context.object; sp.data.energy = 700; sp.data.spot_size = math.radians(110)
            sp.data.spot_blend = 0.6; sp.data.color = (1.0, 0.82, 0.58); sp.data.shadow_soft_size = 0.3
    bpy.ops.object.light_add(type='AREA', location=(1.4, 2.75, T+2.1))       # screen spill
    sl = bpy.context.object; sl.data.energy = 140; sl.data.size = 3.5; sl.data.color = (1.0, 0.5, 0.42)
    sl.rotation_euler = (0, math.radians(-90), 0)

# ---------------- camera + turntable ----------------
target = Vector((6.0, 3.6, 4.4))
base_off = Vector((18, -22, 15))
R_xy = math.hypot(base_off.x, base_off.y); base_az = math.atan2(base_off.y, base_off.x)
bpy.ops.object.empty_add(location=target); tgt = bpy.context.object
bpy.ops.object.camera_add(location=target + base_off)
cam = bpy.context.object; scene.camera = cam
cam.data.type = 'ORTHO'; cam.data.ortho_scale = 25.5
c = cam.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'

r = scene.render
r.resolution_x, r.resolution_y = RES
r.film_transparent = True
r.engine = 'CYCLES'
cy = scene.cycles
cy.samples = SAMPLES; cy.use_denoising = True
cy.max_bounces = 3; cy.caustics_reflective = False; cy.caustics_refractive = False
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for dev in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
        try:
            prefs.compute_device_type = dev; prefs.get_devices()
            if any(d.type == dev for d in prefs.devices):
                for d in prefs.devices: d.use = True
                cy.device = 'GPU'; break
        except Exception: pass
except Exception: pass
scene.view_settings.view_transform = 'AgX'
try: scene.view_settings.look = 'AgX - Medium High Contrast'
except Exception: pass
scene.view_settings.exposure = 0.15 if not dark else 0.85
r.image_settings.file_format = 'WEBP'
r.image_settings.color_mode = 'RGBA'
r.image_settings.quality = 82

rooms = {
    "markets":   Vector((2.6, 3.4, T + 1.6)),
    "screen":    Vector((0.1, 2.75, T + 2.15)),
    "portfolio": Vector((9.5, 3.4, T + 1.6)),
    "research":  Vector((3.0, 3.6, F1 + T + 2.0)),
    "records":   Vector((9.0, 3.4, F1 + T + 1.9)),
}
frames = []
for f in range(FRAMES):
    t = 0.5 if FRAMES == 1 else f / (FRAMES - 1)
    az = base_az + math.radians(-ARC + 2 * ARC * t)
    cam.location = target + Vector((R_xy * math.cos(az), R_xy * math.sin(az), base_off.z))
    bpy.context.view_layer.update()
    anchors = {k: [round(world_to_camera_view(scene, cam, v).x, 4), round(1 - world_to_camera_view(scene, cam, v).y, 4)] for k, v in rooms.items()}
    name = f"{MODE}-{f:02d}"
    frames.append({"file": name + ".webp", "anchors": anchors})
    if DO_RENDER:
        r.filepath = os.path.join(OUT, "frames", name + ".webp")
        bpy.ops.render.render(write_still=True)
        print("FRAME", name, flush=True)
mid = FRAMES // 2
t = 0.5
cam.location = target + base_off; bpy.context.view_layer.update()
with open(os.path.join(OUT, "frames", f"{MODE}.json"), "w") as fh:
    json.dump({"mode": MODE, "frames": frames, "res": RES, "engine": r.engine, "device": cy.device}, fh)
print("DONE", MODE, len(frames))
