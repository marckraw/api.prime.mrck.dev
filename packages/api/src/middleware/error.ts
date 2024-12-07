import {Context, MiddlewareHandler} from 'hono';
import {HTTPException} from 'hono/http-exception';
import {z} from 'zod';

interface ErrorResponse {
    success: false;
    message: string;
    details?: unknown;
  }

export const errorHandler = (): MiddlewareHandler => async (c, next) => {
  try {
    await next();
  } catch (error: any) {
    console.error('Unhandled error:', error);

    const response: ErrorResponse = {
      success: false,
      message: 'Internal Server Error',
    };

    if (error instanceof z.ZodError) {
      response.message = 'Validation Error';
      response.details = error.errors;
      return c.json(response, 400);
    }

    if (error instanceof HTTPException) {
      response.message = error.message;
      return c.json(response, error.status);
    }

    return c.json(response, 500);
  }
};
