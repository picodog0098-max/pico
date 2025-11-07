import { GoogleGenAI, Modality, FinishReason } from "@google/genai";

// Define a custom error for API key issues
export class ApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyError';
  }
}

// Helper function to handle potential invalid key errors
const handleApiError = (err: any): never => {
  const errorMessage = err.message?.toLowerCase() || '';
  if (errorMessage.includes('api key not valid') || errorMessage.includes('api key must be set')) {
    // Use the custom error class
    throw new ApiKeyError('کلید API انتخاب شده نامعتبر است یا تنظیم نشده. لطفاً یک کلید جدید انتخاب کنید.');
  }
  throw err;
};


export async function* streamAnalyzeDog(imageBase64: string, soundDescription: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';
    
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    };

    const textPart = {
      text: `این تصویر و توصیف صدای یک سگ است. رفتار او را به زبان فارسی تحلیل کن. تحلیل باید دقیق و بر اساس شواهد بصری و صوتی باشد.
    توصیف صدا: "${soundDescription}"`,
    };

    const response = await ai.models.generateContentStream({
        model: model,
        contents: { parts: [imagePart, textPart] },
    });

    for await (const chunk of response) {
      yield chunk.text;
    }
  } catch(err: any) {
     handleApiError(err);
  }
}

export const textToSpeech = async (text: string): Promise<string> => {
  if (!text.trim()) return '';
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash-preview-tts';

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
      },
    });
    
    // Safety check
    if (response.candidates?.[0]?.finishReason !== FinishReason.STOP) {
      throw new Error(`پاسخ به دلایل ایمنی مسدود شد: ${response.candidates?.[0]?.finishReason}`);
    }

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('پاسخ صوتی از API دریافت نشد.');
    }
    
    return base64Audio;
  } catch (err: any) {
    handleApiError(err);
  }
};


export async function* streamGetTrainingAdvice(question: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';

    const prompt = `به عنوان یک مربی حرفه‌ای سگ، به این سوال به زبان فارسی پاسخ بده: "${question}"`;
    
    const response = await ai.models.generateContentStream({
        model: model,
        contents: prompt
    });

    for await (const chunk of response) {
      yield chunk.text;
    }
  } catch(err: any) {
    handleApiError(err);
  }
}