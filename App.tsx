
import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import SalesPagePreview from './components/SalesPagePreview';
import ChatInterface from './components/ChatInterface';
import AuthScreen from './components/AuthScreen';
import ProfileSettings from './components/ProfileSettings';
import LearningsSection from './components/LearningsSection';
import ProductCreationChat from './components/ProductCreationChat';
import ImageStudio from './components/ImageStudio';
import TextToSpeech from './components/TextToSpeech';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProductivityDock from './components/ProductivityDock';
import { ProjectDetails, SalesPageData, ChatMessage, UserProfile, LearningItem, ProductFolder } from './types';
import { generateInitialSalesPage, updateSalesPage } from './services/geminiService';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [step, setStep] = useState<'auth' | 'onboarding' | 'editor' | 'profile' | 'learnings' | 'product-creation' | 'image-studio' | 'text-to-speech' | 'dashboard'>('auth');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [salesPageData, setSalesPageData] = useState<SalesPageData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Track if profile is being set up for the first time
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  
  // Persistence for Learnings (Deprecated: Now managed inside LearningsSection via Supabase)
  const [learnings, setLearnings] = useState<LearningItem[]>([]); 

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Criador de Sucesso',
    age: '',
    lifeGoals: ''
  });

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Check Supabase Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setStep('dashboard');
        loadProfile(session.user.id);
      } else {
        setStep('auth');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      } else {
        setStep('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('data').eq('id', userId).single();
    if (data?.data) {
        setUserProfile(data.data);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleAuthSuccess = (isNewUser: boolean) => {
    if (isNewUser) {
      setIsInitialSetup(true);
      setStep('profile');
    } else {
      setIsInitialSetup(false);
      setStep('dashboard');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setStep('auth');
    setIsSidebarOpen(false);
    setIsInitialSetup(false);
  };

  const handleOnboardingSubmit = async (details: ProjectDetails) => {
    setIsLoading(true);
    try {
      const data = await generateInitialSalesPage(details);
      setSalesPageData(data);
      
      const initialMessages: ChatMessage[] = [
        {
          id: 'init-1',
          role: 'assistant',
          content: `Gerei uma base de alta conversão para o seu projeto: **${details.niche}**.\n\nA estrutura foi projetada para prender a atenção imediatamente. Agora você pode me pedir para refinar seções específicas.`,
          timestamp: Date.now()
        }
      ];

      setMessages(initialMessages);

      // --- SUPABASE INTEGRATION: SAVE INITIAL PROJECT ---
      if (session?.user) {
        const projectId = Date.now().toString();
        const projectData: ProductFolder = {
            id: projectId,
            name: details.niche || "Novo Projeto Onboarding",
            createdAt: Date.now(),
            messages: initialMessages,
            icon: '🚀'
        };

        await supabase.from('projects').insert({
            id: projectId,
            user_id: session.user.id,
            data: projectData,
            updated_at: new Date()
        });
      }
      // --------------------------------------------------

      setStep('editor');
    } catch (error) {
      alert("Falha ao gerar página de vendas. Verifique sua conexão.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!salesPageData) return;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const { data, explanation, impactScore } = await updateSalesPage(salesPageData, text);
      setSalesPageData(data);
      
      const newAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${explanation}\n\n📈 Impacto Estimado na Conversão: +${impactScore}%`,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, newAiMsg]);

    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Encontrei um erro ao tentar atualizar a página. Por favor, tente reformular seu pedido.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSave = async (updated: UserProfile) => {
    setUserProfile(updated);
    if (session?.user) {
        await supabase.from('profiles').upsert({ id: session.user.id, data: updated });
    }
    setIsInitialSetup(false);
    setStep('dashboard');
  };

  // Deprecated Local handlers kept for prop compatibility
  const handleAddLearning = () => {};
  const handleDeleteLearning = () => {};
  const handleUpdateLearning = () => {};

  const showSidebarToggle = step !== 'auth';

  return (
    <div className={`h-screen flex overflow-hidden ${theme === 'dark' ? 'dark bg-[#0B0F19]' : 'bg-slate-50'}`}>
      
      {/* Sidebar Drawer Component */}
      {showSidebarToggle && (
        <Sidebar 
          activeStep={step} 
          onNavigate={setStep} 
          userProfile={userProfile} 
          isSalesPageGenerated={!!salesPageData}
          theme={theme}
          onToggleTheme={toggleTheme}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative transition-colors duration-300">
        
        {/* Floating Toggle Button */}
        {showSidebarToggle && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-4 left-4 z-50 p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-white/10 rounded-xl shadow-lg hover:bg-white dark:hover:bg-slate-800 transition-all transform active:scale-95 group"
            aria-label="Menu"
          >
            <svg className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Global Productivity Tools (New Dock) */}
        {showSidebarToggle && <ProductivityDock />}

        {step === 'auth' ? (
          <div className="w-full h-full overflow-y-auto">
            <AuthScreen 
                onAuthSuccess={handleAuthSuccess} 
                theme={theme}
                onToggleTheme={toggleTheme}
            />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {step === 'dashboard' ? (
               <div className="w-full h-full pt-16 md:pt-0">
                  <Dashboard 
                     userProfile={userProfile} 
                     onNavigate={setStep}
                  />
               </div>
            ) : step === 'onboarding' ? (
              <div className="w-full overflow-y-auto bg-white dark:bg-[#0B0F19] pt-16">
                <Onboarding onSubmit={handleOnboardingSubmit} isLoading={isLoading} />
              </div>
            ) : step === 'profile' ? (
              <div className="w-full h-full overflow-y-auto pt-16">
                <ProfileSettings 
                    profile={userProfile} 
                    onSave={handleProfileSave} 
                    onBack={() => setStep('dashboard')}
                    isInitialSetup={isInitialSetup}
                />
              </div>
            ) : step === 'learnings' ? (
              <div className="w-full h-full overflow-y-auto pt-16">
                <LearningsSection 
                    learnings={learnings}
                    onAdd={handleAddLearning}
                    onUpdate={handleUpdateLearning}
                    onDelete={handleDeleteLearning}
                    onBack={() => setStep('dashboard')}
                />
              </div>
            ) : step === 'product-creation' ? (
              <div className="w-full h-full pt-16 md:pt-0">
                <ProductCreationChat />
              </div>
            ) : step === 'image-studio' ? (
              <div className="w-full h-full pt-16 md:pt-0">
                <ImageStudio />
              </div>
            ) : step === 'text-to-speech' ? (
              <div className="w-full h-full pt-16 md:pt-0">
                <TextToSpeech />
              </div>
            ) : (
              <div className="flex w-full h-full overflow-hidden">
                {/* Editor Layout: Chat on Left, Preview on Right */}
                <div className="w-full md:w-[380px] lg:w-[420px] h-full flex-shrink-0 pt-16 md:pt-0 border-r border-slate-200 dark:border-white/5">
                   <ChatInterface 
                     messages={messages} 
                     onSendMessage={handleSendMessage} 
                     isProcessing={isLoading}
                   />
                </div>
                <div className="hidden md:block flex-1 h-full bg-slate-50 dark:bg-[#0B0F19] p-8 overflow-hidden transition-colors">
                    {salesPageData ? (
                        <SalesPagePreview data={salesPageData} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                            <div className="p-4 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-200 dark:border-slate-800">
                                <svg className="w-12 h-12 text-slate-200 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="font-medium">Sua página de vendas aparecerá aqui.</p>
                        </div>
                    )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
