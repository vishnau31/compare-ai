import { AIProvider, AIResponse, AIError } from '../types';
import { encode } from 'gpt-tokenizer';

export class XAIProvider implements AIProvider {
  private apiKey: string;
  public name = 'xai';
  public model = "grok-3-latest";  // X.AI uses their own model identifiers
  private costPer1kTokens = {
    prompt: 0.03,    // Actual GPT-4 pricing
    completion: 0.06, // Actual GPT-4 pricing
  };
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Allow overriding the base URL through environment variable
    this.baseUrl = process.env.XAI_API_BASE_URL || 'https://api.x.ai/v1';
  }

  private async makeRequest(endpoint: string, data: any) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('Making X.AI request to:', url);
    console.log('Request data:', JSON.stringify(data, null, 2));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'x-api-version': '1',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      console.log('X.AI response status:', response.status);
      console.log('X.AI response headers:', Object.fromEntries(response.headers.entries()));
      console.log('X.AI response data:', JSON.stringify(responseData, null, 2));

      if (!response.ok) {
        throw new Error(
          responseData.error?.message || 
          `API request failed with status ${response.status}`
        );
      }

      return responseData;
    } catch (error: any) {
      console.error('X.AI request failed:', {
        error: error.message,
        url,
        status: error.status,
      });
      throw error;
    }
  }

  async generateResponse(prompt: string): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const promptTokens = this.countTokens(prompt);

      const data = await this.makeRequest('/chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
        n: 1
      });

      // Extract response content and metrics
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      const completionTokens = data.usage?.completion_tokens || 0;
      const totalTokens = data.usage?.total_tokens || 0;
      const actualPromptTokens = data.usage?.prompt_tokens || promptTokens;
      const latencyMs = Date.now() - startTime;

      return {
        content,
        metrics: {
          promptTokens: actualPromptTokens,
          completionTokens,
          totalTokens,
          latencyMs,
          cost: this.calculateCost(actualPromptTokens, completionTokens),
        },
      };
    } catch (error: any) {
      console.error('X.AI Error:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack,
      });

      // Enhanced error handling
      const errorMessage = 
        error.error?.message || 
        error.message || 
        'Failed to generate response';
      
      const errorCode = 
        error.error?.code || 
        error.status?.toString() || 
        'unknown';
      
      const isRateLimit = 
        errorCode === 'rate_limit_exceeded' || 
        error.status === 429 ||
        errorMessage.toLowerCase().includes('rate limit');

      throw new AIError(
        errorMessage,
        this.name,
        errorCode,
        isRateLimit
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