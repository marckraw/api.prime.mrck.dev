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
    })
    .strict();

export const chatStreamRequestSchema = chatRequestSchema