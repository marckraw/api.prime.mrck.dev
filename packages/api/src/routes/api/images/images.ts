import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { analyzeImageSchema, generateImageSchema, improvePromptSchema } from './validators/images'
import { config } from '../../../config.env'
import { AntonSDK } from '@mrck-labs/anton-sdk'
import { altTextExtractingPrompt } from '../../../anton-config/config'
import { improvePromptPrompt } from './prompts'

const imageRouter = new Hono()

export const getImageAsBase64 = async (imageUrl: string): Promise<string> => {
    const response = await fetch(imageUrl)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return buffer.toString('base64')
  }

  const imageContent = async ({imageUrl, company}: {imageUrl: string, company: string}) => {
    if (company === "openai") {
      return {
        "type": "image_url",
        "image_url": {
          "url": imageUrl
        }
      }
    } else if (company === "anthropic") {
      const convertedBase64Image = await getImageAsBase64(imageUrl as string)
      return {
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: convertedBase64Image,
        },
      }
    }
  }

imageRouter.post('/analyze', zValidator('json', analyzeImageSchema), async (c) => {
  try {
    const { imageUrl, model, debug } = await c.req.valid('json')

    let anton;
    if(model) {
      if(model.company === "anthropic") {
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

  const imageContentData = await imageContent({imageUrl, company: model?.company || "openai"})

    const response = await anton.chat({
        messages: [
            {
              role: "user",
              // @ts-ignore
              content: [
                imageContentData,
                {
                  type: "text",
                  text: altTextExtractingPrompt
                },
              ]
            }
          ],
    });
    
    return c.json({
      suggestedAltText: (response as any)[0].content,
      ...(debug ? {
        debug: anton.debug(),
    } : {})
    })

  } catch (error) {
    console.error('Error analyzing image:', error)
    return c.json({ error: 'Failed to analyze image' }, 500)
  }
})

imageRouter.post('/generate', zValidator('json', generateImageSchema), async (c) => {
  try {
    const { prompt, model = "dall-e-3", debug } = await c.req.valid('json')    

    const anton = AntonSDK.create({
          model: "gpt-4o-mini",
          apiKey: config.OPENAI_API_KEY,
          type: "openai",
          supportedModelsApiKeys: {
            leonardoAI: config.LEONARDOAI_API_KEY
          }
      });


      let response;
      if(model === "leonardoai") {
        response = await anton.createImageWithLeonardo({
          prompt,
          alchemy: true,
          height: 512,
          modelId: "6b645e3a-d64f-4341-a6d8-7a3690fbf042", // leonardo phoenix
          num_images: 1,
          // @ts-ignore
          presetStyle: "CINEMATIC",
          width: 512
        })
      } else {
        response = await anton.createImage({
          prompt,
          model: 'dall-e-3'
        })
      }
    
    return c.json({
      response,
      ...(debug ? {
        debug: anton.debug(),
    } : {})
    })

  } catch (error) {
    console.error('Error generating image:', error)
    return c.json({ error: 'Failed to generate image' }, 500)
  }
})

imageRouter.post('/improve-prompt', zValidator('json', improvePromptSchema), async (c) => {
  try {
    const { prompt, debug } = await c.req.valid('json')    

    const anton = AntonSDK.create({
          model: "gpt-4o-mini",
          apiKey: config.OPENAI_API_KEY,
          type: "openai",
      });


      anton.setSystemMessage?.(improvePromptPrompt)

      const response = await anton.chat({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    
    return c.json({
      response,
      ...(debug ? {
        debug: anton.debug(),
    } : {})
    })

  } catch (error) {
    console.error('Error generating image:', error)
    return c.json({ error: 'Failed to generate image' }, 500)
  }
})


export default imageRouter