import {
  LanguageDetector,
  SpeechToTextProvider,
  TextToSpeechProvider,
  DetectionResult,
  TranscriptResult,
  LOW_CONFIDENCE_THRESHOLD,
} from './interfaces';

/**
 * Mock LanguageDetector — simulates detection based on simple heuristics.
 * Used in tests and development only. No API key required.
 */
export class MockLanguageDetector implements LanguageDetector {
  async detectFromText(text: string): Promise<DetectionResult> {
    // Very naive detection based on Unicode script ranges for demonstration
    const devanagariPattern = /[\u0900-\u097F]/;
    const bengaliPattern = /[\u0980-\u09FF]/;
    const gujaratiPattern = /[\u0A80-\u0AFF]/;

    let detectedLanguage = 'en';
    let confidence = 0.90;

    if (devanagariPattern.test(text)) {
      detectedLanguage = 'hi';
      confidence = 0.88;
    } else if (bengaliPattern.test(text)) {
      detectedLanguage = 'bn';
      confidence = 0.85;
    } else if (gujaratiPattern.test(text)) {
      detectedLanguage = 'gu';
      confidence = 0.82;
    }

    return {
      detectedLanguage,
      confidence,
      requiresConfirmation: confidence < LOW_CONFIDENCE_THRESHOLD,
      alternatives: [
        { language: detectedLanguage, confidence },
        { language: 'en', confidence: 1 - confidence },
      ],
    };
  }

  async detectFromAudio(_audioBuffer: ArrayBuffer): Promise<DetectionResult> {
    // Mock: always return Hindi with moderate confidence for audio
    return {
      detectedLanguage: 'hi',
      confidence: 0.65, // Below threshold → requiresConfirmation = true
      requiresConfirmation: true,
      alternatives: [
        { language: 'hi', confidence: 0.65 },
        { language: 'mr', confidence: 0.20 },
        { language: 'en', confidence: 0.15 },
      ],
    };
  }
}

/**
 * Mock SpeechToTextProvider — returns a canned transcript.
 * Used in tests and development only. No API key required.
 */
export class MockSpeechToTextProvider implements SpeechToTextProvider {
  async transcribe(
    _audioBuffer: ArrayBuffer,
    languageHint?: string
  ): Promise<TranscriptResult> {
    return {
      originalTranscript: 'मुझे PMFBY योजना के बारे में जानकारी चाहिए',
      transcriptLanguage: languageHint || 'hi',
    };
  }
}

/**
 * Mock TextToSpeechProvider — returns an empty ArrayBuffer.
 * Used in tests and development only. No API key required.
 */
export class MockTextToSpeechProvider implements TextToSpeechProvider {
  async synthesize(text: string, language: string): Promise<ArrayBuffer> {
    console.log(`[MockTTS] Synthesizing "${text}" in "${language}"`);
    return new ArrayBuffer(0);
  }
}
