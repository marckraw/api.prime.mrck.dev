import { AntonSDK } from "@mrck-labs/anton-sdk";
import { config } from "../config.env";
import { Langfuse } from "langfuse";
import { mainSystemMessage } from "../anton-config/config";

interface ChatOptions {
  messages: Array<{
    role: string;
    content: string;
  }>;
  system_message?: string;
  model?: {
    company: string;
    model: string;
  };
}

interface ChatResponse {
  messages: Array<{
    role: string;
    content: string;
  }>;
}


const createChatService = () => {
  const chatGenerator = (() => {
    const generator = AntonSDK.create({
      model: "gpt-4o-mini",
      apiKey: config.OPENAI_API_KEY,
      type: "openai"
    });

    generator.setSystemMessage?.(mainSystemMessage);

    return generator;
  })();

  const chat = async (options: ChatOptions): Promise<ChatResponse> => {
    const langfuse = new Langfuse();
    const trace = langfuse.trace({
      name: "chat-conversation",
    });

    const generation = trace.generation({
      name: "chat-completion",
      model: options.model?.model || "gpt-4o",
      input: options,
    });

    try {
      let anton;

      if (options.model?.company === "anthropic") {
        anton = AntonSDK.create({
          model: options.model.model,
          apiKey: config.ANTHROPIC_API_KEY,
          type: "anthropic",
        });
      } else {
        anton = chatGenerator;
      }

      if (options.system_message) {
        anton.setSystemMessage?.(options.system_message);
      }

      const response = await anton.chat({
        messages: options.messages,
      });

      generation.end({
        output: response,
      });

      return {
        messages: [{
          role: "assistant",
          content: (response as any)[0].content
        }]
      };

    } catch (error) {
      console.error("Error in chat conversation:", error);
      generation.end({
        error: error instanceof Error ? error : new Error("Unknown error occurred")
      });
      throw error;
    }
  };

  return {
    chat
  };
};

export { createChatService };
export type { ChatOptions, ChatResponse };
