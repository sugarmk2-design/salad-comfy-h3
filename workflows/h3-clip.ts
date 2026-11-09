import { z } from 'zod'

const ComfyNodeSchema = z.object({
  inputs: z.any(),
  class_type: z.string(),
  _meta: z.any().optional(),
})

type ComfyNode = z.infer<typeof ComfyNodeSchema>
type ComfyPrompt = Record<string, ComfyNode>

interface Workflow {
  RequestSchema: z.ZodObject<any, any>
  generateWorkflow: (input: any) => Promise<ComfyPrompt> | ComfyPrompt
  description?: string
  summary?: string
}

const RequestSchema = z.object({
  prompt: z.string().describe('The text prompt to generate a video clip from.'),
  seconds: z
    .number()
    .int()
    .min(4)
    .max(15)
    .default(5)
    .describe('Duration of the clip in seconds (4-15).'),
  seed: z
    .number()
    .int()
    .optional()
    .default(() => Math.floor(Math.random() * 1000000000000))
    .describe('Seed for the noise generator.'),
  megapixels: z
    .number()
    .min(0.3)
    .max(1.5)
    .default(1.0)
    .describe('Resolution budget in megapixels (1.0 is about 1376x768 at 16:9).'),
})

type InputType = z.infer<typeof RequestSchema>

// Official MiniMax H3 text-to-video API workflow (Comfy-Org template),
// the same graph that was verified on Modal. Patched per request below.
const TEMPLATE: ComfyPrompt = {"92":{"inputs":{"filename_prefix":"MiniMax_H3","format":"auto","format.codec":"auto","codec":"auto","video":["140:130",0]},"class_type":"SaveVideo","_meta":{"title":"Save Video"}},"115":{"inputs":{"aspect_ratio":"16:9 (Widescreen)","megapixels":0.4,"multiple":32},"class_type":"ResolutionSelector","_meta":{"title":"Resolution Selector"}},"140:119":{"inputs":{"vae_name":"minimax_h3_video_vae_int8_convrot.safetensors"},"class_type":"VAELoader","_meta":{"title":"Load VAE"}},"140:120":{"inputs":{"vae_name":"minimax_h3_audio_vae_fp32.safetensors"},"class_type":"VAELoader","_meta":{"title":"Load VAE"}},"140:121":{"inputs":{"samples":["140:125",0],"vae":["140:120",0]},"class_type":"VAEDecodeAudio","_meta":{"title":"VAE Decode Audio"}},"140:122":{"inputs":{"samples":["140:125",0],"vae":["140:119",0]},"class_type":"VAEDecode","_meta":{"title":"VAE Decode"}},"140:123":{"inputs":{"sampler_name":"res_multistep"},"class_type":"KSamplerSelect","_meta":{"title":"KSamplerSelect"}},"140:124":{"inputs":{"scheduler":"simple","steps":["140:136",0],"denoise":1,"model":["140:135",0]},"class_type":"BasicScheduler","_meta":{"title":"BasicScheduler"}},"140:125":{"inputs":{"noise":["140:129",0],"guider":["140:126",0],"sampler":["140:123",0],"sigmas":["140:124",0],"latent_image":["140:131",1]},"class_type":"SamplerCustomAdvanced","_meta":{"title":"SamplerCustomAdvanced"}},"140:126":{"inputs":{"model":["140:135",0],"conditioning":["140:131",0]},"class_type":"BasicGuider","_meta":{"title":"Basic Guider"}},"140:127":{"inputs":{"unet_name":"minimax_h3_fl2va_pruned_int8_convrot.safetensors","weight_dtype":"default"},"class_type":"UNETLoader","_meta":{"title":"Load Diffusion Model"}},"140:128":{"inputs":{"clip_name":"qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors","type":"minimax","device":"default"},"class_type":"CLIPLoader","_meta":{"title":"Load CLIP"}},"140:129":{"inputs":{"noise_seed":757358688076805},"class_type":"RandomNoise","_meta":{"title":"RandomNoise"}},"140:130":{"inputs":{"fps":24,"bit_depth":8,"color_space":"sRGB","codec":"none","images":["140:122",0],"audio":["140:121",0]},"class_type":"CreateVideo","_meta":{"title":"Create Video"}},"140:131":{"inputs":{"prompt":"Realistic live-action cinematic look, action movie trailer: practical film photography style, a post-rain dusk metropolis, anamorphic lens, shallow depth of field, film grain, city volumetric fog, flying-car traffic between the towers, restrained grading for a premium feel, powerful natural movement.\n\nScene overview: at dusk on a cluster of skyscrapers, the protagonist is being chased, sprinting and leaping across rooftops, jumping from one building's roof to the next with pursuers closing in behind. This is the escape sequence of an action movie trailer: every leap is life-or-death, thrilling and fluid.\n\nStoryboard (each shot a separate scene, rapid cuts, all landing on the musical beats):\n[0s-1.5s] Shot 1: high side angle: the protagonist sprinting at the roof edge, pursuers appearing in the rooftop doorway behind him, wind catching his coat.\n[1s-2.5s] Shot 2: the protagonist leaps across the gap between buildings, body stretching mid-air, towers and flying-car light trails behind him, a slight slow-motion feel.\n[2.5s-4s] Shot 3: he lands, rolls and rises, low-angle shot, tower shadows and fog behind him, he keeps running.\n[4s-5s] Shot 4: freeze: the instant he hits the edge of the next roof and launches into the jump, silhouette, holding.\n\nCamera: each shot its own angle, cuts clean and hard, no dissolves, a slight frame jitter on the jumps.\n\nAudio: wind, rapid footsteps, city ambience, low score underneath, an accent hit on each leap, the score bursting at 4s, closing the last 1s.\n\nNo text, subtitles, logos or watermarks of any kind, no animation or cartoon rendering, no overly-CG look, keep the live-action texture.","width":["115",0],"height":["115",1],"length":["140:132",1],"clip":["140:128",0],"vae":["140:119",0]},"class_type":"MiniMaxH3ImageToVideo","_meta":{"title":"MiniMax H3 Image to Video"}},"140:132":{"inputs":{"expression":"max(5, round(a * 24)) + (5 - (max(5, round(a * 24)) % 17)) % 17","values.a":["140:133",0]},"class_type":"ComfyMathExpression","_meta":{"title":"Math Expression"}},"140:133":{"inputs":{"value":5},"class_type":"PrimitiveFloat","_meta":{"title":"Float (duration)"}},"140:134":{"inputs":{"lora_name":"minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors","strength_model":1,"model":["140:127",0]},"class_type":"LoraLoaderModelOnly","_meta":{"title":"Load LoRA"}},"140:135":{"inputs":{"switch":["140:139",0],"on_false":["140:127",0],"on_true":["140:134",0]},"class_type":"ComfySwitchNode","_meta":{"title":"If/Else Switch (Model)"}},"140:136":{"inputs":{"switch":["140:139",0],"on_false":["140:137",0],"on_true":["140:138",0]},"class_type":"ComfySwitchNode","_meta":{"title":"If/Else Switch (Steps)"}},"140:137":{"inputs":{"value":20},"class_type":"PrimitiveInt","_meta":{"title":"Int"}},"140:138":{"inputs":{"value":8},"class_type":"PrimitiveInt","_meta":{"title":"Int"}},"140:139":{"inputs":{"value":false},"class_type":"PrimitiveBoolean","_meta":{"title":"Boolean (Enable Lightning LoRA)"}}}

function generateWorkflow(input: InputType): ComfyPrompt {
  const workflow: ComfyPrompt = JSON.parse(JSON.stringify(TEMPLATE))

  // Prompt text on the H3 node.
  for (const node of Object.values(workflow)) {
    if (node.class_type === 'MiniMaxH3ImageToVideo') {
      node.inputs.prompt = input.prompt
    }
  }

  // Duration: PrimitiveFloat (seconds) feeding the ComfyMathExpression.
  for (const node of Object.values(workflow)) {
    if (node.class_type !== 'ComfyMathExpression') continue
    for (const [key, value] of Object.entries(node.inputs)) {
      if (key.startsWith('values.') && Array.isArray(value)) {
        const source = workflow[String(value[0])]
        if (source && source.class_type === 'PrimitiveFloat') {
          source.inputs.value = input.seconds
        }
      }
    }
  }

  // Turbo LoRA on: flip the PrimitiveBoolean driving the ComfySwitchNodes.
  for (const node of Object.values(workflow)) {
    if (node.class_type !== 'ComfySwitchNode') continue
    const sw = node.inputs.switch
    if (Array.isArray(sw)) {
      const source = workflow[String(sw[0])]
      if (source && source.class_type === 'PrimitiveBoolean') {
        source.inputs.value = true
      }
    }
  }

  // Seed and resolution.
  for (const node of Object.values(workflow)) {
    if (node.class_type === 'RandomNoise') {
      node.inputs.noise_seed = input.seed
    }
    if (node.class_type === 'ResolutionSelector') {
      node.inputs.megapixels = input.megapixels
    }
  }

  return workflow
}

const workflow: Workflow = {
  RequestSchema,
  generateWorkflow,
  description: 'Generate a MiniMax H3 video clip from a text prompt.',
  summary: 'MiniMax H3 Text to Video',
}

export default workflow
