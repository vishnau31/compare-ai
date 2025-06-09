import { prisma } from '../prisma';
import { AIProvider, AIResponse, AIError } from './types';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';

export class AIService {
  private providers: AIProvider[];

  constructor(
    openAIKey: string,
    anthropicKey: string,
    xaiKey: string
  ) {
    this.providers = [
      new OpenAIProvider(openAIKey),
      new AnthropicProvider(anthropicKey),
      // XAI provider would be added here
    ];
  }

  async processPrompt(prompt: string) {
    // Create prompt record
    const promptRecord = await prisma.prompt.create({
      data: { content: prompt },
    });

    // Process all providers in parallel
    const responses = await Promise.allSettled(
      this.providers.map(async (provider) => {
        try {
          const startTime = Date.now();
          const response = await provider.generateResponse(prompt);
          
          // Save response and metrics to database
          const savedResponse = await prisma.response.create({
            data: {
              promptId: promptRecord.id,
              model: provider.model,
              provider: provider.name,
              content: response.content,
              metrics: {
                create: {
                  promptTokens: response.metrics.promptTokens,
                  completionTokens: response.metrics.completionTokens,
                  totalTokens: response.metrics.totalTokens,
                  latencyMs: response.metrics.latencyMs,
                  cost: response.metrics.cost,
                },
              },
            },
            include: {
              metrics: true,
            },
          });
          return {
            ...savedResponse,
            provider: provider.name,
            model: provider.model,
          };
        } catch (error) {
          if (error instanceof AIError) {
            throw error;
          }
          throw new AIError(
            'Unknown error occurred',
            provider.name,
            'unknown',
            false
          );
        }
      })
    );

    return {
      promptId: promptRecord.id,
      responses: responses.map((result) => ({
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null,
      })),
    };
  }

  async getComparisonHistory(limit = 10) {
    return prisma.prompt.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        responses: {
          include: {
            metrics: true,
          },
        },
      },
    });
  }

  async getComparisonById(promptId: string) {
    return prisma.prompt.findUnique({
      where: { id: promptId },
      include: {
        responses: {
          include: {
            metrics: true,
          },
        },
      },
    });
  }
} 