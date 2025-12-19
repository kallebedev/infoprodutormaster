
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface AuthScreenProps {
  onAuthSuccess: (isNewUser: boolean) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, theme, onToggleTheme }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const getFriendlyErrorMessage = (errorMsg: string) => {
    const msg = errorMsg.toLowerCase();
    if (msg.includes("invalid login credentials")) {
      return "E-mail ou senha incorretos. Verifique suas credenciais.";
    }
    if (msg.includes("user already registered")) {
      return "Este e-mail já está cadastrado. Tente fazer login.";
    }
    if (msg.includes("password should be at least")) {
      return "A senha deve ter pelo menos 6 caracteres.";
    }
    return errorMsg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setInfoMessage('');
    
    // Sanitize email: trim whitespace and lowercase
    const cleanEmail = email.trim().toLowerCase();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        onAuthSuccess(false);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        
        // Check for email confirmation requirement
        if (data.user && !data.session) {
            setInfoMessage("Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro antes de entrar.");
            setIsLogin(true); // Switch to login view
            return;
        }

        // Sign up successful with session (auto-confirm enabled or not required)
        onAuthSuccess(true);
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(getFriendlyErrorMessage(error.message || "Falha na autenticação."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-900 transition-colors relative">
      
      {/* Theme Toggle Button */}
      <button
        onClick={onToggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-all shadow-sm"
        title="Alternar Tema"
      >
        {theme === 'light' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
        ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
            </svg>
        )}
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
            <div className="bg-brand-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
             <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          {isLogin ? 'Acesse seu QG' : 'Crie seu Império'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 font-medium">
          {isLogin ? 'Ainda não é um estrategista?' : 'Já possui acesso?'}
          {' '}
          <button 
            onClick={() => { setIsLogin(!isLogin); setErrorMessage(''); setInfoMessage(''); }}
            className="font-bold text-brand-600 hover:text-brand-500 transition-colors hover:underline"
          >
            {isLogin ? 'Começar agora' : 'Entrar'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-2xl sm:rounded-[2rem] sm:px-10 border border-gray-100 dark:border-slate-700 transition-colors relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-accent-500"></div>

          {infoMessage && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">
                {infoMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg border border-red-200 dark:border-red-800">
                {errorMessage}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                E-mail Corporativo
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm transition-all bg-slate-50 dark:bg-slate-900/50 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                Senha de Acesso
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm transition-all bg-slate-50 dark:bg-slate-900/50 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-500/20 text-sm font-black text-white uppercase tracking-widest bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Autenticando...</span>
                  </div>
                ) : (
                  isLogin ? 'Acessar Painel' : 'Registrar Acesso'
                )}
              </button>
            </div>
          </form>
        </div>
        
        <p className="text-center text-[10px] text-slate-400 mt-8 font-bold uppercase tracking-widest">
            Infoprodutor Master AI v4.0 • Powered by Supabase
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
