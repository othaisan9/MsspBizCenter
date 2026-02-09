'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAiStream } from '@/hooks/useAiStream';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AiChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const { content: streamContent, loading, error, start, reset } = useAiStream();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent]);

  // When streaming completes, add to messages
  useEffect(() => {
    if (!loading && streamContent) {
      setMessages(prev => [...prev, { role: 'assistant', content: streamContent }]);
      reset();
    }
  }, [loading, streamContent, reset]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    start('/ai/chat', { message: trimmed, contextType: 'all' });
  }, [input, loading, start]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-violet-600 text-white rounded-full border-2 border-violet-800 shadow-brutal flex items-center justify-center hover:bg-violet-700 transition-all duration-150 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        aria-label="AI 어시스턴트"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-xl">✦</span>
        )}
      </button>

      {/* Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white border-2 border-gray-800 rounded-md shadow-brutal flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gray-800 bg-violet-50">
            <div className="flex items-center gap-2">
              <span className="text-violet-600">✦</span>
              <h3 className="text-sm font-bold text-gray-900">AI 어시스턴트</h3>
            </div>
            <button
              onClick={handleToggle}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !streamContent && (
              <div className="text-center text-gray-400 text-sm py-8">
                <p className="mb-2">업무에 대해 무엇이든 물어보세요!</p>
                <div className="space-y-1 text-xs">
                  <p>"이번 주 내 업무 현황은?"</p>
                  <p>"마감 임박한 업무 뭐가 있어?"</p>
                  <p>"지난 회의 결정사항 알려줘"</p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-md text-sm ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white border-2 border-violet-800'
                      : 'bg-gray-100 text-gray-900 border-2 border-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {/* Streaming response */}
            {loading && streamContent && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-3 py-2 rounded-md text-sm bg-gray-100 text-gray-900 border-2 border-gray-800">
                  <div className="whitespace-pre-wrap">{streamContent}</div>
                  <span className="inline-block w-2 h-3 bg-violet-600 animate-pulse ml-0.5" />
                </div>
              </div>
            )}

            {loading && !streamContent && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-md text-sm bg-gray-100 border-2 border-gray-800">
                  <div className="flex items-center gap-2 text-gray-500">
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    생각하는 중...
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center text-red-500 text-xs py-2">{error}</div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t-2 border-gray-800 p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요..."
                disabled={loading}
                className="flex-1 border-2 border-gray-800 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent shadow-brutal-sm disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-3 py-2 bg-violet-600 text-white border-2 border-violet-800 rounded-md shadow-brutal-sm text-sm font-bold hover:bg-violet-700 transition-all duration-150 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
