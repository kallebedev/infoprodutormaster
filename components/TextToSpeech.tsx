
import React, { useState, useRef, useEffect } from 'react';
import { generateSpeech } from '../services/geminiService';
import { ProductFolder } from '../types';
import { supabase } from '../services/supabase';

const VOICES = [
    { id: 'Puck', name: 'Puck', gender: 'Masculino', style: 'Energético e Jovem' },
    { id: 'Charon', name: 'Charon', gender: 'Masculino', style: 'Profundo e Autoritário' },
    { id: 'Kore', name: 'Kore', gender: 'Feminino', style: 'Calmo e Reconfortante' },
    { id: 'Fenrir', name: 'Fenrir', gender: 'Masculino', style: 'Intenso e Rápido' },
    { id: 'Zephyr', name: 'Zephyr', gender: 'Feminino', style: 'Polido e Profissional' }
];

interface AudioItem {
    id: string;
    text: string;
    voice: string;
    url: string;
    timestamp: number;
    projectName?: string;
}

const TextToSpeech: React.FC = () => {
    const [text, setText] = useState('');
    const [selectedVoice, setSelectedVoice] = useState(VOICES[2].id); // Default Kore
    const [isGenerating, setIsGenerating] = useState(false);
    const [history, setHistory] = useState<AudioItem[]>([]);
    const [activeAudio, setActiveAudio] = useState<AudioItem | null>(null);
    
    // Mobile Tab State
    const [activeTab, setActiveTab] = useState<'config' | 'player'>('config');

    // Product Context State
    const [products, setProducts] = useState<ProductFolder[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>('');

    const audioRef = useRef<HTMLAudioElement>(null);

    // Load products on mount from Supabase
    useEffect(() => {
        const fetchProducts = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('projects').select('id, data').eq('user_id', user.id);
                if (data) {
                    setProducts(data.map(d => ({ id: d.id, ...d.data })));
                }
            }
        };
        fetchProducts();
    }, []);

    // Auto-play when activeAudio changes
    useEffect(() => {
        if (activeAudio && audioRef.current) {
            audioRef.current.src = activeAudio.url;
            audioRef.current.play().catch(e => console.log("Auto-play prevented:", e));
        }
    }, [activeAudio]);

    const handleGenerate = async () => {
        if (!text.trim() || isGenerating) return;

        setIsGenerating(true);
        setActiveTab('player'); // Switch to player to see result

        try {
            const audioUrl = await generateSpeech(text, selectedVoice);
            
            const selectedProject = products.find(p => p.id === selectedProductId);

            const newItem: AudioItem = {
                id: Date.now().toString(),
                text: text,
                voice: selectedVoice,
                url: audioUrl,
                timestamp: Date.now(),
                projectName: selectedProject?.name
            };

            setHistory(prev => [newItem, ...prev]);
            setActiveAudio(newItem);
        } catch (error: any) {
            alert(`Erro: ${error.message || "Falha ao gerar áudio."}`);
            setActiveTab('config'); // Go back
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = (item: AudioItem) => {
        const link = document.createElement('a');
        link.href = item.url;
        link.download = `nexus-audio-${item.voice}-${item.id}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Header */}
            <header className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="bg-rose-500 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Narrador Studio</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Texto para Voz (TTS)</p>
                    </div>
                </div>
            </header>
            
            {/* Mobile Tab Switcher */}
            <div className="md:hidden flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <button 
                onClick={() => setActiveTab('config')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'config' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-slate-500'}`}
                >
                Configuração
                </button>
                <button 
                onClick={() => setActiveTab('player')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'player' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-slate-500'}`}
                >
                Player & Histórico
                </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* Controls Sidebar */}
                <div className={`w-full md:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col space-y-6 overflow-y-auto z-10 ${activeTab === 'player' ? 'hidden md:flex' : 'flex'}`}>
                    
                    {/* Product Selector */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Projeto Associado</label>
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white outline-none appearance-none cursor-pointer"
                        >
                            <option value="">Sem vínculo (Geral)</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Roteiro / Texto</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Digite o texto que o narrador deve falar..."
                            rows={8}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white resize-none"
                            maxLength={5000}
                        />
                        <div className="flex justify-between mt-2 ml-1">
                            <span className="text-[10px] text-slate-400 font-bold">{text.length}/5000 caracteres</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Selecione a Voz</label>
                        <div className="grid grid-cols-1 gap-2">
                            {VOICES.map(voice => (
                                <button
                                    key={voice.id}
                                    onClick={() => setSelectedVoice(voice.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                        selectedVoice === voice.id 
                                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500' 
                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    <div>
                                        <div className="font-bold text-sm">{voice.name}</div>
                                        <div className="text-[10px] opacity-70 uppercase tracking-wider">{voice.style}</div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedVoice === voice.id ? 'bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        {voice.gender === 'Masculino' ? 'M' : 'F'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !text.trim()}
                        className={`w-full py-5 rounded-2xl font-black text-white uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-3 ${
                            isGenerating || !text.trim() ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600'
                        }`}
                    >
                        {isGenerating ? (
                            <div className="flex items-center space-x-2">
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Gerando Áudio...</span>
                            </div>
                        ) : (
                            <span>Gerar Narração</span>
                        )}
                    </button>
                </div>

                {/* Player & History */}
                <div className={`flex-1 bg-slate-100 dark:bg-slate-950 p-6 md:p-12 flex flex-col items-center relative overflow-y-auto ${activeTab === 'config' ? 'hidden md:flex' : 'flex'}`}>
                    
                    {/* Active Player */}
                    <div className="w-full max-w-2xl mb-12">
                         <div className={`bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-8 border border-slate-200 dark:border-slate-800 transition-all duration-500 ${activeAudio ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 grayscale'}`}>
                             <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg ${isGenerating ? 'animate-pulse bg-slate-300' : 'bg-rose-500'}`}>
                                        {activeAudio ? activeAudio.voice[0] : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>}
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                                                {activeAudio ? `Narração (${activeAudio.voice})` : 'Aguardando Geração'}
                                            </h3>
                                            {activeAudio?.projectName && (
                                                <span className="text-[10px] bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                                    {activeAudio.projectName}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs mt-1">
                                            {activeAudio ? activeAudio.text : 'Selecione ou gere um áudio para ouvir.'}
                                        </p>
                                    </div>
                                </div>
                                {activeAudio && (
                                    <button 
                                        onClick={() => handleDownload(activeAudio)}
                                        className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors"
                                        title="Baixar WAV"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </button>
                                )}
                             </div>

                             {/* Audio Element */}
                             <audio ref={audioRef} controls className="w-full" />
                         </div>
                    </div>

                    {/* History List */}
                    <div className="w-full max-w-2xl">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pl-2">Histórico Recente</h3>
                        <div className="space-y-3">
                            {history.length === 0 && (
                                <div className="text-center py-10 opacity-40">
                                    <p className="text-slate-500">Nenhum áudio gerado nesta sessão.</p>
                                </div>
                            )}
                            {history.map(item => (
                                <div 
                                    key={item.id}
                                    onClick={() => setActiveAudio(item)}
                                    className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${
                                        activeAudio?.id === item.id 
                                        ? 'bg-white dark:bg-slate-900 border-rose-500 shadow-lg' 
                                        : 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex items-center space-x-4 min-w-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${activeAudio?.id === item.id ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            {item.voice[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <p className={`text-sm font-bold truncate ${activeAudio?.id === item.id ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>{item.text}</p>
                                                {item.projectName && <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">{item.projectName}</span>}
                                            </div>
                                            <p className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleTimeString()} • {item.voice}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                                        className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TextToSpeech;
