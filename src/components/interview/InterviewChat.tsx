'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  User,
  Bot,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { Role } from '@/lib/roles';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type Props = {
  role: Role;
  difficulty: string;
  mode: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

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
          questionNumber,
          totalQuestions,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      const aiMessage: Message = { role: 'assistant', content: data.reply };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    const nextQuestionNumber = questionNumber + 1;

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

  const progressPercent = Math.min(
    100,
    ((questionNumber - 1) / totalQuestions) * 100
  );

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit
            </Button>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="hidden sm:flex">
                <Bot className="mr-1 h-3 w-3" />
                AI Interviewer
              </Badge>
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
                {role.title} · {difficulty} level
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
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="container mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 && isLoading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Your interviewer is preparing...
            </div>
          )}

          {messages.map((msg, i) => (
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
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

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
                    onClick={() => askNextQuestion(messages)}
                  >
                    Try Again
                  </Button>
                </div>
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
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer here... (Cmd/Ctrl+Enter to send)"
              className="min-h-[60px] max-h-[160px] resize-none"
              disabled={isLoading || isFinishing}
            />
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
            {questionNumber < totalQuestions
              ? `Answer the question, then send. The interviewer will ask the next one.`
              : `This is the last question. After your answer, you'll get your scorecard.`}
          </p>
        </div>
      </footer>
    </div>
  );
}
