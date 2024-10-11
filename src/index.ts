import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { AntonSDK } from "@mrck-labs/anton-sdk";
import { z } from "zod";
import { config } from './config.env'

// Define a more strict schema for the request body
const messageSchema = z
    .object({
      role: z.enum(["user", "system", "assistant"]),
      content: z.string(),
    })
    .strict();

const requestSchema = z
    .object({
      messages: z.array(messageSchema),
    })
    .strict();

// Infer the TypeScript type from the Zod schema
type RequestBody = z.infer<typeof requestSchema>;

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/test', (c) => {
  return c.json({ message: 'Message man!. Hello Hono!' })
})

app.post('/chat', async (c) => {
  const requestData = await c.req.json()
  console.log("whatecer")

  try {
    const validatedData: RequestBody = requestSchema.parse(requestData);

    const anton = AntonSDK.create({
      model: "claude-3-5-sonnet-20240620",
      apiKey: process.env.ANTHROPIC_API_KEY as string,
      type: "anthropic",
    });

    const response = await anton.chat({
      messages: validatedData.messages,
    });

    return c.json({response});
  } catch (e) {
    if (e instanceof z.ZodError) {
      return c.json(
          {error: "Invalid request body", details: e.errors},
          {status: 400},
      );
    }
  }
})


  // try {
  //   const requestData = await request.json();
  //
  //   // Validate the request body against the schema
  //   const validatedData: RequestBody = requestSchema.parse(requestData);
  //
  //   const anton = AntonSDK.create({
  //     model: "claude-3-5-sonnet-20240620",
  //     apiKey: process.env.ANTHROPIC_API_KEY as string,
  //     type: "anthropic",
  //   });
  //
  //   const response = await anton.chat({
  //     messages: validatedData.messages,
  //   });
  //
  //   return Response.json(response);
  // } catch (e) {
  //   if (e instanceof z.ZodError) {
  //     logger.error("Invalid request body:", e.errors);
  //     return Response.json(
  //         { error: "Invalid request body", details: e.errors },
  //         { status: 400 },
  //     );
  //   }

const port = parseInt(config.PORT) || 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
