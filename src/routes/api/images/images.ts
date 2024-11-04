import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { analyzeImageSchema } from './validators/images'
import { config } from '../../../config.env'
import { AntonSDK } from '@mrck-labs/anton-sdk'
import { altTextExtractingPrompt } from '../../../anton-config/config'

const imageRouter = new Hono()


async function getImageAsBase64(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return buffer.toString('base64')
  }

imageRouter.post('/analyze', zValidator('json', analyzeImageSchema), async (c) => {
  try {
    const { imageUrl } = await c.req.valid('json')    

    const convertedBase64Image = await getImageAsBase64(imageUrl as string)

    const anton = AntonSDK.create({
        model: "claude-3-5-sonnet-20240620",
        apiKey: config.ANTHROPIC_API_KEY,
        type: "anthropic",
    });

    const response = await anton.chat({
        messages: [
            {
              role: "user",
              // @ts-ignore
              content: [
                {
                    type: "image",
                    source: {
                        type: "base64",
                        media_type: "image/jpeg",
                        data: convertedBase64Image,
                    },
                },
                {
                  type: "text",
                  text: altTextExtractingPrompt
                },
              ]
            }
          ],
    });
    
    return c.json({
      suggestedAltText: (response as any)[0].content
    })

  } catch (error) {
    console.error('Error analyzing image:', error)
    return c.json({ error: 'Failed to analyze image' }, 500)
  }
})

export default imageRouter