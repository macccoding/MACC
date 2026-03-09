/**
 * Web Speech API wrapper for voice capture.
 *
 * Handles browser compatibility (webkitSpeechRecognition fallback),
 * auto-restart on unexpected stops, and interim/final result streaming.
 */

/* ---------------------------------------------------------------
 * Inline Web Speech API type declarations.
 * These aren't in all TypeScript DOM libs, so we declare them here
 * to keep the module self-contained.
 * --------------------------------------------------------------- */

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventLike {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionErrorEventLike {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

// Browser compat — Chrome uses the webkit prefix, others may use standard
function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;

  const win = window as unknown as Record<string, unknown>;
  return (
    (win.SpeechRecognition as SpeechRecognitionConstructor | undefined) ??
    (win.webkitSpeechRecognition as SpeechRecognitionConstructor | undefined) ??
    null
  );
}

/** Check if the browser supports the Web Speech API */
export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

export interface SpeechRecognizerCallbacks {
  /** Called with transcript text. `isFinal` is true when the engine commits the phrase. */
  onResult: (text: string, isFinal: boolean) => void;
  /** Called on recognition errors. */
  onError: (error: string) => void;
  /** Called when recognition ends (whether intentional or not). */
  onEnd: () => void;
}

export class SpeechRecognizer {
  private recognition: SpeechRecognitionLike | null = null;
  private listening = false;
  private intentionallyStopped = false;
  private callbacks: SpeechRecognizerCallbacks;

  constructor(callbacks: SpeechRecognizerCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Start listening. Returns false if the browser doesn't support the API.
   */
  start(): boolean {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) return false;

    // If already listening, no-op
    if (this.listening && this.recognition) return true;

    this.intentionallyStopped = false;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      // The results list may contain multiple entries; grab the latest
      const last = event.results[event.results.length - 1];
      if (last) {
        this.callbacks.onResult(last[0].transcript, last.isFinal);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      // "aborted" fires when we intentionally stop — don't surface it
      if (event.error === "aborted") return;
      this.callbacks.onError(event.error);
    };

    recognition.onend = () => {
      // Auto-restart if we didn't intentionally stop
      if (this.listening && !this.intentionallyStopped) {
        try {
          recognition.start();
          return; // don't fire onEnd — we're restarting
        } catch {
          // start() can throw if called too quickly; fall through to onEnd
        }
      }

      this.listening = false;
      this.recognition = null;
      this.callbacks.onEnd();
    };

    try {
      recognition.start();
      this.recognition = recognition;
      this.listening = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Stop listening.
   */
  stop(): void {
    this.intentionallyStopped = true;
    this.listening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Already stopped
      }
      this.recognition = null;
    }
  }

  /**
   * Whether the recognizer is currently listening.
   */
  isListening(): boolean {
    return this.listening;
  }
}
