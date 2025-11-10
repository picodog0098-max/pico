import { GoogleGenAI, Modality, FinishReason, Type } from "@google/genai";
import { AnalysisResultData } from '../types';

// =======================================================================
// هشدار: کلید API شما در اینجا به صورت هاردکد قرار گرفته است.
// این روش برای محیط‌های توسعه مناسب است، اما برای محیط پروداکشن توصیه نمی‌شود.
// لطفاً کلید API واقعی خود را جایگزین "YOUR_API_KEY_HERE" کنید.
// =======================================================================
const API_KEY = "YOUR_API_KEY_HERE";

// این بخش بررسی می‌کند که آیا کلید API وارد شده است یا خیر.
// اگر کلید وارد نشده باشد، برنامه با خطا متوقف می‌شود تا به شما یادآوری کند.
if (API_KEY === "YOUR_API_KEY_HERE") {
  throw new Error("لطفاً کلید API خود را در فایل services/geminiService.ts در متغیر API_KEY قرار دهید.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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