import {z} from "zod";

export const chatRequestSchema = z
    .object({
        messages: z.array(
            z.object({
                role: z.enum(["user", "system", "assistant"]),
                content: z.string(),
            })
                .strict()
        ),
        systemMessage: z.string().optional(),
    })
    .strict();

export const chatStreamRequestSchema = chatRequestSchema