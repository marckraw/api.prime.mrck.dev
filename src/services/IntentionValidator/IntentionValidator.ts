import { AntonSDK } from "@mrck-labs/anton-sdk";
import { config } from "../../config.env";
import { intentionValidationPrompt } from "../../routes/api/agi/prompts/intentionValidationPrompts";

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
        const response = await this.intentionValidator.chat({
            messages: messages,
        })

        return response
    }
}