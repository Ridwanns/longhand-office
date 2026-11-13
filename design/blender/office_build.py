"""Longhand Office model: assembly sequence for the Overview opening (no orbit).
Builds the v2 scene at its front camera, then animates the model being put together:
  board -> ground floor drops in -> columns rise -> upper floor drops in -> model trees pop up.
Run: blender -b --factory-startup -P office_build.py   (env: OUT_DIR, MODE=light|dark, SAMPLES, BFRAMES)
Writes frames/build-<mode>-NN.webp and frames/build-<mode>.json (anchors at the final pose)."""
import bpy, os, json, math, runpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("OUT_DIR", ".")
MODE = os.environ.get("MODE", "light")
N = int(os.environ.get("BFRAMES", 60))
# build the scene once at the front camera angle, without rendering the turntable
SCR = os.environ.get("SCRATCH", os.path.join(OUT, "_scratch")); os.makedirs(os.path.join(SCR, "frames"), exist_ok=True)
g = runpy.run_path(os.path.join(HERE, "office_scene_v2.py"), init_globals={"CFG": {"OUT_DIR": SCR, "MODE": MODE, "FRAMES": 1, "RENDER": False,
    "SAMPLES": os.environ.get("SAMPLES", 40), "SCREEN": os.path.join(HERE, "ihsg-screen.png")}})
scene = bpy.context.scene; cam = scene.camera
T, H, GAP = g["T"], g["H"], g["GAP"]; F1 = g["F1"]; rooms = g["rooms"]
bpy.context.view_layer.update()

def empty(name, loc):
    o = bpy.data.objects.new(name, None); scene.collection.objects.link(o); o.location = loc; bpy.context.view_layer.update(); return o
def adopt(child, parent):
    mw = child.matrix_world.copy(); child.parent = parent; child.matrix_parent_inverse = parent.matrix_world.inverted(); child.matrix_world = mw

ground = empty("G_ground", (6, 4, 0)); upper = empty("G_upper", (6, 4, F1))
static = {"board", "board_edge", "path", "shadow_catcher", "key_sun", "fill"}
import re
trees, cols = {}, []
for o in list(scene.objects):
    if o.type == 'CAMERA' or o.name.startswith("G_") or o.name in static or o.parent: continue
    if o.type == 'EMPTY': continue
    m = re.match(r'(stick|crown|shrub)(\d+)', o.name)
    if m: trees.setdefault(int(m.group(2)), []).append(o); continue
    if o.name.startswith("col"): cols.append(o); continue
    zc = o.matrix_world.translation.z if o.type == 'LIGHT' else (o.matrix_world @ Vector(o.bound_box[0])).z
    adopt(o, upper if zc >= F1 - 0.05 else ground)
tree_e = []
for i in sorted(trees):
    objs = trees[i]; xs = [o.matrix_world.translation for o in objs]
    e = empty(f"G_tree{i}", (sum(v.x for v in xs) / len(xs), sum(v.y for v in xs) / len(xs), 0)); [adopt(o, e) for o in objs]; tree_e.append(e)
col_e = []
for k, o in enumerate(cols):
    e = empty(f"G_col{k}", (o.matrix_world.translation.x, o.matrix_world.translation.y, T + H)); adopt(o, e); col_e.append(e)

def key(o, path, frames_vals, interp='CUBIC', easing='EASE_OUT'):
    for f, v in frames_vals:
        getattr(o, path)[:] = v; o.keyframe_insert(path, frame=f)
    ad = o.animation_data; curves = []
    try: curves = list(ad.action.fcurves)
    except Exception:
        try:
            for layer in ad.action.layers:
                for strip in layer.strips:
                    for cb in strip.channelbags: curves += list(cb.fcurves)
        except Exception: pass
    for fc in curves:
        for kp in fc.keyframe_points:
            if kp.interpolation != 'CONSTANT': kp.interpolation = interp; kp.easing = easing
def appear(objs, f):
    for ch in objs:
        ch.hide_render = True; ch.keyframe_insert("hide_render", frame=max(0, f - 1))
        ch.hide_render = False; ch.keyframe_insert("hide_render", frame=f)

f_end = N - 1; S = N / 30.0; tm = lambda f: int(round(f * S))
# 30-frame plan scaled to N: ground drops 1-11, columns rise 9-14, upper floor drops 11-22, planting 16-29
key(ground, "location", [(tm(1), (6, 4, 7.5)), (tm(11), (6, 4, 0))])
key(upper, "location", [(tm(11), (6, 4, F1 + 9.0)), (tm(22), (6, 4, F1))])
appear(ground.children, tm(1)); appear(upper.children, tm(11))
for k, e in enumerate(col_e):
    a = tm(9) + k * 2; key(e, "scale", [(a, (1, 1, 0.001)), (a + tm(5), (1, 1, 1))]); appear(e.children, a + 1)
span = tm(6); step = max(1, (f_end - tm(16) - span) / max(1, len(tree_e) - 1))
for k, e in enumerate(tree_e):
    a = int(tm(16) + k * step); key(e, "scale", [(a, (0.001, 0.001, 0.001)), (min(f_end, a + span), (1, 1, 1))]); appear(e.children, a + 1)

scene.frame_start, scene.frame_end = 0, f_end
r = scene.render
r.resolution_x, r.resolution_y = int(os.environ.get("SEQ_X", 1200)), int(os.environ.get("SEQ_Y", 800))
scene.cycles.samples = int(os.environ.get("SAMPLES", 28))
os.makedirs(os.path.join(OUT, "frames"), exist_ok=True)
scene.frame_set(f_end); bpy.context.view_layer.update()
anchors = {k: [round(world_to_camera_view(scene, cam, v).x, 4), round(1 - world_to_camera_view(scene, cam, v).y, 4)] for k, v in rooms.items()}
files = []
dry = os.environ.get("DRY") == "1"
only = os.environ.get("ONLY")
for f in range(N):
    if only and f not in [int(x) for x in only.split(",")]: continue
    scene.frame_set(f)
    name = f"build-{MODE}-{f:02d}.webp"; files.append(name)
    r.filepath = os.path.join(OUT, "frames", name)
    if not dry: bpy.ops.render.render(write_still=True)
    print("BUILD", name, flush=True)
if os.environ.get("FINAL", "1") == "1" and not dry and not only:
    scene.frame_set(f_end); r.resolution_x, r.resolution_y = 1500, 1000; scene.cycles.samples = 64
    r.filepath = os.path.join(OUT, "frames", f"build-{MODE}-final.webp"); bpy.ops.render.render(write_still=True)
if not only:
    with open(os.path.join(OUT, "frames", f"build-{MODE}.json"), "w") as fh:
        json.dump({"mode": MODE, "fps": int(os.environ.get("FPS", 48)), "files": files, "final": f"build-{MODE}-final.webp", "anchors": anchors, "res": [1500, 1000]}, fh)
print("DONE build", MODE, N)
