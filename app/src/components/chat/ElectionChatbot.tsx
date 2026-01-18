import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types/chat';
import type { ElectionData } from '../../lib/dataLoader';
import { sendChatMessage } from '../../lib/groq/groqService';
import { DynamicChart } from './DynamicChart';

interface ElectionChatbotProps {
  electionData: ElectionData;
}

export function ElectionChatbot({ electionData }: ElectionChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await sendChatMessage(userMessage.content, electionData, conversationHistory);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        chartData: response.chartData
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Si è verificato un errore. Riprova.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    'Chi ha vinto le elezioni?',
    'Qual è stata l\'affluenza?',
    'Confronta i candidati',
    'Mostra le liste più votate'
  ];

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl overflow-hidden border-4 border-white hover:scale-110 transition-transform z-50"
        title="Apri assistente AI"
      >
        <img
          src="/assets/rozzi-background.webp"
          alt="Assistente AI"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
          <span className="text-white text-2xl">💬</span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/assets/rozzi-background.webp)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 backdrop-blur-sm" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50">
              <img
                src="/assets/rozzi-background.webp"
                alt="Rozzi"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-white">Assistente Elettorale</h3>
              <p className="text-xs text-white/70">Powered by AI</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-white/90 mb-4">
                Ciao! Sono l'assistente AI per i dati elettorali di Ascoli Piceno.
                Chiedimi qualsiasi cosa!
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputValue(q)}
                    className="px-3 py-1.5 text-xs bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/90 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.chartData && (
                  <DynamicChart data={message.chartData} />
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/90 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scrivi un messaggio..."
              className="flex-1 px-4 py-3 rounded-full bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
