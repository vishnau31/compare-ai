export interface AIResponse {
  content: string;
  metrics: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    latencyMs: number;
    cost: number;
  };
}

export interface AIProvider {
  name: string;
  model: string;
  generateResponse(prompt: string): Promise<AIResponse>;
  countTokens(text: string): number;
  calculateCost(promptTokens: number, completionTokens: number): number;
}

export class AIError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code: string,
    public isRetryable: boolean
  ) {
    super(message);
    this.name = 'AIError';
  }
} 