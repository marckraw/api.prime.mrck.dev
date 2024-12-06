import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

interface RateLimitOptions {
  max: number;        // maximum requests
  window: number;     // time window in seconds
  message?: string;   // custom error message
}

interface RateLimitInfo {
  count: number;
  reset: number;
}

const store = new Map<string, RateLimitInfo>();

export const rateLimit = (options: RateLimitOptions) => {
  const { max, window: windowSeconds, message = 'Too many requests' } = options;

  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const key = `${ip}`;
    const now = Date.now();
    
    const resetTime = now + (windowSeconds * 1000);
    let info = store.get(key);

    if (!info || now > info.reset) {
      info = { count: 0, reset: resetTime };
    }

    if (info.count >= max) {
      c.header('X-RateLimit-Limit', max.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', Math.ceil(info.reset / 1000).toString());
      
      throw new HTTPException(429, { message });
    }

    info.count++;
    store.set(key, info);

    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', (max - info.count).toString());
    c.header('X-RateLimit-Reset', Math.ceil(info.reset / 1000).toString());

    await next();
  };
}; 