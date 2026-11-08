FROM ghcr.io/saladtechnologies/comfyui-api:comfy0.35.0-api1.19.2-torch2.13.0-cuda13.0-runtime

COPY manifest.yaml .
ENV MANIFEST=manifest.yaml
