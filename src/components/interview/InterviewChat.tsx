'use client';

import { useState, useRef, useEffect } from 'react';
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

export function InterviewChat({
  role,
  difficulty,
  mode,
  totalQuestions,
  onBack,
  onComplete,
}: Props) {
  const isVoice = mode === 'voice';

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
  const [autoPlay, setAutoPlay] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const questionNumberRef = useRef(1);

  // Keep refs in sync with state for use in callbacks
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

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Fetch TTS audio for a message and play it
  async function speakMessage(messageId: string, text: string) {
    if (!autoPlay || !isVoice) return;
    try {
      setIsSpeaking(true);
      setCurrentSpeakingId(messageId);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          setCurrentSpeakingId(null);
          URL.revokeObjectURL(url);
        };
        audioRef.current.onerror = () => {
          setIsSpeaking(false);
          setCurrentSpeakingId(null);
        };
        await audioRef.current.play();
      }
    } catch (err) {
      setIsSpeaking(false);
      setCurrentSpeakingId(null);
    }
  }

  function stopSpeaking() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setCurrentSpeakingId(null);
  }

  // Kick off the interview with the first question
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    void askNextQuestion([]);
  }, []);

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
      // Auto-play the AI's voice in voice mode
      const messageId = `msg-${newMessages.length - 1}`;
      if (isVoice) {
        // slight delay so the chat renders first
        setTimeout(() => speakMessage(messageId, aiMessage.content), 200);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // --- Voice Recording ---

  async function startRecording() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  async function transcribeAudio(blob: Blob) {
    setIsTranscribing(true);
    try {
      // convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          // strip the data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const res = await fetch('/api/asr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_base64: base64 }),
      });
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

  async function handleSubmit() {
    if (!input.trim() || isLoading) return;
    // stop any playing audio
    stopSpeaking();
    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messagesRef.current, userMessage];
    setMessages(newMessages);
    setInput('');

    const nextQuestionNumber = questionNumberRef.current + 1;

    if (nextQuestionNumber > totalQuestions) {
      // Interview is done — pass transcript to parent for feedback
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

  function clearInput() {
    setInput('');
  }

  const progressPercent = Math.min(
    100,
    ((questionNumber - 1) / totalQuestions) * 100
  );

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} className="hidden" />

      {/* Top bar */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => { stopSpeaking(); onBack(); }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit
            </Button>
            <div className="flex items-center gap-3">
              {isVoice && (
                <Badge variant={isSpeaking ? 'default' : 'outline'}>
                  {isSpeaking ? (
                    <>
                      <Volume2 className="mr-1 h-3 w-3 animate-pulse" />
                      Speaking
                    </>
                  ) : (
                    <>
                      <Mic className="mr-1 h-3 w-3" />
                      Voice Mode
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
              <Badge variant="secondary">
                <Clock className="mr-1 h-3 w-3" />
                {mins.toString().padStart(2, '0')}:
                {secs.toString().padStart(2, '0')}
              </Badge>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">
                {role.title} · {difficulty} level{isVoice ? ' · Voice' : ''}
              </span>
              <span>
                Question {Math.min(questionNumber, totalQuestions)} of{' '}
                {totalQuestions}
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
            return (
              <div
                key={i}
                className={`mb-6 flex gap-3 ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                    msg.role === 'user'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`group max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.content}
                  </p>
                  {/* AI message actions in voice mode */}
                  {msg.role === 'assistant' && isVoice && (
                    <div className="mt-2 flex items-center gap-2 border-t border-border/50 pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() =>
                          isAiSpeakingThis
                            ? stopSpeaking()
                            : speakMessage(messageId, msg.content)
                        }
                      >
                        {isAiSpeakingThis ? (
                          <>
                            <VolumeX className="mr-1 h-3 w-3" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Volume2 className="mr-1 h-3 w-3" />
                            Replay
                          </>
                        )}
                      </Button>
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
                  <p className="text-sm font-medium text-destructive">
                    {error}
                  </p>
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
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {micError}
                </p>
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
            <div className="mb-3 flex items-center justify-center gap-2">
              <Button
                variant={isRecording ? 'destructive' : 'default'}
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing || isLoading || isFinishing}
                className="rounded-full"
              >
                {isRecording ? (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Stop Recording
                  </>
                ) : isTranscribing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    {input ? 'Record More' : 'Hold to Speak'}
                  </>
                )}
              </Button>
              {isSpeaking && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopSpeaking}
                  className="rounded-full"
                >
                  <VolumeX className="mr-2 h-4 w-4" />
                  Stop Audio
                </Button>
              )}
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
                onClick={clearInput}
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
              : 'This is the last question. After your answer, you\'ll get your scorecard.'}
          </p>
        </div>
      </footer>
    </div>
  );
}
