import {z} from "zod";

export const googleSchema = z
    .object({
        name: z.string(),
    })
    .strict();
