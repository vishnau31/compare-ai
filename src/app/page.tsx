'use client';

import React, { useState } from 'react';
import TopBar from '@/components/TopBar';
import ResponsePane from '@/components/ResponsePane';
import PromptInput from '@/components/PromptInput';

interface ComparisonResponse {
  promptId: string;
  responses: Array<{
    status: 'fulfilled' | 'rejected';
    data: {
      provider: string;
      model: string;
      content: string;
      metrics: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        latencyMs: number;
        cost: number;
      };
    } | null;
    error: Error | null;
  }>;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);

  const handlePromptSubmit = async (prompt: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI responses');
      }

      const data = await response.json();
      setComparison(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderResponse = (providerName: string) => {
    if (!comparison) return null;
    return comparison.responses.find(
      (r) => r.data?.provider === providerName
    );
  };

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <TopBar />
      <PromptInput onSubmit={handlePromptSubmit} />
      
      {error && (
        <div className="w-full bg-red-50 text-red-600 px-4 py-2 text-center">
          {error}
        </div>
      )}
      
      <div className="flex-1 flex flex-col md:flex-row p-4 gap-4">
        <ResponsePane
          modelName="GPT-4"
          provider="OpenAI"
          response={getProviderResponse('openai')?.data?.content ?? ''}
          metrics={getProviderResponse('openai')?.data?.metrics ?? {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            latencyMs: 0,
            cost: 0,
          }}
          isLoading={isLoading}
        />
        
        <ResponsePane
          modelName="Claude 3"
          provider="Anthropic"
          response={getProviderResponse('anthropic')?.data?.content ?? ''}
          metrics={getProviderResponse('anthropic')?.data?.metrics ?? {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            latencyMs: 0,
            cost: 0,
          }}
          isLoading={isLoading}
        />
        
        <ResponsePane
          modelName="XAI Model"
          provider="XAI"
          response={getProviderResponse('xai')?.data?.content ?? ''}
          metrics={getProviderResponse('xai')?.data?.metrics ?? {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            latencyMs: 0,
            cost: 0,
          }}
          isLoading={isLoading}
        />
      </div>
    </main>
  );
}