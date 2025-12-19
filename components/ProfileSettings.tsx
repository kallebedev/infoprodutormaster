
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';

interface ProfileSettingsProps {
  profile: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
  onBack: () => void;
  isInitialSetup?: boolean;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile, onSave, onBack, isInitialSetup = false }) => {
  const [formData, setFormData] = useState<UserProfile>({
    ...profile,
    age: profile.age || '',
    lifeGoals: profile.lifeGoals || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Handle global drag events to prevent stopping when cursor leaves the container
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleWindowMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem é muito grande. Escolha uma imagem de até 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
        setIsCropping(true);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmCrop = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Output resolution
    const OUTPUT_SIZE = 400;
    const PREVIEW_SIZE = 256; // w-64 is 16rem = 256px
    const scaleFactor = OUTPUT_SIZE / PREVIEW_SIZE;

    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const img = imageRef.current;
    
    // Calculate drawing parameters matching the preview visual
    // Visual size in preview = natural * zoom
    // We scale that up to match output resolution
    const drawWidth = img.naturalWidth * zoom * scaleFactor;
    const drawHeight = img.naturalHeight * zoom * scaleFactor;
    
    // Calculate position
    // Center of canvas (200,200) corresponds to Center of Preview
    // Offset is shift from center in Preview pixels, so we scale it
    const startX = (OUTPUT_SIZE - drawWidth) / 2 + (offset.x * scaleFactor);
    const startY = (OUTPUT_SIZE - drawHeight) / 2 + (offset.y * scaleFactor);

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    
    // Enhance quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(img, startX, startY, drawWidth, drawHeight);

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9);
    setFormData({ ...formData, avatar: croppedBase64 });
    setIsCropping(false);
    setTempImage(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    // Store the difference between current mouse pos and current offset
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      onSave(formData);
      setIsSaving(false);
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Cropper Modal */}
      {isCropping && tempImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md transition-all">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">Ajustar Foto de Perfil</h3>
              <button onClick={() => setIsCropping(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 flex flex-col items-center">
              <div 
                className="relative w-64 h-64 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-move shadow-inner border-4 border-white dark:border-slate-800"
                onMouseDown={handleMouseDown}
              >
                <img 
                  ref={(el) => { if (el) imageRef.current = el; }}
                  src={tempImage} 
                  alt="Ajuste" 
                  className="absolute max-w-none pointer-events-none select-none"
                  style={{
                    width: 'auto',
                    height: 'auto',
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: 'center center'
                  }}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    // Initial Zoom to cover the circle area
                    const scale = 256 / Math.min(img.naturalWidth, img.naturalHeight);
                    setZoom(scale);
                  }}
                />
                {/* Overlay Ring to emphasize circle crop */}
                <div className="absolute inset-0 pointer-events-none ring-[100px] ring-slate-900/40 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]"></div>
              </div>
              
              <div className="w-full mt-8 space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-xs font-bold text-slate-400">−</span>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="5" 
                    step="0.01" 
                    value={zoom} 
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                  <span className="text-xs font-bold text-slate-400">+</span>
                </div>
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Arraste para posicionar e use o slider para redimensionar</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex space-x-3">
              <button 
                onClick={() => setIsCropping(false)}
                className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmCrop}
                className="flex-1 py-3 bg-brand-500 text-white text-sm font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand-500/20 hover:bg-brand-600 active:scale-95 transition-all"
              >
                Aplicar Ajuste
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}

      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
             {isInitialSetup ? 'Gestão de Identidade' : 'Editar Perfil'}
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">Configure seu perfil e ambições estratégicas.</p>
        </div>
        <button 
          onClick={onBack}
          className="text-sm font-bold text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {isInitialSetup ? 'Pular configuração →' : 'Voltar'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-2xl rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="flex items-center space-x-8 mb-10">
            <div className="relative group">
              <div className="h-28 w-28 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-brand-500 border-4 border-white dark:border-slate-800 overflow-hidden shadow-xl">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl font-black">{formData.name.charAt(0) || 'U'}</span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-brand-500/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 012 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </button>
            </div>
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect} 
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-bold text-brand-500 hover:text-brand-600 block px-4 py-2 bg-brand-50 dark:bg-brand-500/10 rounded-lg transition-colors"
              >
                Alterar Avatar
              </button>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">Recomendado: Foto centralizada (Até 5MB)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 gap-x-6">
            <div className="sm:col-span-1">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome de Exibição</label>
              <input
                type="text"
                className="mt-1 block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-white transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Sua Idade</label>
              <input
                type="number"
                placeholder="Ex: 28"
                className="mt-1 block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-white transition-all"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Metas de Vida & Ambições</label>
              <textarea
                placeholder="Quais são seus grandes objetivos? Ex: Alcançar 10k/mês, liberdade geográfica..."
                rows={4}
                className="mt-1 block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-white transition-all"
                value={formData.lifeGoals}
                onChange={(e) => setFormData({ ...formData, lifeGoals: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              {isInitialSetup ? 'Cancelar / Pular' : 'Cancelar'}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-10 py-3 bg-brand-500 text-white text-sm font-black uppercase tracking-widest rounded-xl shadow-xl shadow-brand-500/20 hover:bg-brand-600 active:scale-95 transition-all flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Perfil</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
