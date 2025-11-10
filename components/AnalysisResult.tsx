import React from 'react';
import { VolumeUpIcon, LoadingSpinnerIcon, StopIcon, HeartIcon, ClipboardDocumentListIcon, SparklesIcon } from './icons';
import { AnalysisResultData } from '../types';

type AudioStatus = 'idle' | 'generating' | 'playing';

interface AnalysisResultProps {
  analysis: AnalysisResultData;
  onReadAloud: () => void;
  onStop: () => void;
  audioStatus: AudioStatus;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, onReadAloud, onStop, audioStatus }) => {
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
      
      <div className="space-y-6">
        {/* Emotion Section */}
        <div className="p-4 bg-black/20 rounded-lg border-l-4 border-fuchsia-500">
          <div className="flex items-center mb-2">
            <HeartIcon className="w-6 h-6 text-fuchsia-400 mr-3" />
            <h4 className="text-lg font-semibold text-fuchsia-300">احساس</h4>
          </div>
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
            {analysis.emotion}
          </p>
        </div>

        {/* Behavior Analysis Section */}
        <div className="p-4 bg-black/20 rounded-lg border-l-4 border-cyan-500">
          <div className="flex items-center mb-2">
            <ClipboardDocumentListIcon className="w-6 h-6 text-cyan-400 mr-3" />
            <h4 className="text-lg font-semibold text-cyan-300">تحلیل رفتار</h4>
          </div>
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
            {analysis.behavior_analysis}
          </p>
        </div>
        
        {/* Recommendation Section */}
        <div className="p-4 bg-black/20 rounded-lg border-l-4 border-amber-500">
          <div className="flex items-center mb-2">
            <SparklesIcon className="w-6 h-6 text-amber-400 mr-3" />
            <h4 className="text-lg font-semibold text-amber-300">توصیه</h4>
          </div>
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
            {analysis.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;