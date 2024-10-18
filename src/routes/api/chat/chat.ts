import {Hono} from "hono";
import {streamText} from 'hono/streaming'
import {AntonSDK} from "@mrck-labs/anton-sdk";
import {zValidator} from "@hono/zod-validator";
import {chatRequestSchema} from "./validators/chat";

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

chatRouter.get('/stream', (c) => {
    return streamText(c, async (stream) => {
        // Write a text with a new line ('\n').
        await stream.writeln('Hello')
        // Wait 1 second.
        await stream.sleep(1000)
        // Write a text without a new line.
        await stream.write(`Hono!`)
        await stream.sleep(2000)
        await stream.writeln('Other stuff!')
        await stream.sleep(4000)
        await stream.write('Final!')
    })
})

export default chatRouter