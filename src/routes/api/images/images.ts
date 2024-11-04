import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { analyzeImageSchema } from './validators/images'
import { config } from '../../../config.env'

const imageRouter = new Hono()

imageRouter.post('/analyze', zValidator('json', analyzeImageSchema), async (c) => {
  try {
    const { imageUrl, base64Image } = await c.req.valid('json')
    
    const imageContent = {
      type: "image" as const,
      source: imageUrl 
        ? {
            type: "url" as const,
            url: imageUrl
          }
        : {
            type: "base64" as const,
            media_type: "image/jpeg",
            data: base64Image!
          }
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this image and suggest a detailed alt text description that would be useful for accessibility. The description should be concise but informative, capturing the key elements and context of the image."
              },
              imageContent
            ]
          }
        ]
      })
    })

    const data = await response.json()
    
    return c.json({
      suggestedAltText: data.content[0].text,
    })

  } catch (error) {
    console.error('Error analyzing image:', error)
    return c.json({ error: 'Failed to analyze image' }, 500)
  }
})

export default imageRouter