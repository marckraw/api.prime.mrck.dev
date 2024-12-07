import { CoreMessage } from "ai";

// Base AI Service
interface BaseAIConfig {
    model: string;
    temperature?: number;
    max_tokens?: number;
  }
  
  interface BaseAIService {
    chat: (messages: CoreMessage[]) => Promise<string>;
    complete: (prompt: string) => Promise<string>;
    getConfig: () => BaseAIConfig;
  }
  
  const createBaseAI = (config: BaseAIConfig) => {
    const state = {
      config: {
        temperature: 0.7,
        max_tokens: 1000,
        ...config
      }
    };
  
    return {
      chat: async (messages: CoreMessage[]) => {
        // Base chat implementation
        return "response";
      },
      complete: async (prompt: string) => {
        // Base completion implementation
        return "completion";
      },
      getConfig: () => ({ ...state.config })
    };
  };
  
  // AI with Skills
  interface Skill {
    name: string;
    execute: (input: string) => Promise<string>;
  }
  
  interface AIWithSkillsConfig extends BaseAIConfig {
    skills?: Skill[];
  }
  
  interface AIWithSkills extends BaseAIService {
    useSkill: (skill_name: string, input: string) => Promise<string>;
    addSkill: (skill: Skill) => void;
    listSkills: () => string[];
  }
  
  const createAIWithSkills = (config: AIWithSkillsConfig): AIWithSkills => {
    // "Inherit" base functionality
    const baseAI = createBaseAI(config);
    
    // Extended state
    const state = {
      skills: new Map<string, Skill>(
        config.skills?.map(skill => [skill.name, skill]) ?? []
      )
    };
  
    return {
      // Spread base methods
      ...baseAI,
  
      // Add new methods
      useSkill: async (skill_name: string, input: string) => {
        const skill = state.skills.get(skill_name);
        if (!skill) {
          throw new Error(`Skill ${skill_name} not found`);
        }
        return skill.execute(input);
      },
  
      addSkill: (skill: Skill) => {
        state.skills.set(skill.name, skill);
      },
  
      listSkills: () => Array.from(state.skills.keys()),
  
      // Override base methods if needed
      chat: async (messages: CoreMessage[]) => {
        const base_response = await baseAI.chat(messages);
        // Add enhanced functionality
        return base_response;
      }
    };
  };
  
  // Usage example:
  const createCustomAI = (config: AIWithSkillsConfig) => {
    const ai = createAIWithSkills(config);
  
    // Add custom skills
    ai.addSkill({
      name: 'code_review',
      execute: async (code: string) => {
        const messages: CoreMessage[] = [
          { role: 'system', content: 'You are a code reviewer.' },
          { role: 'user', content: code }
        ];
        return ai.chat(messages);
      }
    });
  
    return ai;
  };
  
  // Allow further extension
  export {
    createBaseAI,
    createAIWithSkills,
    createCustomAI,
    type BaseAIService,
    type AIWithSkills,
    type Skill
  };