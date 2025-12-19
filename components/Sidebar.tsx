
import React from 'react';
import { UserProfile } from '../types';

interface SidebarProps {
  activeStep: string;
  onNavigate: (step: 'onboarding' | 'editor' | 'profile' | 'learnings' | 'product-creation' | 'image-studio' | 'text-to-speech' | 'dashboard') => void;
  userProfile: UserProfile;
  isSalesPageGenerated: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeStep, 
  onNavigate, 
  userProfile, 
  isSalesPageGenerated, 
  theme, 
  onToggleTheme,
  isOpen,
  onClose,
  onLogout
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Visão Geral',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      disabled: false
    },
    {
      id: 'product-creation',
      label: 'Criação de Produtos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.183.319l-3.08 1.914A1 1 0 002.435 19h19.13a1 1 0 00.647-1.763l-2.784-1.809z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14V4a2 2 0 012-2h12a2 2 0 012 2v10M9 2v12M15 2v12M9 8h6" />
        </svg>
      ),
      disabled: false
    },
    {
      id: 'image-studio',
      label: 'Media Studio',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      disabled: false
    },
    {
      id: 'text-to-speech',
      label: 'Narrador AI',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      disabled: false
    },
    {
      id: 'learnings',
      label: 'Aprendizados',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      disabled: false
    },
    {
      id: 'profile',
      label: 'Meu Perfil',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      disabled: false
    }
  ];

  const handleNavClick = (id: any) => {
    onNavigate(id);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Drawer */}
      <aside 
        className={`fixed inset-y-0 left-0 w-72 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200 dark:border-white/5 flex flex-col h-full z-50 transform transition-transform duration-300 ease-out shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand Logo & Close */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-brand-600 to-accent-600 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 transform rotate-3 flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
                <span className="block text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                Infoprodutor
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-accent-500">
                Master AI
                </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-black text-slate-400/80 uppercase tracking-widest px-3 mb-4 mt-2">Plataforma</div>
          {navItems.map((item) => {
            const isActive = activeStep === item.id;
            return (
              <button
                key={item.id}
                disabled={item.disabled}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative overflow-hidden ${
                  isActive
                    ? 'text-white shadow-lg shadow-brand-500/25'
                    : item.disabled
                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-accent-600"></div>
                )}
                <span className={`relative z-10 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors'}`}>
                  {item.icon}
                </span>
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile Section */}
        <div className="p-4 space-y-4 bg-slate-50/50 dark:bg-black/20 border-t border-slate-200 dark:border-white/5 backdrop-blur-sm">
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-700 transition-all"
          >
            <div className="flex items-center space-x-2">
              {theme === 'light' ? (
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              <span>{theme === 'light' ? 'Modo Claro' : 'Modo Escuro'}</span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-brand-600' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all`} style={{left: theme === 'dark' ? '18px' : '2px'}}></div>
            </div>
          </button>

          <div className="flex items-center space-x-3 pt-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 p-0.5 shadow-md">
                <div className="h-full w-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                    {userProfile.avatar ? (
                        <img src={userProfile.avatar} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-sm font-bold text-brand-600">{userProfile.name.charAt(0)}</span>
                    )}
                </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userProfile.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Plano Pro</p>
            </div>
            <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Sair"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
