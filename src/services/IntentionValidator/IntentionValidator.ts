import { AntonSDK } from "@mrck-labs/anton-sdk";
import { config } from "../../config.env";
import { intentionValidationPrompt } from "../../routes/api/ai/prompts/intentionValidationPrompts";
import { Langfuse } from "langfuse";

interface Messages {
  messages: any[];
}

const createIntentionValidator = () => {
  // Private variable using closure
  const validator = AntonSDK.create({
    model: "gpt-4o-mini",
    apiKey: config.OPENAI_API_KEY,
    type: "openai",
  });

  // Initialize system message
  validator.setSystemMessage?.(intentionValidationPrompt());

  // Public methods
  const validateAndClassify = async ({ messages }: Messages) => {
    const langfuse = new Langfuse();
    const trace = langfuse.trace({
      name: "agi-intention-validation",
    });

    const generation = trace.generation({
      name: "chat-completion",
      model: "gpt-4o",
      input: messages,
    });

    const response = await validator.chat({
      messages: messages,
    });

    generation.end({
      output: response,
    });

    return response;
  };

  // Return public interface
  return {
    validateAndClassify,
  };
};

export { createIntentionValidator };