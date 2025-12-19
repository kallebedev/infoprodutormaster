
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ProductFolder } from '../types';
import { chatProductCreation, researchWithGrounding } from '../services/geminiService';
import { supabase } from '../services/supabase';

// Helper to render basic Markdown styling
const MessageContentRenderer: React.FC<{ content: string }> = ({ content }) => {
  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-brand-600 dark:text-brand-400">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-1">
      {content.split('\n').map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={index} className="text-lg font-bold text-slate-800 dark:text-white mt-6 mb-3 flex items-center">
              {trimmed.replace('### ', '')}
            </h3>
          );
        }
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div key={index} className="flex items-start space-x-3 mb-2 ml-1">
              <span className="text-brand-500 mt-1.5 flex-shrink-0">•</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {parseBold(trimmed.substring(2))}
              </p>
            </div>
          );
        }
        if (trimmed === '') {
          return <div key={index} className="h-2" />;
        }
        return (
          <p key={index} className="mb-2 text-slate-700 dark:text-slate-300 leading-relaxed">
            {parseBold(line)}
          </p>
        );
      })}
    </div>
  );
};

const ProductCreationChat: React.FC = () => {
  // State
  const [folders, setFolders] = useState<ProductFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Mobile Sidebar State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Grounding Toggle State
  const [isResearchMode, setIsResearchMode] = useState(false);
  const [useMaps, setUseMaps] = useState(false);

  // Rename & Edit States
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Load from Supabase
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
            setUser(user);
            fetchProjects(user.id);
        }
    });
  }, []);

  const fetchProjects = async (userId: string) => {
      const { data, error } = await supabase.from('projects').select('*').order('updated_at', { ascending: false });
      if (data) {
          const mapped: ProductFolder[] = data.map(d => ({
              id: d.id,
              ...d.data
          }));
          setFolders(mapped);
          if (mapped.length > 0 && !activeFolderId) {
              setActiveFolderId(mapped[0].id);
          }
      }
  };

  const saveProject = async (folder: ProductFolder) => {
      if (!user) return;
      // Optimistic Update
      setFolders(prev => prev.map(f => f.id === folder.id ? folder : f));
      
      const { id, ...data } = folder;
      await supabase.from('projects').upsert({
          id: id,
          user_id: user.id,
          data: data,
          updated_at: new Date()
      });
  };

  const activeFolder = folders.find(f => f.id === activeFolderId) || null;

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [activeFolder?.messages]);
  useEffect(() => { if (isEditingTitle && titleInputRef.current) { titleInputRef.current.focus(); titleInputRef.current.select(); } }, [isEditingTitle]);

  // Logic Handlers
  const handleCreateFolder = async () => {
    if (!user) return;
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const newFolder: ProductFolder = { id, name: "Novo Produto", createdAt: Date.now(), messages: [], icon: '📁' };
    
    setFolders(prev => [newFolder, ...prev]);
    setActiveFolderId(id);
    setIsMobileSidebarOpen(false);
    setTimeout(() => { setTempTitle("Novo Produto"); setIsEditingTitle(true); }, 100);
    
    saveProject(newFolder);
  };

  const startEditing = (e: React.MouseEvent | null, folder: ProductFolder) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setActiveFolderId(folder.id);
    setTempTitle(folder.name);
    setIsEditingTitle(true);
  };

  const saveTitle = () => {
    if (tempTitle.trim() && activeFolderId && activeFolder) {
        const updated = { ...activeFolder, name: tempTitle.trim() };
        saveProject(updated);
    }
    setIsEditingTitle(false);
  };

  const handleKeyDownTitle = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          saveTitle();
      } else if (e.key === 'Escape') {
          setIsEditingTitle(false);
      }
  };

  const handleDeleteFolder = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este produto e todo o histórico?")) {
      const newFolders = folders.filter(f => f.id !== id);
      setFolders(newFolders);
      if (activeFolderId === id) setActiveFolderId(newFolders[0]?.id || null);
      await supabase.from('projects').delete().eq('id', id);
    }
  };

  const handleEditMessage = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditText(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editText.trim() || !activeFolderId || !activeFolder) return;
    
    const msgIndex = activeFolder.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    setEditingMessageId(null);
    setIsProcessing(true);

    const truncatedMessages = activeFolder.messages.slice(0, msgIndex + 1);
    truncatedMessages[msgIndex] = { ...truncatedMessages[msgIndex], content: editText.trim(), id: Date.now().toString() };

    const updatedFolder = { ...activeFolder, messages: truncatedMessages };
    saveProject(updatedFolder);

    const history = truncatedMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
    const { message: aiResponseText, productName } = await chatProductCreation(history, editText.trim());

    const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponseText,
        timestamp: Date.now(),
    };

    const finalFolder = { 
        ...updatedFolder, 
        messages: [...updatedFolder.messages, aiMsg],
        name: (productName && (updatedFolder.name === 'Novo Produto' || updatedFolder.name === 'Projeto Piloto')) ? productName : updatedFolder.name
    };
    saveProject(finalFolder);

    setIsProcessing(false);
  };

  // Chat Handlers
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isProcessing || !activeFolderId || !activeFolder) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now(),
    };

    const folderWithUserMsg = { ...activeFolder, messages: [...activeFolder.messages, userMsg] };
    setFolders(prev => prev.map(f => f.id === activeFolderId ? folderWithUserMsg : f)); // Quick UI update
    
    setInput('');
    setIsProcessing(true);

    try {
      let aiResponseText = "";
      let productName: string | undefined;
      let sources: any[] = [];

      // BRANCH: Research Mode vs Creative Mode
      if (isResearchMode) {
         const result = await researchWithGrounding(text, useMaps);
         aiResponseText = result.text;
         sources = result.sources;
      } else {
         const history = folderWithUserMsg.messages.map(m => ({ role: m.role, content: m.content }));
         const res = await chatProductCreation(history, text);
         aiResponseText = res.message;
         productName = res.productName;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponseText,
        timestamp: Date.now(),
        groundingMetadata: sources.length > 0 ? { 
            searchSources: useMaps ? undefined : sources, 
            mapSources: useMaps ? sources : undefined 
        } : undefined
      };

      const finalFolder = {
          ...folderWithUserMsg,
          messages: [...folderWithUserMsg.messages, aiMsg],
          name: (productName && (folderWithUserMsg.name === 'Novo Produto' || folderWithUserMsg.name === 'Projeto Piloto')) ? productName : folderWithUserMsg.name
      };
      
      saveProject(finalFolder);

    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in"
            onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Drawer on Mobile, Relative on Desktop) */}
      <div className={`fixed inset-y-0 left-0 z-40 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 transition-transform duration-300 md:relative md:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl md:shadow-none md:pt-16`}>
        <div className="p-4 pb-2">
          <button onClick={handleCreateFolder} className="w-full flex items-center justify-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/20 active:scale-95 group">
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span className="font-bold text-sm tracking-wide">Novo Produto</span>
          </button>
        </div>

        <div className="px-5 py-2 flex justify-between items-center">
           <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico de Projetos</h2>
           {/* Close button only on mobile */}
           <button onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {folders.length === 0 && <div className="text-center py-8 px-4 opacity-50"><p className="text-xs text-slate-500">Nenhum projeto ativo.</p></div>}
          {folders.map(folder => (
            <div 
              key={folder.id}
              onClick={() => { setActiveFolderId(folder.id); setIsEditingTitle(false); setIsMobileSidebarOpen(false); }}
              className={`group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all relative overflow-hidden ${
                activeFolderId === folder.id 
                  ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 shadow-sm' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
              }`}
            >
              {activeFolderId === folder.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 rounded-l-xl"></div>}
              <div className="flex items-center space-x-3 min-w-0 pl-1 relative z-10">
                <span className={`text-lg ${activeFolderId === folder.id ? 'opacity-100' : 'opacity-60 grayscale'}`}>{folder.icon || '📁'}</span>
                <div className="min-w-0">
                   <p className={`text-sm font-bold truncate ${activeFolderId === folder.id ? 'text-brand-700 dark:text-brand-300' : 'text-slate-600 dark:text-slate-400'}`}>{folder.name}</p>
                   <p className="text-[10px] text-slate-400 truncate">{new Date(folder.createdAt).toLocaleDateString()} • {folder.messages.length} msgs</p>
                </div>
              </div>
              <div className={`flex items-center transition-all relative z-30 ${activeFolderId === folder.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button onClick={(e) => startEditing(e, folder)} className="p-1.5 text-slate-400 hover:text-brand-500 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                <button onClick={(e) => handleDeleteFolder(e, folder.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-all ml-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span>Sincronizado com Supabase</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 transition-colors duration-300 relative w-full">
        {!activeFolder ? (
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-brand-50 dark:bg-brand-500/10 rounded-full flex items-center justify-center text-brand-500 mb-6 shadow-xl">
                   <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-3">Nenhum Produto Selecionado</h2>
                <button onClick={handleCreateFolder} className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 transition-all active:scale-95 flex items-center space-x-2"><span>Criar Novo Produto</span></button>
           </div>
        ) : (
           <>
             {/* Header Restored to Clean Look */}
             <div className="px-4 md:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm z-10 sticky top-0">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Mobile Sidebar Toggle */}
                    <button 
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="md:hidden p-2 -ml-2 text-slate-500 hover:text-brand-500"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>

                    <div className="bg-slate-100 dark:bg-slate-800 w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                       {activeFolder.icon || '📂'}
                    </div>
                    <div className="flex-1 min-w-0">
                      {isEditingTitle ? (
                          <input 
                            ref={titleInputRef}
                            type="text" 
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={saveTitle}
                            onKeyDown={handleKeyDownTitle}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-brand-300 dark:border-brand-700 rounded px-2 py-1 text-lg font-black text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                      ) : (
                          <div onClick={() => startEditing(null, activeFolder)} className="group/title flex items-center cursor-pointer">
                            <h1 className="text-lg font-black text-slate-800 dark:text-white tracking-tight flex items-center group-hover/title:text-brand-500 transition-colors truncate">
                              {activeFolder.name}
                              <svg className="w-4 h-4 ml-2 opacity-0 group-hover/title:opacity-100 transition-opacity text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </h1>
                            <span className="ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] text-slate-500 rounded-full font-bold uppercase tracking-wide flex-shrink-0 hidden sm:inline-block">Pasta do Produto</span>
                          </div>
                      )}
                      {!isEditingTitle && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">Última atividade: {new Date(activeFolder.messages[activeFolder.messages.length - 1]?.timestamp || activeFolder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>}
                    </div>
                  </div>
                  <div className="flex items-center pl-4 border-l border-slate-200 dark:border-slate-800 ml-4">
                    <button onClick={(e) => handleDeleteFolder(e, activeFolder.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
             </div>

             {/* Messages */}
             <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6" ref={scrollRef}>
                {activeFolder.messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                      <div className="w-20 h-20 bg-brand-50 dark:bg-brand-500/10 rounded-3xl flex items-center justify-center text-brand-500 mb-6 shadow-xl rotate-3">
                         <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      </div>
                      <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Pasta Vazia: {activeFolder.name}</h2>
                      <p className="text-slate-500 dark:text-slate-400 mb-12 max-w-sm">Use o poder da IA para preencher esta pasta com estratégias vencedoras.</p>
                    </div>
                ) : (
                    activeFolder.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 group/message`}>
                        <div className={`flex space-x-4 max-w-[95%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                             {/* Avatar */}
                             <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'}`}>
                                {msg.role === 'user' ? 'VOCÊ' : 'IA'}
                             </div>
                             
                             {/* Message Bubble */}
                             <div className={`mt-1 text-sm shadow-sm transition-all relative ${
                               msg.role === 'user' 
                                 ? 'bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tr-none text-slate-700 dark:text-slate-200 w-full md:w-auto' 
                                 : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl rounded-tl-none w-full'
                             } ${editingMessageId === msg.id ? 'w-full md:w-[500px] ring-2 ring-brand-500/20' : ''}`}>
                                
                                {editingMessageId === msg.id ? (
                                    <div className="flex flex-col space-y-3">
                                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-y min-h-[100px]" autoFocus />
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={handleCancelEdit} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 rounded-md">Cancelar</button>
                                            <button onClick={() => handleSaveEdit(msg.id)} className="px-3 py-1.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-md shadow-md">Salvar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {msg.role === 'user' ? (
                                           <div className="relative group/content">
                                               {msg.content}
                                               {!isProcessing && (
                                                   <button onClick={() => handleEditMessage(msg)} className="absolute -left-10 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-brand-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full opacity-0 group-hover/message:opacity-100 transition-all scale-90 hover:scale-100 hidden md:block"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                               )}
                                           </div>
                                        ) : (
                                           <MessageContentRenderer content={msg.content} />
                                        )}
                                        {/* Grounding Sources Display */}
                                        {msg.groundingMetadata?.searchSources && (
                                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Fontes Verificadas</p>
                                            <div className="space-y-1">
                                                {msg.groundingMetadata.searchSources.map((s, idx) => (
                                                    <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="block text-xs text-brand-500 hover:underline truncate">{idx + 1}. {s.title}</a>
                                                ))}
                                            </div>
                                            </div>
                                        )}
                                        {msg.groundingMetadata?.mapSources && (
                                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">Locais (Maps)</p>
                                            <div className="grid grid-cols-1 gap-1">
                                                {msg.groundingMetadata.mapSources.map((s, idx) => (
                                                    <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 p-1 rounded">
                                                        <svg className="w-3 h-3 mr-2 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                                        {s.title}
                                                    </a>
                                                ))}
                                            </div>
                                            </div>
                                        )}
                                    </>
                                )}
                             </div>
                        </div>
                    </div>
                )))}
                {isProcessing && (
                    <div className="flex justify-start">
                        <div className="flex space-x-4 max-w-[90%]">
                            <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center animate-pulse">IA</div>
                            <div className="flex space-x-1 items-center mt-3">
                                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                )}
             </div>

             {/* Input Area with Tools */}
             <div className="px-4 md:px-6 py-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="max-w-3xl mx-auto">
                    {/* Tool Badges */}
                    <div className="flex items-center space-x-2 mb-3 overflow-x-auto scrollbar-hide">
                         <button 
                            onClick={() => setIsResearchMode(!isResearchMode)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border flex items-center space-x-1 whitespace-nowrap ${
                                isResearchMode 
                                ? 'bg-brand-500 border-brand-500 text-white shadow-md' 
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-brand-300'
                            }`}
                         >
                            <span>Pesquisar Web</span>
                            {isResearchMode && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse ml-1"></span>}
                         </button>
                         {isResearchMode && (
                             <button 
                                onClick={() => setUseMaps(!useMaps)}
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                                    useMaps 
                                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-500 hover:border-emerald-300'
                                }`}
                             >
                                Google Maps
                             </button>
                         )}
                    </div>

                    <div className="relative">
                    <textarea 
                        rows={1}
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage(input)}
                        placeholder={isResearchMode ? "Ex: Estatísticas de mercado 2024..." : `Nota ou comando em "${activeFolder.name}"...`}
                        className={`w-full bg-slate-50 dark:bg-slate-900 border ${isResearchMode ? 'border-brand-300 ring-2 ring-brand-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-2xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-white transition-all resize-none shadow-sm`}
                    />
                    <button onClick={() => handleSendMessage(input)} disabled={!input.trim() || isProcessing} className="absolute right-3 top-3 w-10 h-10 bg-brand-500 text-white rounded-xl flex items-center justify-center hover:bg-brand-600 disabled:opacity-20 transition-all shadow-lg shadow-brand-500/20 active:scale-95">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" /></svg>
                    </button>
                    </div>
                </div>
                <p className="text-center text-[9px] text-slate-400 mt-3 font-bold uppercase tracking-widest hidden md:block">
                    {isResearchMode ? 'Modo de Pesquisa Ativado • Dados Reais do Google' : 'Modo Criativo Ativado • Estratégia Pura'}
                </p>
             </div>
           </>
        )}
      </div>
    </div>
  );
};

export default ProductCreationChat;
