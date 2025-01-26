import { mainSystemMessage } from "../anton-config/config";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { conversations } from "../db/schema/conversations";
import { messages } from "../db/schema/conversations";
import {
  actions,
  IntentionValidationResponse,
} from "../routes/api/ai/prompts/intentionValidationPrompts";
import { createImageService } from "./images";
import { AgiRequest } from "../routes/api/ai/validation/agi";
import { config } from "../config.env";
import { AntonSDK } from "@mrck-labs/anton-sdk";
import { AgiResponse } from "@mrck-labs/api.prime.mrck.dev";

export const executeAction = async (
  action: (typeof actions)[number],
  payload: { intention: IntentionValidationResponse; requestData: AgiRequest }
): Promise<
  Omit<AgiResponse["data"], "suggestedAction" | "intentionValidation">
> => {
  switch (action) {
    case "create_image": {
      const imageService = createImageService();
      const imageResponse = await imageService.generateImageWithImprovedPrompt({
        prompt: payload.intention.originalMessage,
      });
      return {
        messages: [
          {
            role: "assistant",
            content: imageResponse.imageUrl ?? "ERROR: No image created",
          },
        ],
        debug: payload.requestData.debug ? imageResponse : undefined,
        channel: payload.requestData.channel,
      };
    }
    case "chat": {
      let conversation;
      let existingMessages: any[] = [];

      if (payload.requestData.conversationId) {
        const [existingConversation] = await db
          .select()
          .from(conversations)
          .where(
            eq(conversations.id, parseInt(payload.requestData.conversationId))
          );

        if (!existingConversation) {
          throw new Error("Conversation not found");
        }

        conversation = existingConversation;
        existingMessages = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversation.id));
      } else {
        const [newConversation] = await db
          .insert(conversations)
          .values({
            systemMessage:
              payload.requestData.systemMessage || mainSystemMessage,
          })
          .returning();
        conversation = newConversation;
      }

      await db.insert(messages).values(
        payload.requestData.messages.map((msg) => ({
          conversationId: conversation.id,
          role: msg.role,
          content: msg.content,
        }))
      );

      let anton;
      if (payload.requestData.model) {
        if (payload.requestData.model.company === "anthropic") {
          anton = AntonSDK.create({
            model: payload.requestData.model.model,
            apiKey: config.ANTHROPIC_API_KEY,
            type: "anthropic",
          });
        } else {
          anton = AntonSDK.create({
            model: payload.requestData.model.model,
            apiKey: config.OPENAI_API_KEY,
            type: "openai",
          });
        }
      } else {
        anton = AntonSDK.create({
          model: "gpt-4o",
          apiKey: config.OPENAI_API_KEY,
          type: "openai",
        });
      }

      if (anton) {
        if (payload.requestData.systemMessage) {
          anton.setSystemMessage?.(payload.requestData.systemMessage);
        } else {
          anton.setSystemMessage?.(
            conversation.systemMessage || mainSystemMessage
          );
        }
      }

      const allMessages = [
        ...existingMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        ...payload.requestData.messages,
      ];

      const response = await anton.chat({
        messages: allMessages,
      });

      await db.insert(messages).values({
        conversationId: conversation.id,
        role: "assistant",
        content: (response as any)[0].content,
      });

      return {
        messages: [
          {
            role: "assistant",
            content: (response as any)[0].content,
          },
        ],
        conversationId: conversation.id.toString(),
        debug: payload.requestData.debug ? anton.debug?.() : undefined,
        channel: payload.requestData.channel,
      };
    }
    default:
      throw new Error("Action not found");
  }
};
