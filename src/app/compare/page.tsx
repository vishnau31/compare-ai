'use client';

import React, { useState } from 'react';
import PromptInput from '@/components/PromptInput';
import ResponsePane from '@/components/ResponsePane';

interface ProviderState {
  content: string;
  metrics: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    latencyMs: number;
    cost: number;
  };
  isLoading: boolean;
  isStreaming: boolean;
  error?: string;
}

interface CompareState {
  [provider: string]: ProviderState;
}

const defaultMetrics = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  latencyMs: 0,
  cost: 0,
};

const createInitialProviderState = (isStreaming: boolean = false): ProviderState => ({
  content: '',
  metrics: { ...defaultMetrics },
  isLoading: true,
  isStreaming,
  error: undefined,
});

export default function ComparePage() {
  const [state, setState] = useState<CompareState>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = async (prompt: string) => {
    try {
      setIsProcessing(true);
      setShowSuggestions(false);
      
      setLastSubmittedPrompt(prompt);
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get response');
      }

      // Initialize streaming state for all providers
      setState(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(provider => {
          newState[provider] = createInitialProviderState();
        });
        return newState;
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex;
          while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.trim()) {
              try {
                const event = JSON.parse(line);
                
                switch (event.type) {
                  case 'init':
                    setState(prev => {
                      const newState: CompareState = {};
                      event.providers.forEach(({ name }: { name: string }) => {
                        newState[name] = createInitialProviderState(true);
                      });
                      return newState;
                    });
                    break;

                  case 'token':
                    if (event.provider && event.content) {
                      setState(prev => {
                        if (!prev[event.provider]) return prev;
                        return {
                          ...prev,
                          [event.provider]: {
                            ...prev[event.provider],
                            content: prev[event.provider].content + event.content,
                            isLoading: false,
                          },
                        };
                      });
                    }
                    break;

                  case 'complete':
                    if (event.provider && event.metrics) {
                      setState(prev => {
                        if (!prev[event.provider]) return prev;
                        return {
                          ...prev,
                          [event.provider]: {
                            ...prev[event.provider],
                            metrics: event.metrics,
                            isLoading: false,
                            isStreaming: false,
                          },
                        };
                      });
                    }
                    break;

                  case 'error':
                    if (event.provider && event.error) {
                      setState(prev => {
                        if (!prev[event.provider]) return prev;
                        return {
                          ...prev,
                          [event.provider]: {
                            ...prev[event.provider],
                            error: event.error,
                            isLoading: false,
                            isStreaming: false,
                          },
                        };
                      });
                    }
                    break;

                  case 'end':
                    setState(prev => {
                      const newState = { ...prev };
                      Object.keys(newState).forEach(provider => {
                        if (newState[provider].isLoading) {
                          newState[provider] = {
                            ...newState[provider],
                            isLoading: false,
                            isStreaming: false,
                          };
                        }
                      });
                      return newState;
                    });
                    setIsProcessing(false);
                    break;
                }
              } catch (error) {
                console.error('Error parsing stream event:', error);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error:', error);
      setIsProcessing(false);
      setLastSubmittedPrompt(null);
      // Handle error state
    }
  };

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <PromptInput onSubmit={handleSubmit} isProcessing={isProcessing}/>
        
        {lastSubmittedPrompt && (
          <div className="w-full">
            <div className="max-w-4xl mx-auto px-4 py-3 bg-white rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Submitted Prompt:</h3>
              <p className="text-gray-800 whitespace-pre-wrap">{lastSubmittedPrompt}</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(state).map(([provider, data]) => (
            <ResponsePane
              key={provider}
              modelName={provider}
              provider={provider}
              response={data.content}
              metrics={data.metrics}
              isLoading={data.isLoading}
              isStreaming={data.isStreaming}
              error={data.error}
            />
          ))}
        </div>
      </div>
    </main>
  );
} 