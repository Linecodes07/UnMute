import { GoogleGenAI, Modality } from "@google/genai";
import { blobToBase64 } from "./audioUtils";

// Initialize Gemini Client
// @ts-ignore - Env variable is injected by runtime
const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey });

/**
 * 1. Fast AI Response: Categorize complaint using Flash Lite
 * Restriction: gemini-2.5-flash-lite (mapped via gemini-flash-lite-latest)
 */
export const categorizeComplaint = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Categorize the following ragging complaint into one word (e.g., Physical, Verbal, Cyber, Exclusion, Financial): "${text}"`,
    });
    return response.text?.trim() || "Uncategorized";
  } catch (error) {
    console.error("Categorization failed", error);
    return "General";
  }
};

/**
 * 2. Transcribe Audio
 * Restriction: gemini-3-flash-preview
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const base64Data = await blobToBase64(audioBlob);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type, 
              data: base64Data,
            },
          },
          { text: "Transcribe this audio exactly as spoken." },
        ],
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription failed", error);
    throw error;
  }
};

/**
 * 3. Thinking Mode: Deep Analysis
 * Restriction: gemini-3-pro-preview with thinkingBudget: 32768
 */
export const analyzeComplaintDeeply = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze this student ragging complaint. Assess the severity, identify potential policy violations, and suggest immediate actions for the Anti-Ragging Committee. Complaint: "${text}"`,
      config: {
        thinkingConfig: {
            thinkingBudget: 32768
        }
      }
    });
    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Deep analysis failed", error);
    return "Error generating analysis.";
  }
};

/**
 * 4. Chatbot
 * Restriction: gemini-3-pro-preview
 */
export const getChatResponse = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history,
      config: {
        systemInstruction: "You are a supportive, empathetic, and knowledgeable AI assistant for the 'UnMute' anti-ragging app. Your goal is to help students feel safe, provide legal or procedural information about ragging, and encourage them to report incidents. Be concise but warm."
      }
    });
    
    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Chat error", error);
    return "I'm having trouble connecting right now. Please try again later.";
  }
};

/**
 * 5. Search Grounding
 * Restriction: gemini-3-flash-preview with googleSearch
 */
export const getGroundingResources = async (query: string): Promise<{ text: string; links: string[] }> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Find up-to-date helplines, legal acts, and support resources in India regarding: ${query}`,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        
        const text = response.text || "";
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        // Extract URLs from chunks
        const links = chunks
            .map((c: any) => c.web?.uri)
            .filter((uri: any): uri is string => typeof uri === 'string' && !!uri);

        return { text, links: [...new Set(links)] }; // Unique links
    } catch (error) {
        console.error("Search grounding failed", error);
        return { text: "Could not fetch external resources.", links: [] };
    }
};

/**
 * 6. Generate Speech (TTS)
 * Restriction: gemini-2.5-flash-preview-tts
 */
export const generateSpeech = async (text: string): Promise<string | undefined> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        // Return base64 string of the audio
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
        console.error("TTS failed", error);
        return undefined;
    }
};