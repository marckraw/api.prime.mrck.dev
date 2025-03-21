import { Hono } from "hono";
import { streamText, stream } from "hono/streaming";
import { AntonSDK } from "@mrck-labs/anton-sdk";
import { zValidator } from "@hono/zod-validator";
import { chatRequestSchema, chatStreamRequestSchema } from "./validation/ai";
import { mainSystemMessage } from "../../../anton-config/config";
import { config } from "../../../config.env";
import { AgiRequest, agiRequestSchema } from "./validation/agi";
import { createIntentionValidator } from "../../../services/IntentionValidator/IntentionValidator";
import { intentionValidationSchema } from "./prompts/intentionValidationPrompts";
import { IntentionValidationResponse } from "./prompts/intentionValidationPrompts";
import { z } from "zod";
import { executeAction } from "../../../services/action";
import { ChatResponse, AgiResponse } from "@mrck-labs/api.prime.mrck.dev";
import { createChatService } from "../../../services/conversation";

const aiRouter = new Hono();

const validateIntention = async (
  requestData: AgiRequest
): Promise<IntentionValidationResponse> => {
  const intentionValidator = createIntentionValidator();

  try {
    const intentionValidationResponse =
      await intentionValidator.validateAndClassify({
        messages: requestData.messages,
      });

    const parsedIntentionValidationResponse = JSON.parse(
      (intentionValidationResponse as any)[0].content
    );

    // Validate the response with Zod schema
    const validatedResponse = intentionValidationSchema.parse(
      parsedIntentionValidationResponse
    );

    return validatedResponse;
  } catch (error) {
    console.error("Error in validateIntention:", error);

    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.errors
          .map((e: any) => e.message)
          .join(", ")}`
      );
    }

    throw new Error("Failed to validate intention");
  }
};

aiRouter.post("/agi", zValidator("json", agiRequestSchema), async (c) => {
  try {
    const requestData = c.req.valid("json");
    const parsedIntentionValidationResponse = await validateIntention(
      requestData
    );

    if (parsedIntentionValidationResponse.suggestedAction) {
      const { suggestedAction } = parsedIntentionValidationResponse;
      try {
        const responseFromAction = await executeAction(suggestedAction, {
          requestData,
          intention: parsedIntentionValidationResponse,
        });

        // TODO: create an rephrase service which will take the response and rephrase it to a more human readable format
        const chatService = createChatService();
        const response = await chatService.rephrase(
          {
            user_request: parsedIntentionValidationResponse.originalMessage,
            your_answer: responseFromAction.messages[0].content,
          },
          {
            parsedIntentionValidationResponse,
            requestData,
          }
        );
        console.log("This is response from rephrase: ");
        console.log(response);

        const agiResponse: AgiResponse = {
          success: true,
          data: {
            messages: response.messages || [],
            conversationId: responseFromAction.conversationId,
            suggestedAction,
            ...(requestData.debug
              ? {
                  debug: responseFromAction.debug,
                  channel: requestData.channel,
                  intentionValidation: parsedIntentionValidationResponse,
                }
              : {}),
          },
        };

        return c.json(agiResponse);
      } catch (error) {
        return c.json(
          {
            success: false,
            error: {
              message: (error as any).message,
              code: (error as any).code || "EXECUTION_ERROR",
            },
          },
          (error as any).status || 500
        );
      }
    }

    return c.json({
      success: true,
      data: {
        messages: [
          {
            role: "assistant",
            content: "No action suggested",
          },
        ],
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          message: (error as any).message,
          code: "INTERNAL_ERROR",
        },
      },
      500
    );
  }
});

aiRouter.post("/chat", zValidator("json", chatRequestSchema), async (c) => {
  try {
    const requestData = c.req.valid("json");
    const anton = AntonSDK.create({
      model: "gpt-4o-mini",
      apiKey: config.OPENAI_API_KEY,
      type: "openai",
    });

    if (anton) {
      if (requestData.systemMessage) {
        console.log("#####################");
        console.log("#####################");
        console.log("#####################");
        console.log(requestData.systemMessage);
        console.log("#####################");
        console.log("#####################");
        console.log("#####################");
        anton.setSystemMessage?.(requestData.systemMessage);
      } else {
        anton.setSystemMessage?.(mainSystemMessage);
      }
    }

    const response = await anton.chat({
      messages: requestData.messages,
    });

    const chatResponse: ChatResponse = {
      success: true,
      data: {
        messages: [
          {
            role: "assistant",
            content: (response as any)[0].content,
          },
        ],
      },
    };

    return c.json(chatResponse);
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          message: (error as any).message,
          code: "CHAT_ERROR",
        },
      },
      500
    );
  }
});

aiRouter.post("/stream", zValidator("json", chatRequestSchema), (c) => {
  const requestData = c.req.valid("json");

  return stream(c, async (stream) => {
    try {
      let anton;
      if (requestData.model?.company === "anthropic") {
        anton = AntonSDK.create({
          model: "claude-3-5-sonnet-20240620",
          apiKey: config.ANTHROPIC_API_KEY,
          type: "anthropic",
        });
      } else {
        anton = AntonSDK.create({
          model: (requestData?.model?.model as any) || "gpt-4o",
          apiKey: config.OPENAI_API_KEY,
          type: "openai",
        });
      }

      if (anton) {
        if (requestData.systemMessage) {
          anton.setSystemMessage?.(requestData.systemMessage);
        } else {
          anton.setSystemMessage?.(mainSystemMessage);
        }
      }
      const message = await anton.chat({
        messages: requestData.messages,
        stream: true,
      });

      let finalText = "";
      for await (const chunk of message) {
        const text = chunk.toString();
        const lines = text
          .split("\n")
          .filter((line: string) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            if (line.includes("[DONE]")) {
              break;
            }

            try {
              const data = JSON.parse(line.slice(6)) as any;

              if (requestData.model?.company === "anthropic") {
                switch (data.type) {
                  case "content_block_delta":
                    finalText += data.delta.text;
                    await stream.write(data.delta.text);
                    break;
                  case "message_start":
                  case "content_block_start":
                  case "message_stop":
                    // Skip these events
                    break;
                }
              } else {
                if (data.choices[0].delta.content) {
                  finalText += data.choices[0].delta.content;
                  await stream.write(data.choices[0].delta.content);
                } else if (data.choices[0].finish_reason === "stop") {
                  break;
                }
              }
            } catch (e) {
              console.error("Failed to parse chunk data:", e);
            }
          }
        }
      }
      console.log("Final streamed text: ", finalText);
      await stream.write("data: [DONE]\n\n");
    } catch (error) {
      // Send error event
      await stream.write(
        `data: ${JSON.stringify({ error: "Stream error occurred" })}\n\n`
      );
    }
    await stream.close();
  });
});

export default aiRouter;
