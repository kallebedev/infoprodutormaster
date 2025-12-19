import React from 'react';
import { SalesPageData, SalesPageSection } from '../types';

interface SalesPagePreviewProps {
  data: SalesPageData;
}

const SectionRenderer: React.FC<{ section: SalesPageSection; themeColor: string }> = ({ section, themeColor }) => {
  const { type, content } = section;
  const themeClass = `text-${themeColor}-600`;
  const bgThemeClass = `bg-${themeColor}-600`;
  const bgLightClass = `bg-${themeColor}-50`;

  switch (type) {
    case 'hero':
      return (
        <section className="relative py-20 px-6 text-center bg-white overflow-hidden border-b border-gray-100">
          <div className="max-w-4xl mx-auto z-10 relative">
            {content.subheadline && (
              <p className={`text-lg font-bold uppercase tracking-wide mb-4 ${themeClass}`}>
                {content.subheadline}
              </p>
            )}
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              {content.headline}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
              {content.body}
            </p>
            {content.ctaText && (
              <button className={`${bgThemeClass} text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform transition hover:scale-105 hover:shadow-xl`}>
                {content.ctaText}
              </button>
            )}
            <div className="mt-8 text-sm text-gray-500 italic">
              *Oferta por tempo limitado
            </div>
          </div>
        </section>
      );

    case 'problem':
      return (
        <section className="py-16 px-6 bg-gray-100">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">{content.headline}</h2>
            <div className="prose prose-lg text-gray-700 mx-auto whitespace-pre-wrap">
              {content.body}
            </div>
          </div>
        </section>
      );

    case 'solution':
      return (
        <section className="py-16 px-6 bg-white border-t border-b border-gray-100">
           <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
             <div>
                <h2 className={`text-3xl font-extrabold mb-4 ${themeClass}`}>{content.headline}</h2>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{content.subheadline}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{content.body}</p>
             </div>
             <div className={`${bgLightClass} rounded-xl h-64 flex items-center justify-center border-2 border-dashed border-${themeColor}-200`}>
                <span className="text-gray-400 font-medium text-center px-4">Visual do Produto / Mockup Profissional</span>
             </div>
           </div>
        </section>
      );

    case 'benefits':
      return (
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{content.headline}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {content.bullets?.map((bullet, idx) => (
                <div key={idx} className="flex items-start">
                  <div className={`flex-shrink-0 h-6 w-6 rounded-full ${bgThemeClass} flex items-center justify-center mt-1`}>
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-4 text-lg text-gray-700">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'proof':
      return (
        <section className="py-16 px-6 bg-white">
           <div className="max-w-4xl mx-auto text-center">
             <h2 className="text-2xl font-bold text-gray-900 mb-8">{content.headline}</h2>
             <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-lg border border-gray-100 shadow-sm text-left">
                    <div className="flex text-yellow-400 mb-2">★★★★★</div>
                    <p className="text-gray-600 text-sm mb-4">"Mudou absolutamente a minha vida. Não acredito que esperei tanto tempo para tentar. Super recomendado!"</p>
                    <p className="font-bold text-gray-900 text-sm">- Cliente Satisfeito {i}</p>
                  </div>
                ))}
             </div>
           </div>
        </section>
      );

    case 'guarantee':
      return (
        <section className="py-12 px-6 bg-gray-900 text-white text-center">
          <div className="max-w-2xl mx-auto border-2 border-white/20 p-8 rounded-xl bg-gray-800 shadow-inner">
             <h2 className="text-2xl font-bold mb-4">{content.headline}</h2>
             <p className="text-gray-300 text-lg mb-6">{content.body}</p>
             <div className="inline-block px-4 py-1 bg-white/10 rounded text-sm font-semibold tracking-wide border border-white/10">
               100% LIVRE DE RISCO
             </div>
          </div>
        </section>
      );

    case 'cta':
      return (
        <section className="py-20 px-6 text-center bg-white">
          <div className="max-w-3xl mx-auto">
             <h2 className="text-4xl font-extrabold text-gray-900 mb-4">{content.headline}</h2>
             <p className="text-xl text-gray-600 mb-10">{content.subheadline}</p>
             <button className={`${bgThemeClass} text-white font-bold py-5 px-10 rounded-full text-2xl shadow-xl transform transition hover:scale-105 w-full md:w-auto`}>
               {content.ctaText}
             </button>
             <p className="mt-6 text-sm text-gray-400">Pagamento Seguro • Acesso Imediato</p>
          </div>
        </section>
      );
      
    case 'faq':
        return (
            <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{content.headline || "Perguntas Frequentes"}</h2>
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="font-bold text-lg mb-2">Isso é adequado para iniciantes?</h3>
                            <p className="text-gray-600">Sim! Projetamos isso especificamente para ser acessível, independentemente do seu nível de experiência anterior.</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="font-bold text-lg mb-2">Como eu acesso o conteúdo?</h3>
                            <p className="text-gray-600">Você receberá um e-mail com detalhes de acesso imediato logo após a compra.</p>
                        </div>
                    </div>
                </div>
            </section>
        );

    default:
      return null;
  }
};

const SalesPagePreview: React.FC<SalesPagePreviewProps> = ({ data }) => {
  return (
    <div className="bg-white shadow-2xl rounded-lg overflow-hidden min-h-[80vh] border border-gray-200">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="flex-1 text-center text-xs text-gray-500 font-mono">
          preview.infoprodutormaster.com.br
        </div>
      </div>
      <div className="h-[calc(100vh-140px)] overflow-y-auto scroll-smooth">
        {data.sections.map((section) => (
          <SectionRenderer key={section.id} section={section} themeColor={data.themeColor || 'green'} />
        ))}
        <div className="py-8 text-center text-gray-400 text-sm bg-white border-t border-gray-100">
          Desenvolvido por <span className="font-bold text-gray-600">Infoprodutor Master</span>
        </div>
      </div>
    </div>
  );
};

export default SalesPagePreview;