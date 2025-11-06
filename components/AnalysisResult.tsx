
import React from 'react';
import { VolumeUpIcon, LoadingSpinnerIcon, StopIcon } from './icons';

type AudioStatus = 'idle' | 'generating' | 'playing';

interface AnalysisResultProps {
  text: string;
  onReadAloud: () => void;
  onStop: () => void;
  audioStatus: AudioStatus;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ text, onReadAloud, onStop, audioStatus }) => {
  const isReading = audioStatus === 'generating' || audioStatus === 'playing';

  const renderButtonContent = () => {
    switch (audioStatus) {
      case 'generating':
        return <LoadingSpinnerIcon className="w-6 h-6" />;
      case 'playing':
        return <StopIcon className="w-6 h-6" />;
      case 'idle':
      default:
        return <VolumeUpIcon className="w-6 h-6" />;
    }
  };

  return (
    <div className="bg-slate-900/40 border border-cyan-900/50 p-6 rounded-xl shadow-lg mt-6 animate-fade-in transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-cyan-500/80 hover:shadow-xl hover:shadow-cyan-500/20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-cyan-200">نتیجه تحلیل</h3>
        <button
          onClick={isReading ? onStop : onReadAloud}
          className={`p-3 rounded-full transition-colors duration-200 ease-in-out flex items-center justify-center ${
            isReading
              ? 'bg-rose-600 hover:bg-rose-700 animate-pulse-glow-rose'
              : 'bg-cyan-500 hover:bg-cyan-600 animate-pulse-glow-cyan'
          }`}
          aria-label={isReading ? 'توقف خواندن' : 'خواندن تحلیل'}
        >
          {renderButtonContent()}
        </button>
      </div>
      <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
        {text}
      </p>
    </div>
  );
};

export default AnalysisResult;
