// Greek ERP/CRM - Shared AI Utilities

// AI service types
export interface AIRequest {
  prompt: string;
  context?: Record<string, any>;
  maxTokens?: number;
}

export interface AIResponse {
  text: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface GreekBusinessContext {
  companyType: string;
  industry: string;
  region: string;
  language: "el" | "en";
}

// AI utilities
export const processAIRequest = async (
  request: AIRequest
): Promise<AIResponse> => {
  // TODO: Implement AI processing with OpenAI/other providers
  return {
    text: "Sample AI response",
    confidence: 0.9,
    metadata: { model: "gpt-4" },
  };
};

export const createGreekBusinessPrompt = (
  userPrompt: string,
  context: GreekBusinessContext
): string => {
  const basePrompt = `Context: You are helping a Greek business in the ${
    context.industry
  } industry.
Company type: ${context.companyType}
Region: ${context.region}
Language: ${context.language}

User request: ${userPrompt}

Please respond in ${
    context.language === "el" ? "Greek" : "English"
  } with business-appropriate advice.`;

  return basePrompt;
};

export const getDefaultAIConfig = () => ({
  maxTokens: 1000,
  temperature: 0.7,
  model: "gpt-4",
});
