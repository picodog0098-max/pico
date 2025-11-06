
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CameraIcon, CheckCircleIcon, ExclamationTriangleIcon, UploadIcon } from './icons';

interface CameraFeedProps {
  onCapture: (imageBase64: string) => void;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lowLightCheckInterval = useRef<number | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLowLight, setIsLowLight] = useState(false);
  const [error, setError] = useState<string>('');

  const startCamera = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraOn(true);
          setError('');
        }
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('دسترسی به دوربین رد شد. برای استفاده از این قابلیت، لطفاً به تنظیمات مرورگر خود بروید و مجوز دسترسی به دوربین را برای این سایت فعال کنید.');
        } else {
          setError('دسترسی به دوربین امکان‌پذیر نیست. لطفاً دوباره تلاش کنید یا از آپلود تصویر استفاده کنید.');
        }
        setIsCameraOn(false);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);
  
  useEffect(() => {
    if (isCameraOn) {
      startCamera();
    } else {
      stopCamera();
    }
    // This effect should only run when isCameraOn changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOn]);


  useEffect(() => {
    if (isCameraOn && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      lowLightCheckInterval.current = window.setInterval(() => {
        if (!video || !canvas || video.readyState < video.HAVE_METADATA) return;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;

        const tempWidth = 100;
        const tempHeight = (video.videoHeight / video.videoWidth) * tempWidth;
        canvas.width = tempWidth;
        canvas.height = tempHeight;
        context.drawImage(video, 0, 0, tempWidth, tempHeight);

        try {
          const imageData = context.getImageData(0, 0, tempWidth, tempHeight);
          const data = imageData.data;
          let totalLuminance = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            totalLuminance += 0.2126 * r + 0.7152 * g + 0.0722 * b;
          }

          const avgLuminance = totalLuminance / (tempWidth * tempHeight);
          const lowLightThreshold = 60; 
          setIsLowLight(avgLuminance < lowLightThreshold);
        } catch (e) {
          console.error("Error processing canvas data:", e);
        }

      }, 1000);

    } else {
      if (lowLightCheckInterval.current) {
        clearInterval(lowLightCheckInterval.current);
        lowLightCheckInterval.current = null;
      }
      setIsLowLight(false);
    }

    return () => {
      if (lowLightCheckInterval.current) {
        clearInterval(lowLightCheckInterval.current);
      }
    };
  }, [isCameraOn]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        onCapture(dataUrl.split(',')[1]); 
      }
      setIsCameraOn(false); // Turn off camera after capture
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) { // 4MB limit for Gemini API
      setError('حجم فایل نباید بیشتر از 4 مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCapturedImage(dataUrl);
      onCapture(dataUrl.split(',')[1]);
      setError('');
    };
    reader.onerror = () => {
      setError('خطا در خواندن فایل.');
    };
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const resetState = () => {
    setCapturedImage(null);
    setIsCameraOn(false);
    setError('');
    onCapture(''); // Clear the image in the parent component
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    stopCamera();
  };

  return (
    <div className="bg-slate-900/40 border border-cyan-900/50 p-4 rounded-xl shadow-lg flex flex-col items-center justify-center space-y-4 h-full transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-cyan-500/80 hover:shadow-xl hover:shadow-cyan-500/20">
      <h2 className="text-xl font-bold text-cyan-200">۱. ضبط رفتار</h2>
      <div className="relative w-full aspect-video bg-black/50 rounded-md overflow-hidden flex items-center justify-center">
        {error && <p className="text-red-400 px-4 text-center">{error}</p>}
        
        <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraOn && !capturedImage ? 'opacity-100' : 'opacity-0 hidden'}`}
        ></video>

        {capturedImage && (
            <img src={capturedImage} alt="Captured" className="object-cover w-full h-full absolute inset-0" />
        )}
        
        {!isCameraOn && !capturedImage && !error && (
            <div className="flex flex-col items-center justify-center text-slate-600">
                <UploadIcon className="w-12 h-12" />
                <span className="mt-2 text-sm">آپلود تصویر</span>
                <span className="my-2 font-semibold text-slate-500">یا</span>
                <CameraIcon className="w-12 h-12" />
                <span className="mt-2 text-sm">استفاده از دوربین</span>
            </div>
        )}
        
        {isCameraOn && !capturedImage && (
          <>
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
              <div className="w-full h-full border-4 border-cyan-400 border-dashed rounded-lg opacity-75 animate-pulse"></div>
            </div>
            <p className="absolute bottom-2 text-sm text-cyan-200 bg-black bg-opacity-50 px-2 py-1 rounded">
              صورت سگ را در این کادر قرار دهید
            </p>
          </>
        )}

        {isLowLight && isCameraOn && !capturedImage && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-yellow-300 p-4 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 mb-2" />
            <p className="font-bold text-lg">نور کم است</p>
            <p className="text-sm">برای تحلیل بهتر، در محیط روشن‌تری عکس بگیرید.</p>
          </div>
        )}

        {capturedImage && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white">
                <CheckCircleIcon className="w-16 h-16 text-green-400"/>
                <p className="mt-2 font-bold">تصویر آماده است!</p>
            </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden"></canvas>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/jpeg, image/png, image/webp"
        onChange={handleFileSelect}
      />
      
      <div className="flex justify-center gap-4 w-full h-10">
        {!capturedImage && !isCameraOn && (
            <>
                <button onClick={triggerFileUpload} className="px-6 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold rounded-lg transition-colors animate-pulse-glow-fuchsia w-1/2">
                    آپلود تصویر
                </button>
                 <button onClick={() => setIsCameraOn(true)} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors animate-pulse-glow-cyan w-1/2">
                    روشن کردن دوربین
                </button>
            </>
        )}
        {!capturedImage && isCameraOn && (
            <>
                <button onClick={handleCapture} className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors animate-pulse-glow-rose w-1/2">
                    گرفتن عکس
                </button>
                 <button onClick={() => setIsCameraOn(false)} className="px-6 py-2 bg-slate-500 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors w-1/2">
                    لغو
                </button>
            </>
        )}
        {capturedImage && (
            <button onClick={resetState} className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors">
                انتخاب عکس جدید
            </button>
        )}
      </div>
    </div>
  );
};

export default CameraFeed;
