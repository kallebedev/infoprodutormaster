
import React, { useState } from 'react';
import { ProjectDetails } from '../types';

interface OnboardingProps {
  onSubmit: (details: ProjectDetails) => void;
  isLoading: boolean;
}

const Onboarding: React.FC<OnboardingProps> = ({ onSubmit, isLoading }) => {
  const [details, setDetails] = useState<ProjectDetails>({
    niche: '',
    productType: 'course',
    targetAudience: '',
    price: '',
    context: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDetails({ ...details, context: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(details);
  };

  return (
    <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <div className="inline-block px-4 py-1.5 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4">
          Motor de Conversão Ativado
        </div>
        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight sm:text-6xl mb-6">
          Sua Nova Máquina de <span className="text-brand-500">Vendas</span>
        </h1>
        <p className="mt-4 text-xl text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
          Filtramos a complexidade para você focar apenas no que traz lucro: Copy e Estratégia.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 py-10 px-8 shadow-2xl rounded-[2.5rem] border border-slate-100 dark:border-slate-800 transition-all duration-300">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-2">
            <div>
              <label htmlFor="niche" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nicho Estratégico</label>
              <div className="mt-1">
                <input
                  type="text"
                  name="niche"
                  id="niche"
                  required
                  placeholder="ex: Perda de Peso High Ticket"
                  className="appearance-none block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-white transition-all placeholder-slate-400 sm:text-sm"
                  value={details.niche}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="productType" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Formato da Oferta</label>
              <div className="mt-1">
                <select
                  id="productType"
                  name="productType"
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-white transition-all sm:text-sm appearance-none"
                  value={details.productType}
                  onChange={handleChange}
                >
                  <option value="course">Curso Online</option>
                  <option value="ebook">Ebook / PDF</option>
                  <option value="mentorship">Mentoria / Coaching</option>
                  <option value="spreadsheet">Template / Planilha</option>
                  <option value="webinar">Webinar / Workshop</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="targetAudience" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Público-alvo Ideal</label>
              <div className="mt-1">
                <input
                  type="text"
                  name="targetAudience"
                  id="targetAudience"
                  required
                  placeholder="ex: Profissionais C-Level frustrados com a rotina"
                  className="appearance-none block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-white transition-all placeholder-slate-400 sm:text-sm"
                  value={details.targetAudience}
                  onChange={handleChange}
                />
              </div>
            </div>

             <div className="sm:col-span-2">
              <label htmlFor="price" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ancoragem de Preço</label>
              <div className="mt-1">
                <input
                  type="text"
                  name="price"
                  id="price"
                  required
                  placeholder="ex: 12x de R$ 97,00"
                  className="appearance-none block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-white transition-all placeholder-slate-400 sm:text-sm"
                  value={details.price}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="context" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Mecanismo Único / Promessa Principal</label>
              <p className="text-[11px] text-slate-400 mb-3 ml-1 font-medium italic">Cole rascunhos, bullets ou a promessa central que diferencia seu produto.</p>
              <div className="mt-1">
                <textarea
                  id="context"
                  name="context"
                  rows={5}
                  required
                  className="appearance-none block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-white transition-all placeholder-slate-400 sm:text-sm"
                  placeholder="A promessa principal é que você vai..."
                  value={details.context}
                  onChange={handleContextChange}
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-brand-500/20 text-sm font-black text-white uppercase tracking-widest ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-600 active:scale-95'} transition-all transform duration-200`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando Dados...
                </span>
              ) : (
                'Gerar Oferta Imbatível'
              )}
            </button>
          </div>
        </form>
      </div>
      <p className="text-center mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
        Sistema de Resposta Direta v4.0 • Zero Decisões Técnicas
      </p>
    </div>
  );
};

export default Onboarding;
