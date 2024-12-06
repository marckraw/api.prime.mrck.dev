import { AntonSDK } from "@mrck-labs/anton-sdk";
import { config } from "../config.env";
import { Langfuse } from "langfuse";
import { improvePromptPrompt } from "../routes/api/images/prompts";

interface ImageGenerationOptions {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_images?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  modelId?: string;
}

interface ImageResponse {
  imageUrl: string;
  generationId: string;
}

const createImageService = () => {
  // Private variable using closure
  const imageGenerator = (() => {
    const generator = AntonSDK.create({
      model: "gpt-4o-mini",
      apiKey: config.OPENAI_API_KEY, 
      type: "openai",
      supportedModelsApiKeys: {
        leonardoAI: config.LEONARDOAI_API_KEY
      }
    });
    
    // Initialize with system message
    generator.setSystemMessage?.(improvePromptPrompt);
    
    return generator;
  })();

  const improvePrompt = async (prompt: string) => {
    const improvedPromptResponse = await imageGenerator.chat({
        messages: [
            {
            role: "user",
            content: prompt
            }
        ]
    })

    const improvedPrompt = (improvedPromptResponse as any)[0].content

    return improvedPrompt
  }

  // Public methods
  const generateImage = async (options: ImageGenerationOptions): Promise<ImageResponse> => {
    const langfuse = new Langfuse();
    const trace = langfuse.trace({
      name: "image-generation",
    });

    const generation = trace.generation({
      name: "leonardo-image",
      model: "leonardo-diffusion",
      input: options,
    });

    try {
      const response = await imageGenerator.createImageWithLeonardo({
        prompt: options.prompt,
        // @ts-ignore
        negative_prompt: options.negative_prompt || "",
        nsfw: true,
        num_images: options.num_images || 1,
        width: options.width || 1280,
        height: options.height || 1920,
        num_inference_steps: options.num_inference_steps || 10,
        contrast: 3.5,
        guidance_scale: options.guidance_scale || 15,
        sd_version: "PHOENIX",
        modelId: options.modelId || "6b645e3a-d64f-4341-a6d8-7a3690fbf042",
        presetStyle: "LEONARDO",
        scheduler: "LEONARDO",
        public: false,
        tiling: false,
        alchemy: true,
        highResolution: false,
        contrastRatio: 0.5,
        weighting: 0.75,
        highContrast: false,
        expandedDomain: false,
        photoReal: false,
        transparency: "disabled",
        styleUUID: "a5632c7c-ddbb-4e2f-ba34-8456ab3ac436",
        enhancePrompt: false,
        ultra: false
      });

      generation.end({
        output: response,
      });

      return {
        // @ts-ignore
        imageUrl: response.imageUrl,
        // @ts-ignore
        generationId: response.generationId
      };

    } catch (error) {
      console.error("Error generating image:", error);
      generation.end({
        // @ts-ignore
        error: error instanceof Error ? error : new Error("Unknown error occurred")
      });
      throw error;
    }
  };

  const generateImageWithImprovedPrompt = async (options: ImageGenerationOptions) => {
    const improvedPrompt = await improvePrompt(options.prompt)
    return generateImage({...options, prompt: improvedPrompt})
  }

  // Return public interface
  return {
    generateImage,
    generateImageWithImprovedPrompt,
    improvePrompt
  };
};

export { createImageService };
export type { ImageGenerationOptions, ImageResponse };
