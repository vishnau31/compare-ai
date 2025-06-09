import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comparison = await prisma.comparison.findUnique({
      where: { id: params.id },
      include: {
        responses: {
          include: {
            metrics: true
          }
        },
        metrics: true
      }
    });

    if (!comparison) {
      return NextResponse.json(
        { error: 'Comparison not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(comparison);
  } catch (error) {
    logger.error(`Error fetching comparison ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch comparison' },
      { status: 500 }
    );
  }
} 