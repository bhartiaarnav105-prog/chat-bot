import React, { useState } from 'react';
import { t, LANGUAGE_LABELS } from '../../i18n';
import type { SupportedLocale } from '../../i18n';
import { VoiceQueryButton } from '../../components/VoiceQueryButton';

interface Citation {
  documentTitle: string;
  sourceUrl: string;
}

interface CitedAnswer {
  answerText: string | null;
  schemes: any[];
  insufficientEvidence: boolean;
}

interface DetectionState {
  detectedLanguage: string;
  confidence: number;
  requiresConfirmation: boolean;
}

interface AskJourneyProps {
  locale: SupportedLocale;
  farmerId: string;
  onSaveGuidance: (text: string) => void;
}

export function AskJourney({ locale, farmerId, onSaveGuidance }: AskJourneyProps) {
  const [typedQuestion, setTypedQuestion] = useState('');
  const [answer, setAnswer] = useState<CitedAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState(locale);
  
  // New state from VoiceQueryButton
  const [transcript, setTranscript] = useState('');
  const [detection, setDetection] = useState<DetectionState | null>(null);
  const [userOverride, setUserOverride] = useState<string | null>(null);

  const askTextQuestion = async (question: string, language: string) => {
    setLoading(true);
    setAnswer(null);
    setTranscript(question); // Reflect what is being asked
    console.log('[CHATBOT] Sending question to assistant API');
    try {
      const res = await fetch('/api/v1/assistant/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, language, farmerId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.error || 'Unable to answer the question');
      }
      console.log('[CHATBOT] Assistant response received');
      console.log(`[CHATBOT] Schemes received: ${data.schemes?.length || 0}`);
      setAnswer(data);
    } catch {
      setAnswer({ answerText: null, schemes: [], insufficientEvidence: false });
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = (newTranscript: string, lang: string, newDetection: DetectionState) => {
    setDetectedLanguage(lang as SupportedLocale);
    setTranscript(newTranscript);
    setTypedQuestion(newTranscript); // Fill the text input so user sees the transcript
    setDetection(newDetection);
    
    // If confirmation is needed, we wait for user. Otherwise auto-submit via existing text flow.
    if (!newDetection.requiresConfirmation) {
      askTextQuestion(newTranscript, lang);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedQuestion.trim()) askTextQuestion(typedQuestion, detectedLanguage);
  };

  const handleConfirmLanguage = (lang: string) => {
    setUserOverride(lang);
    askTextQuestion(transcript, lang);
  };

  const speakAnswer = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.5rem', fontFamily: 'sans-serif' }}>

      {/* Voice input component */}
      <VoiceQueryButton 
        locale={locale} 
        onProcessingStart={() => {
          setLoading(true);
          setTranscript('');
          setAnswer(null);
          setDetection(null);
          setUserOverride(null);
        }}
        onTranscript={(t, l, d) => {
          setLoading(false);
          handleVoiceTranscript(t, l, d);
        }}
        onError={() => setLoading(false)}
      />

      {/* Transcript Preview */}
      {transcript && !loading && (
        <div style={{ marginTop: 16, padding: 16, background: '#f7f9f8', borderRadius: 12, border: '1px solid #E4ECE8' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#45515F', marginBottom: 4 }}>
            {t('voice.transcript_label', locale)}
          </p>
          <p style={{ margin: 0, fontSize: 16, color: '#101B2D', fontWeight: 500 }}>{transcript}</p>
        </div>
      )}

      {/* Language Confirmation UI */}
      {detection?.requiresConfirmation && !userOverride && !loading && (
        <div
          role="alert"
          style={{ marginTop: 12, padding: 16, background: '#FFF7ED', borderRadius: 12, border: '2px solid #F06B12' }}
        >
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#101B2D', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#F06B12" aria-hidden="true">
              <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
            </svg>
            {t('language.low_confidence', locale)}
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: '#45515F' }}>
            {t('language.confirm_prompt', locale, {
              language: LANGUAGE_LABELS[detection.detectedLanguage] ?? detection.detectedLanguage
            })}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => handleConfirmLanguage(detection.detectedLanguage)}
              style={{ padding: '8px 20px', borderRadius: 999, border: 'none', background: '#14AE57', color: '#fff', fontWeight: 600, cursor: 'pointer', minHeight: 48 }}
            >
              {LANGUAGE_LABELS[detection.detectedLanguage] ?? detection.detectedLanguage} ✓
            </button>
            <button
              onClick={() => handleConfirmLanguage('en')}
              style={{ padding: '8px 20px', borderRadius: 999, border: '2px solid #14AE57', background: '#fff', color: '#14AE57', fontWeight: 600, cursor: 'pointer', minHeight: 48 }}
            >
              English
            </button>
          </div>
        </div>
      )}

      {/* Detected Language Info */}
      {detection && !detection.requiresConfirmation && !loading && (
         <p style={{ marginTop: 8, fontSize: 13, color: '#45515F' }}>
           🌐 {t('language.detected', locale)}: <strong>{LANGUAGE_LABELS[detection.detectedLanguage] ?? detection.detectedLanguage}</strong>
           {' '}({Math.round(detection.confidence * 100)}%)
         </p>
      )}

      {/* Loading state indicator for text/follow-up */}
      {loading && (
        <div style={{ marginTop: 16, textAlign: 'center', color: '#14AE57', fontWeight: 600 }}>
          {t('common.loading', locale)}
        </div>
      )}

      {/* Divider */}
      <p style={{ textAlign: 'center', color: '#45515F', margin: '16px 0', fontSize: 14 }}>
        {t('voice.or_type', locale)}
      </p>

      {/* Text input */}
      <form onSubmit={handleTextSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={typedQuestion}
          onChange={e => setTypedQuestion(e.target.value)}
          placeholder={t('voice.transcript_label', locale)}
          aria-label={t('voice.transcript_label', locale)}
          style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '2px solid #E4ECE8', fontSize: 16 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ minHeight: 48, padding: '0 20px', borderRadius: 12, border: 'none', background: '#14AE57', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
        >
          {loading ? '...' : '→'}
        </button>
      </form>

      {/* Cited Answer View */}
      {answer && !loading && (!detection?.requiresConfirmation || userOverride) && (
        <div style={{ marginTop: 24 }}>
          {answer.insufficientEvidence || !answer.answerText ? (
            <div role="alert" style={{ padding: 16, background: '#FFF7ED', borderRadius: 12, border: '2px solid #F06B12' }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#F06B12' }}>⚠ {t('answer.no_evidence', locale)}</p>
              <button style={{ marginTop: 12, padding: '10px 20px', borderRadius: 999, background: '#F06B12', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', minHeight: 48 }}>
                {t('answer.escalate', locale)}
              </button>
            </div>
          ) : (
            <div style={{ padding: 20, background: '#fff', borderRadius: 16, border: '1px solid #E4ECE8', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: '3px solid #14AE57' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <p style={{ margin: 0, color: '#101B2D', lineHeight: 1.7, fontSize: 16, whiteSpace: 'pre-wrap' }}>{answer.answerText}</p>
                
                {/* TTS Speaker Button */}
                <button 
                  onClick={() => speakAnswer(answer.answerText!, userOverride || detectedLanguage)}
                  aria-label="Read answer aloud"
                  style={{ background: 'none', border: 'none', color: '#14AE57', cursor: 'pointer', padding: 8, flexShrink: 0 }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </svg>
                </button>
              </div>

              {/* Citations / Schemes */}
              {answer.schemes && answer.schemes.length > 0 && (
                <div style={{ borderTop: '1px solid #E4ECE8', paddingTop: 12 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#45515F', textTransform: 'uppercase' }}>
                    {t('answer.sources_label', locale)}
                  </p>
                  {answer.schemes.map((s, i) => (
                    <a key={i} href="#"
                      style={{ display: 'block', color: '#2E78ED', fontSize: 13, marginBottom: 4 }}>
                      📄 {s.scheme_name || 'Scheme Document'}
                    </a>
                  ))}
                </div>
              )}

              {/* Save guidance */}
              <button
                onClick={() => onSaveGuidance(answer.answerText!)}
                style={{ marginTop: 16, minHeight: 48, padding: '0 20px', borderRadius: 999, border: '2px solid #14AE57', background: '#fff', color: '#14AE57', fontWeight: 600, cursor: 'pointer' }}
              >
                💾 {t('farmer.save_guidance', locale)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
