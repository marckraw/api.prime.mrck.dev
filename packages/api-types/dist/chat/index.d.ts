import { z } from 'zod';
export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
}
export declare const chatMessageSchema: z.ZodObject<{
    id: z.ZodString;
    content: z.ZodString;
    role: z.ZodEnum<["user", "assistant"]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    content: string;
    role: "user" | "assistant";
}, {
    id: string;
    content: string;
    role: "user" | "assistant";
}>;
