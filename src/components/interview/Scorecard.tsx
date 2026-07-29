'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ReactMarkdown from 'react-markdown';
import {
  Loader2,
  Trophy,
  RotateCcw,
  Home,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import type { Role } from '@/lib/roles';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type Props = {
  role: Role;
  difficulty: string;
  transcript: Message[];
  onRestart: () => void;
  onHome: () => void;
};

export function Scorecard({ role, difficulty, transcript, onRestart, onHome }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [overallScore, setOverallScore] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadFeedback() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: role.id,
            difficulty,
            transcript,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed: ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;
        setFeedback(data.feedback || '');
        setOverallScore(data.overallScore);
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || 'Failed to generate feedback');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadFeedback();
    return () => {
      cancelled = true;
    };
  }, [role.id, difficulty, transcript]);

  const scoreOutOf10 = overallScore !== null ? (overallScore / 10).toFixed(1) : null;
  const passStatus =
    overallScore === null
      ? null
      : overallScore >= 70
      ? { label: 'Pass', color: 'text-emerald-600', bg: 'bg-emerald-500/10' }
      : overallScore >= 50
      ? { label: 'Borderline', color: 'text-amber-600', bg: 'bg-amber-500/10' }
      : { label: 'Needs Work', color: 'text-rose-600', bg: 'bg-rose-500/10' };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Trophy className="h-7 w-7" />
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">
            Your Interview Scorecard
          </h1>
          <p className="text-muted-foreground">
            {role.title} · {difficulty} level · {transcript.filter((m) => m.role === 'user').length} answers
          </p>
        </div>

        {loading && (
          <Card className="p-12 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <h3 className="mb-1 font-semibold">Analyzing your interview...</h3>
            <p className="text-sm text-muted-foreground">
              The AI is reviewing every answer. This takes about 30 seconds.
            </p>
          </Card>
        )}

        {error && (
          <Card className="border-destructive bg-destructive/5 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
              <div className="flex-1">
                <p className="font-medium text-destructive">
                  Failed to generate scorecard
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        )}

        {!loading && !error && (
          <>
            {/* Score hero */}
            {overallScore !== null && passStatus && (
              <Card className={`mb-6 overflow-hidden ${passStatus.bg}`}>
                <div className="p-6 text-center">
                  <div className="mb-2 text-sm font-medium text-muted-foreground">
                    Overall Score
                  </div>
                  <div className={`text-5xl font-bold ${passStatus.color}`}>
                    {scoreOutOf10}
                    <span className="text-2xl text-muted-foreground">/10</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`mt-3 ${passStatus.bg} ${passStatus.color} border-0`}
                  >
                    {passStatus.label}
                  </Badge>
                  <Progress
                    value={overallScore}
                    className="mt-4 h-2"
                  />
                </div>
              </Card>
            )}

            {/* Feedback markdown */}
            <Card className="p-6 md:p-8">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h2 className="mb-3 mt-6 text-2xl font-bold tracking-tight">
                        {children}
                      </h2>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-3 mt-6 text-xl font-bold tracking-tight">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-2 mt-4 text-lg font-semibold">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-3 leading-relaxed text-muted-foreground">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-3 ml-5 list-disc space-y-1 text-muted-foreground">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-3 ml-5 list-decimal space-y-1 text-muted-foreground">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">
                        {children}
                      </strong>
                    ),
                    code: ({ children }: any) => (
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {children}
                      </code>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-primary bg-primary/5 py-2 pl-4 text-muted-foreground">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {feedback}
                </ReactMarkdown>
              </div>
            </Card>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={onHome}>
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
              <Button onClick={onRestart}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Practice Again
              </Button>
            </div>

            {/* Tips */}
            <Card className="mt-6 border-primary/30 bg-primary/5 p-6">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="mb-1 font-semibold">Pro tip</h3>
                  <p className="text-sm text-muted-foreground">
                    Practice the same role 2-3 times before moving to the next.
                    You'll see your score go up — that's how you know you're
                    ready for the real interview.
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
