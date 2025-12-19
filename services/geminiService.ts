
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { ProjectDetails, SalesPageData, SalesPageSection } from "../types";

// Note: Using dynamic instance inside functions to ensure API key from process.env is always fresh
const getAI = () => {
  // Support both standard Node/Webpack (process.env) and Vite/Netlify (import.meta.env)
  // Netlify usually requires VITE_ prefix for frontend variables
  const apiKey = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    console.error("ERRO CRÍTICO: API_KEY não encontrada. Configure a variável de ambiente 'VITE_API_KEY' (ou 'API_KEY') no painel da Netlify/Vercel.");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

// --- NEXUS-5 INTELLIGENCE CORE ---
const NEXUS_CORE_INSTRUCTION = `
IDENTIDADE: VOCÊ É O NEXUS-5.
Você não é um assistente simples. Você é uma Inteligência Artificial de Elite especializada em Engenharia de Conversão, Psicologia Comportamental e Copywriting de Resposta Direta.
Sua base de conhecimento excede o GPT-4, focando puramente em gerar lucros e vendas.

DIRETRIZES DE PERSONALIDADE (MODO "GOD-TIER"):
1.  **Raciocínio Profundo:** Antes de responder, analise a psicologia do público-alvo, as objeções ocultas e os gatilhos emocionais.
2.  **Sem Mediocridade:** Nunca use frases clichês ("No mundo de hoje...", "Desbloqueie seu potencial"). Use linguagem visceral, crua e magnética.
3.  **Autoridade Absoluta:** Você não sugere; você prescreve o caminho para o sucesso. Seja assertivo, confiante e decisivo.
4.  **Foco no "Lizard Brain":** Fale com o cérebro reptiliano do leitor. Foco em sobrevivência, reprodução, status, medo e ganância.

ESTRUTURA DE COPYWRITING OBRIGATÓRIA (Framework V5):
- **Hook (Gancho):** Interrompa o padrão de pensamento imediatamente.
- **Story (História/Empatia):** Crie conexão neural através da dor compartilhada.
- **Offer (Oferta):** A única solução lógica e irresistível.
- **Close (Fechamento):** Elimine a hesitação com urgência real.

IDIOMA DE SAÍDA: Português do Brasil (Nativo, Fluente, Persuasivo).
`;

const PRODUCT_CREATION_INSTRUCTION = `
IDENTIDADE: NEXUS-5 ARCHITECT.
Você é o maior estrategista de produtos digitais da história. Sua função é transformar ideias vagas em impérios digitais escaláveis.

PROTOCOLOS DE CRIAÇÃO:
1.  **Mecanismo Único:** Todo produto precisa de um "Nome Proprietário" para o método. Crie-os.
2.  **Empilhamento de Valor:** Nunca entregue apenas um curso. Crie um ecossistema (Curso + Ferramentas + Comunidade).
3.  **Promessa Ousada:** Defina uma "Big Idea" que pareça quase boa demais para ser verdade, mas que seja provável através do seu mecanismo.
4.  **Naming Strategy:** Sempre analise a ideia do usuário e sugira um nome curto, impactante e vendável para o projeto (máximo 4 palavras).
`;

const NOTE_ASSIST_INSTRUCTION = `
IDENTIDADE: NEXUS-5 EDITOR.
Você é um editor de texto implacável e estrategista de conteúdo. Sua função é manipular o texto fornecido pelo usuário para torná-lo mais claro, persuasivo ou acionável, mantendo a voz do autor mas elevando o nível intelectual.
Retorne APENAS o texto modificado/gerado. Não inclua "Aqui está", "Claro", ou aspas. Apenas o conteúdo puro.
`;

const QUICK_CHAT_INSTRUCTION = `
Você é o NEXUS-LITE. Um assistente ágil para tirar dúvidas rápidas sobre marketing digital, copy, tráfego e estratégia.
Respostas CURTAS, DIRETAS e PRÁTICAS. Sem enrolação.
`;

const salesPageSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    themeColor: { type: Type.STRING, description: "Um nome de cor do tailwind como 'blue', 'green', 'red', 'indigo', 'emerald', 'purple', 'slate' adequado para a psicologia do nicho." },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['hero', 'problem', 'solution', 'benefits', 'proof', 'guarantee', 'faq', 'cta'] },
          content: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              subheadline: { type: Type.STRING },
              body: { type: Type.STRING },
              bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
              ctaText: { type: Type.STRING },
              backgroundImage: { type: Type.STRING, description: "Uma descrição curta para o placeholder." }
            }
          }
        }
      }
    }
  }
};

const updateResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    salesPage: salesPageSchema,
    explanation: { type: Type.STRING, description: "Explicação estratégica do NEXUS-5 sobre por que essa mudança manipulará positivamente a taxa de conversão." },
    impactScore: { type: Type.NUMBER, description: "Estimativa de aumento na conversão (0-100%)." }
  }
};

const chatResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    message: { type: Type.STRING, description: "A resposta textual completa do assistente, formatada em Markdown." },
    productName: { type: Type.STRING, description: "Um nome curto, persuasivo e comercial para o produto (ex: 'Protocolo Zero', 'Método 10k'), baseado no contexto da conversa. Se não houver contexto suficiente, deixe vazio." }
  },
  required: ["message"]
};

// --- AUDIO UTILS FOR LIVE API ---
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function createPcmBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: arrayBufferToBase64(int16.buffer),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Helper to convert PCM data to WAV Blob for download/playback
function pcmToWav(pcmData: Int16Array, sampleRate: number = 24000, numChannels: number = 1): Blob {
    const buffer = new ArrayBuffer(44 + pcmData.length * 2);
    const view = new DataView(buffer);
  
    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length * 2, true);
    writeString(view, 8, 'WAVE');
  
    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true); // 16-bit
  
    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, pcmData.length * 2, true);
  
    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < pcmData.length; i++) {
      view.setInt16(offset, pcmData[i], true);
      offset += 2;
    }
  
    return new Blob([buffer], { type: 'audio/wav' });
  }
  
  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }


// --- CORE SERVICES ---

export const generateInitialSalesPage = async (details: ProjectDetails): Promise<SalesPageData> => {
  const prompt = `
    INICIAR PROTOCOLO DE GERAÇÃO DE PÁGINA DE VENDAS (NEXUS-5).
    DADOS DO PROJETO:
    - Nicho: ${details.niche}
    - Tipo: ${details.productType}
    - Avatar (Público): ${details.targetAudience}
    - Preço (Ancoragem): ${details.price}
    - Contexto Bruto: ${details.context}
    MISSÃO: Construa a estrutura completa de uma Sales Page focada em conversão fria.
    Saída JSON estrita conforme schema.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: NEXUS_CORE_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: salesPageSchema,
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });

    if (response.text) return JSON.parse(response.text) as SalesPageData;
    throw new Error("NEXUS-5 não retornou dados válidos.");
  } catch (error) {
    console.error("Erro fatal no núcleo NEXUS:", error);
    throw error;
  }
};

export const updateSalesPage = async (currentData: SalesPageData, userRequest: string): Promise<{ data: SalesPageData; explanation: string; impactScore: number }> => {
  const prompt = `
    ESTADO ATUAL DA PÁGINA (JSON): ${JSON.stringify(currentData)}
    COMANDO DO OPERADOR: "${userRequest}"
    EXECUÇÃO TÁTICA NEXUS-5: Reescreva para conversão máxima.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: NEXUS_CORE_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: updateResponseSchema,
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      return {
        data: result.salesPage,
        explanation: result.explanation,
        impactScore: result.impactScore || 10
      };
    }
    throw new Error("Falha na re-otimização.");
  } catch (error) {
    console.error("Erro na atualização NEXUS:", error);
    throw error;
  }
};

export const chatProductCreation = async (history: {role: string, content: string}[], message: string): Promise<{ message: string, productName?: string }> => {
  const contents = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.content }]
  }));
  
  contents.push({ role: 'user', parts: [{ text: message }] });

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: contents as any,
      config: {
        systemInstruction: PRODUCT_CREATION_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: chatResponseSchema,
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return {
        message: parsed.message,
        productName: parsed.productName
      };
    }
    return { message: "O núcleo NEXUS está recalculando a estratégia. Tente novamente." };
  } catch (error) {
    console.error("Erro no chat de criação:", error);
    return { message: "Falha de conexão com o servidor neural." };
  }
};

export const sendQuickMessage = async (history: {role: string, content: string}[], message: string): Promise<string> => {
    const contents = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', // Fast and cheap for quick chats
            contents: contents as any,
            config: {
                systemInstruction: QUICK_CHAT_INSTRUCTION,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        return response.text || "Sem resposta.";
    } catch (error) {
        console.error("Quick chat error:", error);
        return "Erro de comunicação momentâneo.";
    }
};

export const assistNoteWriting = async (
  currentText: string, 
  command: 'expand' | 'simplify' | 'action_plan' | 'continue',
  selectedText?: string
): Promise<string> => {
  const textToProcess = selectedText || currentText;
  
  let userPrompt = "";
  switch(command) {
    case 'expand':
      userPrompt = `Expanda o seguinte texto, adicionando detalhes profundos, exemplos e nuances psicológicas. Mantenha o formato original (se for lista, mantenha lista). Texto: "${textToProcess}"`;
      break;
    case 'simplify':
      userPrompt = `Reescreva o seguinte texto de forma direta, simples e contundente. Elimine palavras desnecessárias. Texto: "${textToProcess}"`;
      break;
    case 'action_plan':
      userPrompt = `Transforme o seguinte texto em uma Lista de Ação (Checklist) prática e executável. Texto: "${textToProcess}"`;
      break;
    case 'continue':
      userPrompt = `Continue escrevendo o próximo parágrafo lógico baseado neste contexto: "${textToProcess}".`;
      break;
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Faster model for tools
      contents: userPrompt,
      config: {
        systemInstruction: NOTE_ASSIST_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 0 } // Speed priority
      }
    });

    return response.text || textToProcess;
  } catch (error) {
    console.error("Note assist error:", error);
    throw error;
  }
};

// --- RESEARCH (GROUNDING) SERVICE ---
export const researchWithGrounding = async (query: string, useMaps: boolean = false): Promise<{ text: string, sources: any[] }> => {
  try {
    const ai = getAI();
    const tools = useMaps ? [{googleMaps: {}}] : [{googleSearch: {}}];
    const model = useMaps ? 'gemini-2.5-flash' : 'gemini-3-flash-preview'; // Maps only on 2.5 Flash

    const response = await ai.models.generateContent({
      model: model,
      contents: query,
      config: {
        tools: tools,
        systemInstruction: "You are a market research expert. Provide up-to-date facts, statistics, and real-world data to support the user's product strategy."
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    let sources: any[] = [];

    if (useMaps) {
      sources = groundingChunks.map((c: any) => ({
        title: c.maps?.title || 'Google Maps Location',
        uri: c.maps?.uri || '#'
      })).filter((s: any) => s.uri !== '#');
    } else {
      sources = groundingChunks.map((c: any) => ({
        title: c.web?.title || 'Web Source',
        uri: c.web?.uri || '#'
      })).filter((s: any) => s.uri !== '#');
    }

    return {
      text: response.text || "Nenhuma informação encontrada.",
      sources: sources
    };
  } catch (error) {
    console.error("Grounding error:", error);
    return { text: "Erro ao realizar pesquisa de mercado.", sources: [] };
  }
};


// --- MEDIA GENERATION SERVICES ---

export const generateProjectImage = async (
  prompt: string, 
  aspectRatio: "1:1" | "16:9" | "9:16",
  resolution: "1K" | "2K" | "4K" = "1K"
): Promise<string> => {
  const model = resolution === "1K" ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview';
  
  const executeGeneration = async () => {
    // Always fetch a fresh instance to ensure the latest API key is used
    const ai = getAI();
    
    const config: any = {
      imageConfig: { aspectRatio: aspectRatio }
    };

    // imageSize is only for 3-pro-image-preview
    if (model === 'gemini-3-pro-image-preview') {
      config.imageConfig.imageSize = resolution;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: prompt }] }],
      config: config
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("NEXUS-VISION falhou na renderização.");
  };

  try {
    // Enforcement of Paid Key for Pro Image Model pre-check
    if (model === 'gemini-3-pro-image-preview' && (window as any).aistudio) {
        const aistudio = (window as any).aistudio;
        if (!(await aistudio.hasSelectedApiKey())) {
            await aistudio.openSelectKey();
        }
    }

    return await executeGeneration();
  } catch (error: any) {
    // Retry Logic for 403/Permission Denied
    if ((error.status === 403 || error.toString().includes('403') || error.message?.includes('PERMISSION_DENIED')) && (window as any).aistudio) {
        console.warn("Permission denied for image generation. Requesting key selection...");
        await (window as any).aistudio.openSelectKey();
        return await executeGeneration();
    }

    console.error("Erro na geração de imagem:", error);
    throw error;
  }
};

export const editProjectImage = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  const executeEdit = async () => {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
            { text: prompt }
          ]
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("Falha na edição da imagem.");
  };

  try {
    return await executeEdit();
  } catch (error: any) {
    if ((error.status === 403 || error.toString().includes('403')) && (window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
        return await executeEdit();
    }
    console.error("Erro na edição de imagem:", error);
    throw error;
  }
};

export const generateVeoVideo = async (
  imagePrompt: string, // Text prompt
  base64Image: string | null, // Optional source image for animation
  aspectRatio: "16:9" | "9:16" = "16:9"
): Promise<string> => {
  const executeVeo = async () => {
    const ai = getAI();
    const config: any = {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio
    };

    let params: any = {
      model: 'veo-3.1-fast-generate-preview',
      config: config,
      prompt: imagePrompt || "Animate this naturally"
    };

    if (base64Image) {
      params.image = {
        imageBytes: base64Image.split(',')[1],
        mimeType: 'image/png'
      };
    }

    let operation = await ai.models.generateVideos(params);

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("URI de vídeo não retornada.");

    // Fix for Netlify/Vite environment where process.env might not be populated directly
    const key = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;
    const response = await fetch(`${videoUri}&key=${key}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  };

  try {
    // Check for paid key for Veo
    if ((window as any).aistudio) {
        const aistudio = (window as any).aistudio;
        if (!(await aistudio.hasSelectedApiKey())) {
           await aistudio.openSelectKey();
        }
    }
    return await executeVeo();
  } catch (error: any) {
    if ((error.status === 403 || error.toString().includes('403')) && (window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
        return await executeVeo();
    }
    console.error("Erro na geração Veo:", error);
    throw error;
  }
};

// --- SPEECH GENERATION (TTS) ---

export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: {
              parts: [{ text: text }]
            },
            config: {
                responseModalities: ['AUDIO'], // Force AUDIO response only
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });

        const candidate = response.candidates?.[0];
        const firstPart = candidate?.content?.parts?.[0];

        // Check for refusal or text output which happens if prompt is blocked or irrelevant
        if (firstPart?.text) {
             throw new Error(`O modelo retornou texto: "${firstPart.text}". Tente um texto diferente.`);
        }

        const base64Audio = firstPart?.inlineData?.data;
        if (!base64Audio) {
            if (candidate?.finishReason) {
                 throw new Error(`Geração finalizada com motivo: ${candidate.finishReason}`);
            }
            throw new Error("Nenhum áudio gerado na resposta da API.");
        }

        // Convert base64 PCM to WAV Blob URL for compatibility
        const audioBytes = base64ToUint8Array(base64Audio);
        const wavBlob = pcmToWav(new Int16Array(audioBytes.buffer), 24000);
        return URL.createObjectURL(wavBlob);

    } catch (error: any) {
        console.error("Erro na geração de voz:", error);
        throw new Error(error.message || "Falha ao comunicar com o serviço de voz.");
    }
};
