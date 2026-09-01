'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  User,
  Bot,
  Clock,
  Mic,
  Square,
  Volume2,
  VolumeX,
  Trash2,
  Pause,
  Users,
} from 'lucide-react';
import type { Role } from '@/lib/roles';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type Props = {
  role: Role;
  difficulty: string;
  mode: string; // 'text' | 'voice'
  totalQuestions: number;
  onBack: () => void;
  onComplete: (transcript: Message[]) => void;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Split text into spoken-sentence chunks. Each chunk is short enough to be
 * TTS-friendly (under ~250 chars). We split on sentence enders and also on
 * "Member X:" prefixes (which appear in UPSC/banking panel simulations).
 */
function splitIntoSpokenChunks(text: string): { speaker?: string; text: string }[] {
  // Strip markdown bold/italics that don't translate well to speech
  let clean = text.replace(/\*\*(.*?)\*\*/g, '$1');
  clean = clean.replace(/`([^`]+)`/g, '$1');
  clean = clean.replace(/^#+\s*/gm, '');

  // Detect panel-member prefix pattern: "Chairman:", "Member 2:", etc.
  // We split on these and tag each chunk with the speaker.
  const speakerPattern = /(?:^|\n)\s*((?:Chairman|Member\s*\d*|Panelist|Interviewer)\s*:\s*)/gi;
  const parts: { speaker?: string; text: string }[] = [];
  let lastIndex = 0;
  let currentSpeaker: string | undefined;

  const matches = [...clean.matchAll(speakerPattern)];
  if (matches.length === 0) {
    // No speaker prefixes — split into sentences
    return splitSentences(clean).map((t) => ({ text: t }));
  }

  // Initial segment before any speaker prefix
  if (matches[0].index && matches[0].index > 0) {
    const head = clean.slice(0, matches[0].index).trim();
    if (head) {
      parts.push(...splitSentences(head).map((t) => ({ text: t })));
    }
  }

  matches.forEach((m, i) => {
    const speakerLabel = m[1].replace(/:$/, '').trim();
    currentSpeaker = speakerLabel;
    const start = (m.index || 0) + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : clean.length;
    const segment = clean.slice(start, end).trim();
    if (segment) {
      const sentences = splitSentences(segment);
      sentences.forEach((s, idx) => {
        parts.push({ speaker: idx === 0 ? currentSpeaker : undefined, text: s });
      });
    }
    lastIndex = end;
  });

  if (parts.length === 0) {
    return splitSentences(clean).map((t) => ({ text: t }));
  }
  return parts;
}

function splitSentences(text: string): string[] {
  // Split on . ! ? followed by space/newline, but keep abbreviations intact.
  const rough = text.match(/[^.!?]+[.!?]*(?:\s+|$)/g) || [text];
  return rough
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/* ------------------------------------------------------------------ */
/* Speaker-waveform animation                                         */
/* ------------------------------------------------------------------ */

function SpeakingWaveform() {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="block w-0.5 rounded-full bg-primary"
          style={{
            height: '12px',
            animation: `speaking-wave 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes speaking-wave {
          0%   { height: 4px;  opacity: 0.5; }
          100% { height: 14px; opacity: 1;   }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export function InterviewChat({
  role,
  difficulty,
  mode,
  totalQuestions,
  onBack,
  onComplete,
}: Props) {
  const isVoice = mode === 'voice';
  const isExam = role.domain === 'IndianExam';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Voice states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null);
  const [currentChunkIdx, setCurrentChunkIdx] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const questionNumberRef = useRef(1);
  const playbackQueueRef = useRef<
    { messageId: string; chunks: { speaker?: string; text: string }[]; idx: number } | null
  >(null);
  const stopPlaybackRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    questionNumberRef.current = questionNumber;
  }, [questionNumber]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  /* ------------------- TTS PLAYBACK (sentence-by-sentence) -------- */

  const stopPlayback = useCallback(() => {
    stopPlaybackRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Also stop any browser TTS that's playing
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentSpeakingId(null);
    setCurrentChunkIdx(0);
    setTotalChunks(0);
    playbackQueueRef.current = null;
  }, []);

  const playChunkQueue = useCallback(async () => {
    const queue = playbackQueueRef.current;
    if (!queue) return;

    while (queue.idx < queue.chunks.length) {
      if (stopPlaybackRef.current) return;

      const chunk = queue.chunks[queue.idx];
      setCurrentChunkIdx(queue.idx + 1);

      try {
        // Call our TTS API — it returns either audio/wav OR a JSON signal
        // telling us to use the browser's built-in SpeechSynthesis.
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: chunk.text,
            speed: 0.92, // slightly slower = more natural
          }),
        });

        const contentType = res.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          // Server told us to use browser TTS (no ZAI_API_KEY configured).
          const data = await res.json();
          if (data.use_browser_tts) {
            await playWithBrowserTTS(data.text || chunk.text, data.rate || 0.92);
          } else if (data.error) {
            console.warn('TTS error, skipping:', data.error);
          }
        } else if (res.ok) {
          // Server returned real audio — play it
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);

          if (stopPlaybackRef.current) {
            URL.revokeObjectURL(url);
            return;
          }

          await new Promise<void>((resolve) => {
            const audio = audioRef.current;
            if (!audio) {
              resolve();
              return;
            }
            audio.src = url;
            audio.onended = () => {
              URL.revokeObjectURL(url);
              setTimeout(resolve, 300);
            };
            audio.onerror = () => {
              URL.revokeObjectURL(url);
              resolve();
            };
            audio.play().catch(() => resolve());
          });
        }
        queue.idx += 1;
      } catch {
        break;
      }
    }

    if (!stopPlaybackRef.current) {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentSpeakingId(null);
      setCurrentChunkIdx(0);
      setTotalChunks(0);
      playbackQueueRef.current = null;
    }
  }, []);

  /**
   * Browser-based TTS fallback using Web Speech API (SpeechSynthesis).
   * Free, built into Chrome/Edge, supports Indian English + Hindi voices.
   */
  const playWithBrowserTTS = (text: string, rate: number): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      // Cancel any pending speech
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = rate;
      utter.pitch = 1.0;
      utter.volume = 1.0;
      utter.lang = 'en-IN'; // Indian English (falls back to en-US)

      // Try to pick an Indian English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.lang === 'en-IN') ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];
      if (preferredVoice) utter.voice = preferredVoice;

      utter.onend = () => setTimeout(resolve, 300);
      utter.onerror = () => resolve();

      window.speechSynthesis.speak(utter);
    });
  };

  const speakMessage = useCallback(
    async (messageId: string, text: string) => {
      if (!isVoice) return;
      stopPlaybackRef.current = false;
      const chunks = splitIntoSpokenChunks(text);
      if (chunks.length === 0) return;

      playbackQueueRef.current = { messageId, chunks, idx: 0 };
      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentSpeakingId(messageId);
      setTotalChunks(chunks.length);
      setCurrentChunkIdx(1);
      await playChunkQueue();
    },
    [isVoice, playChunkQueue, stopPlayback]
  );

  const pausePlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resumePlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
      setIsPaused(false);
    }
  }, []);

  /* ------------------- INTERVIEW FLOW ----------------------------- */

  async function askNextQuestion(history: Message[]) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: role.id,
          difficulty,
          messages: history,
          questionNumber: questionNumberRef.current,
          totalQuestions,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      const aiMessage: Message = { role: 'assistant', content: data.reply };
      const newMessages = [...history, aiMessage];
      setMessages(newMessages);
      const messageId = `msg-${newMessages.length - 1}`;
      if (isVoice) {
        setTimeout(() => speakMessage(messageId, aiMessage.content), 250);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    void askNextQuestion([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------- VOICE RECORDING ---------------------------- */

  // Browser-based speech recognition (Chrome/Edge only — free, instant)
  const speechRecognitionRef = useRef<any>(null);

  async function startRecording() {
    setMicError(null);

    // Try browser Web Speech API first (free, no server roundtrip)
    const SpeechRecognition =
      (typeof window !== 'undefined' &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN'; // Indian English (falls back to en-US)
        recognition.continuous = true;
        recognition.interimResults = true;

        let finalTranscript = '';
        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interim += transcript;
            }
          }
          // Show interim in the input box so user sees feedback
          if (interim) {
            setInput((prev) => {
              const base = finalTranscript || prev;
              return base + (base.endsWith(' ') ? '' : ' ') + interim;
            });
          }
        };
        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setMicError('Microphone permission denied.');
          }
          setIsRecording(false);
        };
        recognition.onend = () => {
          setIsRecording(false);
          // Final transcript already updated via onresult
        };
        recognition.start();
        speechRecognitionRef.current = recognition;
        setIsRecording(true);
        return;
      } catch (err: any) {
        console.warn('Web Speech API failed, falling back to MediaRecorder:', err);
      }
    }

    // Fallback: MediaRecorder + server-side ASR
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        await transcribeAudio(audioBlob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      setMicError(
        err?.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow mic access in your browser.'
          : 'Could not access microphone. ' + (err?.message || '')
      );
    }
  }

  function stopRecording() {
    // Stop browser speech recognition if active
    if (speechRecognitionRef.current && isRecording) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
      setIsRecording(false);
      return;
    }
    // Otherwise stop MediaRecorder
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  async function transcribeAudio(blob: Blob) {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const res = await fetch('/api/asr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_base64: base64 }),
      });

      if (res.status === 501) {
        // Server says use browser ASR — but we're in MediaRecorder fallback
        // which means browser ASR already failed. Tell user.
        throw new Error(
          'Speech recognition not available in this browser. Try Chrome or Edge.'
        );
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Transcription failed');
      }
      const data = await res.json();
      if (data.text) {
        setInput((prev) => (prev ? prev + ' ' + data.text : data.text));
      }
    } catch (err: any) {
      setMicError(err.message || 'Failed to transcribe audio.');
    } finally {
      setIsTranscribing(false);
    }
  }

  /* ------------------- SUBMIT ------------------------------------- */

  async function handleSubmit() {
    if (!input.trim() || isLoading) return;
    stopPlayback();
    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messagesRef.current, userMessage];
    setMessages(newMessages);
    setInput('');

    const nextQuestionNumber = questionNumberRef.current + 1;
    if (nextQuestionNumber > totalQuestions) {
      setIsFinishing(true);
      onComplete(newMessages);
      return;
    }
    setQuestionNumber(nextQuestionNumber);
    await askNextQuestion(newMessages);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  /* ------------------- RENDER HELPERS ----------------------------- */

  const progressPercent = Math.min(100, ((questionNumber - 1) / totalQuestions) * 100);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  // Detect panel speaker from message content (for Indian exam panels)
  function extractSpeaker(content: string): string | null {
    const m = content.match(/^\s*(Chairman|Member\s*\d*|Panelist|Interviewer)\s*:\s*/i);
    return m ? m[1].replace(/\s+/g, ' ').trim() : null;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <audio ref={audioRef} className="hidden" />

      {/* Top bar */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => { stopPlayback(); onBack(); }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit
            </Button>
            <div className="flex items-center gap-3">
              {isVoice && (
                <Badge variant={isSpeaking ? 'default' : 'outline'}>
                  {isSpeaking ? (
                    <>
                      <SpeakingWaveform />
                      <span className="ml-2 text-xs">
                        Speaking {currentChunkIdx}/{totalChunks}
                      </span>
                    </>
                  ) : isPaused ? (
                    <>
                      <Pause className="mr-1 h-3 w-3" /> Paused
                    </>
                  ) : (
                    <>
                      <Mic className="mr-1 h-3 w-3" /> Voice Mode
                    </>
                  )}
                </Badge>
              )}
              {!isVoice && (
                <Badge variant="outline" className="hidden sm:flex">
                  <Bot className="mr-1 h-3 w-3" />
                  AI Interviewer
                </Badge>
              )}
              {isExam && role.panelSize && (
                <Badge variant="outline" className="hidden sm:flex">
                  <Users className="mr-1 h-3 w-3" />
                  {role.panelSize}-member panel
                </Badge>
              )}
              <Badge variant="secondary">
                <Clock className="mr-1 h-3 w-3" />
                {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
              </Badge>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">
                {role.title} · {difficulty} {isExam ? 'depth' : 'level'}
                {isVoice ? ' · Voice' : ''}
              </span>
              <span>
                Question {Math.min(questionNumber, totalQuestions)} of {totalQuestions}
              </span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 && isLoading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Your interviewer is preparing...
            </div>
          )}

          {messages.map((msg, i) => {
            const messageId = `msg-${i}`;
            const isAiSpeakingThis = currentSpeakingId === messageId;
            const speaker = msg.role === 'assistant' ? extractSpeaker(msg.content) : null;
            return (
              <div
                key={i}
                className={`mb-6 flex gap-3 ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                      msg.role === 'user'
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  {isAiSpeakingThis && (
                    <div className="mt-1">
                      <SpeakingWaveform />
                    </div>
                  )}
                </div>
                <div
                  className={`group max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {speaker && (
                    <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary">
                      <Users className="h-3 w-3" /> {speaker}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.content}
                  </p>
                  {msg.role === 'assistant' && isVoice && (
                    <div className="mt-2 flex items-center gap-2 border-t border-border/50 pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          if (isAiSpeakingThis) {
                            if (isPaused) resumePlayback();
                            else pausePlayback();
                          } else {
                            speakMessage(messageId, msg.content);
                          }
                        }}
                      >
                        {isAiSpeakingThis ? (
                          isPaused ? (
                            <>
                              <Volume2 className="mr-1 h-3 w-3" /> Resume
                            </>
                          ) : (
                            <>
                              <Pause className="mr-1 h-3 w-3" /> Pause
                            </>
                          )
                        ) : (
                          <>
                            <Volume2 className="mr-1 h-3 w-3" /> Replay
                          </>
                        )}
                      </Button>
                      {(isAiSpeakingThis && !isPaused) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={stopPlayback}
                        >
                          <VolumeX className="mr-1 h-3 w-3" /> Stop
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && messages.length > 0 && (
            <div className="mb-6 flex gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-muted px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          {error && (
            <Card className="border-destructive bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => askNextQuestion(messagesRef.current)}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {micError && (
            <Card className="border-amber-500 bg-amber-500/5 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <p className="text-xs text-amber-700 dark:text-amber-400">{micError}</p>
              </div>
            </Card>
          )}

          {isFinishing && (
            <Card className="border-primary bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    Interview complete! Generating your scorecard...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This takes about 20-30 seconds.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Input */}
      <footer className="border-t bg-background/95 backdrop-blur">
        <div className="container mx-auto max-w-3xl px-4 py-4">
          {isVoice && (
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              <Button
                variant={isRecording ? 'destructive' : 'default'}
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing || isLoading || isFinishing || isSpeaking}
                className="rounded-full"
              >
                {isRecording ? (
                  <>
                    <Square className="mr-2 h-4 w-4" /> Stop Recording
                  </>
                ) : isTranscribing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transcribing...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    {input ? 'Record More' : 'Hold to Speak'}
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoPlay(!autoPlay)}
                className="rounded-full text-xs"
              >
                {autoPlay ? 'Auto-play: On' : 'Auto-play: Off'}
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isVoice
                  ? 'Your transcribed answer will appear here. Edit if needed, then send.'
                  : 'Type your answer here... (Cmd/Ctrl+Enter to send)'
              }
              className="min-h-[60px] max-h-[160px] resize-none"
              disabled={isLoading || isFinishing}
            />
            {input && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setInput('')}
                className="flex-shrink-0"
                title="Clear"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Clear</span>
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading || isFinishing}
              size="lg"
              className="flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {isVoice
              ? 'Click "Hold to Speak", answer out loud, then review and send.'
              : questionNumber < totalQuestions
              ? 'Answer the question, then send. The interviewer will ask the next one.'
              : "This is the last question. After your answer, you'll get your scorecard."}
          </p>
        </div>
      </footer>
    </div>
  );
}
