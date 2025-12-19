
import React, { useState } from 'react';
import PomodoroTimer from './PomodoroTimer';
import QuickChat from './QuickChat';

const ProductivityDock: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'none' | 'timer' | 'chat'>('none');

  const toggleTool = (tool: 'timer' | 'chat') => {
    setActiveTool(current => current === tool ? 'none' : tool);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        
        {/* Render Active Tool Panel */}
        <div className="relative">
            <PomodoroTimer 
                isOpen={activeTool === 'timer'} 
                onClose={() => setActiveTool('none')} 
            />
            <QuickChat 
                isOpen={activeTool === 'chat'} 
                onClose={() => setActiveTool('none')} 
            />
        </div>

        {/* Dock Bar */}
        <div className="flex items-center space-x-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl transition-all hover:scale-105">
            
            <button 
                onClick={() => toggleTool('timer')}
                className={`p-3 rounded-xl transition-all ${activeTool === 'timer' ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title="Timer de Foco"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
            
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>

            <button 
                onClick={() => toggleTool('chat')}
                className={`p-3 rounded-xl transition-all ${activeTool === 'chat' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title="Chat Rápido (Sem Histórico)"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            </button>

        </div>
    </div>
  );
};

export default ProductivityDock;
