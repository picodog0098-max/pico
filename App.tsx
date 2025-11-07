
import React, { useState, useCallback, useRef, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import AudioRecorder from './components/AudioRecorder';
import AnalysisResult from './components/AnalysisResult';
import { streamAnalyzeDog } from './services/geminiService';
import DogTraining from './components/DogTraining';
import { PawPrintIcon } from './components/icons';

type AudioStatus = 'idle' | 'generating' | 'playing';

const App: React.FC = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [soundDescription, setSoundDescription] = useState<string>('');
  const [analysis, setAnalysis] = useState<string>(() => {
    try {
      return localStorage.getItem('lastAnalysis') || '';
    } catch (error) {
      console.error('Failed to read from localStorage', error);
      return '';
    }
  });
  const [isStreamingAnalysis, setIsStreamingAnalysis] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('idle');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    try {
      if (analysis) {
        localStorage.setItem('lastAnalysis', analysis);
      } else {
        localStorage.removeItem('lastAnalysis');
      }
    } catch (error) {
      console.error('Failed to write to localStorage', error);
    }
  }, [analysis]);

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
       const displayMessage = err?.toString() || 'لطفاً دوباره تلاش کنید.';
       setError(`خطا در تحلیل: ${displayMessage}`);
       console.error(err);
    } finally {
      setIsStreamingAnalysis(false);
    }
  }, [capturedImage, soundDescription]);

  const handleReadAloud = useCallback(() => {
    if (!analysis || audioStatus !== 'idle' || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(analysis);
    utterance.lang = 'fa-IR';
    utterance.rate = 0.9;
    
    utterance.onstart = () => {
      setAudioStatus('playing');
    };
    
    utterance.onend = () => {
      setAudioStatus('idle');
      utteranceRef.current = null;
    };
    
    utterance.onerror = (event) => {
      console.error('SpeechSynthesis Error:', event.error);
      setError(`خطا در پخش صدا: ${event.error}`);
      setAudioStatus('idle');
      utteranceRef.current = null;
    };
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

  }, [analysis, audioStatus]);

  const handleStopReading = useCallback(() => {
    if (window.speechSynthesis && utteranceRef.current) {
      window.speechSynthesis.cancel();
      setAudioStatus('idle');
      utteranceRef.current = null;
    }
  }, []);

  const isAnalyzeButtonEnabled = !isStreamingAnalysis && !!capturedImage && !!soundDescription;

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

          <DogTraining />
          
        </main>
      </div>
  );
};

export default App;
