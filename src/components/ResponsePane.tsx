import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface Metrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  cost: number;
}

interface ResponsePaneProps {
  modelName: string;
  provider: string;
  response: string;
  metrics: Metrics;
  isLoading?: boolean;
  isStreaming?: boolean;
  error?: string;
}

const LoadingPulse = () => (
  <div className="flex flex-col gap-4 w-full animate-pulse">
    <div className="space-y-3">
      <div className="h-4 bg-surface-dark rounded w-3/4"></div>
      <div className="h-4 bg-surface-dark rounded w-1/2"></div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-surface-dark rounded w-5/6"></div>
      <div className="h-4 bg-surface-dark rounded w-2/3"></div>
      <div className="h-4 bg-surface-dark rounded w-3/4"></div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-surface-dark rounded w-full"></div>
      <div className="h-4 bg-surface-dark rounded w-4/5"></div>
    </div>
  </div>
);

const MetricsPlaceholder = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <div className="h-4 bg-surface-dark rounded w-24 mb-2"></div>
        <div className="h-2 bg-surface-dark rounded w-full"></div>
      </div>
      <div>
        <div className="h-4 bg-surface-dark rounded w-16 mb-2"></div>
        <div className="h-4 bg-surface-dark rounded w-20"></div>
      </div>
      <div className="col-span-2">
        <div className="h-4 bg-surface-dark rounded w-20 mb-2"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-surface-dark rounded w-24"></div>
          <div className="h-6 bg-surface-dark rounded w-28"></div>
          <div className="h-6 bg-surface-dark rounded w-20"></div>
        </div>
      </div>
    </div>
  </div>
);

const ResponsePane = ({
  modelName,
  provider,
  response,
  metrics,
  isLoading = false,
  isStreaming = false,
  error,
}: ResponsePaneProps) => {
  const [isCopied, setIsCopied] = React.useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when streaming
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [response, isStreaming]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(response);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex-1 bg-surface-light rounded-lg shadow-elevated p-4 m-2 flex flex-col min-h-[400px] max-h-[800px] relative">
      {/* Header */}
      <div className="border-b border-surface-dark pb-3 mb-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{modelName}</h2>
          <p className="text-sm text-gray-500">{provider}</p>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-primary-end rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-500">Streaming</span>
            </span>
          )}
          {response && (
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-primary-end transition-smooth"
            >
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      </div>

      {/* Response Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto mb-4 pr-2 scroll-smooth relative">
        {isLoading && !isStreaming && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg">
              <div className="w-2 h-2 bg-primary-start rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary-end rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary-start rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        
        {isLoading && !isStreaming ? (
          <LoadingPulse />
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-red-500 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="font-medium text-gray-800">Error</p>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{response}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1 h-4 bg-primary-end animate-blink"></span>
            )}
          </div>
        )}
      </div>

      {/* Metrics */}
      {!error && (
        <div className="border-t border-surface-dark pt-3 mt-auto shrink-0">
          {isLoading && !isStreaming ? (
            <MetricsPlaceholder />
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Response Time</p>
                <div className="flex items-center gap-2">
                  <div 
                    className="h-2 bg-gradient-to-r from-primary-start to-primary-end rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(metrics.latencyMs / 50, 100)}%` }}
                  ></div>
                  <span className="text-gray-700 font-medium">{metrics.latencyMs}ms</span>
                </div>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Cost</p>
                <p className="font-medium text-gray-700">${metrics.cost.toFixed(4)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 mb-1">Tokens</p>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-0.5 bg-surface-dark rounded-full">
                    Prompt: {metrics.promptTokens}
                  </span>
                  <span className="px-2 py-0.5 bg-surface-dark rounded-full">
                    Completion: {metrics.completionTokens}
                  </span>
                  <span className="px-2 py-0.5 bg-primary-end/10 text-primary-end rounded-full">
                    Total: {metrics.totalTokens}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResponsePane; 