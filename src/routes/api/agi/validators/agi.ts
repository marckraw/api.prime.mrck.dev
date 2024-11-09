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
        conversationId: z.string().optional(),
        systemMessage: z.string().optional(),
    })
    .strict();

export const agiStreamRequestSchema = agiRequestSchema
