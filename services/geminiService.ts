import { GoogleGenAI, Modality, FinishReason, Type } from "@google/genai";
import { AnalysisResultData } from '../types';

// The GoogleGenAI client is initialized using the API key from the environment variables.
// This is the secure and recommended approach. The execution environment is responsible
// for providing process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeDog(imageBase64: string, soundDescription: string): Promise<AnalysisResultData> {
    const model = 'gemini-2.5-flash';
    
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    };

    const textPart = {
      text: `این تصویر و توصیف صدای یک سگ است. رفتار او را به زبان فارسی تحلیل کن و نتیجه را در قالب یک شیء JSON با سه کلید ارائه بده: "emotion" (احساس اصلی سگ)، "behavior_analysis" (تحلیل دقیق رفتار)، و "recommendation" (یک توصیه برای صاحب سگ).
    توصیف صدا: "${soundDescription}"`,
    };

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        emotion: { type: Type.STRING, description: 'احساس اصلی سگ' },
        behavior_analysis: { type: Type.STRING, description: 'تحلیل دقیق رفتار سگ' },
        recommendation: { type: Type.STRING, description: 'توصیه‌ای برای صاحب سگ' },
      },
      required: ['emotion', 'behavior_analysis', 'recommendation'],
    };

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: 'application/json',
          responseSchema,
        }
    });

    try {
      const jsonText = response.text.trim();
      const result = JSON.parse(jsonText);
      if (result.emotion && result.behavior_analysis && result.recommendation) {
        return result as AnalysisResultData;
      } else {
        throw new Error('پاسخ دریافتی ساختار مورد انتظار را ندارد.');
      }
    } catch (e) {
      console.error("Error parsing JSON response:", e, "Raw response:", response.text);
      throw new Error('خطا در تجزیه و تحلیل پاسخ از سرویس هوش مصنوعی.');
    }
}


export const textToSpeech = async (text: string): Promise<string> => {
  if (!text.trim()) return '';
  
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
};


export async function* streamGetTrainingAdvice(question: string) {
    const model = 'gemini-2.5-flash';

    const prompt = `به عنوان یک مربی حرفه‌ای سگ، به این سوال به زبان فارسی پاسخ بده: "${question}"`;
    
    const response = await ai.models.generateContentStream({
        model: model,
        contents: prompt
    });

    for await (const chunk of response) {
      yield chunk.text;
    }
}