
import React, { useState, useCallback, useRef, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import AudioRecorder from './components/AudioRecorder';
import AnalysisResult from './components/AnalysisResult';
import { streamAnalyzeDog, textToSpeech } from './services/geminiService';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { PawPrintIcon, KeyIcon } from './components/icons';
import DogTraining from './components/DogTraining';
import { splitIntoSentences } from './utils/textUtils';

type AudioStatus = 'idle' | 'generating' | 'playing';

const App: React.FC = () => {
  const [isKeyReady, setIsKeyReady] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [soundDescription, setSoundDescription] = useState<string>('');
  const [analysis, setAnalysis] = useState<string>('');
  const [isStreamingAnalysis, setIsStreamingAnalysis] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('idle');
  const { playAudio, stopAudio } = useAudioPlayer();
  const stopReadingRef = useRef(false);

  useEffect(() => {
    const checkApiKey = async () => {
      // Use a local variable to prevent race conditions from multiple checks
      let keyIsAvailable = false;
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        try {
          keyIsAvailable = await window.aistudio.hasSelectedApiKey();
        } catch (e) {
          console.error("Error checking for API key:", e);
          keyIsAvailable = false;
        }
      } else {
        // If the check function is not available, we can assume the key is injected
        // via other means and proceed optimistically.
        keyIsAvailable = true;
      }
      setIsKeyReady(keyIsAvailable);
      setIsCheckingKey(false);
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    setError('');
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        try {
            await window.aistudio.openSelectKey();
            // Per guidelines, assume the key is selected successfully after this.
            setIsKeyReady(true);
        } catch (e) {
            console.error("Could not open API key selection:", e);
            setError("امکان باز کردن انتخابگر کلید API وجود نداشت.");
        }
    } else {
        setError("قابلیت انتخاب کلید API در این محیط در دسترس نیست.");
    }
  };

  const invalidateKey = useCallback(() => {
    setIsKeyReady(false);
    setError('کلید API شما نامعتبر است یا منقضی شده. لطفاً یک کلید دیگر انتخاب کنید.');
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!capturedImage || !soundDescription) {
      setError('لطفاً هم یک عکس بگیرید و هم صدای سگ را توصیف کنید.');
      return;
    }
    setIsStreamingAnalysis(true);
    setError('');
    setAnalysis('');

    try {
      const stream = streamAnalyzeDog(capturedImage, soundDescription);
      for await (const chunk of stream) {
        setAnalysis(prev => prev + chunk);
      }
    } catch (err: any) {
      const errorMessage = err?.toString() || 'لطفاً دوباره تلاش کنید.';
       if (errorMessage.includes('API Key') || errorMessage.includes('Requested entity was not found')) {
        invalidateKey();
        return;
      }
      setError(`خطا در تحلیل: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsStreamingAnalysis(false);
    }
  }, [capturedImage, soundDescription, invalidateKey]);

  const handleReadAloud = useCallback(async () => {
    if (!analysis || audioStatus !== 'idle') return;
    
    stopReadingRef.current = false;
    const sentences = splitIntoSentences(analysis);

    for (const sentence of sentences) {
      if (stopReadingRef.current) break;
      if (!sentence.trim()) continue;

      try {
        setAudioStatus('generating');
        const audioBase64 = await textToSpeech(sentence);
        if (stopReadingRef.current) break;
        
        setAudioStatus('playing');
        await playAudio(audioBase64);

      } catch (err: any) {
        const errorMessage = err?.toString() || 'لطفاً دوباره تلاش کنید.';
        if (errorMessage.includes('API Key') || errorMessage.includes('Requested entity was not found')) {
          invalidateKey();
          break;
        }
        setError(`خطا در پخش صدا: ${errorMessage}`);
        console.error(err);
        break;
      }
    }
    setAudioStatus('idle');

  }, [analysis, playAudio, audioStatus, invalidateKey]);

  const handleStopReading = useCallback(() => {
    stopReadingRef.current = true;
    stopAudio();
    setAudioStatus('idle');
  }, [stopAudio]);

  const isAnalyzeButtonEnabled = !isStreamingAnalysis && !!capturedImage && !!soundDescription;

  if (isCheckingKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-transparent border-cyan-400 rounded-full animate-spin"></div>
          <p className="text-xl text-slate-300">در حال بررسی کلید API...</p>
        </div>
      </div>
    );
  }

  if (!isKeyReady) {
    return (
       <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
        <main className="w-full max-w-2xl bg-black/30 backdrop-blur-lg border border-rose-500/30 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 text-center animate-fade-in">
           <div className="flex justify-center text-rose-400">
             <KeyIcon className="w-16 h-16"/>
           </div>
          <h1 className="text-3xl font-bold text-rose-300">
            کلید API لازم است
          </h1>
          <p className="text-lg text-slate-400">
            برای استفاده از تحلیلگر رفتار سگ، شما باید یک کلید API از Google AI Studio انتخاب کنید. این کلید برای ارتباط با مدل هوش مصنوعی Gemini استفاده می‌شود.
          </p>
           <p className="text-sm text-slate-500">
            با کلیک بر روی دکمه زیر، یک پنجره برای انتخاب کلید API شما باز می‌شود. استفاده شما از Gemini API ممکن است مشمول هزینه باشد.
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline mx-1">
                اطلاعات بیشتر
            </a>
          </p>
          <button
            onClick={handleSelectKey}
            className="px-8 py-4 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xl rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 animate-pulse-glow-rose flex items-center justify-center mx-auto"
          >
            <KeyIcon className="w-6 h-6 ml-2" />
            انتخاب کلید API
          </button>
          {error && (
            <p className="text-center text-red-300 mt-4 bg-red-900/40 border border-red-500/50 p-3 rounded-lg">{error}</p>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
        <main className="w-full max-w-5xl bg-black/30 backdrop-blur-lg border border-cyan-500/20 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
          <header className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 to-fuchsia-400 text-transparent bg-clip-text pb-2">
              تحلیلگر رفتار سگ
            </h1>
            <p className="text-lg text-slate-400 mt-2">
              رفتار و صدای پیکو را با این اپ درک کنید
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CameraFeed onCapture={setCapturedImage} />
            <AudioRecorder onDescriptionChange={setSoundDescription} />
          </div>

          <div className="text-center pt-4">
            <button
              onClick={handleAnalyze}
              disabled={!isAnalyzeButtonEnabled}
              className={`px-8 py-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 text-white font-bold text-xl rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 disabled:cursor-not-allowed flex items-center justify-center mx-auto disabled:shadow-none ${isAnalyzeButtonEnabled ? 'animate-pulse-glow-cyan' : ''}`}
            >
              {isStreamingAnalysis ? (
                <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <PawPrintIcon className="w-6 h-6 ml-2" />
                  تحلیل کن
                </>
              )}
            </button>
          </div>
          
          {error && (
            <div className="text-center text-red-300 mt-4 bg-red-900/40 border border-red-500/50 p-3 rounded-lg flex justify-between items-center animate-fade-in">
              <span>{error}</span>
              <button 
                onClick={() => setError('')} 
                className="mr-4 text-red-300 hover:text-white font-bold text-2xl leading-none transition-colors"
                aria-label="بستن خطا"
              >
                &times;
              </button>
            </div>
          )}

          {analysis && (
            <AnalysisResult
              text={analysis}
              onReadAloud={handleReadAloud}
              onStop={handleStopReading}
              audioStatus={audioStatus}
            />
          )}

          <DogTraining onKeyInvalidated={invalidateKey} />
          
        </main>
      </div>
  );
};

export default App;
