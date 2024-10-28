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

chatRouter.post('/stream', zValidator('json', chatRequestSchema),
    async (c) => {
    // return stream(c, async (stream) => {
    //     const requestData = c.req.valid('json');
    //
        const anton = AntonSDK.create({
            model: "claude-3-5-sonnet-20240620",
            apiKey: process.env.ANTHROPIC_API_KEY as string,
            type: "anthropic",
        });
    //
    //
    //     const response = await anton.chat({
    //         messages: requestData.messages,
    //         // @ts-ignore
    //         stream: true
    //     });
    //
    //
    //     // Write a text with a new line ('\n').
    //     await stream.writeln('Hello')
    //     // Wait 1 second.
    //     await stream.sleep(1000)
    //     // Write a text without a new line.
    //     await stream.write(`Hono!`)
    //     await stream.sleep(2000)
    //     await stream.writeln('Other stuff!')
    //     await stream.sleep(4000)
    //     await stream.write('Final!')
    // })

        return stream(c, async (stream) => {
            const requestData = c.req.valid('json');

            const anton = AntonSDK.create({
                model: "claude-3-5-sonnet-20240620",
                apiKey: process.env.ANTHROPIC_API_KEY as string,
                type: "anthropic",
            });

            try {
                const message = await anton.chat({
                    messages: requestData.messages,
                    stream: true
                })

                for await (const chunk of message) {
                    const text = chunk.toString()
                    const lines = text.split('\n').filter(line => line.trim() !== '')
                    let finalText = ""
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6)) as any
                                
                                switch (data.type) {
                                    case 'content_block_delta':
                                        finalText += data.delta.text
                                        console.log(finalText)
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

export default chatRouter