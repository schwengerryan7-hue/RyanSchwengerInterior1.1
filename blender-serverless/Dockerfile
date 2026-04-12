FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    python3 python3-pip wget xz-utils \
    libgl1 libglib2.0-0 libgomp1 libsm6 libxrender1 libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Blender 3.6.8 LTS — official binary with proper CUDA/A40 support
RUN wget -q https://download.blender.org/release/Blender3.6/blender-3.6.8-linux-x64.tar.xz \
    && tar xf blender-3.6.8-linux-x64.tar.xz -C /opt/ \
    && rm blender-3.6.8-linux-x64.tar.xz

ENV BLENDER_PATH=/opt/blender-3.6.8-linux-x64/blender

RUN pip3 install runpod numpy open3d anthropic

COPY handler.py /handler.py

CMD ["python3", "-u", "/handler.py"]
