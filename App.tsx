
import React, { useState, useCallback, useRef, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import AudioRecorder from './components/AudioRecorder';
import AnalysisResult from './components/AnalysisResult';
import { streamAnalyzeDog, textToSpeech, streamGetTrainingAdvice } from './services/geminiService';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { KeyIcon, PawPrintIcon } from './components/icons';
import DogTraining from './components/DogTraining';
import { splitIntoSentences } from './utils/textUtils';

type AudioStatus = 'idle' | 'generating' | 'playing';
type KeyStatus = 'checking' | 'needsAistudio' | 'needsManual' | 'ready';

const isAistudioEnv = () => typeof window.aistudio?.hasSelectedApiKey === 'function';

const isApiKeyError = (err: any): boolean => {
    const message = err?.message?.toLowerCase() || '';
    return message.includes('api key not valid') || 
           message.includes('requested entity was not found') ||
           message.includes('api key not available');
};

const App: React.FC = () => {
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('checking');
  const [manualApiKey, setManualApiKey] = useState('');
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [soundDescription, setSoundDescription] = useState<string>('');
  const [analysis, setAnalysis] = useState<string>('');
  const [isStreamingAnalysis, setIsStreamingAnalysis] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('idle');
  const { playAudio, stopAudio } = useAudioPlayer();
  const stopReadingRef = useRef(false);

  useEffect(() => {
    const checkKeyStatus = async () => {
        if (isAistudioEnv()) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setKeyStatus(hasKey ? 'ready' : 'needsAistudio');
        } else {
            // For Netlify/other envs.
            if (window.MANUAL_API_KEY) {
                setKeyStatus('ready');
            } else {
                setKeyStatus('needsManual');
            }
        }
    };
    // Give it a moment to avoid flashing content
    setTimeout(checkKeyStatus, 500);
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setKeyStatus('ready');
      setError('');
    }
  };

  const handleManualKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualApiKey.trim()) {
        window.MANUAL_API_KEY = manualApiKey.trim();
        setKeyStatus('ready');
        setError('');
    } else {
        setError('لطفاً یک API Key معتبر وارد کنید.');
    }
  };

  const handleInvalidKey = useCallback(() => {
    if (isAistudioEnv()) {
        setKeyStatus('needsAistudio');
    } else {
        window.MANUAL_API_KEY = undefined;
        setKeyStatus('needsManual');
    }
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
      if (isApiKeyError(err)) {
        handleInvalidKey();
      } else {
        setError('خطا در تحلیل. لطفاً دوباره تلاش کنید.');
        console.error(err);
      }
    } finally {
      setIsStreamingAnalysis(false);
    }
  }, [capturedImage, soundDescription, handleInvalidKey]);

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
        if (isApiKeyError(err)) {
          handleInvalidKey();
          break;
        } else {
          setError('خطا در پخش صدا. لطفاً دوباره تلاش کنید.');
          console.error(err);
          break;
        }
      }
    }
    setAudioStatus('idle');

  }, [analysis, playAudio, audioStatus, handleInvalidKey]);

  const handleStopReading = useCallback(() => {
    stopReadingRef.current = true;
    stopAudio();
    setAudioStatus('idle');
  }, [stopAudio]);

  const isAnalyzeButtonEnabled = !isStreamingAnalysis && !!capturedImage && !!soundDescription;

  const renderKeyScreen = (type: 'needsAistudio' | 'needsManual') => {
    const isManual = type === 'needsManual';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
        <div className="w-full max-w-md bg-black/30 backdrop-blur-lg border border-cyan-500/20 rounded-2xl shadow-2xl p-8 text-center animate-fade-in">
          <KeyIcon className="w-16 h-16 mx-auto text-cyan-300 mb-4" />
          <h2 className="text-2xl font-bold mb-3 text-white">API Key مورد نیاز است</h2>
          <p className="text-slate-400 mb-6">
            {isManual 
              ? 'برای استفاده از این اپلیکیشن، لطفاً Gemini API Key خود را وارد کنید.'
              : 'برای استفاده از قابلیت‌های هوش مصنوعی، لطفاً یک API Key معتبر انتخاب کنید.'}
          </p>
          {isManual ? (
            <form onSubmit={handleManualKeySubmit} className="space-y-4">
              <input
                type="password"
                value={manualApiKey}
                onChange={(e) => setManualApiKey(e.target.value)}
                placeholder="Gemini API Key خود را اینجا وارد کنید"
                className="w-full p-3 bg-slate-800/60 text-white rounded-md border border-slate-700 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none transition"
              />
              <button
                type="submit"
                className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-lg rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 animate-pulse-glow-cyan"
              >
                ذخیره و ادامه
              </button>
            </form>
          ) : (
            <button
              onClick={handleSelectKey}
              className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-lg rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 animate-pulse-glow-cyan"
            >
              انتخاب API Key
            </button>
          )}
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block text-sm text-slate-500 hover:text-cyan-400 mt-4 transition-colors"
          >
            اطلاعات بیشتر در مورد صورتحساب
          </a>
          {error && <p className="text-center text-red-400 mt-4">{error}</p>}
        </div>
      </div>
    );
  };

  if (keyStatus === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
          <PawPrintIcon className="w-24 h-24 text-cyan-400 animate-pulse" />
          <p className="mt-4 text-lg text-slate-400">در حال بررسی API Key...</p>
      </div>
    );
  }

  if (keyStatus === 'needsAistudio' || keyStatus === 'needsManual') {
    return renderKeyScreen(keyStatus);
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
          
          {error && <p className="text-center text-red-400 mt-4">{error}</p>}

          {analysis && (
            <AnalysisResult
              text={analysis}
              onReadAloud={handleReadAloud}
              onStop={handleStopReading}
              audioStatus={audioStatus}
            />
          )}

          <DogTraining onInvalidKey={handleInvalidKey} />
          
        </main>
      </div>
  );
};

export default App;
