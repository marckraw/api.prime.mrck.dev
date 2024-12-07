"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatMessageSchema = void 0;
const zod_1 = require("zod");
exports.chatMessageSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    content: zod_1.z.string(),
    role: zod_1.z.enum(['user', 'assistant'])
});
