import {Hono} from "hono";
import {AntonSDK} from "@mrck-labs/anton-sdk";
import {zValidator} from "@hono/zod-validator";
import {AgiRequest, agiRequestSchema, AgiResponse} from "./validators/agi";
import { mainSystemMessage } from "../../../anton-config/config";
import { config } from "../../../config.env";
import { conversations, messages } from "../../../db/schema/conversations";
import { db } from "../../../db";
import { eq } from "drizzle-orm";
import { IntentionValidator } from "../../../services/IntentionValidator/IntentionValidator";
import { improvePromptPrompt } from "../images/prompts";


const validateIntention = async (requestData: AgiRequest): Promise<any> => {
    const intentionValidator = new IntentionValidator()
        
    try {
        const intentionValidationResponse = await intentionValidator.validateAndClassify({
            messages: requestData.messages,
        })

        const parsedIntentionValidationResponse = JSON.parse((intentionValidationResponse as any)[0].content)

        return parsedIntentionValidationResponse

    } catch (error) {
        console.log("Error in validationIntention")
        console.log(error)
    }
}

const agiRouter = new Hono()

agiRouter.post('/',
    zValidator('json', agiRequestSchema),
    async (c) => {
        const requestData = c.req.valid('json');
        const parsedIntentionValidationResponse = await validateIntention(requestData)

        if(parsedIntentionValidationResponse?.intent === 'create') {
            const anton = AntonSDK.create({
                model: "gpt-4o-mini",
                apiKey: config.OPENAI_API_KEY,
                type: "openai",
                supportedModelsApiKeys: {
                leonardoAI: config.LEONARDOAI_API_KEY
                }
            });


            anton.setSystemMessage?.(improvePromptPrompt)

            const improvedPromptResponse = await anton.chat({
                messages: [
                {
                    role: "user",
                    content: parsedIntentionValidationResponse.originalMessage
                }
                ]
            })

      const improvedPrompt = (improvedPromptResponse as any)[0].content


        const response = await anton.createImageWithLeonardo({
                // @ts-ignore
                negative_prompt: "",
                nsfw: true,
                num_images: 1,
                width: 1280,
                height: 1920,
                num_inference_steps: 10,
                contrast: 3.5,
                guidance_scale: 15,
                sd_version: "PHOENIX",
                modelId: "6b645e3a-d64f-4341-a6d8-7a3690fbf042",
                presetStyle: "LEONARDO",
                scheduler: "LEONARDO",
                public: false,
                tiling: false,
                alchemy: true,
                highResolution: false,
                contrastRatio: 0.5,
                weighting: 0.75,
                highContrast: false,
                expandedDomain: false,
                photoReal: false,
                transparency: "disabled",
                styleUUID: "a5632c7c-ddbb-4e2f-ba34-8456ab3ac436",
                enhancePrompt: false,
                ultra: false,
                prompt: improvedPrompt
        })

        

        console.log("##############")
        console.log(response)
        console.log("##############")

        return c.json({
            data: {
                 messages: [
                    {
                        role: "assistant",
                        // @ts-ignore
                        content: response?.imageUrl
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
