import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [comparisons, total] = await Promise.all([
      prisma.comparison.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          responses: {
            include: {
              metrics: true
            }
          },
          metrics: true
        }
      }),
      prisma.comparison.count()
    ]);

    return NextResponse.json({
      comparisons,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching comparisons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comparisons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, responses, metrics } = body;

    // Create the comparison with all related data
    const comparison = await prisma.comparison.create({
      data: {
        prompt,
        responses: {
          create: responses.map((response: any) => ({
            modelName: response.model,
            content: response.content,
            metrics: {
              create: {
                promptTokens: response.metrics.promptTokens,
                completionTokens: response.metrics.completionTokens,
                totalTokens: response.metrics.totalTokens,
                latencyMs: response.metrics.latencyMs,
                cost: response.metrics.cost
              }
            }
          }))
        },
        metrics: {
          create: {
            totalLatencyMs: metrics.totalLatencyMs,
            totalCost: metrics.totalCost,
            fastestModel: metrics.fastestModel,
            mostCostEffectiveModel: metrics.mostCostEffectiveModel
          }
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

    return NextResponse.json(comparison, { status: 201 });
  } catch (error) {
    logger.error('Error creating comparison:', error);
    return NextResponse.json(
      { error: 'Failed to create comparison' },
      { status: 500 }
    );
  }
} 