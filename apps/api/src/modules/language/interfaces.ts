/**
 * Language Detection Interfaces for Sahakaar Sathi.
 *
 * Rules enforced here:
 * - Language is ALWAYS dynamically detected from the actual input.
 * - A user preference is an override, never a forced permanent setting.
 * - Confidence below LOW_CONFIDENCE_THRESHOLD triggers user confirmation.
 * - Original transcript is always preserved.
 * - Designed to handle code-switched speech (e.g. Hindi + English).
 */

export const LOW_CONFIDENCE_THRESHOLD = 0.70;

export interface DetectionResult {
  /** BCP-47 language tag e.g. "hi", "en", "mr", "gu", "bn" */
  detectedLanguage: string;
  /** 0.0 – 1.0 confidence score */
  confidence: number;
  /** Whether confidence is too low to be trusted without user confirmation */
  requiresConfirmation: boolean;
  /** All detected language candidates with scores (for code-switched speech) */
  alternatives: Array<{ language: string; confidence: number }>;
}

export interface TranscriptResult {
  /** The original, unmodified transcript from STT */
  originalTranscript: string;
  /** The language that was used for transcription */
  transcriptLanguage: string;
}

/** Detects the language of a text or audio buffer */
export interface LanguageDetector {
  detectFromText(text: string): Promise<DetectionResult>;
  detectFromAudio(audioBuffer: ArrayBuffer): Promise<DetectionResult>;
}

/** Converts audio to text in a given language */
export interface SpeechToTextProvider {
  transcribe(audioBuffer: ArrayBuffer, languageHint?: string): Promise<TranscriptResult>;
}

/** Converts text to audio in a given language */
export interface TextToSpeechProvider {
  synthesize(text: string, language: string): Promise<ArrayBuffer>;
}

/** The resolved language for an interaction, after detection + optional override */
export interface ResolvedLanguage {
  language: string;
  source: 'detected' | 'user_override';
  confidence?: number;
}
