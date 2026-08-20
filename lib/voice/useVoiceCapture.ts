import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

/**
 * Voice capture (spec section 6), built on `expo-speech-recognition` (jamsch), which wraps
 * `SFSpeechRecognizer` on iOS and Android's on-device `SpeechRecognizer` behind a single
 * cross-platform API and an Expo config plugin (see app.json's "expo-speech-recognition"
 * plugin entry for the permission strings).
 *
 * Requirements:
 *   - Package: expo-speech-recognition
 *   - iOS: NSMicrophoneUsageDescription + NSSpeechRecognitionUsageDescription (Info.plist,
 *     set via the config plugin)
 *   - Android: RECORD_AUDIO permission (manifest, set via the config plugin)
 *   - Requires a custom Expo development build — the native module is not present in Expo Go.
 *     On web / Expo Go, `isAvailable` is false and the mic button should fall back to typing.
 */
export interface UseVoiceCaptureOptions {
  /** Called directly from the recognizer's own event, as each transcript update arrives. */
  onTranscript?: (text: string, isFinal: boolean) => void;
}

export function useVoiceCapture(options: UseVoiceCaptureOptions = {}) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const finalTranscriptRef = useRef('');
  const onTranscriptRef = useRef(options.onTranscript);
  onTranscriptRef.current = options.onTranscript;

  useEffect(() => {
    try {
      setIsAvailable(ExpoSpeechRecognitionModule.isRecognitionAvailable());
    } catch {
      setIsAvailable(false);
    }
  }, []);

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);
    if (event.isFinal) finalTranscriptRef.current = text;
    onTranscriptRef.current?.(text, event.isFinal);
  });

  useSpeechRecognitionEvent('error', (event) => {
    setError(event.message || event.error);
    setIsListening(false);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  const start = useCallback(async () => {
    setError(null);
    setTranscript('');
    finalTranscriptRef.current = '';

    const permission =
      Platform.OS === 'web'
        ? await ExpoSpeechRecognitionModule.getPermissionsAsync()
        : await ExpoSpeechRecognitionModule.requestPermissionsAsync();

    if (!permission.granted) {
      setError('Microphone or speech recognition permission was not granted.');
      return;
    }

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
    setIsListening(true);
  }, []);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  return {
    isAvailable,
    isListening,
    transcript,
    error,
    start,
    stop,
    /** The last transcript marked final by the recognizer, if any. */
    getFinalTranscript: () => finalTranscriptRef.current || transcript,
  };
}
