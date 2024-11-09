import {z} from "zod";

export const agiRequestSchema = z
    .object({
        messages: z.array(
            z.object({
                role: z.enum(["user", "system", "assistant"]),
                content: z.string(),
            })
                .strict()
        ),
        model: z.object({
            company: z.enum(["openai", "anthropic"]),
            model: z.string(),
        }).optional(),
        debug: z.boolean().optional(),
        conversationId: z.string().optional(),
        systemMessage: z.string().optional(),
    })
    .strict();

export const agiStreamRequestSchema = agiRequestSchema
