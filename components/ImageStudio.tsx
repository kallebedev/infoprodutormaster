
import React, { useState, useEffect } from 'react';
import { GeneratedMedia, ProductFolder } from '../types';
import { generateProjectImage, editProjectImage, generateVeoVideo } from '../services/geminiService';
import { supabase } from '../services/supabase';

const ImageStudio: React.FC = () => {
  const [mode, setMode] = useState<'create' | 'edit' | 'video'>('create');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1");
  const [resolution, setResolution] = useState<"1K" | "2K" | "4K">("1K");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [history, setHistory] = useState<GeneratedMedia[]>([]);
  const [activeMedia, setActiveMedia] = useState<GeneratedMedia | null>(null);

  // Mobile Tabs
  const [activeTab, setActiveTab] = useState<'settings' | 'preview'>('settings');

  // For Edit/Video Modes
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  // New state for product context integration
  const [products, setProducts] = useState<ProductFolder[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Load products from Supabase on mount
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if ((!prompt.trim() && !referenceImage) || isGenerating) return;
    if (mode === 'edit' && !referenceImage) {
      alert("Para editar, você precisa fazer upload de uma imagem primeiro.");
      return;
    }

    setIsGenerating(true);
    // Switch to preview on mobile when generating starts
    setActiveTab('preview'); 

    try {
      let resultUrl = '';
      let type: 'image' | 'video' = 'image';

      // 1. Context Injection (Only for Create Mode mostly)
      let finalPrompt = prompt;
      if (mode === 'create' && selectedProductId) {
        const product = products.find(p => p.id === selectedProductId);
        if (product) {
          const chatContext = product.messages.slice(-5).map(m => m.content).join(' ');
          finalPrompt = `Product Context: ${product.name}. Details: ${chatContext}. \n\nImage Request: ${prompt}`;
        }
      }

      // 2. Execution based on Mode
      if (mode === 'create') {
        resultUrl = await generateProjectImage(finalPrompt, aspectRatio, resolution);
      } else if (mode === 'edit' && referenceImage) {
        resultUrl = await editProjectImage(referenceImage, prompt || "Improve this image");
      } else if (mode === 'video') {
        type = 'video';
        // Check for Veo specific aspect ratios constraints if needed, but 16:9/9:16 are standard
        resultUrl = await generateVeoVideo(prompt, referenceImage, aspectRatio === '1:1' ? '16:9' : aspectRatio); 
      }

      // 3. Save to History
      const newMedia: GeneratedMedia = {
        id: Date.now().toString(),
        type: type,
        url: resultUrl,
        prompt: prompt,
        aspectRatio: aspectRatio,
        timestamp: Date.now(),
        metadata: { resolution, model: mode }
      };
      
      setHistory(prev => [newMedia, ...prev]);
      setActiveMedia(newMedia);
      
      if (mode === 'create') setPrompt(''); // Clear prompt on create, keep on edit/video usually useful

    } catch (error: any) {
      alert(`Erro: ${error.message || "Falha na geração."}`);
      setActiveTab('settings'); // Go back on error
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadMedia = (item: GeneratedMedia) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = `nexus-${item.type}-${item.id}.${item.type === 'video' ? 'mp4' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-brand-500 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Media Studio Pro</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Imagens & Vídeos (Veo)</p>
          </div>
        </div>
      </header>
      
      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
         <button 
           onClick={() => setActiveTab('settings')}
           className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'settings' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-slate-500'}`}
         >
           Controles
         </button>
         <button 
           onClick={() => setActiveTab('preview')}
           className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'preview' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-slate-500'}`}
         >
           Resultado
         </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Controls Sidebar */}
        <div className={`w-full md:w-80 lg:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col space-y-6 overflow-y-auto ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
             <button onClick={() => setMode('create')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${mode === 'create' ? 'bg-white dark:bg-slate-700 shadow text-brand-500' : 'text-slate-400'}`}>Gerar</button>
             <button onClick={() => setMode('edit')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${mode === 'edit' ? 'bg-white dark:bg-slate-700 shadow text-brand-500' : 'text-slate-400'}`}>Editar</button>
             <button onClick={() => setMode('video')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${mode === 'video' ? 'bg-white dark:bg-slate-700 shadow text-brand-500' : 'text-slate-400'}`}>Vídeo</button>
          </div>

          {/* Context Selector (Only Create) */}
          {mode === 'create' && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="block text-[10px] font-black text-brand-500 uppercase tracking-widest mb-3 ml-1">Fonte de Contexto</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Nenhum</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
          )}

          {/* Upload Input (Edit/Video) */}
          {(mode === 'edit' || mode === 'video') && (
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
               <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="upload-ref" />
               <label htmlFor="upload-ref" className="cursor-pointer block">
                  {referenceImage ? (
                    <img src={referenceImage} alt="Ref" className="h-32 w-full object-cover rounded-xl mx-auto" />
                  ) : (
                    <div className="py-4">
                       <svg className="w-8 h-8 mx-auto text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                       <span className="text-xs font-bold text-slate-500">Clique para carregar imagem base</span>
                    </div>
                  )}
               </label>
            </div>
          )}

          {/* Prompt Input */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
               {mode === 'edit' ? 'Instrução de Edição' : mode === 'video' ? 'Prompt do Vídeo (Opcional)' : 'Prompt Visual'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === 'edit' ? "Ex: Adicione um filtro neon..." : "Descreva o resultado visual..."}
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-white resize-none"
            />
          </div>

          {/* Configs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Formato</label>
              <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <option value="1:1">Quadrado (1:1)</option>
                <option value="16:9">Paisagem (16:9)</option>
                <option value="9:16">Stories (9:16)</option>
              </select>
            </div>
            {mode === 'create' && (
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Resolução</label>
                  <select value={resolution} onChange={(e) => setResolution(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <option value="1K">Rápido (1K)</option>
                    <option value="2K">Alto (2K)</option>
                    <option value="4K">Ultra (4K)</option>
                  </select>
               </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-5 rounded-2xl font-black text-white uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-3 ${
              isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-600'
            }`}
          >
            {isGenerating ? (
               <span>Processando...</span>
            ) : (
               <span>{mode === 'create' ? 'Gerar Imagem' : mode === 'edit' ? 'Aplicar Edição' : 'Renderizar Vídeo'}</span>
            )}
          </button>

          {/* Gallery */}
          <div className="flex-1">
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Histórico</label>
             <div className="grid grid-cols-2 gap-3">
               {history.map(item => (
                 <button
                   key={item.id}
                   onClick={() => { setActiveMedia(item); setActiveTab('preview'); }}
                   className={`aspect-square rounded-xl overflow-hidden border-2 relative ${activeMedia?.id === item.id ? 'border-brand-500' : 'border-transparent'}`}
                 >
                   {item.type === 'video' ? (
                      <video src={item.url} className="w-full h-full object-cover" />
                   ) : (
                      <img src={item.url} className="w-full h-full object-cover" />
                   )}
                   {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                         <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                   )}
                 </button>
               ))}
             </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className={`flex-1 bg-slate-100 dark:bg-slate-950 p-6 md:p-12 flex items-center justify-center relative ${activeTab === 'settings' ? 'hidden md:flex' : 'flex'}`}>
          {isGenerating ? (
             <div className="animate-pulse flex flex-col items-center">
                <div className="w-20 h-20 bg-brand-500 rounded-full mb-4 animate-bounce"></div>
                <p className="text-slate-800 dark:text-white font-black uppercase tracking-widest">Processando Mídia...</p>
             </div>
          ) : activeMedia ? (
             <div className="w-full max-w-4xl flex flex-col items-center animate-in zoom-in-95 duration-300">
                <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                   {activeMedia.type === 'video' ? (
                      <video controls src={activeMedia.url} className="max-h-[70vh] w-auto" />
                   ) : (
                      <img src={activeMedia.url} alt="Result" className="max-h-[70vh] w-auto object-contain" />
                   )}
                </div>
                <div className="mt-6 flex space-x-4">
                   <button onClick={() => downloadMedia(activeMedia)} className="px-6 py-3 bg-white dark:bg-slate-900 rounded-xl font-bold text-sm shadow text-slate-800 dark:text-white">Download</button>
                   {activeMedia.type === 'image' && (
                      <button onClick={() => { setMode('video'); setReferenceImage(activeMedia.url); setActiveTab('settings'); }} className="px-6 py-3 bg-brand-600 rounded-xl font-bold text-sm shadow text-white">Animar com Veo</button>
                   )}
                </div>
             </div>
          ) : (
             <div className="text-center text-slate-400">
                <p>Selecione um modo e comece a criar.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageStudio;
