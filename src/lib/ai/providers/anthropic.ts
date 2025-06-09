import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIResponse, AIError } from '../types';
import { encode } from 'gpt-tokenizer';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  public name = 'anthropic';
  public model = 'claude-3-opus-20240229';
  private costPer1kTokens = {
    prompt: 0.015,
    completion: 0.075,
  };

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateResponse(prompt: string): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const promptTokens = this.countTokens(prompt);

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        system: "You are a helpful AI assistant."
      });

      const latencyMs = Date.now() - startTime;
      const completionTokens = message.usage?.output_tokens ?? 0;
      const totalTokens = (message.usage?.input_tokens ?? 0) + completionTokens;

      // Claude 3 returns content as an array of content blocks
      const content = message.content.map(block => {
        if ('text' in block) {
          return block.text;
        }
        return '';
      }).join('');

      return {
        content,
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
        error.status_code ?? 'unknown',
        error.status_code === 429 // Rate limit error
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