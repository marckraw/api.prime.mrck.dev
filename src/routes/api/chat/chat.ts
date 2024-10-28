import {Hono} from "hono";
import {streamText, stream} from 'hono/streaming'
import {AntonSDK} from "@mrck-labs/anton-sdk";
import {zValidator} from "@hono/zod-validator";
import {chatRequestSchema, chatStreamRequestSchema} from "./validators/chat";

const chatRouter = new Hono()

chatRouter.post('/',
    zValidator('json', chatRequestSchema),
    async (c) => {
        const requestData = c.req.valid('json');

        const anton = AntonSDK.create({
            model: "claude-3-5-sonnet-20240620",
            apiKey: process.env.ANTHROPIC_API_KEY as string,
            type: "anthropic",
        });

        const response = await anton.chat({
            messages: requestData.messages,
        });

        return c.json({response});
    }
)



chatRouter.post('/stream', zValidator('json', chatRequestSchema), (c) => {
    const requestData = c.req.valid('json');
    return stream(c, async (stream) => {
        try {
            const anton = AntonSDK.create({
                model: "claude-3-5-sonnet-20240620",
                apiKey: process.env.ANTHROPIC_API_KEY as string,
                type: "anthropic",
            });
            const message = await anton.chat({
                messages: requestData.messages,
                stream: true
            })

            for await (const chunk of message) {
                const text = chunk.toString()
                // console.log("Chunk: ", text)
                const lines = text.split('\n').filter(line => line.trim() !== '')
                console.log("Lines: ", lines)
                let finalText = ""
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6)) as any

                            console.log("##")
                            console.log(data)
                            console.log("##")
                            
                            switch (data.type) {
                                case 'content_block_delta':
                                    finalText += data.delta.text
                                    // console.log(finalText)
                                    await stream.write(data.delta.text)
                                    break
                                case 'message_start':
                                case 'content_block_start':
                                case 'message_stop':
                                    // Skip these events
                                    break
                            }
                        } catch (e) {
                            console.error('Failed to parse chunk data:', e)
                        }
                    }
                }
            }
            await stream.write('data: [DONE]\n\n')
        } catch (error) {
            // Send error event
            await stream.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`)
        }
        await stream.close()
    })
})

    //   for (let i = 0; i < 10; i++) {
    //     const message = {
    //       id: i,
    //       text: `Message ${i}`,
    //       timestamp: new Date().toISOString()
    //     }
        
    //     stream.write(`data: ${JSON.stringify(message)}\n\n`)
    //     await new Promise(resolve => setTimeout(resolve, 1000))
    //   }

export default chatRouter