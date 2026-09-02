import { describe, it, expect } from 'vitest';
import {
  MockLanguageDetector,
  MockSpeechToTextProvider,
  MockTextToSpeechProvider,
} from '../src/modules/language/mock-providers';
import { LanguageService } from '../src/modules/language/index';
import { LOW_CONFIDENCE_THRESHOLD } from '../src/modules/language/interfaces';

describe('LanguageDetector (Mock)', () => {
  const detector = new MockLanguageDetector();

  it('detects Devanagari text as Hindi', async () => {
    const result = await detector.detectFromText('मुझे PMFBY के बारे में जानकारी चाहिए');
    expect(result.detectedLanguage).toBe('hi');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('detects Bengali text as Bengali', async () => {
    const result = await detector.detectFromText('আমাকে প্রকল্পের তথ্য দিন');
    expect(result.detectedLanguage).toBe('bn');
  });

  it('detects plain ASCII text as English', async () => {
    const result = await detector.detectFromText('Tell me about crop insurance scheme');
    expect(result.detectedLanguage).toBe('en');
  });

  it('sets requiresConfirmation = true when confidence < threshold', async () => {
    const result = await detector.detectFromAudio(new ArrayBuffer(8));
    expect(result.confidence).toBeLessThan(LOW_CONFIDENCE_THRESHOLD);
    expect(result.requiresConfirmation).toBe(true);
  });

  it('includes alternative candidates (for code-switched speech)', async () => {
    const result = await detector.detectFromText('PMFBY योजना kya hai?');
    expect(result.alternatives.length).toBeGreaterThan(0);
  });
});

describe('SpeechToTextProvider (Mock)', () => {
  const stt = new MockSpeechToTextProvider();

  it('returns an original transcript and language', async () => {
    const result = await stt.transcribe(new ArrayBuffer(8), 'hi');
    expect(result.originalTranscript).toBeTruthy();
    expect(result.transcriptLanguage).toBe('hi');
  });

  it('preserves original transcript — does not modify it', async () => {
    const result = await stt.transcribe(new ArrayBuffer(8), 'hi');
    // The transcript must be stored as-is, no translation or modification
    expect(result.originalTranscript).toBe('मुझे PMFBY योजना के बारे में जानकारी चाहिए');
  });
});

describe('TextToSpeechProvider (Mock)', () => {
  const tts = new MockTextToSpeechProvider();

  it('synthesizes audio without throwing', async () => {
    const buffer = await tts.synthesize('आपकी जानकारी मिल गई।', 'hi');
    expect(buffer).toBeInstanceOf(ArrayBuffer);
  });
});

describe('LanguageService', () => {
  const service = new LanguageService(
    new MockLanguageDetector(),
    new MockSpeechToTextProvider()
  );

  it('processes text input and returns detected language', async () => {
    const result = await service.processTextInput('मुझे जानकारी चाहिए');
    expect(result.detection.detectedLanguage).toBe('hi');
    expect(result.resolved.source).toBe('detected');
  });

  it('user override takes precedence as a per-interaction override', async () => {
    const result = await service.processTextInput('मुझे जानकारी चाहिए', 'mr');
    expect(result.resolved.language).toBe('mr');
    expect(result.resolved.source).toBe('user_override');
  });

  it('user override does NOT permanently change detected language', async () => {
    // First call with override
    await service.processTextInput('मुझे जानकारी चाहिए', 'mr');
    // Second call without override — detection runs fresh
    const second = await service.processTextInput('Tell me about PMFBY');
    expect(second.resolved.source).toBe('detected');
    expect(second.resolved.language).toBe('en'); // Fresh detection
  });

  it('audio processing sets requiresConfirmation for low-confidence audio', async () => {
    const result = await service.processAudioInput(new ArrayBuffer(8));
    expect(result.detection.requiresConfirmation).toBe(true);
  });

  it('preserves original transcript in audio flow', async () => {
    const result = await service.processAudioInput(new ArrayBuffer(8));
    expect(result.transcript?.originalTranscript).toBeTruthy();
  });
});
