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

    # Save model if provided, otherwise use None
    model_path = None
    if model_b64:
        model_path = "/tmp/model.glb"
        with open(model_path, "wb") as f:
            f.write(base64.b64decode(model_b64))

    # Write input.json
    with open("/tmp/input.json", "w") as f:
        json.dump({
            "mesh_path": model_path,
            "output_path": "/tmp/output",
            "prompt": prompt
        }, f)

    # Write blender script
    blender_script = '''
import bpy, json, os, math

with open("/tmp/input.json") as f:
    data = json.load(f)

bpy.ops.wm.read_factory_settings(use_empty=True)

# Import model or use default cube
mesh_path = data.get("mesh_path")
if mesh_path and os.path.exists(mesh_path):
    bpy.ops.import_scene.gltf(filepath=mesh_path)
else:
    bpy.ops.mesh.primitive_cube_add(size=2)

prompt = data.get("prompt", "").lower()

# Determine material from prompt
metallic = 1.0 if any(x in prompt for x in ["metal","chrome","steel","gold"]) else 0.0
roughness = 0.05 if "chrome" in prompt else 0.3 if "metal" in prompt else 0.8
if "gold" in prompt:
    color = (0.8, 0.6, 0.1, 1)
elif "chrome" in prompt or "steel" in prompt:
    color = (0.8, 0.8, 0.8, 1)
elif "wood" in prompt or "oak" in prompt or "walnut" in prompt:
    color = (0.4, 0.25, 0.1, 1)
    metallic = 0.0
    roughness = 0.8
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
        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)

# Camera
bpy.ops.object.camera_add(location=(5, -5, 4))
cam = bpy.context.object
cam.rotation_euler = (1.1, 0, 0.785)
bpy.context.scene.camera = cam

# Lighting
bpy.ops.object.light_add(type="SUN", location=(5, 5, 10))
sun = bpy.context.object
sun.data.energy = 3

# Render settings
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

    # Run Blender
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
