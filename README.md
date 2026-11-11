# salad-comfy-h3

ComfyUI + MiniMax H3 (open weights, Comfy-Org repack) container image for SaladCloud.

## Design

- Base image: SaladTechnologies' official `comfyui-api` image
  (`comfy0.35.0-api1.19.2-torch2.13.0-cuda13.0-runtime`), which ships
  ComfyUI 0.35.0 including the native MiniMax H3 nodes.
- Model weights (~42 GB total) are NOT baked into the image, because
  SaladCloud caps container images at 35 GB compressed. Instead,
  `manifest.yaml` lists the five MiniMax H3 files and the ComfyUI API
  image downloads them from Hugging Face (`Comfy-Org/MiniMax-H3`)
  into ComfyUI's `models/` folders at container startup
  (`models.before_start`).
- The workflow used for generation is the official API-format
  MiniMax H3 text-to-video workflow (same one used in the companion
  Modal setup), patched per request: prompt, duration (4-15 s),
  Turbo LoRA on (8 steps), resolution, optional first frame (i2v).

## Models (downloaded at startup)

| File | Size |
| --- | --- |
| diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors | 20.97 GB |
| text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors | 15.69 GB |
| vae/minimax_h3_video_vae_int8_convrot.safetensors | 2.81 GB |
| vae/minimax_h3_audio_vae_fp32.safetensors | 0.61 GB |
| loras/minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors | 1.96 GB |

## Build

Pushing to `main` triggers GitHub Actions, which builds the image and
pushes it to GHCR as `ghcr.io/<owner>/salad-comfy-h3:latest`.

## Test results

- v2 (2026-11-08 evening): the job-queue worker never claimed jobs;
  two test jobs sat pending for hours. Root cause not proven; the
  leading hypothesis was a worker that died at startup with no
  supervision in the image's CMD.
- v3 (2026-11-08 night, worker pinned to v0.7.0 in /usr/local/bin,
  run.sh supervision pattern from the official sample,
  SALAD_LOG_LEVEL=debug): the worker defect is FIXED. A fresh job was
  claimed immediately, ComfyUI executed the full H3 workflow
  (176 s of execution, all nodes including SaveVideo) and the job
  status became "succeeded". Two stale jobs from the v2 era were
  claimed the moment ComfyUI came up and failed instantly with empty
  output.
- Remaining defect: the succeeded job returned `output.images = []`
  and `output.filenames = []` (comfyui-api stats show
  `upload_time: 0`, `postprocess_time: 0`), so the rendered MP4 never
  came back through the queue. The file existed only inside the
  container, which was stopped after the test. Retrieval of SaveVideo
  output through comfyui-api is the open problem; do not assume the
  queue returns video files until this is verified.
- After the test the group was scaled to zero (replicas 0). Set
  replicas back to 1 to run again. Cold start is ~45 min in total
  (~12 min allocation + ~33 min model download) at Medium priority.

## License note

MiniMax H3 is distributed under the MiniMax H3 Community License,
which does not cover use in the US, EU, UK, or South Korea. The
SaladCloud container group for this image is therefore restricted
by country codes (via the SaladCloud API) to allowed territories.

## Future direction (decided 2026-11-09, not yet implemented)

- Host the model files on S3-compatible storage (e.g. Cloudflare R2)
  and let comfyui-api fetch them at startup through its native
  storage-provider support, instead of downloading from Hugging Face
  on every cold start. Optionally bake part of the model set into the
  image within the 35 GB cap and fetch only the remainder.
- A Google Drive mount is not viable in SaladCloud containers (no
  FUSE privileges, and OAuth credentials would sit on third-party
  nodes); a Drive copy-in at startup is possible in theory but has
  no speed guarantee.


## Test results — v4 confirmation test (2026-11-09)

- Image: ghcr.io/sugarmk2-design/salad-comfy-h3@sha256:5e4c2bea877c7673f7f3e4578e52e91aaeb777f71a271874153e29b5ea891fc2
  (SaveVideo filename_prefix fixed to "MiniMax_H3", no subfolder).
- Job 21ed2253-8920-4311-b175-bb2765f3bdda (5 s, seed 424242):
  succeeded, and this time the MP4 came back through the queue —
  output.images held the file (1,494,453 bytes), filename
  2bfee0d9-6c11-4547-9a25-2ecc981e3171_MiniMax_H3_00001_.mp4.
  Saved to ~/workspace/your_files/salad-h3-output/test-5s-salad-v4.mp4.
- Verified locally: H.264 1376×768, 24 fps, 5.17 s, AAC track; the
  frame at 2 s shows the red paper airplane in a sunlit classroom,
  matching the prompt.
- The output-retrieval defect is FIXED. The SaladCloud route now
  works end to end: submit → generate → retrieve MP4.
- Group stopped after the test (replicas 0, status stopped verified
  via API). Instance ran ~13:22–14:32 JST (~1.2 h); estimated cost
  $0.4–0.6 at Medium rates (estimate; portal actuals not checked).
- Operational note: after a /stop, setting replicas back to 1 does
  NOT restart the group; POST .../start is required.

<!-- rebuild trigger 2026-11-11: republish image from verified HEAD (workflows/h3-clip.ts blob cdc3fc48) -->
