import {z} from "zod";

export const agiRequestSchema = z
    .object({
        intention: z.string().optional(),
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
        channel: z.string().optional(),
        conversationId: z.string().optional(),
        systemMessage: z.string().optional(),
    })
    .strict();

export const agiResponseSchema = z
    .object({
        intention: z.string().optional(),
        data: z.object({
            messages: z.array(
                z.object({
                    role: z.enum(["user", "system", "assistant"]),
                    content: z.string(),
                })
                    .strict()
            )
        })
    })
    .strict();

export type AgiResponse = z.infer<typeof agiResponseSchema>;

export const agiStreamRequestSchema = agiRequestSchema
