FROM ubuntu:22.04                                                                                                                                    
                  
  ENV DEBIAN_FRONTEND=noninteractive

  RUN apt-get update && apt-get install -y \                                                                                                           
      python3 python3-pip wget xz-utils \
      blender \                                                                                                                                        
      libgl1-mesa-glx \
      libglib2.0-0 \
      libgomp1 \                                                                                                                                       
      libc++1 \
      libstdc++6 \                                                                                                                                     
      && rm -rf /var/lib/apt/lists/*

  RUN pip3 install --upgrade pip                                                                                                                       
  RUN pip3 install runpod numpy
  RUN pip3 install open3d --no-cache-dir                                                                                                               
                  
  RUN blender --background --python-expr "import subprocess, sys; subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'numpy'])"            
   
  COPY handler.py /handler.py                                                                                                                          
                  
  CMD ["python3", "-u", "/handler.py"]