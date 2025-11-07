
import { GoogleGenAI, Modality } from '@google/genai';

function getAiClient() {
  // The API key is injected by the execution environment and is assumed to be available.
  // Using process.env.API_KEY is the correct and secure way to access it.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export async function* streamAnalyzeDog(imageBase64: string, soundDescription: string) {
  const ai = getAiClient();
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: imageBase64,
    },
  };

  const textPart = {
    text: `شما یک متخصص برجسته و جهانی در زمینه رفتارشناسی سگ‌ها هستید. با دقت بسیار بالا، زبان بدن سگ در این تصویر و توصیف صدای آن را تحلیل کنید. صدای توصیف شده این است: «${soundDescription}».
تحلیل شما باید شامل موارد زیر باشد:
1.  **احساسات اصلی:** به طور دقیق مشخص کنید سگ چه احساسی دارد (مثلاً ترس، شادی، اضطراب، کنجکاوی).
2.  **قصد و نیت:** توضیح دهید که این رفتار و صدا به چه معناست و سگ احتمالاً چه چیزی می‌خواهد یا قصد انجام چه کاری را دارد.
3.  **نشانه‌های کلیدی:** به جزئیات زبان بدن (مانند حالت گوش‌ها، دم، چشم‌ها، و بدن) و ویژگی‌های صدا (مانند زیر و بمی، سرعت) که شما را به این نتیجه رسانده، اشاره کنید.
4.  **شخصیت احتمالی:** بر اساس این شواهد، یک تحلیل کوتاه از ویژگی‌های شخصیتی احتمالی سگ (مثلاً بازیگوش، محتاط، مسلط) ارائه دهید.

تحلیل خود را به زبان فارسی، به صورت جامع، دقیق و در عین حال دوستانه برای صاحب سگ بنویسید.`,
  };

  const response = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
  });

  for await (const chunk of response) {
    yield chunk.text;
  }
}

export const textToSpeech = async (text: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say this in a friendly tone: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // A suitable voice
        },
      },
    },
  });
  
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (base64Audio) {
    return base64Audio;
  }

  // If no audio, investigate the reason for failure.
  if (response.promptFeedback?.blockReason) {
    throw new Error(`درخواست به دلیل خط‌مشی‌های ایمنی مسدود شد: ${response.promptFeedback.blockReason}`);
  }
  
  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
      if (finishReason === 'SAFETY') {
          const safetyRatings = response.candidates?.[0]?.safetyRatings;
          const blockedCategories = safetyRatings?.filter(r => r.blocked).map(r => r.category).join(', ');
          throw new Error(`پاسخ به دلیل تنظیمات ایمنی مسدود شد. دسته‌بندی‌های مسدود شده: ${blockedCategories || 'نامشخص'}`);
      }
    throw new Error(`فراخوانی API به دلیل ${finishReason} متوقف شد.`);
  }

  throw new Error('دیتای صوتی از API دریافت نشد. ممکن است پاسخ خالی باشد یا مشکلی رخ داده باشد.');
};


export async function* streamGetTrainingAdvice(question: string) {
  const ai = getAiClient();
  const textPart = {
    text: `شما یک پروفسور برجسته دامپزشکی و یک مربی سگ در سطح جهانی هستید که به خاطر روش‌های انسانی، مبتنی بر علم و تقویت مثبت شهرت دارید. یک صاحب سگ سوالی از شما دارد. سوال او این است: «${question}».
یک راهنمای واضح، گام به گام و دلگرم کننده برای کمک به او ارائه دهید. آموزش را به مراحل ساده و قابل مدیریت تقسیم کنید. بر صبر، ثبات و اهمیت ارتباط مثبت بین سگ و صاحبش تاکید کنید. پاسخ خود را به زبان فارسی، با لحنی حرفه‌ای و در عین حال قابل فهم بنویسید.`,
  };

   const response = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: { parts: [textPart] },
  });

  for await (const chunk of response) {
    yield chunk.text;
  }
}
