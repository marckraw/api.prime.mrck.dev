import {Hono} from "hono";
import {AntonSDK} from "@mrck-labs/anton-sdk";
import {z} from "zod";

// Define a more strict schema for the request body
export const messageSchema = z
    .object({
        role: z.enum(["user", "system", "assistant"]),
        content: z.string(),
    })
    .strict();

export const requestSchema = z
    .object({
        messages: z.array(messageSchema),
    })
    .strict();

// Infer the TypeScript type from the Zod schema
export type RequestBody = z.infer<typeof requestSchema>;


const chatRouter = new Hono()

chatRouter.post('/', async (c) => {
    const requestData = await c.req.json()

    try {
        const validatedData: RequestBody = requestSchema.parse(requestData);

        const anton = AntonSDK.create({
            model: "claude-3-5-sonnet-20240620",
            apiKey: process.env.ANTHROPIC_API_KEY as string,
            type: "anthropic",
        });

        const response = await anton.chat({
            messages: validatedData.messages,
        });

        return c.json({response});
    } catch (e) {
        if (e instanceof z.ZodError) {
            return c.json(
                {error: "Invalid request body", details: e.errors},
                {status: 400},
            );
        }
    }
})

export default chatRouter