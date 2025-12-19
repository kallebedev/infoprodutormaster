
import React, { useState, useEffect, useRef } from 'react';
import { LearningItem, LearningFolder } from '../types';
import { assistNoteWriting } from '../services/geminiService';
import { supabase } from '../services/supabase';

interface LearningsSectionProps {
  learnings: LearningItem[];
  onAdd: (learning: Omit<LearningItem, 'id' | 'date'>) => void;
  onUpdate: (id: string, item: Partial<LearningItem>) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const FONTS = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Courier Prime', value: 'Courier Prime, monospace' },
  { name: 'Playfair Display', value: 'Playfair Display, serif' },
  { name: 'Merriweather', value: 'Merriweather, serif' },
];

const LearningsSection: React.FC<LearningsSectionProps> = ({ onBack }) => {
  const [view, setView] = useState<'gallery' | 'editor'>('gallery');
  const [folders, setFolders] = useState<LearningFolder[]>([]);
  const [items, setItems] = useState<LearningItem[]>([]);
  const [user, setUser] = useState<any>(null);
  
  // Navigation State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  const [activeItem, setActiveItem] = useState<LearningItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<LearningItem['attachment'] | undefined>(undefined);
  const [selectedFont, setSelectedFont] = useState(FONTS[0].value);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  
  // AI Tools State
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State for Folder Creation
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Initial Load
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
            setUser(user);
            fetchData(user.id);
        }
    });
  }, []);

  const fetchData = async (userId: string) => {
      // Fetch Folders
      const { data: folderData } = await supabase.from('learnings').select('*').eq('type', 'folder');
      if (folderData) {
          setFolders(folderData.map(d => ({ id: d.id, ...d.data })));
      }

      // Fetch Items
      const { data: itemData } = await supabase.from('learnings').select('*').eq('type', 'item');
      if (itemData) {
          setItems(itemData.map(d => ({ id: d.id, ...d.data })));
      }
  };

  const saveLearningData = async (type: 'item' | 'folder', id: string, content: any) => {
      if (!user) return;
      await supabase.from('learnings').upsert({
          id: id,
          user_id: user.id,
          type: type,
          data: content
      });
  };

  const deleteLearningData = async (id: string) => {
      await supabase.from('learnings').delete().eq('id', id);
  };

  const handleCreateNew = () => {
    setTitle('');
    setDescription('');
    setAttachment(undefined);
    setSelectedFont(FONTS[0].value);
    setActiveItem(null);
    setView('editor');
  };

  const openFolderModal = () => {
      setNewFolderName('');
      setIsFolderModalOpen(true);
      setTimeout(() => document.getElementById('new-folder-input')?.focus(), 50);
  };

  const handleCreateFolder = (e: React.FormEvent) => {
      e.preventDefault();
      if (newFolderName && newFolderName.trim()) {
          const id = Date.now().toString();
          const newFolder: LearningFolder = {
              id: id,
              name: newFolderName.trim(),
              createdAt: Date.now(),
              parentId: currentFolderId || undefined
          };
          setFolders([...folders, newFolder]);
          saveLearningData('folder', id, newFolder);
          setIsFolderModalOpen(false);
          setNewFolderName('');
      }
  };

  const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (confirm("Tem certeza? Pastas internas e anotações serão movidas para o nível anterior (ou Principal).")) {
          const folderToDelete = folders.find(f => f.id === id);
          const parentId = folderToDelete?.parentId;

          // 1. Remove the folder locally
          const remainingFolders = folders.filter(f => f.id !== id);
          
          // 2. Reparent sub-folders
          const updatedFolders = remainingFolders.map(f => {
              if (f.parentId === id) {
                  const updated = { ...f, parentId: parentId };
                  saveLearningData('folder', f.id, updated);
                  return updated;
              }
              return f;
          });
          
          setFolders(updatedFolders);
          deleteLearningData(id);
      }
  };

  const handleOpenItem = (item: LearningItem) => {
    setTitle(item.title);
    setDescription(item.description);
    setAttachment(item.attachment);
    setSelectedFont(item.fontFamily || FONTS[0].value);
    setActiveItem(item);
    setView('editor');
  };

  const handleSave = () => {
    if (title.trim()) {
      const data: any = { 
          title, 
          description: description || "Sem descrição.", 
          fontFamily: selectedFont,
          folderId: activeItem?.folderId || currentFolderId || undefined,
          attachment: attachment,
          date: Date.now()
      };
      
      if (!activeItem) {
        // Create
        const id = Math.random().toString(36).substr(2, 9);
        const newItem = { id, ...data };
        setItems(prev => [newItem, ...prev]);
        saveLearningData('item', id, newItem);
      } else {
        // Update
        const id = activeItem.id;
        const updatedItem = { ...activeItem, ...data };
        setItems(prev => prev.map(i => i.id === id ? updatedItem : i));
        saveLearningData('item', id, updatedItem);
      }
      setView('gallery');
    } else {
        alert("O item precisa de um título.");
    }
  };

  const handleDeleteItem = (id: string) => {
      setItems(prev => prev.filter(i => i.id !== id));
      deleteLearningData(id);
  };

  const handleDownload = (itemTitle: string, itemContent: string) => {
    const element = document.createElement("a");
    const fileContent = `INSIGHT ESTRATÉGICO\n\nTítulo: ${itemTitle}\nData: ${new Date().toLocaleDateString()}\n\n----------------------------\n\n${itemContent}\n\n----------------------------\nGerado por Infoprodutor Master`;
    const file = new Blob([fileContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${itemTitle || 'insight-estrategico'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadAttachment = () => {
      if (!attachment) return;
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- File Upload Logic ---
  const triggerFileUpload = () => {
      fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Limit size (e.g. 10MB) to allow bigger files like audio/short video
      if (file.size > 10 * 1024 * 1024) {
          alert("Arquivo muito grande. O limite para armazenamento local é 10MB.");
          return;
      }

      const reader = new FileReader();
      
      const isTextLike = 
        file.type.startsWith('text/') || 
        file.name.match(/\.(md|json|csv|txt|js|ts|tsx|jsx|html|css|scss|py|java|c|cpp|h|log|xml|yaml|yml|toml|ini|env|svg)$/i);

      reader.onload = () => {
          const result = reader.result as string;
          
          if (isTextLike) {
              setDescription(prev => prev ? prev + "\n\n" + result : result);
              const base64Attachment = btoa(unescape(encodeURIComponent(result))); 
              setAttachment({
                  name: file.name,
                  type: file.type || 'text/plain',
                  size: file.size,
                  url: `data:${file.type || 'text/plain'};base64,${base64Attachment}`
              });
          } else {
              setAttachment({
                  name: file.name,
                  type: file.type || 'application/octet-stream',
                  size: file.size,
                  url: result 
              });
          }
          
          if (!title) setTitle(file.name);
          if (!activeItem) setView('editor'); 
      };

      if (isTextLike) {
          reader.readAsText(file);
      } else {
          reader.readAsDataURL(file);
      }
  };

  const formatBytes = (bytes: number, decimals = 1) => {
      if (!+bytes) return '0 B';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const getFileIcon = (mimeType: string, fileName: string = '') => {
      // PDF
      if (mimeType.includes('pdf')) return (
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
      );
      // Images
      if (mimeType.includes('image')) return (
          <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      );
      // Audio
      if (mimeType.includes('audio') || fileName.match(/\.(mp3|wav|ogg|m4a)$/i)) return (
          <svg className="w-6 h-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
      );
      // Video
      if (mimeType.includes('video') || fileName.match(/\.(mp4|mov|avi|webm)$/i)) return (
          <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      );
      // Archives (Zip, Rar)
      if (mimeType.includes('zip') || mimeType.includes('compressed') || fileName.match(/\.(zip|rar|7z|tar|gz)$/i)) return (
          <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
      );
      // Spreadsheet
      if (mimeType.includes('sheet') || mimeType.includes('csv') || fileName.match(/\.(xls|xlsx|csv)$/i)) return (
          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      );
      // Code / Text
      if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('javascript') || fileName.match(/\.(js|ts|py|html|css|json)$/i)) return (
          <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
      );
      
      // Default / Word / Unknown
      return <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
  };

  // --- Editor Tools Logic ---
  const insertFormat = (prefix: string, suffix: string = '') => {
    if (!textAreaRef.current) return;
    const start = textAreaRef.current.selectionStart;
    const end = textAreaRef.current.selectionEnd;
    const text = description;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + prefix + selected + suffix + after;
    setDescription(newText);
    
    // Restore focus and cursor
    setTimeout(() => {
        if(textAreaRef.current) {
            textAreaRef.current.focus();
            textAreaRef.current.setSelectionRange(start + prefix.length, end + prefix.length);
        }
    }, 10);
  };

  const handleAiAssist = async (command: 'expand' | 'simplify' | 'action_plan' | 'continue') => {
      if (!textAreaRef.current) return;
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const selectedText = description.substring(start, end);
      
      const textToProcess = selectedText || description;
      
      if (!textToProcess.trim()) {
          alert("Escreva ou selecione algo para a IA processar.");
          return;
      }

      setIsAiProcessing(true);
      try {
          const result = await assistNoteWriting(description, command, selectedText);
          
          if (selectedText) {
              const before = description.substring(0, start);
              const after = description.substring(end);
              setDescription(before + result + after);
          } else {
              if (command === 'continue') {
                  setDescription(description + "\n\n" + result);
              } else {
                  setDescription(result);
              }
          }
      } catch (e) {
          alert("Falha no processamento IA.");
      } finally {
          setIsAiProcessing(false);
      }
  };

  // --- Logic for Views (Nested Folders) ---
  const visibleFolders = folders.filter(f => {
      if (!currentFolderId) {
          return !f.parentId;
      }
      return f.parentId === currentFolderId;
  });

  const currentItems = items.filter(item => {
      if (currentFolderId) {
          return item.folderId === currentFolderId;
      }
      const folderExists = item.folderId && folders.find(f => f.id === item.folderId);
      return !item.folderId || !folderExists;
  }).sort((a, b) => b.date - a.date);

  const getBreadcrumbs = () => {
      const crumbs = [];
      let current = folders.find(f => f.id === currentFolderId);
      while (current) {
          crumbs.unshift(current);
          current = folders.find(f => f.id === current?.parentId);
      }
      return crumbs;
  };

  const wordCount = description.trim().split(/\s+/).filter(w => w.length > 0).length;
  const readTime = Math.ceil(wordCount / 200);

  // --- Editor View ---
  if (view === 'editor') {
    const currentFontName = FONTS.find(f => f.value === selectedFont)?.name || 'Fonte';

    return (
      <div className="h-full flex flex-col bg-[#F8F9FA] dark:bg-slate-950 transition-colors">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-col z-20 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <button onClick={() => setView('gallery')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
              <input
                type="text"
                placeholder="Título do Documento"
                className="bg-transparent border-none text-lg font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-0 placeholder-slate-300 w-64 md:w-96 truncate"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-3">
               <div className="text-xs text-slate-400 font-medium mr-2 hidden md:block">
                   {isAiProcessing ? 'NEXUS Pensando...' : 'Salvo na Nuvem'}
               </div>
               <button 
                onClick={handleSave}
                className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 flex items-center"
               >
                 <span>Salvar</span>
               </button>
            </div>
          </div>
          
          {/* Enhanced Toolbar */}
          <div className="flex items-center justify-between pt-1 overflow-x-auto pb-1 scrollbar-hide">
            <div className="flex items-center space-x-1">
                {/* Font Selector */}
                <div className="relative mr-2">
                <button 
                    onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                >
                    <span>{currentFontName}</span>
                    <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isFontDropdownOpen && (
                    <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsFontDropdownOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-lg py-1 z-50">
                        {FONTS.map(font => (
                        <button
                            key={font.value}
                            onClick={() => { setSelectedFont(font.value); setIsFontDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm truncate dark:text-slate-200"
                            style={{ fontFamily: font.value }}
                        >
                            {font.name}
                        </button>
                        ))}
                    </div>
                    </>
                )}
                </div>
                
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                {/* Formatting Tools */}
                <button onClick={() => insertFormat('**', '**')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 font-bold" title="Negrito">B</button>
                <button onClick={() => insertFormat('*', '*')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 italic font-serif" title="Itálico">I</button>
                <button onClick={() => insertFormat('# ')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 font-bold text-xs" title="Título 1">H1</button>
                <button onClick={() => insertFormat('## ')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 font-bold text-xs" title="Título 2">H2</button>
                <button onClick={() => insertFormat('- ')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500" title="Lista">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <button onClick={() => insertFormat('> ')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500" title="Citação">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                </button>
            </div>

            {/* AI Magic Tools */}
            <div className="flex items-center space-x-2 pl-4 border-l border-slate-200 dark:border-slate-700 ml-2">
                <span className="text-[10px] font-black text-brand-500 uppercase tracking-wider hidden md:inline-block">AI Tools:</span>
                <button onClick={() => handleAiAssist('expand')} disabled={isAiProcessing} className="flex items-center space-x-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded-lg text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors disabled:opacity-50">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                    <span>Expandir</span>
                </button>
                <button onClick={() => handleAiAssist('simplify')} disabled={isAiProcessing} className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span>Simplificar</span>
                </button>
                <button onClick={() => handleAiAssist('action_plan')} disabled={isAiProcessing} className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    <span>Plano de Ação</span>
                </button>
            </div>
          </div>
        </header>

        {/* Attachment Banner in Editor */}
        {attachment && (
            <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {getFileIcon(attachment.type, attachment.name)}
                    <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{attachment.name}</p>
                        <p className="text-xs text-slate-500">{formatBytes(attachment.size)} • {attachment.type || 'arquivo'}</p>
                    </div>
                </div>
                <button 
                    onClick={handleDownloadAttachment}
                    className="text-xs font-bold text-brand-500 hover:text-brand-600 flex items-center bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"
                >
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download
                </button>
            </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-[#F0F2F5] dark:bg-black/20">
          <div className="w-full max-w-[816px] bg-white dark:bg-slate-900 min-h-[1056px] shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-16 relative transition-colors">
            {isAiProcessing && (
                <div className="absolute top-2 right-2 flex items-center space-x-2 bg-brand-50 text-brand-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse z-10">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.183.319l-3.08 1.914A1 1 0 002.435 19h19.13a1 1 0 00.647-1.763l-2.784-1.809z" /></svg>
                    <span>Processando...</span>
                </div>
            )}
            <textarea
              ref={textAreaRef}
              className="w-full h-full resize-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200 leading-relaxed placeholder-slate-300 selection:bg-brand-200 dark:selection:bg-brand-900"
              style={{ fontFamily: selectedFont, fontSize: '11pt', lineHeight: '1.6' }}
              placeholder="Comece a escrever seu insight ou use as ferramentas de IA acima..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        
        {/* Footer Stats */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
             <div>
                {wordCount} Palavras • ~{readTime} min leitura
             </div>
             <div>
                NEXUS EDITOR v2.1
             </div>
        </div>
      </div>
    );
  }

  // --- Gallery View ---
  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      
      {/* Folder Creation Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 p-6 transform transition-all scale-100">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Nova Pasta</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
               {currentFolderId ? 'Criar subpasta dentro da atual.' : 'Criar pasta na raiz.'}
            </p>
            <form onSubmit={handleCreateFolder}>
              <input 
                id="new-folder-input"
                type="text" 
                placeholder="Nome da pasta" 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white mb-6"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />
              <div className="flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsFolderModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-brand-500/20"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="px-6 py-6 md:px-8 md:py-8 flex flex-col md:flex-row md:items-end justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
         <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Base de Conhecimento</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 md:mt-2 font-medium text-sm md:text-base">Capture e refine suas estratégias de mercado.</p>
         </div>
         <div className="flex flex-wrap gap-3">
            <button 
              onClick={triggerFileUpload}
              className="flex-1 md:flex-none justify-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all flex items-center whitespace-nowrap"
            >
               <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>
               Upload
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect} 
                // Removed accept attribute to allow all files as requested
            />

            <button 
              onClick={openFolderModal}
              className="flex-1 md:flex-none justify-center px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors flex items-center whitespace-nowrap"
            >
               <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
               Pasta
            </button>
            <button 
              onClick={handleCreateNew}
              className="w-full md:w-auto justify-center px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/20 transition-all transform active:scale-95 flex items-center"
            >
               <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
               Novo Insight
            </button>
         </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        
        {/* Breadcrumbs Navigation */}
        <div className="flex items-center flex-wrap gap-2 mb-6 text-sm font-bold text-slate-500">
            <button 
                onClick={() => setCurrentFolderId(null)} 
                className={`hover:text-brand-500 flex items-center ${!currentFolderId ? 'text-brand-500' : ''}`}
            >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Principal
            </button>
            
            {getBreadcrumbs().map((crumb) => (
                <React.Fragment key={crumb.id}>
                    <span className="text-slate-300">/</span>
                    <button 
                        onClick={() => setCurrentFolderId(crumb.id)}
                        className={`hover:text-brand-500 ${currentFolderId === crumb.id ? 'text-brand-500 underline decoration-2 underline-offset-4' : ''}`}
                    >
                        {crumb.name}
                    </button>
                </React.Fragment>
            ))}
        </div>

        {/* Folders Grid */}
        {visibleFolders.length > 0 && (
            <div className="mb-8">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Pastas</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                    {visibleFolders.map(folder => (
                        <div 
                            key={folder.id} 
                            onClick={() => setCurrentFolderId(folder.id)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-brand-500 hover:shadow-lg transition-all group relative"
                        >
                            <div className="w-10 h-10 bg-brand-50 dark:bg-brand-500/10 rounded-lg flex items-center justify-center text-brand-500 mb-3 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white truncate">{folder.name}</h3>
                            
                            {/* Check item count + subfolder count */}
                            <p className="text-xs text-slate-400">
                                {items.filter(l => l.folderId === folder.id).length} itens
                                {folders.filter(f => f.parentId === folder.id).length > 0 && ` • ${folders.filter(f => f.parentId === folder.id).length} pastas`}
                            </p>
                            
                            <button 
                                onClick={(e) => handleDeleteFolder(folder.id, e)}
                                className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                                title="Excluir pasta"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Notes Grid */}
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
            {currentFolderId ? `Conteúdos em ${folders.find(f => f.id === currentFolderId)?.name}` : 'Anotações & Arquivos'}
        </h2>
        
        {currentItems.length === 0 && visibleFolders.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-800">
               <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                   <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
               </div>
               <p className="text-slate-500 font-medium">Pasta vazia.</p>
               <div className="mt-4 flex space-x-4">
                   <button onClick={handleCreateNew} className="text-brand-500 font-bold hover:underline">Criar insight</button>
                   <span className="text-slate-300">|</span>
                   <button onClick={triggerFileUpload} className="text-brand-500 font-bold hover:underline">Upload Arquivo</button>
               </div>
           </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {currentItems.map((item) => (
                <div 
                    key={item.id}
                    onClick={() => handleOpenItem(item)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col h-64 relative"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${item.attachment ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-brand-500'}`}>
                            {item.attachment ? getFileIcon(item.attachment.type, item.attachment.name) : item.title.charAt(0).toUpperCase()}
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 z-10"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                    
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2 line-clamp-1 truncate" title={item.title}>{item.title}</h3>
                    <p className={`text-sm text-slate-500 dark:text-slate-400 line-clamp-4 flex-1 ${item.attachment ? 'italic opacity-70' : ''}`} style={{fontFamily: item.fontFamily}}>
                        {item.attachment && !item.description.includes(item.attachment.name) 
                            ? (item.description === 'Sem descrição.' ? 'Arquivo anexado.' : item.description) 
                            : item.description}
                    </p>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                        {item.attachment && (
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">{formatBytes(item.attachment.size)}</span>
                        )}
                    </div>
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default LearningsSection;
