import runpod
import subprocess
import base64
import os
import json

def handler(job):
    job_input = job["input"]
    prompt = job_input.get("prompt", "")
    model_b64 = job_input.get("model_base64", None)

    os.makedirs("/tmp/output", exist_ok=True)

    model_path = None
    if model_b64:
        model_path = "/tmp/model.glb"
        with open(model_path, "wb") as f:
            f.write(base64.b64decode(model_b64))

    with open("/tmp/input.json", "w") as f:
        json.dump({"mesh_path": model_path, "output_path": "/tmp/output", "prompt": prompt}, f)

    blender_script = '''
import bpy, json, os, math

with open("/tmp/input.json") as f:
    data = json.load(f)

bpy.ops.wm.read_factory_settings(use_empty=True)

mesh_path = data.get("mesh_path")
if mesh_path and os.path.exists(mesh_path):
    bpy.ops.import_scene.gltf(filepath=mesh_path)
else:
    bpy.ops.mesh.primitive_cube_add(size=2)

prompt = data.get("prompt", "").lower()

# Material
metallic = 1.0 if any(x in prompt for x in ["metal","chrome","steel","gold"]) else 0.0
roughness = 0.05 if "chrome" in prompt else 0.3 if "metal" in prompt else 0.8
if "gold" in prompt:
    color = (0.8, 0.6, 0.1, 1)
elif "chrome" in prompt or "steel" in prompt:
    color = (0.9, 0.9, 0.9, 1)
elif "wood" in prompt or "oak" in prompt or "walnut" in prompt:
    color = (0.4, 0.25, 0.1, 1)
    metallic = 0.0
    roughness = 0.8
elif "linen" in prompt or "fabric" in prompt:
    color = (0.9, 0.85, 0.75, 1)
    metallic = 0.0
    roughness = 0.95
else:
    color = (0.8, 0.8, 0.8, 1)

for obj in bpy.context.scene.objects:
    if obj.type == "MESH":
        mat = bpy.data.materials.new("Mat")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = color
            bsdf.inputs["Metallic"].default_value = metallic
            bsdf.inputs["Roughness"].default_value = roughness
        obj.data.materials.clear()
        obj.data.materials.append(mat)

# Auto-frame camera around the model
mesh_objects = [o for o in bpy.context.scene.objects if o.type == "MESH"]
if mesh_objects:
    min_x = min(o.location.x - max(o.dimensions)/2 for o in mesh_objects)
    max_x = max(o.location.x + max(o.dimensions)/2 for o in mesh_objects)
    min_y = min(o.location.y - max(o.dimensions)/2 for o in mesh_objects)
    max_y = max(o.location.y + max(o.dimensions)/2 for o in mesh_objects)
    min_z = min(o.location.z for o in mesh_objects)
    max_z = max(o.location.z + max(o.dimensions) for o in mesh_objects)
    
    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2
    center_z = (min_z + max_z) / 2
    size = max(max_x - min_x, max_y - min_y, max_z - min_z)
    dist = size * 2.5

    cam_x = center_x + dist * 0.7
    cam_y = center_y - dist * 0.7
    cam_z = center_z + dist * 0.5

    bpy.ops.object.camera_add(location=(cam_x, cam_y, cam_z))
    cam = bpy.context.object
    dx = center_x - cam_x
    dy = center_y - cam_y
    dz = center_z - cam_z
    cam.rotation_euler = (math.atan2(-dz, math.sqrt(dx**2+dy**2)), 0, math.atan2(dx, -dy))
    bpy.context.scene.camera = cam

# Lighting
bpy.ops.object.light_add(type="SUN", location=(5, -5, 10))
sun = bpy.context.object
sun.data.energy = 3
sun.rotation_euler = (0.785, 0, 0.785)

bpy.ops.object.light_add(type="AREA", location=(-3, 3, 5))
fill = bpy.context.object
fill.data.energy = 500
fill.data.size = 5

# Render
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 128
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024
scene.render.image_settings.file_format = "PNG"
output_file = os.path.join(data["output_path"], "render.png")
scene.render.filepath = output_file
bpy.ops.render.render(write_still=True)
'''

    with open("/tmp/render.py", "w") as f:
        f.write(blender_script)

    result = subprocess.run(
        ["blender", "--background", "--python", "/tmp/render.py"],
        capture_output=True, text=True
    )

    output_path = "/tmp/output/render.png"
    if os.path.exists(output_path):
        with open(output_path, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode("utf-8")
        return {"image_base64": img_b64, "status": "ok"}
    else:
        return {"status": "error", "log": result.stderr[-3000:]}

runpod.serverless.start({"handler": handler})
