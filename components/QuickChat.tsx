
import React, { useState, useRef, useEffect } from 'react';
import { sendQuickMessage } from '../services/geminiService';

interface QuickChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickChat: React.FC<QuickChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user' as const, content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
        const responseText = await sendQuickMessage(messages.concat(userMsg), userMsg.content);
        setMessages(prev => [...prev, { role: 'model', content: responseText }]);
    } catch (err) {
        setMessages(prev => [...prev, { role: 'model', content: "Erro temporário. Tente novamente." }]);
    } finally {
        setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-16 right-0 mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-80 sm:w-96 h-[500px] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300 origin-bottom-right z-50 overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-bold text-slate-800 dark:text-white text-sm">Nexus Lite</span>
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={() => setMessages([])} className="text-xs text-slate-400 hover:text-red-500" title="Limpar conversa">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-950" ref={scrollRef}>
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-6">
                    <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    <p className="text-xs text-slate-500">Tire dúvidas rápidas. O histórico não é salvo.</p>
                </div>
            )}
            {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                        m.role === 'user' 
                        ? 'bg-brand-500 text-white rounded-tr-sm' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-sm'
                    }`}>
                        {m.content}
                    </div>
                </div>
            ))}
            {isLoading && (
                 <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                 </div>
            )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <form onSubmit={handleSend} className="relative">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Pergunte algo rápido..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white placeholder-slate-400"
                />
                <button 
                    type="submit" 
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-2 p-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
            </form>
        </div>
    </div>
  );
};

export default QuickChat;
