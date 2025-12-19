
import React, { useEffect, useState } from 'react';
import { UserProfile, ProductFolder, LearningItem } from '../types';
import { supabase } from '../services/supabase';

interface DashboardProps {
  userProfile: UserProfile;
  onNavigate: (step: 'onboarding' | 'editor' | 'profile' | 'learnings' | 'product-creation' | 'image-studio' | 'text-to-speech' | 'dashboard') => void;
}

const MARKETING_INSIGHTS = [
  { title: "Gatilho da Escassez", body: "A escassez só funciona se for genuína. Em vez de 'vagas limitadas' falsas, use 'bônus expirando' ou 'aumento de preço programado'." },
  { title: "A Regra do Um", body: "Sua copy deve ter UMA grande ideia, fazer UMA promessa, contar UMA história e pedir UMA ação. Foco absoluto converte mais." },
  { title: "Benefício do Benefício", body: "Não venda 'perda de peso'. Venda 'voltar a usar aquele vestido favorito no casamento da sua melhor amiga'." },
  { title: "Ancoragem de Preço", body: "Nunca revele o preço antes de estabelecer que o valor entregue é pelo menos 10x maior que o custo." },
  { title: "Quebra de Padrão", body: "O cérebro ignora o comum. Comece seus anúncios ou e-mails com uma afirmação controversa ou uma imagem estranha." }
];

const Dashboard: React.FC<DashboardProps> = ({ userProfile, onNavigate }) => {
  const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  
  const [recentProjects, setRecentProjects] = useState<ProductFolder[]>([]);
  const [recentLearnings, setRecentLearnings] = useState<LearningItem[]>([]);
  const [stats, setStats] = useState({
    projectsCount: 0,
    learningsCount: 0,
    wordsGenerated: 0
  });
  const [dailyInsight, setDailyInsight] = useState(MARKETING_INSIGHTS[0]);

  useEffect(() => {
    setDailyInsight(MARKETING_INSIGHTS[Math.floor(Math.random() * MARKETING_INSIGHTS.length)]);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      // Fetch Learnings
      const { data: learningsData } = await supabase
        .from('learnings')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'item') // Only fetch items, not folders for stats
        .limit(20);

      const folders: ProductFolder[] = projectsData?.map(p => ({ id: p.id, ...p.data })) || [];
      const learnings: LearningItem[] = learningsData?.map(l => ({ id: l.id, ...l.data })) || [];

      // Calculate Stats
      const totalMessages = folders.reduce((acc, curr) => acc + (curr.messages?.length || 0), 0);
      const estimatedWords = totalMessages * 50; 

      setStats({
        projectsCount: folders.length,
        learningsCount: learnings.length,
        wordsGenerated: estimatedWords
      });

      setRecentProjects(folders.slice(0, 3));
      // Sort learnings by date desc manually since they are JSONB
      const sortedLearnings = learnings.sort((a, b) => b.date - a.date);
      setRecentLearnings(sortedLearnings.slice(0, 3));

    } catch (e) {
      console.error("Error loading dashboard data", e);
    }
  };

  const handleContinueProject = (folderId: string) => {
    // We still use localStorage for the *active* state to keep it simple between component mounts, 
    // but the data itself lives in Supabase.
    localStorage.setItem('infoprodutor_active_id', folderId);
    onNavigate('product-creation');
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-[#0B0F19] overflow-y-auto p-6 md:p-10 transition-colors scrollbar-hide">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Central de Comando
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
             {currentDate} • Bem-vindo, <span className="text-brand-500 font-bold">{userProfile.name}</span>
          </p>
        </div>
        <div>
           <button 
                onClick={() => onNavigate('product-creation')}
                className="w-full md:w-auto px-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors flex items-center justify-center shadow-xl shadow-brand-500/20 active:scale-95"
             >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Iniciar Novo Projeto
             </button>
        </div>
      </div>

      {/* Primary Modules Grid (Mirroring Sidebar Structure) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <button onClick={() => onNavigate('product-creation')} className="group bg-white dark:bg-[#131620] p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 hover:border-brand-500/30 dark:hover:border-brand-500/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg className="w-24 h-24 text-brand-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.183.319l-3.08 1.914A1 1 0 002.435 19h19.13a1 1 0 00.647-1.763l-2.784-1.809z" /></svg>
             </div>
             <div className="w-12 h-12 bg-brand-50 dark:bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.183.319l-3.08 1.914A1 1 0 002.435 19h19.13a1 1 0 00.647-1.763l-2.784-1.809z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14V4a2 2 0 012-2h12a2 2 0 012 2v10M9 2v12M15 2v12M9 8h6" /></svg>
             </div>
             <h3 className="font-bold text-slate-900 dark:text-white mb-1">Criação de Produtos</h3>
             <p className="text-xs text-slate-500 dark:text-slate-400">Desenvolva cursos, ebooks e mentorias com IA.</p>
          </button>

          <button onClick={() => onNavigate('image-studio')} className="group bg-white dark:bg-[#131620] p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 hover:border-blue-500/30 dark:hover:border-blue-500/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
             <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
             <h3 className="font-bold text-slate-900 dark:text-white mb-1">Media Studio</h3>
             <p className="text-xs text-slate-500 dark:text-slate-400">Gere imagens e vídeos de alta conversão.</p>
          </button>

          <button onClick={() => onNavigate('text-to-speech')} className="group bg-white dark:bg-[#131620] p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 hover:border-rose-500/30 dark:hover:border-rose-500/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg className="w-24 h-24 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
             </div>
             <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
             </div>
             <h3 className="font-bold text-slate-900 dark:text-white mb-1">Narrador Studio</h3>
             <p className="text-xs text-slate-500 dark:text-slate-400">Transforme roteiros em narrações realistas.</p>
          </button>

          <button onClick={() => onNavigate('learnings')} className="group bg-white dark:bg-[#131620] p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 hover:border-amber-500/30 dark:hover:border-amber-500/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg className="w-24 h-24 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
             </div>
             <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
             </div>
             <h3 className="font-bold text-slate-900 dark:text-white mb-1">Aprendizados</h3>
             <p className="text-xs text-slate-500 dark:text-slate-400">Banco de ideias, notas e estratégias.</p>
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
            
            {/* Recent Projects Section */}
            <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                    Projetos Recentes
                </h3>
                
                {recentProjects.length === 0 ? (
                    <div className="bg-white dark:bg-[#131620] border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-10 text-center">
                        <p className="text-slate-400 text-sm mb-4">Você ainda não iniciou nenhum projeto.</p>
                        <button onClick={() => onNavigate('product-creation')} className="text-brand-500 font-bold hover:underline">Iniciar Projeto Piloto &rarr;</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentProjects.map(project => (
                            <div key={project.id} onClick={() => handleContinueProject(project.id)} className="group bg-white dark:bg-[#131620] p-5 rounded-3xl border border-slate-100 dark:border-white/5 hover:border-brand-500/50 dark:hover:border-brand-500/50 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between">
                                <div className="flex items-center space-x-5 min-w-0">
                                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner flex-shrink-0">
                                        {project.icon || '📁'}
                                    </div>
                                    <div className="min-w-0 pr-4">
                                        <h4 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-brand-500 transition-colors truncate">{project.name}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                                            Editado em {new Date(project.messages && project.messages.length > 0 ? project.messages[project.messages.length - 1].timestamp : project.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                     <div className="hidden sm:block text-right">
                                         <span className="block text-xl font-black text-slate-200 dark:text-slate-700">{project.messages?.length || 0}</span>
                                         <span className="text-[9px] uppercase font-bold text-slate-400">Interações</span>
                                     </div>
                                     <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-brand-500">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                     </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Learnings */}
            <div>
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                      Anotações Estratégicas
                   </h3>
                </div>
                {recentLearnings.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 text-center text-xs text-slate-400">Nenhum insight salvo ainda.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {recentLearnings.map(item => (
                            <div key={item.id} className="bg-[#FFF8E1] dark:bg-amber-950/20 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/30 relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform" onClick={() => onNavigate('learnings')}>
                                <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm mb-2 truncate">{item.title}</h4>
                                <p className="text-xs text-amber-800/70 dark:text-amber-200/50 line-clamp-3 leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>

        {/* Right Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
            
            {/* Stats Card */}
            <div className="bg-slate-900 dark:bg-white rounded-[2.5rem] p-8 text-white dark:text-slate-900 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 dark:bg-slate-900/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="relative z-10">
                    <p className="text-xs font-black uppercase tracking-widest opacity-50 mb-6">Produtividade Total</p>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-white/10 dark:border-slate-900/10 pb-4">
                            <span className="font-bold">Projetos Ativos</span>
                            <span className="text-2xl font-black">{stats.projectsCount}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/10 dark:border-slate-900/10 pb-4">
                            <span className="font-bold">Insights Capturados</span>
                            <span className="text-2xl font-black">{stats.learningsCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold">Palavras Geradas</span>
                            <span className="text-2xl font-black">{stats.wordsGenerated > 1000 ? `${(stats.wordsGenerated/1000).toFixed(1)}k` : stats.wordsGenerated}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Insight Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                </div>
                <div className="relative z-10">
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-sm">NEXUS Daily</span>
                    <h3 className="font-bold text-2xl mb-3 leading-tight">{dailyInsight.title}</h3>
                    <p className="text-sm text-indigo-100 leading-relaxed opacity-90 font-medium">{dailyInsight.body}</p>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
