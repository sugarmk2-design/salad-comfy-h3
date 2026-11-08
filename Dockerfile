FROM ghcr.io/saladtechnologies/comfyui-api:comfy0.35.0-api1.19.2-torch2.13.0-cuda13.0-runtime

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
