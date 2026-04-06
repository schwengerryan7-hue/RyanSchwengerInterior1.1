import runpod, base64, os, io, tempfile                                                                                             
  from PIL import Image                                                                                                               
                                                                                                                                      
  os.environ["TRIPOSG_MODEL_DIR"] = "/model"                                                                                          
  PIPE = None     
                                                                                                                                      
  def load_pipeline():
      from triposg.pipelines import TripoSGPipeline                                                                                   
      pipe = TripoSGPipeline.from_pretrained("/model").to("cuda")                                                                     
      return pipe                                                                                                                     
                                                                                                                                      
  def handler(job):                                                                                                                   
      global PIPE 
      if PIPE is None:
          PIPE = load_pipeline()                                                                                                      
      job_input = job["input"]
      image_b64 = job_input.get("image_base64")                                                                                       
      img_bytes = base64.b64decode(image_b64)                                                                                         
      image = Image.open(io.BytesIO(img_bytes)).convert("RGB").resize((512, 512))
      outputs = PIPE(image, num_inference_steps=50, guidance_scale=7.5)                                                               
      mesh = outputs.mesh                                                                                                             
      with tempfile.NamedTemporaryFile(suffix=".glb", delete=False) as f:                                                             
          glb_path = f.name                                                                                                           
      mesh.export(glb_path)
      with open(glb_path, "rb") as f:                                                                                                 
          glb_b64 = base64.b64encode(f.read()).decode("utf-8")                                                                        
      os.unlink(glb_path)
      return {"mesh_base64": glb_b64, "status": "ok"}                                                                                 
                                                                                                                                      
  runpod.serverless.start({"handler": handler})