import React, { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isProcessing?: boolean;
}

const SUGGESTION_BLOCKS = [
  {
    category: "Programming",
    suggestions: [
      "Compare the approaches to handling async operations in different programming languages.",
      "Explain the differences between functional and object-oriented programming.",
    ]
  },
  {
    category: "Science",
    suggestions: [
      "Explain quantum entanglement and its implications for quantum computing.",
      "How does CRISPR gene editing techn ology work?",
    ]
  },
  {
    category: "Creative",
    suggestions: [
      "Write a creative story about a time traveler who can only travel to random points in time.",
      "Create a dialogue between the Sun and the Moon discussing their roles in the universe.",
    ]
  }
];

const PromptInput = ({ onSubmit, isProcessing = false}: PromptInputProps) => {
  const [prompt, setPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    };

    adjustHeight();
  }, [prompt]);

  const handleSubmit = (e: KeyboardEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      setLastSubmittedPrompt(prompt);
      onSubmit(prompt);
      setPrompt('');
      setShowSuggestions(false);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setIsTyping(true);
    setShowSuggestions(false);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (suggestionsEnabled && !e.target.value) {
        setShowSuggestions(true);
      }
    }, 1000);
  };

  const toggleSuggestions = () => {
    setSuggestionsEnabled(!suggestionsEnabled);
    if (!suggestionsEnabled && !isTyping && !prompt) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full bg-surface-light shadow-subtle">
      <form onSubmit={(e) => { e.preventDefault(); if (prompt.trim()) { onSubmit(prompt); setShowSuggestions(false); }}} className="w-full px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestionsEnabled && !isTyping && !prompt) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="Enter your prompt here... (⌘/Ctrl + Enter to submit)"
              className="w-full px-4 py-3 pr-44 border border-surface-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-end/50 focus:border-transparent resize-none min-h-[60px] max-h-[200px] overflow-y-auto"
              rows={1}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSuggestions}
                className={`px-3 py-1.5 text-sm rounded-lg transition-smooth ${
                  suggestionsEnabled
                    ? 'text-primary-end bg-primary-end/10'
                    : 'text-gray-400 hover:text-primary-end'
                }`}
              >
                {suggestionsEnabled ? 'Hide Tips' : 'Show Tips'}
              </button>
              <span className="text-sm text-gray-400">
                {prompt.length} chars
              </span>
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="px-4 py-2 bg-gradient-to-r from-primary-start to-primary-end text-white rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary-end/50 focus:ring-offset-2 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Suggestions Panel */}
      {showSuggestions && suggestionsEnabled && !isTyping && !isProcessing && (
        <div className="w-full border-t border-surface-dark">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SUGGESTION_BLOCKS.map((block) => (
                <div key={block.category} className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">{block.category}</h3>
                  <div className="space-y-1">
                    {block.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setPrompt(suggestion);
                          setShowSuggestions(false);
                          textareaRef.current?.focus();
                        }}
                        className="w-full text-left px-3 py-2 text-sm bg-white hover:bg-surface rounded-md hover:text-primary-end transition-smooth"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptInput; 