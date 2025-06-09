import OpenAI from 'openai';
import { AIProvider, AIResponse, AIError } from '../types';
import { encode } from 'gpt-tokenizer';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  public name = 'openai';
  public model = 'gpt-4';
  private costPer1kTokens = {
    prompt: 0.03,
    completion: 0.06,
  };

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateResponse(prompt: string): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const promptTokens = this.countTokens(prompt);

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
      });

      const latencyMs = Date.now() - startTime;
      const completionTokens = completion.usage?.completion_tokens ?? 0;
      const totalTokens = completion.usage?.total_tokens ?? 0;

      return {
        content: completion.choices[0]?.message?.content ?? '',
        metrics: {
          promptTokens,
          completionTokens,
          totalTokens,
          latencyMs,
          cost: this.calculateCost(promptTokens, completionTokens),
        },
      };
    } catch (error: any) {
      throw new AIError(
        error.message,
        this.name,
        error.code ?? 'unknown',
        error.status === 429 // Rate limit error
      );
    }
  }

  countTokens(text: string): number {
    return encode(text).length;
  }

  calculateCost(promptTokens: number, completionTokens: number): number {
    return (
      (promptTokens * this.costPer1kTokens.prompt +
        completionTokens * this.costPer1kTokens.completion) /
      1000
    );
  }
} 