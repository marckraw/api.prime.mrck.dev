import {Hono} from "hono";
import {streamText, stream} from 'hono/streaming'
import {AntonSDK} from "@mrck-labs/anton-sdk";
import {zValidator} from "@hono/zod-validator";
import {chatRequestSchema, chatStreamRequestSchema} from "./validators/chat";
import { mainSystemMessage } from "../../../anton-config/config";
import { config } from "../../../config.env";
import { request } from "http";

const chatRouter = new Hono()

chatRouter.post('/',
    zValidator('json', chatRequestSchema),
    async (c) => {
        const requestData = c.req.valid('json');

        const anton = AntonSDK.create({
            model: "claude-3-5-sonnet-20240620",
            apiKey: config.ANTHROPIC_API_KEY,
            type: "anthropic",
        });

        if (anton) {
            if (requestData.systemMessage) {
                anton.setSystemMessage?.(requestData.systemMessage)
            } else {
                anton.setSystemMessage?.(mainSystemMessage)
            }
        }

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
            let anton;
            if(requestData.model?.company === "anthropic") {
                anton = AntonSDK.create({
                    model: "claude-3-5-sonnet-20240620",
                    apiKey: config.ANTHROPIC_API_KEY,
                    type: "anthropic",
                });
            } else {
                anton = AntonSDK.create({
                    model: requestData?.model?.model as any || 'gpt-4o',
                    apiKey: config.OPENAI_API_KEY,
                    type: "openai",
                });    
            }


            if (anton) {
                if (requestData.systemMessage) {
                    anton.setSystemMessage?.(requestData.systemMessage)
                } else {
                    anton.setSystemMessage?.(mainSystemMessage)
                }
            }
            const message = await anton.chat({
                messages: requestData.messages,
                stream: true
            })

            let finalText = ""
            for await (const chunk of message) {
                const text = chunk.toString()
                const lines = text.split('\n').filter((line: string) => line.trim() !== '')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        if(line.includes("[DONE]")) {
                            break;
                        }

                        try {
                            const data = JSON.parse(line.slice(6)) as any

                            if(requestData.model?.company === "anthropic") {
                                switch (data.type) {
                                    case 'content_block_delta':
                                        finalText += data.delta.text
                                        await stream.write(data.delta.text)
                                        break
                                    case 'message_start':
                                    case 'content_block_start':
                                    case 'message_stop':
                                        // Skip these events
                                        break
                                }
                            } else {
                                if (data.choices[0].delta.content) {
                                    finalText += data.choices[0].delta.content;
                                    await stream.write(data.choices[0].delta.content);
                                } else if (data.choices[0].finish_reason === 'stop') {
                                    break;
                                }
                            }
                        } catch (e) {
                            console.error('Failed to parse chunk data:', e)
                        }
                    }
                }
            }
            console.log("Final streamed text: ", finalText)
            await stream.write('data: [DONE]\n\n')
        } catch (error) {
            // Send error event
            await stream.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`)
        }
        await stream.close()
    })
})

export default chatRouter