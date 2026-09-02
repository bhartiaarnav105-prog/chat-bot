import {
  LanguageDetector,
  SpeechToTextProvider,
  DetectionResult,
  TranscriptResult,
  ResolvedLanguage,
  LOW_CONFIDENCE_THRESHOLD,
} from './interfaces';
import { MockLanguageDetector, MockSpeechToTextProvider } from './mock-providers';

interface ProcessedInput {
  transcript: TranscriptResult | null;
  detection: DetectionResult;
  resolved: ResolvedLanguage;
}

/**
 * LanguageService orchestrates the full detection flow:
 *
 * audio/text → detect language → confidence check → 
 * if low → requiresConfirmation = true (UI asks user)
 * user may provide override → resolved language stored per interaction
 *
 * Rules enforced:
 * - User preference is an OVERRIDE only, never a permanent forced language
 * - Original transcript is always preserved
 * - Confidence score is always stored
 */
export class LanguageService {
  constructor(
    private detector: LanguageDetector = new MockLanguageDetector(),
    private stt: SpeechToTextProvider = new MockSpeechToTextProvider()
  ) {}

  /**
   * Process typed text input.
   * Detects language, stores confidence, preserves original text.
   */
  async processTextInput(text: string, userOverride?: string): Promise<ProcessedInput> {
    const detection = await this.detector.detectFromText(text);

    const resolved: ResolvedLanguage = userOverride
      ? { language: userOverride, source: 'user_override' }
      : { language: detection.detectedLanguage, source: 'detected', confidence: detection.confidence };

    return {
      transcript: { originalTranscript: text, transcriptLanguage: detection.detectedLanguage },
      detection,
      resolved,
    };
  }

  /**
   * Process audio input.
   * Detects language first, transcribes, stores confidence.
   * Low confidence → requiresConfirmation flag is set for the UI.
   */
  async processAudioInput(audioBuffer: ArrayBuffer, userOverride?: string): Promise<ProcessedInput> {
    // Step 1: Detect language from audio
    const detection = await this.detector.detectFromAudio(audioBuffer);

    // Step 2: Transcribe using detected language as hint
    const transcript = await this.stt.transcribe(audioBuffer, detection.detectedLanguage);

    // Step 3: Resolve language — user override takes precedence but is NOT permanent
    const resolved: ResolvedLanguage = userOverride
      ? { language: userOverride, source: 'user_override' }
      : { language: detection.detectedLanguage, source: 'detected', confidence: detection.confidence };

    return { transcript, detection, resolved };
  }

  /** Resolve effective language — always returns detected unless user explicitly overrides */
  resolveLanguage(detected: string, userOverride?: string): ResolvedLanguage {
    if (userOverride) {
      return { language: userOverride, source: 'user_override' };
    }
    return { language: detected, source: 'detected' };
  }
}
