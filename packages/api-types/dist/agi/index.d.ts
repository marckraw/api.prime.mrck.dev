import { z } from "zod";
export interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
}
export declare const apiResponseSchema: <T extends z.ZodType>(dataSchema: T) => z.ZodObject<{
    data: T;
    status: z.ZodNumber;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, { [k in keyof z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    data: T;
    status: z.ZodNumber;
    message: z.ZodString;
}>, any>]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    data: T;
    status: z.ZodNumber;
    message: z.ZodString;
}>, any>[k]; }, { [k_1 in keyof z.baseObjectInputType<{
    data: T;
    status: z.ZodNumber;
    message: z.ZodString;
}>]: z.baseObjectInputType<{
    data: T;
    status: z.ZodNumber;
    message: z.ZodString;
}>[k_1]; }>;
