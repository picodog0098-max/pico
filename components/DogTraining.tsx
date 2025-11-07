import React, { useState } from 'react';
import { streamGetTrainingAdvice } from '../services/geminiService';
import { BookOpenIcon, PawPrintIcon } from './icons';

interface DogTrainingProps {
    onKeyInvalidated: () => void;
}

const DogTraining: React.FC<DogTrainingProps> = ({ onKeyInvalidated }) => {
  const [question, setQuestion] = useState('');
  const [advice, setAdvice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetAdvice = async () => {
    if (!question) {
      setError('لطفاً سوال خود را در مورد تربیت سگ بنویسید.');
      return;
    }
    setIsLoading(true);
    setError('');
    setAdvice('');

    try {
      const stream = streamGetTrainingAdvice(question);
      for await (const chunk of stream) {
        setAdvice(prev => prev + chunk);
      }
    } catch (err: any) {
      const errorMessage = err.message?.toLowerCase() || '';
      if (errorMessage.includes('api key not valid') || errorMessage.includes('api key must be set')) {
        onKeyInvalidated();
      } else {
        const displayMessage = err?.toString() || 'لطفاً دوباره تلاش کنید.';
        setError(`خطا در دریافت مشاوره: ${displayMessage}`);
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonEnabled = !isLoading && !!question;

  return (
    <div className="bg-slate-900/40 border border-cyan-900/50 p-6 rounded-xl shadow-lg mt-6 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-cyan-500/80 hover:shadow-xl hover:shadow-cyan-500/20">
      <div className="flex items-center mb-4">
        <h3 className="text-2xl font-bold text-cyan-200">آموزش و تربیت سگ</h3>
        <BookOpenIcon className="w-8 h-8 text-cyan-200 mr-3" />
        <PawPrintIcon className="w-7 h-7 text-cyan-200 mr-2" />
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="مثلاً: چگونه به سگم یاد بدهم بنشیند؟"
          className="w-full p-2 bg-slate-800/60 text-white rounded-md border border-slate-700 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none transition"
        />
        <button
          onClick={handleGetAdvice}
          disabled={!isButtonEnabled}
          className={`px-6 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-600 text-white font-bold rounded-md transition-colors duration-300 flex items-center justify-center min-w-[150px] disabled:shadow-none ${isButtonEnabled ? 'animate-pulse-glow-fuchsia' : ''}`}
        >
          {isLoading ? <div className="w-6 h-6 border-4 border-t-transparent border-white rounded-full animate-spin"></div> : 'دریافت مشاوره'}
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

      {advice && (
        <div className="mt-4 p-4 bg-black/30 rounded-md animate-fade-in">
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
            {advice}
          </p>
        </div>
      )}
    </div>
  );
};

export default DogTraining;