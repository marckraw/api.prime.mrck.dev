import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  analyzeImageSchema,
  generateImageSchema,
  improvePromptSchema,
} from "./validators/images";
import { config } from "../../../config.env";
import { AntonSDK } from "@mrck-labs/anton-sdk";
import { altTextExtractingPrompt } from "../../../anton-config/config";
import { improvePromptPrompt } from "./prompts";
import {
  createImageService,
  imageService,
} from "../../../services/ImageService/image.service";
import { createChatService } from "../../../services/conversation";

const imageRouter = new Hono();

imageRouter.post(
  "/analyze",
  zValidator("json", analyzeImageSchema),
  async (c) => {
    try {
      const { imageUrl, model, debug } = await c.req.valid("json");

      let anton;
      if (model) {
        if (model.company === "anthropic") {
          anton = AntonSDK.create({
            model: model.model as any,
            apiKey: config.ANTHROPIC_API_KEY,
            type: "anthropic",
          });
        } else {
          anton = AntonSDK.create({
            model: model.model as any,
            apiKey: config.OPENAI_API_KEY,
            type: "openai",
          });
        }
      } else {
        anton = AntonSDK.create({
          model: "gpt-4o-mini",
          apiKey: config.OPENAI_API_KEY,
          type: "openai",
        });
      }

      const imageContentData = await imageService.imageContent({
        imageUrl,
        company: model?.company || "openai",
      });

      const response = await anton.chat({
        messages: [
          {
            role: "user",
            // @ts-ignore
            content: [
              imageContentData,
              {
                type: "text",
                text: altTextExtractingPrompt,
              },
            ],
          },
        ],
      });

      return c.json({
        suggestedAltText: (response as any)[0].content,
        ...(debug
          ? {
              debug: anton.debug(),
            }
          : {}),
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      return c.json({ error: "Failed to analyze image" }, 500);
    }
  }
);

imageRouter.post(
  "/generate",
  zValidator("json", generateImageSchema),
  async (c) => {
    try {
      const {
        prompt,
        model = "dall-e-3",
        debug,
        rephrase,
      } = await c.req.valid("json");

      const imageService = createImageService();

      let response;
      if (model === "leonardoai") {
        response = await imageService.generateImageWithLeonardo({
          prompt,
          negative_prompt: "",
          // @ts-ignore
          nsfw: true,
          num_images: 1,
          width: 1280,
          height: 1920,
          num_inference_steps: 10,
          contrast: 3.5,
          guidance_scale: 15,
          sd_version: "PHOENIX",
          modelId: "6b645e3a-d64f-4341-a6d8-7a3690fbf042",
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
          ultra: false,
        });
      } else {
        response = await imageService.generateImageWithDallE3({
          prompt,
        });
      }

      if (rephrase) {
        const chatService = createChatService();
        const rephraseResponse = await chatService.rephrase(
          {
            user_request: (response as any).revisedPrompt ?? prompt,
            your_answer: response?.imageUrl ?? "ERROR: No image created",
          },
          {
            debug: imageService.debug,
          }
        );

        return c.json({
          data: rephraseResponse,
          ...(debug
            ? {
                debug: imageService.debug,
              }
            : {}),
        });
      }

      return c.json({
        data: response,
        ...(debug
          ? {
              debug: imageService.debug,
            }
          : {}),
      });
    } catch (error) {
      console.error("Error generating image:", error);
      return c.json({ error: "Failed to generate image" }, 500);
    }
  }
);

imageRouter.post(
  "/improve-prompt",
  zValidator("json", improvePromptSchema),
  async (c) => {
    try {
      const { prompt, debug } = await c.req.valid("json");

      const anton = AntonSDK.create({
        model: "gpt-4o-mini",
        apiKey: config.OPENAI_API_KEY,
        type: "openai",
      });

      anton.setSystemMessage?.(improvePromptPrompt);

      const response = await anton.chat({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      return c.json({
        response,
        ...(debug
          ? {
              debug: anton.debug(),
            }
          : {}),
      });
    } catch (error) {
      console.error("Error generating image:", error);
      return c.json({ error: "Failed to generate image" }, 500);
    }
  }
);

export default imageRouter;
