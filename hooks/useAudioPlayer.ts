
import { useState, useCallback, useRef, useEffect } from 'react';
import { decode, decodeAudioData } from '../utils/audioUtils';

export const useAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if(AudioContext) {
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        }
    }
    
    return () => {
        // Cleanup on unmount
        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch (e) { /* Ignore error on unmount */ }
        }
    };
  }, []);

  const playAudio = useCallback(async (base64Audio: string): Promise<void> => {
    const context = audioContextRef.current;
    if (!context) {
      console.error("AudioContext not supported or initialized.");
      return Promise.reject(new Error("AudioContext not available."));
    }
    
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) { /* Ignore error if already stopped */ }
    }
    
    if (context.state === 'suspended') {
      await context.resume();
    }
    
    setIsPlaying(true);
    
    return new Promise(async (resolve, reject) => {
      try {
        const decodedBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(decodedBytes, context, 24000, 1);
        
        const source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(context.destination);
        
        source.onended = () => {
          setIsPlaying(false);
          // Check if this is the source we expect to end.
          if (sourceNodeRef.current === source) {
            sourceNodeRef.current = null;
          }
          resolve();
        };

        source.start(0);
        sourceNodeRef.current = source;
      } catch (error) {
        console.error("Error playing audio:", error);
        setIsPlaying(false);
        reject(error);
      }
    });
  }, []);

  const stopAudio = useCallback(() => {
    if (sourceNodeRef.current) {
        try {
            sourceNodeRef.current.stop();
            // onended will fire and handle cleanup
        } catch(e) {
            console.warn("Error stopping audio source:", e);
        }
    }
  }, []);

  return { playAudio, stopAudio, isPlaying };
};
