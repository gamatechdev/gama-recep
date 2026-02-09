import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Transcribes audio using Gemini 2.5 Flash.
 * @param audioBlob The audio blob to transcribe.
 * @returns The transcribed text.
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    // Convert Blob to Base64
    const base64Data = await blobToBase64(audioBlob);
    
    // Gemini API expects raw base64 without the data URI prefix
    const cleanBase64 = base64Data.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type || 'audio/webm',
              data: cleanBase64
            }
          },
          {
            text: "Transcreva o áudio a seguir fielmente. Retorne apenas o texto transcrito, sem comentários adicionais."
          }
        ]
      }
    });

    return response.text || "Não foi possível transcrever o áudio.";
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Falha na transcrição do áudio.");
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
