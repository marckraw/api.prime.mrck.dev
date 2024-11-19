import {Hono} from "hono";
import {AntonSDK} from "@mrck-labs/anton-sdk";
import {zValidator} from "@hono/zod-validator";
import {agiRequestSchema, AgiResponse} from "./validators/agi";
import { mainSystemMessage } from "../../../anton-config/config";
import { config } from "../../../config.env";
import { conversations, messages } from "../../../db/schema/conversations";
import { db } from "../../../db";
import { eq } from "drizzle-orm";
import { IntentionValidator } from "../../../services/IntentionValidator/IntentionValidator";

const agiRouter = new Hono()

agiRouter.post('/',
    zValidator('json', agiRequestSchema),
    async (c) => {
        const requestData = c.req.valid('json');

        let parsedIntentionValidationResponse;
        let intentionValidationResponse;

        if(requestData.intention !== 'conversation') {
            const intentionValidator = new IntentionValidator()

            
            try {
                intentionValidationResponse = await intentionValidator.validateAndClassify({
                    messages: requestData.messages,
                })

                parsedIntentionValidationResponse = JSON.parse((intentionValidationResponse as any)[0].content)

            } catch (error) {
                parsedIntentionValidationResponse = (intentionValidationResponse as any)[0].content
            }
    }

    console.log(parsedIntentionValidationResponse)

    if(parsedIntentionValidationResponse?.intent === 'create') {
        const anton = AntonSDK.create({
            model: "gpt-4o",
            apiKey: config.OPENAI_API_KEY,
            type: "openai",
        });

        const response = await anton.createImage({
            prompt: parsedIntentionValidationResponse.originalMessage,
            model: 'dall-e-3'
        })

        console.log(response)

        return c.json({
            data: {
                 messages: [
                    {
                        role: "assistant",
                        content: response?.data[0].url
                    }
                 ]
            }
        } as AgiResponse, 200)
    }
        

        let conversation;
        let existingMessages: any[] = [];

        if (requestData.conversationId) {
            // Get existing conversation and messages
            const [existingConversation] = await db
                .select()
                .from(conversations)
                .where(eq(conversations.id, parseInt(requestData.conversationId)));

            if (!existingConversation) {
                return c.json({ error: "Conversation not found" }, 404);
            }

            conversation = existingConversation;
            existingMessages = await db
                .select()
                .from(messages)
                .where(eq(messages.conversationId, conversation.id));
        } else {
            // Create a new conversation
            const [newConversation] = await db.insert(conversations).values({
                systemMessage: requestData.systemMessage || mainSystemMessage,
            }).returning();
            conversation = newConversation;
        }

        // Insert new messages
        await db.insert(messages).values(
            requestData.messages.map(msg => ({
                conversationId: conversation.id,
                role: msg.role,
                content: msg.content,
            }))
        );


        let anton;
        if(requestData.model) {
            if(requestData.model.company === "anthropic") {
                anton = AntonSDK.create({
                    model: requestData.model.model as any,
                    apiKey: config.ANTHROPIC_API_KEY,
                    type: "anthropic",
                });
            } else {
                anton = AntonSDK.create({
                    model: requestData.model.model as any,
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
            if (requestData.systemMessage) {
                anton.setSystemMessage?.(requestData.systemMessage)
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
            ...requestData.messages
        ];

        try {
            const response = await anton.chat({
                messages: allMessages,
            });

            // Save the assistant's response
            await db.insert(messages).values({
                conversationId: conversation.id,
                role: 'assistant',
                content: (response as any)[0].content,
            });


            return c.json({
                conversationId: conversation.id,
                data: {
                    messages: response
                },
                ...(requestData.debug ? {
                    debug: anton.debug(),
                    channel: requestData.channel,
                    intentionValidation: parsedIntentionValidationResponse ? parsedIntentionValidationResponse : null
                } : {}),
            })
        } catch (error) {
            return c.json({ error: {message: (error as any).message, code: (error as any).code} }, (error as any).status || 500);
        }
    }
)

export default agiRouter
