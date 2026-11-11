FROM ghcr.io/saladtechnologies/comfyui-api:comfy0.35.0-api1.19.2-torch2.13.0-cuda13.0-runtime

# --- GGUF build (v5): models baked into the image, no startup download ---
# Design notes:
# - Diffusion model is the community GGUF quant (Abiray pruned Q4_K_M,
#   11,564,180,576 bytes) instead of the 20.97 GB int8 safetensors, so the
#   whole set fits SaladCloud's 35 GB compressed image cap.
# - Text encoder and VAEs stay the official Comfy-Org safetensors.
# - The Turbo LoRA is NOT baked: the workflow runs the plain 20-step path
#   (the GGUF loader path does not use the LoRA switch).
# - Model total: 11.56 + 15.69 + 2.81 + 0.61 = 30.67 GB on top of the
#   ~4.1 GB base image.

# ComfyUI-GGUF loader node (city96), baked in so nothing is cloned or
# pip-installed at container startup.
RUN git clone --depth 1 https://github.com/city96/ComfyUI-GGUF.git /opt/ComfyUI/custom_nodes/ComfyUI-GGUF \
    && pip install --no-cache-dir -r /opt/ComfyUI/custom_nodes/ComfyUI-GGUF/requirements.txt

# Model weights, one layer per file (remote ADD streams straight into the
# layer; no local copies in the build context).
ADD https://huggingface.co/Abiray/MiniMax-H3-Pruned-GGUF/resolve/main/MiniMax-H3-FL2VA-Pruned-Q4_K_M.gguf /opt/ComfyUI/models/unet/MiniMax-H3-FL2VA-Pruned-Q4_K_M.gguf
ADD https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors /opt/ComfyUI/models/text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors
ADD https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_video_vae_int8_convrot.safetensors /opt/ComfyUI/models/vae/minimax_h3_video_vae_int8_convrot.safetensors
ADD https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_audio_vae_fp32.safetensors /opt/ComfyUI/models/vae/minimax_h3_audio_vae_fp32.safetensors

COPY manifest.yaml .
ENV MANIFEST=manifest.yaml

# Custom workflow endpoints for ComfyUI API (loaded from $WORKFLOW_DIR=/workflows)
COPY workflows $WORKFLOW_DIR

# SaladCloud Job Queue worker v0.7.0 (the version pinned by the official
# with-shell-script sample), installed to /usr/local/bin like the sample.
ADD https://github.com/SaladTechnologies/salad-cloud-job-queue-worker/releases/download/v0.7.0/salad-http-job-queue-worker_x86_64.tar.gz /tmp/salad-http-job-queue-worker.tar.gz
RUN tar -C /usr/local/bin -zxpf /tmp/salad-http-job-queue-worker.tar.gz && rm /tmp/salad-http-job-queue-worker.tar.gz

# Make the worker's behavior visible in the container logs (it otherwise
# only prints error-level lines, which hid the v2 failure).
ENV SALAD_LOG_LEVEL=debug

# Sample-style supervisor: if either process exits, the container exits and
# SaladCloud restarts it, instead of a dead worker going unnoticed.
COPY --chmod=755 run.sh /usr/local/bin/run.sh
CMD ["/usr/local/bin/run.sh"]
