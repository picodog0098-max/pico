
import React, { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon } from './icons';

// Define the interface for the component props
interface AudioRecorderProps {
  onDescriptionChange: (description: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onDescriptionChange }) => {
  const [description, setDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [recognitionError, setRecognitionError] = useState('');
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setIsSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.lang = 'fa-IR';
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDescription(transcript);
        onDescriptionChange(transcript);
        setRecognitionError(''); // Clear any previous error
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        let errorMessage = 'خطای ناشناخته در تشخیص گفتار رخ داد.';
        switch (event.error) {
            case 'no-speech':
                errorMessage = 'هیچ صدایی شناسایی نشد. لطفاً دوباره تلاش کنید.';
                break;
            case 'audio-capture':
                errorMessage = 'خطا در دریافت صدا از میکروفون. لطفاً مطمئن شوید میکروفون دیگری از آن استفاده نمی‌کند.';
                break;
            case 'not-allowed':
            case 'service-not-allowed':
                errorMessage = 'دسترسی به میکروفون مجاز نیست. لطفاً مجوز را در تنظیمات مرورگر فعال کنید.';
                break;
            case 'network':
                errorMessage = 'خطای شبکه رخ داد. لطفاً اتصال اینترنت خود را بررسی کنید.';
                break;
            default:
                 errorMessage = `خطا در تشخیص گفتار: ${event.error}`;
        }
        setRecognitionError(errorMessage);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      console.warn('Speech recognition not supported in this browser.');
    }
  }, [onDescriptionChange]);


  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    onDescriptionChange(newDescription);
    if (recognitionError) setRecognitionError('');
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    setRecognitionError('');

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // Clear previous description before starting a new recording
      setDescription('');
      onDescriptionChange('');
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch(err) {
        console.error("Error starting recognition:", err);
        setRecognitionError('شروع ضبط با خطا مواجه شد.');
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="bg-slate-900/40 border border-cyan-900/50 p-4 rounded-xl shadow-lg flex flex-col items-center justify-center space-y-4 h-full transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-cyan-500/80 hover:shadow-xl hover:shadow-cyan-500/20">
      <h2 className="text-xl font-bold text-cyan-200">۲. توصیف صدا</h2>
      <div className="w-full flex flex-col items-center justify-center flex-grow text-center space-y-3">
        <p className="text-slate-400 px-2">
            برای توصیف صدای سگ، دکمه میکروفون را فشار دهید و صحبت کنید، یا در کادر زیر تایپ کنید.
        </p>

        {isSupported ? (
          <>
            <button
              onClick={toggleRecording}
              className={`p-4 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 ${
                isRecording
                  ? 'bg-rose-600 animate-pulse'
                  : 'bg-cyan-600 hover:bg-cyan-700 animate-pulse-glow-cyan'
              }`}
              aria-label={isRecording ? 'توقف توصیف صوتی' : 'شروع توصیف صوتی'}
            >
              <MicrophoneIcon className="w-8 h-8 text-white" />
            </button>
            <div className="h-6 text-lg">
                {isRecording ? (
                    <p className="text-cyan-300 animate-pulse">در حال گوش دادن...</p>
                ) : recognitionError ? (
                    <p className="text-red-400 text-sm px-2">{recognitionError}</p>
                ) : null}
            </div>
          </>
        ) : (
            <p className="text-yellow-400 text-sm">تشخیص گفتار در این مرورگر پشتیبانی نمی‌شود.</p>
        )}
        
        <textarea
          value={description}
          onChange={handleDescriptionChange}
          placeholder="مثلاً: پارس‌های کوتاه و سریع..."
          className="w-full h-24 p-2 bg-slate-800/60 text-white rounded-md border border-slate-700 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none transition"
        />
      </div>
    </div>
  );
};

export default AudioRecorder;
