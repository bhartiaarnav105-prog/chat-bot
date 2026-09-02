import { useState, useRef, useEffect } from 'react';
import { t } from '../i18n';
import type { SupportedLocale } from '../i18n';

type VoiceState = 'idle' | 'prompt_permission' | 'recording' | 'processing' | 'done' | 'error';

interface DetectionState {
  detectedLanguage: string;
  confidence: number;
  requiresConfirmation: boolean;
}

interface VoiceQueryButtonProps {
  /** The dynamically resolved locale */
  locale: SupportedLocale;
  /** Called when the backend successfully processes audio and returns a transcript + language */
  onTranscript?: (transcript: string, resolvedLanguage: string, detection: DetectionState) => void;
  /** Called when processing begins (so parent can show loading UI if desired) */
  onProcessingStart?: () => void;
  /** Called when an error occurs */
  onError?: (msg: string) => void;
}

export function VoiceQueryButton({ locale, onTranscript, onProcessingStart, onError }: VoiceQueryButtonProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [volume, setVolume] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup resources when component unmounts
  useEffect(() => {
    return () => {
      stopAllHardware();
    };
  }, []);

  const stopAllHardware = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const startRecording = async () => {
    setVoiceState('prompt_permission');
    setErrorMessage('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio analysis for volume meter
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(avg);
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadAudio(audioBlob);
      };

      mediaRecorder.start();
      setVoiceState('recording');
    } catch (err: any) {
      setVoiceState('error');
      if (err.name === 'NotAllowedError') {
        const msg = 'Microphone permission denied. Please allow access in your browser settings.';
        setErrorMessage(msg);
        onError?.(msg);
      } else if (err.name === 'NotFoundError') {
        const msg = 'No microphone found on this device.';
        setErrorMessage(msg);
        onError?.(msg);
      } else {
        const msg = 'Could not access the microphone. Please try again.';
        setErrorMessage(msg);
        onError?.(msg);
      }
      stopAllHardware();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      // stopAllHardware will be called after upload or on error
    }
  };

  const uploadAudio = async (audioBlob: Blob) => {
    setVoiceState('processing');
    onProcessingStart?.();
    stopAllHardware(); // Release mic immediately

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice_query.webm');

      const response = await fetch('/api/v1/assistant/query', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || data.error || 'Failed to process voice query');
      }

      setVoiceState('done');
      
      const detection: DetectionState = {
        detectedLanguage: data.data.detectedLanguage,
        confidence: data.data.confidence,
        requiresConfirmation: data.data.requiresConfirmation
      };

      onTranscript?.(data.data.transcript, data.data.detectedLanguage, detection);

    } catch (error: any) {
      setVoiceState('error');
      const msg = error.message || t('common.error', locale);
      setErrorMessage(msg);
      onError?.(msg);
    }
  };

  const isRecording = voiceState === 'recording';
  const isProcessing = voiceState === 'processing';
  const isPrompting = voiceState === 'prompt_permission';

  // Calculate dynamic scale for microphone pulse
  const pulseScale = isRecording ? 1 + (volume / 255) * 0.5 : 1;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: 'sans-serif' }}>

      {/* Primary speak/stop button — minimum 64px touch target */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing || isPrompting}
        aria-label={isRecording ? 'Stop Recording' : t('voice.tap_to_speak', locale)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          width: '100%',
          minHeight: 64,
          padding: '0 24px',
          borderRadius: 999,
          border: 'none',
          background: isRecording ? '#DC2626' : (isProcessing ? '#0B8A45' : '#14AE57'),
          color: '#fff',
          fontSize: 18,
          fontWeight: 700,
          cursor: isProcessing || isPrompting ? 'not-allowed' : 'pointer',
          opacity: isProcessing || isPrompting ? 0.8 : 1,
          transition: 'background 0.2s, transform 0.1s',
          transform: `scale(${isRecording ? 1 : 1})`,
        }}
      >
        {isRecording ? (
          // Stop square icon
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ transform: `scale(${pulseScale})`, transition: 'transform 0.05s' }}>
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        ) : (
          // Microphone icon
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        )}
        
        {isPrompting 
          ? 'Allow Microphone Access...' 
          : isRecording 
            ? 'Tap to Stop' 
            : isProcessing
              ? t('voice.processing', locale)
              : t('voice.tap_to_speak', locale)}
      </button>

      {/* Status announcements for screen readers */}
      <div aria-live="polite" aria-atomic="true" style={{ position: 'absolute', left: -9999 }}>
        {isPrompting && 'Please allow microphone access when prompted by your browser.'}
        {isRecording && 'Recording started. Speak your question.'}
        {isProcessing && t('voice.processing', locale)}
      </div>

      {/* Error state */}
      {voiceState === 'error' && (
        <div role="alert" style={{ marginTop: 12, padding: 12, background: '#FEF2F2', borderRadius: 8, color: '#B91C1C', display: 'flex', gap: 8, alignItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {errorMessage}
        </div>
      )}
      
      {/* Retry/Reset button on error */}
      {voiceState === 'error' && (
        <button
          onClick={() => { setVoiceState('idle'); setErrorMessage(''); }}
          style={{ marginTop: 12, padding: '10px 24px', borderRadius: 999, border: '2px solid #DC2626', background: '#fff', color: '#DC2626', fontWeight: 600, cursor: 'pointer', minHeight: 48, width: '100%' }}
        >
          🔄 {t('voice.retry', locale)}
        </button>
      )}

    </div>
  );
}
