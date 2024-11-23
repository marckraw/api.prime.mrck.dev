import { AntonSDK } from "@mrck-labs/anton-sdk";
import { config } from "../../config.env";
import { intentionValidationPrompt } from "../../routes/api/agi/prompts/intentionValidationPrompts";
import { Langfuse } from "langfuse";

export class IntentionValidator {
    intentionValidator: any; 
    constructor() {
        this.intentionValidator = AntonSDK.create({
            model: "gpt-4o",
            apiKey: config.OPENAI_API_KEY,
            type: "openai",
        });

        this.intentionValidator.setSystemMessage?.(intentionValidationPrompt())
    }

    async validateAndClassify({messages}: {messages: any[]}) {
        const langfuse = new Langfuse();
        const trace = langfuse.trace({
            name: "agi-intention-validation",
        });

        const generation = trace.generation({
            name: "chat-completion",
            model: "gpt-4o",
            input: messages,
          });

        const response = await this.intentionValidator.chat({
            messages: messages,
        })

        // End generation - sets endTime
        generation.end({
            output: response,
        });

        return response
    }
}