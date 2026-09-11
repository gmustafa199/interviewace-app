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
  onComplete: (transcript: Message[], durationSec: number) => void;
};

type SpokenChunk = { speaker?: string; text: string };

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Split text into spoken-sentence chunks (each < ~260 chars).
 * Detects panel-member prefixes ("Chairman:", "Member 2:") and tags every
 * sentence with the active speaker so the TTS server can assign each
 * panelist a distinct neural voice.
 */
function splitIntoSpokenChunks(text: string): SpokenChunk[] {
  let clean = text.replace(/\*\*(.*?)\*\*/g, '$1');
  clean = clean.replace(/`([^`]+)`/g, '$1');
  clean = clean.replace(/^#+\s*/gm, '');

  const speakerPattern =
    /(?:^|\n)\s*((?:Chairman|Member\s*\d*|Panelist|Interviewer)\s*:\s*)/gi;

  const matches = [...clean.matchAll(speakerPattern)];
  if (matches.length === 0) {
    return splitSentences(clean).map((t) => ({ text: t }));
  }

  const parts: SpokenChunk[] = [];

  // Segment before the first speaker prefix
  if (matches[0].index && matches[0].index > 0) {
    const head = clean.slice(0, matches[0].index).trim();
    if (head) {
      splitSentences(head).forEach((t) => parts.push({ text: t }));
    }
  }

  matches.forEach((m, i) => {
    const speakerLabel = m[1].replace(/:$/, '').trim();
    const start = (m.index || 0) + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : clean.length;
    const segment = clean.slice(start, end).trim();
    if (segment) {
      splitSentences(segment).forEach((s) => parts.push({ speaker: speakerLabel, text: s }));
    }
  });

  if (parts.length === 0) {
    return splitSentences(clean).map((t) => ({ text: t }));
  }
  return parts;
}

function splitSentences(text: string): string[] {
  const rough = text.match(/[^.!?]+[.!?]*(?:\s+|$)/g) || [text];
  return rough.map((s) => s.trim()).filter((s) => s.length > 0);
}

/** Natural pause (ms) after a chunk — humans breathe between sentences. */
function pauseAfterChunk(chunk: SpokenChunk, nextChunk?: SpokenChunk): number {
  if (nextChunk && nextChunk.speaker && nextChunk.speaker !== chunk.speaker) {
    return 650; // panel handover — longer beat
  }
  const t = chunk.text.trim();
  if (/\?$/.test(t)) return 520; // question hangs in the air
  if (/[.!]$/.test(t)) return 340; // full stop
  return 240; // mid-sentence split
}

/* ------------------------------------------------------------------ */
/* Voice animations                                                   */
/* ------------------------------------------------------------------ */

function SpeakingWaveform({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="block w-0.5 rounded-full bg-current"
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

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
          style={{ animation: `typing-dot 1.2s ease-in-out ${i * 0.18}s infinite` }}
        />
      ))}
      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
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
  const [speakingSpeaker, setSpeakingSpeaker] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const questionNumberRef = useRef(1);
  const autoPlayRef = useRef(true);
  const playbackQueueRef = useRef<{ messageId: string; chunks: SpokenChunk[]; idx: number } | null>(
    null
  );
  const stopPlaybackRef = useRef(false);
  const speechRecognitionRef = useRef<any>(null);
  const voicesReadyRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    questionNumberRef.current = questionNumber;
  }, [questionNumber]);
  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

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

  /* ------------------- BROWSER TTS (last-resort fallback) --------- */

  /**
   * Warm up the voice list — Chrome loads voices asynchronously, and the
   * first getVoices() call often returns an empty array.
   */
  useEffect(() => {
    if (!isVoice) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const warm = () => {
      const voices = synth.getVoices();
      if (voices.length > 0) voicesReadyRef.current = true;
    };
    warm();
    synth.addEventListener('voiceschanged', warm);
    return () => synth.removeEventListener('voiceschanged', warm);
  }, [isVoice]);

  /** Pick the most human-sounding browser voice available. */
  function pickBrowserVoice(): SpeechSynthesisVoice | undefined {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return undefined;
    const byName = (frag: string) => voices.find((v) => v.name.includes(frag));
    return (
      byName('Google UK English Female') ||
      byName('Google UK English Male') ||
      byName('Google US English') ||
      byName('Microsoft Aria') ||
      byName('Microsoft Neerja') ||
      byName('Microsoft Sonia') ||
      voices.find((v) => v.lang === 'en-IN') ||
      voices.find((v) => v.lang === 'en-GB') ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0]
    );
  }

  const playWithBrowserTTS = (text: string, speaker?: string | null): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      // Interviewers speak a touch slower than default; questions even slower
      utter.rate = /\?\s*$/.test(text.trim()) ? 0.88 : 0.94;
      // Vary pitch slightly per panel member so voices are distinguishable
      const s = (speaker || '').toLowerCase();
      utter.pitch = s.includes('chairman') ? 0.9 : /\d/.test(s) && parseInt(s.match(/\d/)![0], 10) % 2 === 1 ? 1.08 : 1.0;
      utter.volume = 1.0;
      utter.lang = 'en-IN';

      const voice = pickBrowserVoice();
      if (voice) utter.voice = voice;

      utter.onend = () => setTimeout(resolve, 300);
      utter.onerror = () => resolve();
      window.speechSynthesis.speak(utter);
    });
  };

  /* ------------------- TTS PLAYBACK (sentence-by-sentence) -------- */

  const stopPlayback = useCallback(() => {
    stopPlaybackRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentSpeakingId(null);
    setCurrentChunkIdx(0);
    setTotalChunks(0);
    setSpeakingSpeaker(null);
    playbackQueueRef.current = null;
  }, []);

  const playChunkQueue = useCallback(async () => {
    const queue = playbackQueueRef.current;
    if (!queue) return;

    while (queue.idx < queue.chunks.length) {
      if (stopPlaybackRef.current) return;

      const chunk = queue.chunks[queue.idx];
      setCurrentChunkIdx(queue.idx + 1);
      setSpeakingSpeaker(chunk.speaker || null);

      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: chunk.text, speaker: chunk.speaker }),
        });

        const contentType = res.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data.use_browser_tts) {
            await playWithBrowserTTS(data.text || chunk.text, chunk.speaker);
          } else if (data.error) {
            console.warn('TTS error, skipping:', data.error);
          }
        } else if (res.ok) {
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
              setTimeout(resolve, 120);
            };
            audio.onerror = () => {
              URL.revokeObjectURL(url);
              resolve();
            };
            audio.play().catch(() => resolve());
          });
        }

        // Natural pause between sentences / panel handovers
        const gap = pauseAfterChunk(chunk, queue.chunks[queue.idx + 1]);
        await new Promise((r) => setTimeout(r, gap));
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
      setSpeakingSpeaker(null);
      playbackQueueRef.current = null;
    }
  }, []);

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
    [isVoice, playChunkQueue]
  );

  const pausePlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resumePlayback = useCallback(() => {
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play().catch(() => {});
      setIsPaused(false);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
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
      if (isVoice && autoPlayRef.current) {
        setTimeout(() => speakMessage(messageId, aiMessage.content), 350);
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

  async function startRecording() {
    setMicError(null);
    stopPlayback();

    const SpeechRecognition =
      (typeof window !== 'undefined' &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
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
    if (speechRecognitionRef.current && isRecording) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
      setIsRecording(false);
      return;
    }
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
      const durationSec = Math.floor((Date.now() - startTime) / 1000);
      onComplete(newMessages, durationSec);
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

  function extractSpeaker(content: string): string | null {
    const m = content.match(/^\s*(Chairman|Member\s*\d*|Panelist|Interviewer)\s*:\s*/i);
    return m ? m[1].replace(/\s+/g, ' ').trim() : null;
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <audio ref={audioRef} className="hidden" />

      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-foreground"
              onClick={() => {
                stopPlayback();
                onBack();
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit
            </Button>
            <div className="flex items-center gap-2">
              {isVoice && (
                <Badge
                  variant="outline"
                  className={`border-indigo-200 text-indigo-700 ${
                    isSpeaking ? 'bg-indigo-50' : 'bg-white'
                  }`}
                >
                  {isSpeaking ? (
                    <>
                      <SpeakingWaveform className="text-indigo-600" />
                      <span className="ml-2 text-xs font-medium">
                        {speakingSpeaker || 'Interviewer'} speaking
                      </span>
                    </>
                  ) : isPaused ? (
                    <>
                      <Pause className="mr-1 h-3 w-3" /> Paused
                    </>
                  ) : (
                    <>
                      <Mic className="mr-1 h-3 w-3" /> Voice mode
                    </>
                  )}
                </Badge>
              )}
              {isExam && role.panelSize && (
                <Badge variant="outline" className="hidden bg-white sm:flex">
                  <Users className="mr-1 h-3 w-3" />
                  {role.panelSize}-member panel
                </Badge>
              )}
              <Badge variant="outline" className="bg-white font-medium tabular-nums">
                <Clock className="mr-1 h-3 w-3" />
                {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
              </Badge>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">
                {role.title}
                <span className="font-normal text-slate-400">
                  {' '}
                  · {difficulty} {isExam ? 'depth' : 'level'}
                  {isVoice ? ' · Voice' : ''}
                </span>
              </span>
              <span className="tabular-nums text-slate-500">
                Question <span className="font-semibold text-indigo-600">{Math.min(questionNumber, totalQuestions)}</span> of {totalQuestions}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 && isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
                <Bot className="h-7 w-7 text-indigo-600" />
              </div>
              <p className="text-sm font-medium">Your interviewer is joining…</p>
              <p className="mt-1 text-xs text-slate-400">Setting up the room</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const messageId = `msg-${i}`;
            const isAiSpeakingThis = currentSpeakingId === messageId;
            const speaker = msg.role === 'assistant' ? extractSpeaker(msg.content) : null;
            return (
              <div
                key={i}
                className={`chat-msg mb-5 flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                style={{ animationDelay: `${Math.min(i * 60, 400)}ms` }}
              >
                <style>{`
                  @keyframes chat-enter {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                  }
                  .chat-msg { animation: chat-enter 0.35s ease-out backwards; }
                `}</style>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-slate-600 text-white'
                        : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
                    }`}
                  >
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  {isAiSpeakingThis && (
                    <SpeakingWaveform className="text-indigo-500" />
                  )}
                </div>
                <div
                  className={`group max-w-[82%] ${
                    msg.role === 'user' ? 'items-end' : ''
                  }`}
                >
                  {speaker && (
                    <div className="mb-1 ml-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100">
                        <Users className="h-2.5 w-2.5" />
                      </span>
                      {speaker}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-sm ${
                      msg.role === 'user'
                        ? 'rounded-tr-md bg-indigo-600 text-white'
                        : 'rounded-tl-md border border-slate-200/80 bg-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                      {msg.content}
                    </p>
                    {msg.role === 'assistant' && isVoice && (
                      <div className="mt-2 flex items-center gap-1 border-t border-slate-100 pt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-slate-500 hover:text-indigo-600"
                          onClick={() => {
                            if (isAiSpeakingThis) {
                              if (isPaused) resumePlayback();
                              else pausePlayback();
                            } else {
                              stopPlaybackRef.current = false;
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
                        {isAiSpeakingThis && !isPaused && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-slate-500 hover:text-indigo-600"
                            onClick={stopPlayback}
                          >
                            <VolumeX className="mr-1 h-3 w-3" /> Stop
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && messages.length > 0 && (
            <div className="chat-msg mb-5 flex gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-md border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                <TypingDots />
              </div>
            </div>
          )}

          {error && (
            <Card className="border-rose-200 bg-rose-50/60 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-rose-700">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 border-rose-200 bg-white hover:bg-rose-50"
                    onClick={() => askNextQuestion(messagesRef.current)}
                  >
                    Try again
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {micError && (
            <Card className="border-amber-200 bg-amber-50/60 p-3 shadow-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <p className="text-xs text-amber-700">{micError}</p>
              </div>
            </Card>
          )}

          {isFinishing && (
            <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Interview complete</p>
                  <p className="text-xs text-slate-500">
                    Evaluating your performance — generating your scorecard…
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Input */}
      <footer className="border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto max-w-3xl px-4 py-4">
          {isVoice && (
            <div className="mb-3 flex flex-wrap items-center justify-center gap-3">
              <div className="relative">
                {isRecording && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/40" />
                )}
                <Button
                  variant={isRecording ? 'destructive' : 'default'}
                  size="lg"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing || isLoading || isFinishing || isSpeaking}
                  className="relative h-14 w-14 rounded-full p-0 shadow-md"
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  {isRecording ? (
                    <Square className="h-5 w-5" />
                  ) : isTranscribing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">
                  {isRecording
                    ? 'Listening… tap to stop'
                    : isTranscribing
                    ? 'Transcribing…'
                    : isSpeaking
                    ? 'Interviewer is speaking'
                    : input
                    ? 'Tap the mic to add more'
                    : 'Tap the mic and answer out loud'}
                </p>
                <p className="text-xs text-slate-400">
                  You can also type your answer below
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoPlay(!autoPlay)}
                className="ml-auto rounded-full text-xs text-slate-500"
              >
                {autoPlay ? 'Auto-play on' : 'Auto-play off'}
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
                  ? 'Or type your answer here…'
                  : 'Type your answer… (⌘/Ctrl + Enter to send)'
              }
              className="min-h-[56px] max-h-[160px] resize-none rounded-xl border-slate-200 bg-white focus-visible:ring-indigo-400"
              disabled={isLoading || isFinishing}
            />
            {input && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setInput('')}
                className="flex-shrink-0 rounded-xl border-slate-200"
                title="Clear"
              >
                <Trash2 className="h-4 w-4 text-slate-400" />
                <span className="sr-only">Clear</span>
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading || isFinishing}
              size="lg"
              className="flex-shrink-0 rounded-xl bg-indigo-600 shadow-sm hover:bg-indigo-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            {isVoice
              ? 'Speak naturally — the interviewer will follow up on your answer'
              : questionNumber < totalQuestions
              ? 'Answer, then the interviewer follows up'
              : 'Last question — make it count'}
          </p>
        </div>
      </footer>
    </div>
  );
}
