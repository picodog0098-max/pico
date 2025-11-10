import React, { useState } from 'react';
import { KeyIcon } from './icons';

interface ApiKeySetupProps {
  onKeySubmit: (key: string) => void;
  isInvalid?: boolean;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onKeySubmit, isInvalid }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onKeySubmit(key.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-black/30 backdrop-blur-lg border border-cyan-700 rounded-2xl shadow-2xl p-8 m-4 animate-fade-in">
        <div className="text-center">
          <KeyIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">تنظیم کلید API</h2>
          <p className="text-slate-400 mb-6">
            برای استفاده از این برنامه، به کلید API گوگل Gemini نیاز دارید. این کلید فقط در مرورگر شما ذخیره می‌شود و به هیچ سروری ارسال نمی‌شود.
          </p>
          {isInvalid && (
            <p className="text-red-400 bg-red-900/40 border border-red-500/50 p-3 rounded-lg mb-4">
              کلید API نامعتبر است. لطفاً یک کلید جدید وارد کنید.
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-2">
              کلید API Gemini
            </label>
            <input
              id="apiKey"
              type="password"
              autoComplete="off"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="کلید خود را اینجا وارد کنید..."
              className="w-full p-3 bg-slate-900 text-white rounded-md border border-slate-600 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none transition"
              required
            />
          </div>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="block text-center text-sm text-cyan-400 hover:text-cyan-300 transition-colors pt-2">
            دریافت کلید API از Google AI Studio
          </a>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 text-white font-bold rounded-lg transition-colors duration-300 animate-pulse-glow-cyan"
            disabled={!key.trim()}
          >
            ذخیره و شروع
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApiKeySetup;
