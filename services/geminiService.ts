
import { GoogleGenAI, Modality } from '@google/genai';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function* streamAnalyzeDog(imageBase64: string, soundDescription: string) {
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
  if (!base64Audio) {
    throw new Error('No audio data received from API.');
  }
  return base64Audio;
};


export async function* streamGetTrainingAdvice(question: string) {
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
