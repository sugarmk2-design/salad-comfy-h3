FROM ghcr.io/saladtechnologies/comfyui-api:comfy0.35.0-api1.19.2-torch2.13.0-cuda13.0-runtime

COPY manifest.yaml .
ENV MANIFEST=manifest.yaml

# Custom workflow endpoints for ComfyUI API (loaded from $WORKFLOW_DIR=/workflows)
COPY workflows $WORKFLOW_DIR

# SaladCloud Job Queue worker: forwards queue jobs to the local ComfyUI API.
ADD https://github.com/SaladTechnologies/salad-cloud-job-queue-worker/releases/latest/download/salad-http-job-queue-worker_x86_64.tar.gz /tmp/salad-http-job-queue-worker.tar.gz
RUN tar -xzf /tmp/salad-http-job-queue-worker.tar.gz && rm /tmp/salad-http-job-queue-worker.tar.gz && chmod +x salad-http-job-queue-worker

# Start the job queue worker in the background and the ComfyUI API in the foreground
CMD ["bash", "-c", "./salad-http-job-queue-worker & ./comfyui-api"]
