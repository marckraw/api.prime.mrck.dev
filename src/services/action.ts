import { mainSystemMessage } from "../anton-config/config"
import { db } from "../db"
import { eq } from "drizzle-orm";
import { conversations } from "../db/schema/conversations"
import { messages } from "../db/schema/conversations"
import { actions, IntentionValidationResponse } from "../routes/api/ai/prompts/intentionValidationPrompts"
import { createChatService } from "./conversation"
import { createImageService } from "./images"
import { AgiRequest, AgiResponse } from "../routes/api/ai/validation/agi";
import { config } from "../config.env";
import { AntonSDK } from "@mrck-labs/anton-sdk";

export const executeAction = async (action: (typeof actions)[number], payload: {intention: IntentionValidationResponse, requestData: AgiRequest}) => {
    switch(action) {
        case "create_image": {
            const imageService = createImageService()
            const imageResponse = await imageService.generateImageWithImprovedPrompt({
                prompt: payload.intention.originalMessage,
            })
            return imageResponse
        }
        case "chat": {
            console.log("This is chat")
            console.log({action, payload})

            let conversation;
            let existingMessages: any[] = [];

            if (payload.requestData.conversationId) {
                console.log("Getting existing conversation")
                // Get existing conversation and messages
                const [existingConversation] = await db
                    .select()
                    .from(conversations)
                    .where(eq(conversations.id, parseInt(payload.requestData.conversationId)));

                if (!existingConversation) {
                    return { error: "Conversation not found", statusCode: 404 }
                }

                conversation = existingConversation;
                existingMessages = await db
                    .select()
                    .from(messages)
                    .where(eq(messages.conversationId, conversation.id));
            } else {
                // Create a new conversation
                const [newConversation] = await db.insert(conversations).values({
                    systemMessage: payload.requestData.systemMessage || mainSystemMessage,
                }).returning();
                conversation = newConversation;
            }

            // Insert new messages
            await db.insert(messages).values(
                payload.requestData.messages.map((msg) => ({
                    conversationId: conversation.id,
                    role: msg.role,
                    content: msg.content,
                }))
            );

            let anton;
            if(payload.requestData.model) {
                if(payload.requestData.model.company === "anthropic") {
                    anton = AntonSDK.create({
                    model: payload.requestData.model.model as any,
                    apiKey: config.ANTHROPIC_API_KEY,
                    type: "anthropic",
                });
            } else {
                anton = AntonSDK.create({
                    model: payload.requestData.model.model as any,
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
                    anton.setSystemMessage?.(payload.requestData.systemMessage)
                } else {
                    anton.setSystemMessage?.(conversation.systemMessage || mainSystemMessage)
                }
            }

            // Combine existing messages with new messages for the chat
        const allMessages = [
            ...existingMessages.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
                ...payload.requestData.messages
            ];

                const response = await anton.chat({
                    messages: allMessages,
                });
    
                // Save the assistant's response
                await db.insert(messages).values({
                    conversationId: conversation.id,
                    role: 'assistant',
                    content: (response as any)[0].content,
                });
    
    
                return {
                    conversationId: conversation.id,
                    data: {
                        messages: response
                    },
                    ...(payload.requestData.debug ? {
                        debug: anton.debug(),
                        channel: payload.requestData.channel,
                        intentionValidation: payload.intention ? payload.intention : null
                    } : {}),
                }
        }
        default:
            return "Action not found"
    }
}