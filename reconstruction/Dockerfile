FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04                                                                                  
  ENV DEBIAN_FRONTEND=noninteractive
  RUN apt-get update && apt-get install -y python3 python3-pip git wget libgl1 libglib2.0-0 libgomp1 && rm -rf /var/lib/apt/lists/*   
  RUN pip3 install runpod torch torchvision pillow trimesh numpy huggingface_hub einops omegaconf                                     
  RUN pip3 install git+https://github.com/VAST-AI-Research/TripoSG.git                                                                
  RUN python3 -c "from huggingface_hub import snapshot_download; snapshot_download('VAST-AI-Research/TripoSG', local_dir='/model')"   
  COPY handler.py /handler.py                                                                                                         
  CMD ["python3", "-u", "/handler.py"]   