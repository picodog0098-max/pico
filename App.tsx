import React, { useState, useCallback, useRef, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import AudioRecorder from './components/AudioRecorder';
import AnalysisResult from './components/AnalysisResult';
import { analyzeDog, textToSpeech } from './services/geminiService';
import DogTraining from './components/DogTraining';
import { PawPrintIcon } from './components/icons';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { AnalysisResultData } from './types';

type AudioStatus = 'idle' | 'generating' | 'playing';

const App: React.FC = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [soundDescription, setSoundDescription] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalysisResultData | null>(() => {
    try {
      const saved = localStorage.getItem('lastAnalysis');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to read from localStorage', error);
      return null;
    }
  });
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const { playAudio, stopAudio, isPlaying } = useAudioPlayer();
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const audioRequestCancelled = useRef(false);

  const audioStatus: AudioStatus = isGeneratingAudio ? 'generating' : isPlaying ? 'playing' : 'idle';

  useEffect(() => {
    try {
      if (analysis) {
        localStorage.setItem('lastAnalysis', JSON.stringify(analysis));
      } else {
        localStorage.removeItem('lastAnalysis');
      }
    } catch (error) {
      console.error('Failed to write to localStorage', error);
    }
  }, [analysis]);
  
  const handleApiError = useCallback((err: any) => {
     const displayMessage = err?.toString() || 'لطفاً دوباره تلاش کنید.';
     setError(`خطا: ${displayMessage}`);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!capturedImage || !soundDescription) {
      setError('لطفاً هم یک عکس بگیرید و هم صدای سگ را توصیف کنید.');
      return;
    }
    setIsAnalyzing(true);
    setError('');
    setAnalysis(null);

    try {
      const result = await analyzeDog(capturedImage, soundDescription);
      setAnalysis(result);
    } catch (err: any) {
       handleApiError(err);
       console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [capturedImage, soundDescription, handleApiError]);

  const handleReadAloud = useCallback(async () => {
    if (!analysis || audioStatus !== 'idle') return;

    const textToRead = `احساس: ${analysis.emotion}. تحلیل رفتار: ${analysis.behavior_analysis}. توصیه: ${analysis.recommendation}.`;

    audioRequestCancelled.current = false;
    setIsGeneratingAudio(true);
    setError('');

    try {
      const base64Audio = await textToSpeech(textToRead);
      if (base64Audio && !audioRequestCancelled.current) {
        await playAudio(base64Audio);
      }
    } catch (err: any) {
      if (!audioRequestCancelled.current) {
        console.error('TTS or playback error:', err);
        handleApiError(err);
      }
    } finally {
      setIsGeneratingAudio(false);
    }
  }, [analysis, audioStatus, playAudio, handleApiError]);

  const handleStopReading = useCallback(() => {
    audioRequestCancelled.current = true;
    stopAudio();
    setIsGeneratingAudio(false);
  }, [stopAudio]);


  const isAnalyzeButtonEnabled = !isAnalyzing && !!capturedImage && !!soundDescription;

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
              {isAnalyzing ? (
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
              analysis={analysis}
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