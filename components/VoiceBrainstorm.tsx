
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/geminiService';

const VoiceBrainstorm: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [transcriptions, setTranscriptions] = useState<{role: 'user'|'model', text: string}[]>([]);
  
  // Refs for audio handling
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Helper to append transcription
  const addTranscription = (role: 'user' | 'model', text: string) => {
    setTranscriptions(prev => {
      // If the last message is from the same role, append to it for smoother reading
      if (prev.length > 0 && prev[prev.length - 1].role === role) {
         const newArr = [...prev];
         newArr[newArr.length - 1].text += text;
         return newArr;
      }
      return [...prev, { role, text }];
    });
  };

  const startSession = async () => {
    try {
      setStatus('connecting');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);
      outputNodeRef.current = outputNode;

      // Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('connected');
            setIsActive(true);
            
            // Setup Input Processing
            const source = inputCtx.createMediaStreamSource(stream);
            sourceRef.current = source;
            
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Transcription
            if (msg.serverContent?.outputTranscription?.text) {
               addTranscription('model', msg.serverContent.outputTranscription.text);
            }
            if (msg.serverContent?.inputTranscription?.text) {
               addTranscription('user', msg.serverContent.inputTranscription.text);
            }

            // Handle Audio Output
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputCtx) {
              const audioBytes = base64ToUint8Array(audioData);
              const buffer = await decodeAudioData(audioBytes, outputCtx);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputNode);
              source.start(nextStartTimeRef.current);
              
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              
              source.onended = () => sourcesRef.current.delete(source);
            }

            // Handle Interruption
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            setStatus('disconnected');
            setIsActive(false);
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setStatus('error');
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: "Você é um consultor estratégico de negócios digitais. Responda de forma concisa, energética e focada em resultados. Fale português do Brasil."
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (e) {
      console.error("Failed to start session:", e);
      setStatus('error');
    }
  };

  const stopSession = () => {
    // Cleanup Audio
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Close Session if possible (no explicit close method on sessionPromise usually, relies on GC or disconnect)
    // But we simulate disconnect state in UI
    setIsActive(false);
    setStatus('disconnected');
    nextStartTimeRef.current = 0;
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white relative overflow-hidden">
       {/* Background Animation */}
       <div className="absolute inset-0 z-0">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/20 rounded-full blur-[100px] transition-all duration-700 ${isActive ? 'scale-150 opacity-100' : 'scale-100 opacity-20'}`}></div>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
       </div>

       <div className="relative z-10 flex flex-col h-full max-w-2xl mx-auto w-full p-6">
          <div className="flex-1 overflow-y-auto space-y-6 scrollbar-hide py-10">
             {transcriptions.length === 0 && status !== 'connected' && (
               <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-xl">
                     <svg className="w-10 h-10 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                     </svg>
                  </div>
                  <h2 className="text-2xl font-black">Voice Brainstorm</h2>
                  <p className="text-slate-400 max-w-xs">Discuta estratégias de produto em tempo real com a IA. Fale naturalmente.</p>
               </div>
             )}
             
             {transcriptions.map((t, i) => (
                <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] rounded-2xl px-6 py-4 text-lg font-medium leading-relaxed ${
                      t.role === 'user' 
                      ? 'bg-slate-800 text-white rounded-tr-sm' 
                      : 'bg-transparent text-slate-200'
                   }`}>
                      {t.text}
                   </div>
                </div>
             ))}
             
             {/* Visualizer when connected */}
             {status === 'connected' && transcriptions.length > 0 && (
                <div className="flex justify-center py-10">
                   <div className="flex space-x-1 items-end h-8">
                      <div className="w-1 bg-brand-500 animate-[bounce_1s_infinite] h-4"></div>
                      <div className="w-1 bg-brand-500 animate-[bounce_1.2s_infinite] h-6"></div>
                      <div className="w-1 bg-brand-500 animate-[bounce_0.8s_infinite] h-8"></div>
                      <div className="w-1 bg-brand-500 animate-[bounce_1.1s_infinite] h-5"></div>
                      <div className="w-1 bg-brand-500 animate-[bounce_0.9s_infinite] h-3"></div>
                   </div>
                </div>
             )}
          </div>

          <div className="py-8 flex justify-center items-center relative">
             {status === 'connecting' && (
                <div className="absolute top-0 text-xs font-bold uppercase tracking-widest text-brand-400 animate-pulse">Conectando...</div>
             )}
             
             <button
                onClick={isActive ? stopSession : startSession}
                disabled={status === 'connecting'}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl border-4 ${
                   isActive 
                   ? 'bg-red-500 border-red-400 hover:bg-red-600 hover:scale-105' 
                   : 'bg-brand-600 border-brand-500 hover:bg-brand-500 hover:scale-110'
                }`}
             >
                {isActive ? (
                   <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                   <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                   </svg>
                )}
             </button>
             <p className="absolute bottom-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
               {isActive ? 'Toque para encerrar' : 'Toque para falar'}
             </p>
          </div>
       </div>
    </div>
  );
};

export default VoiceBrainstorm;
