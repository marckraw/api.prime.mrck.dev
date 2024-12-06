import {Context, MiddlewareHandler} from 'hono';

interface BodyLimitOptions {
  maxSize: number;
  onError?: (c: Context) => Response | Promise<Response>;
}

export const bodyLimit = (options: BodyLimitOptions): MiddlewareHandler => {
  return async (c, next) => {
    const contentLength = Number(c.req.header('content-length')) || 0;

    if (contentLength > options.maxSize) {
      if (options.onError) {
        return options.onError(c);
      }
      return c.text('Payload Too Large', 413);
    }

    await next();
  };
};
