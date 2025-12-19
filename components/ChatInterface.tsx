
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isProcessing }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 transition-colors duration-300">
      
      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50 dark:bg-[#0B0F19]" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
            <div className={`max-w-[90%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-all ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-brand-600 to-accent-600 text-white rounded-tr-sm shadow-lg shadow-brand-500/20' 
                : 'bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-sm'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <span className={`text-[10px] block mt-2 font-medium opacity-60 ${msg.role === 'user' ? 'text-brand-100 text-right' : 'text-slate-400 text-left'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-white/5 text-slate-400 rounded-2xl rounded-tl-sm px-5 py-4 text-sm shadow-sm flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5">
        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            className="w-full bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 rounded-xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-500/50 dark:text-white transition-all placeholder-slate-400 dark:placeholder-slate-500 shadow-inner"
            placeholder="Digite seu comando de otimização..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 top-2 p-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-all transform active:scale-95 shadow-md shadow-brand-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </form>
        <div className="flex justify-center mt-3 space-x-6">
             <div className="flex items-center space-x-1.5">
                <div className="w-1 h-1 rounded-full bg-brand-500"></div>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Decisivo</span>
             </div>
             <div className="flex items-center space-x-1.5">
                <div className="w-1 h-1 rounded-full bg-accent-500"></div>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Focado</span>
             </div>
             <div className="flex items-center space-x-1.5">
                <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Conversão</span>
             </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
