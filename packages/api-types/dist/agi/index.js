"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiResponseSchema = void 0;
const zod_1 = require("zod");
const apiResponseSchema = (dataSchema) => zod_1.z.object({
    data: dataSchema,
    status: zod_1.z.number(),
    message: zod_1.z.string()
});
exports.apiResponseSchema = apiResponseSchema;
