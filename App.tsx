import React, { useState, useCallback, useRef, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import AudioRecorder from './components/AudioRecorder';
import AnalysisResult from './components/AnalysisResult';
import { streamAnalyzeDog, textToSpeech } from './services/geminiService';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { KeyIcon, PawPrintIcon } from './components/icons';
import DogTraining from './components/DogTraining';
import { splitIntoSentences } from './utils/textUtils';
import Loader from './components/Loader';

type AudioStatus = 'idle' | 'generating' | 'playing';
type ApiKeyStatus = 'checking' | 'ready' | 'needed';

const App: React.FC = () => {
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>('checking');
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
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setApiKeyStatus('ready');
      } else {
        setApiKeyStatus('needed');
      }
    };
    checkApiKey();
  }, []);

  const onKeyInvalidated = useCallback(() => {
      setError('کلید API نامعتبر است. لطفاً یک کلید جدید انتخاب کنید.');
      setApiKeyStatus('needed');
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success and try to proceed. The API call will validate the key.
      setApiKeyStatus('ready');
      setError('');
    }
  };

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
       if (err.message?.includes('API key not valid')) {
         onKeyInvalidated();
       } else {
         const errorMessage = err?.toString() || 'لطفاً دوباره تلاش کنید.';
         setError(`خطا در تحلیل: ${errorMessage}`);
         console.error(err);
       }
    } finally {
      setIsStreamingAnalysis(false);
    }
  }, [capturedImage, soundDescription, onKeyInvalidated]);

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
        if (stopReadingRef.current || !audioBase64) break;
        
        setAudioStatus('playing');
        await playAudio(audioBase64);

      } catch (err: any) {
        if (err.message?.includes('API key not valid')) {
            onKeyInvalidated();
        } else {
            const errorMessage = err?.toString() || 'لطفاً دوباره تلاش کنید.';
            setError(`خطا در پخش صدا: ${errorMessage}`);
            console.error(err);
        }
        break; // Stop trying to read sentences if one fails
      }
    }
    setAudioStatus('idle');

  }, [analysis, playAudio, audioStatus, onKeyInvalidated]);

  const handleStopReading = useCallback(() => {
    stopReadingRef.current = true;
    stopAudio();
    setAudioStatus('idle');
  }, [stopAudio]);

  const isAnalyzeButtonEnabled = !isStreamingAnalysis && !!capturedImage && !!soundDescription;

  if (apiKeyStatus === 'checking') {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
            <Loader />
            <p className="mt-4">در حال بررسی کلید API...</p>
        </div>
    );
  }
  
  if (apiKeyStatus === 'needed') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
              <main className="w-full max-w-lg bg-black/30 backdrop-blur-lg border border-cyan-500/20 rounded-2xl shadow-2xl p-8 text-center animate-fade-in">
                  <KeyIcon className="w-16 h-16 text-cyan-300 mx-auto mb-4" />
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-fuchsia-400 text-transparent bg-clip-text pb-2">
                      کلید API مورد نیاز است
                  </h1>
                  <p className="text-slate-400 mt-4">
                      برای استفاده از هوش مصنوعی Gemini، لطفاً کلید API خود را انتخاب کنید.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                      با استفاده از این سرویس، شما با شرایط استفاده و سیاست‌های مربوط به صورت‌حساب موافقت می‌کنید.
                      <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline mx-1">
                         اطلاعات بیشتر
                      </a>
                  </p>
                  <button
                      onClick={handleSelectKey}
                      className="mt-6 px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-lg rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 animate-pulse-glow-cyan"
                  >
                      انتخاب کلید API
                  </button>
                   {error && (
                      <p className="text-red-400 text-sm mt-4">{error}</p>
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

          <DogTraining onKeyInvalidated={onKeyInvalidated} />
          
        </main>
      </div>
  );
};

export default App;