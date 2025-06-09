import { NextRequest, NextResponse } from 'next/server';
import { OpenAIProvider } from '@/lib/ai/providers/openai';
import { AnthropicProvider } from '@/lib/ai/providers/anthropic';
import { XAIProvider } from '@/lib/ai/providers/xai';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  logger.info(`[${requestId}] Received comparison request`);

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      logger.warn(`[${requestId}] Missing prompt in request`);
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    logger.info(`[${requestId}] Processing prompt with length: ${prompt.length}`);

    const providers = [
      new OpenAIProvider(process.env.OPENAI_API_KEY || ''),
      new AnthropicProvider(process.env.ANTHROPIC_API_KEY || ''),
      new XAIProvider(process.env.XAI_API_KEY || ''),
    ];

    // Generate responses in parallel
    const responses = await Promise.allSettled(
      providers.map(async (provider) => {
        try {
          logger.debug(`[${requestId}] Requesting response from ${provider.name}`);
          const response = await provider.generateResponse(prompt);
          logger.info(`[${requestId}] Received response from ${provider.name}`);
          return {
            provider: provider.name,
            model: provider.model,
            ...response,
          };
        } catch (error: any) {
          logger.error(`[${requestId}] Error from ${provider.name}:`, {
            error: error.message,
            code: error.code,
          });
          throw error;
        }
      })
    );

    // Process responses
    const formattedResponses = responses.map((result) => ({
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null,
    }));

    // Calculate comparison metrics
    const successfulResponses = formattedResponses
      .filter(r => r.status === 'fulfilled' && r.data)
      .map(r => r.data);

    let metrics = {
      totalLatencyMs: 0,
      totalCost: 0,
      fastestModel: '',
      mostCostEffectiveModel: ''
    };

    if (successfulResponses.length > 0) {
      let maxLatency = 0;
      let totalCost = 0;
      let fastest = successfulResponses[0]!;
      let mostCostEffective = successfulResponses[0]!;

      for (const response of successfulResponses) {
        if (!response) continue;
        const r = response!;
        maxLatency = Math.max(maxLatency, r.metrics.latencyMs);
        totalCost += r.metrics.cost;
        if (r.metrics.latencyMs < fastest.metrics.latencyMs) {
          fastest = r;
        }
        if ((r.metrics.cost / r.metrics.totalTokens) < (mostCostEffective.metrics.cost / mostCostEffective.metrics.totalTokens)) {
          mostCostEffective = r;
        }
      }

      metrics = {
        totalLatencyMs: maxLatency,
        totalCost,
        fastestModel: fastest.model,
        mostCostEffectiveModel: mostCostEffective.model
      };
    }

    // Save to database
    const comparison = await prisma.comparison.create({
      data: {
        prompt,
        responses: {
          create: successfulResponses.map(response => ({
            modelName: response!.model,
            content: response!.content,
            metrics: {
              create: {
                promptTokens: response!.metrics.promptTokens,
                completionTokens: response!.metrics.completionTokens,
                totalTokens: response!.metrics.totalTokens,
                latencyMs: response!.metrics.latencyMs,
                cost: response!.metrics.cost
              }
            }
          }))
        },
        metrics: {
          create: metrics
        }
      },
      include: {
        responses: {
          include: {
            metrics: true
          }
        },
        metrics: true
      }
    });

    logger.info(`[${requestId}] Completed processing all responses`);
    logger.debug(`[${requestId}] Response summary:`, {
      total: responses.length,
      fulfilled: responses.filter(r => r.status === 'fulfilled').length,
      rejected: responses.filter(r => r.status === 'rejected').length,
    });

    return NextResponse.json({
      comparisonId: comparison.id,
      responses: formattedResponses,
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Unexpected error:`, {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Remove the GET endpoint since we're not using it yet
// We can add it back when we implement history functionality 