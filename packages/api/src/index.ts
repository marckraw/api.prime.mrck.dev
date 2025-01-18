import { serve } from "@hono/node-server";
import { Context, Hono } from "hono";
import { logger } from "hono/logger";
import { config } from "./config.env";
import apiRouter from "./routes/api";
import { pinoLogger } from "./middleware/pino-logger";
import { prettyJSON } from "hono/pretty-json";
import { cors } from "hono/cors";
import { errorHandler } from "./middleware/error";
import { bodyLimit } from "./middleware/upload";
import { rateLimit } from "./middleware/rate-limit";
import placeholderRouter from "./routes/api/placeholder/placeholder";

const app = new Hono();
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", pinoLogger());
app.use(
  "/*",
  cors({
    origin: [
      "https://plugins.storyblok.com",
      "http://localhost:8080",
      "http://localhost:5173",
      "https://localhost:8080",
      "https://apiprimemrckdev-production.up.railway.app",
      "https://prime.mrck.dev",
      "https://do-not-talk-about-this.vercel.app",
    ], // Add your frontend URL
    allowMethods: ["POST", "GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    maxAge: 600,
    credentials: true,
  })
);
app.use("*", errorHandler());
app.use(
  "*", // Limit of the upload file size
  bodyLimit({
    maxSize: 50 * 1024 * 1024, // 50MB
    onError: (c: Context) => c.text("File too large", 413),
  })
);
app.use(
  "*",
  rateLimit({
    max: 50, // 50 requests
    window: 60, // per 60 seconds
    message: "Rate limit exceeded. Please try again later.",
  })
);

app.route("/api", apiRouter);
app.route("/placeholder", placeholderRouter);

export type AppType = typeof app;

const port = parseInt(config.PORT) || 3000;

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server is running on port ${port}`);
