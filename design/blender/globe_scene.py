"""Desk globe painted with Office atlas data. Headless: blender -b --factory-startup -P globe_scene.py
env: OUT_DIR, IND=gdp|cpi, FRAMES (360-degree spin), SAMPLES, RENDER=1|0"""
import bpy, math, json, os
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

CFG = globals().get("CFG", {})
env = lambda k, d: CFG.get(k, os.environ.get(k, d))
OUT = env("OUT_DIR", "."); IND = env("IND", "gdp")
FRAMES = int(env("FRAMES", 24)); SAMPLES = int(env("SAMPLES", 48)); DO_RENDER = str(env("RENDER", "1")) == "1"
RES = int(env("RES", 1100))

if bpy.app.background:
    bpy.ops.wm.read_factory_settings(use_empty=True); scene = bpy.context.scene
else:
    nm = "LonghandGlobe-" + IND
    if nm in bpy.data.scenes:
        old = bpy.data.scenes[nm]
        for o in list(old.objects): bpy.data.objects.remove(o, do_unlink=True)
        bpy.data.scenes.remove(old)
    scene = bpy.data.scenes.new(nm); bpy.context.window.scene = scene

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple([x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c] + [1.0])

def principled(name, col, rough=0.5, metal=0.0, coat=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = lin(col); b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if coat: b.inputs["Coat Weight"].default_value = coat; b.inputs["Coat Roughness"].default_value = 0.12
    return m

BRASS = principled("brass", "#b08d4c", 0.28, 1.0)
WALNUT = principled("walnut", "#3b281c", 0.38, 0.0, 0.5)
GLOBE = bpy.data.materials.new("globe"); GLOBE.use_nodes = True
nt = GLOBE.node_tree; b = nt.nodes["Principled BSDF"]
tc = nt.nodes.new("ShaderNodeTexCoord"); tex = nt.nodes.new("ShaderNodeTexImage")
tex.image = bpy.data.images.load(os.path.join(OUT, f"globe-{IND}.png")); tex.projection = 'FLAT'  # UV sphere UVs are equirectangular
tex.interpolation = 'Cubic'
nt.links.new(tc.outputs["UV"], tex.inputs["Vector"]); nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
b.inputs["Roughness"].default_value = 0.42; b.inputs["Coat Weight"].default_value = 0.3; b.inputs["Coat Roughness"].default_value = 0.18

R = 1.0
TILT = math.radians(23.4)
# axis parent: tilted about Y so the north pole leans to the right in view
bpy.ops.object.empty_add(location=(0, 0, 0)); axis = bpy.context.object; axis.name = "axis"
axis.rotation_euler = (0, TILT, 0)
bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=64, radius=R, location=(0, 0, 0))
globe = bpy.context.object; globe.name = "globe"; bpy.ops.object.shade_smooth()
globe.data.materials.append(GLOBE); globe.parent = axis
# meridian ring (half circle, brass), follows tilt but does not spin
bpy.ops.mesh.primitive_torus_add(major_radius=R + 0.06, minor_radius=0.018, major_segments=128, minor_segments=16)
ring = bpy.context.object; ring.name = "meridian"; ring.rotation_euler = (math.pi / 2, 0, 0)
bpy.ops.object.transform_apply(rotation=True); ring.data.materials.append(BRASS); ring.parent = axis
bpy.ops.object.shade_smooth()
for zc in (R + 0.04, -(R + 0.04)):                      # pivots at the poles
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.08, location=(0, 0, zc))
    o = bpy.context.object; o.data.materials.append(BRASS); o.parent = axis
# stand
BASE_Z = -(R + 0.42)
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.62, depth=0.1, location=(0, 0, BASE_Z))
base = bpy.context.object; base.data.materials.append(WALNUT); bpy.ops.object.shade_smooth()
md = base.modifiers.new("b", "BEVEL"); md.width = 0.03; md.segments = 3
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.05, depth=0.36, location=(0, 0, BASE_Z + 0.23))
o = bpy.context.object; o.data.materials.append(BRASS); bpy.ops.object.shade_smooth()
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.08, location=(0, 0, BASE_Z + 0.06))
o = bpy.context.object; o.data.materials.append(BRASS); bpy.ops.object.shade_smooth()
# shadow catcher
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, BASE_Z - 0.05)); pc = bpy.context.object; pc.is_shadow_catcher = True

# light: large soft key from camera-left high, cool rim from behind-right
world = bpy.data.worlds.new("w"); scene.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = lin("#efe9dd")
world.node_tree.nodes["Background"].inputs[1].default_value = 0.22
bpy.ops.object.light_add(type='AREA', location=(-3.2, -4.2, 3.4)); key = bpy.context.object
key.data.energy = 330; key.data.size = 3.0; key.data.color = (1.0, 0.95, 0.88)
key.rotation_euler = (Vector((0, 0, 0)) - key.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.light_add(type='AREA', location=(3.4, 3.0, 2.2)); rim = bpy.context.object
rim.data.energy = 260; rim.data.size = 2.0; rim.data.color = (0.8, 0.88, 1.0)
rim.rotation_euler = (Vector((0, 0, 0)) - rim.location).to_track_quat('-Z', 'Y').to_euler()

# camera: front, slightly above
bpy.ops.object.camera_add(location=(0, -7.2, 1.25)); cam = bpy.context.object; scene.camera = cam
cam.data.lens = 85
cam.rotation_euler = (Vector((0, 0, -0.18)) - cam.location).to_track_quat('-Z', 'Y').to_euler()

r = scene.render; r.resolution_x = r.resolution_y = RES; r.film_transparent = True; r.engine = 'CYCLES'
cy = scene.cycles; cy.samples = SAMPLES; cy.use_denoising = True; cy.max_bounces = 4
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
r.image_settings.file_format = 'WEBP'; r.image_settings.color_mode = 'RGBA'; r.image_settings.quality = 84

cent = json.load(open(os.path.join(OUT, "globe-centroids.json")))["centroids"]
def local_point(lon, lat, rad=R):
    lo, la = math.radians(lon), math.radians(lat)
    # Blender SPHERE projection: u=(1-atan2(x,-y)/pi)/2  ->  u=(1-atan2(x,y)/pi)/2: lon 0 on +Y, 90E on -X
    return Vector((math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la))) * rad

# frame 0 puts Indonesia (lon ~118E) toward the camera
idn = local_point(118, -2)
start = -math.pi / 2 - math.atan2(idn.y, idn.x)
os.makedirs(os.path.join(OUT, "globe"), exist_ok=True)
frames = []
for f in range(FRAMES):
    globe.rotation_euler = (0, 0, start + 2 * math.pi * f / FRAMES)
    bpy.context.view_layer.update()
    mw = globe.matrix_world; cam_dir = (cam.matrix_world.to_quaternion() @ Vector((0, 0, -1))).normalized()
    pos = {}
    for cid, (lon, lat) in cent.items():
        p = mw @ local_point(lon, lat); n = (p - mw.translation).normalized()
        facing = -(n.dot((p - cam.location).normalized()))
        if facing > 0.12:
            s = world_to_camera_view(scene, cam, p); pos[cid] = [round(s.x, 4), round(1 - s.y, 4), round(facing, 3)]
    frames.append(pos)
    if DO_RENDER:
        r.filepath = os.path.join(OUT, "globe", f"{IND}-{f:02d}.webp")
        bpy.ops.render.render(write_still=True); print("FRAME", IND, f, flush=True)
json.dump({"frames": frames, "count": FRAMES}, open(os.path.join(OUT, "globe", "positions.json"), "w"))
print("DONE", IND, FRAMES)
