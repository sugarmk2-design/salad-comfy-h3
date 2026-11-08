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

## License note

MiniMax H3 is distributed under the MiniMax H3 Community License,
which does not cover use in the US, EU, UK, or South Korea. The
SaladCloud container group for this image is therefore restricted
by country codes (via the SaladCloud API) to allowed territories.
