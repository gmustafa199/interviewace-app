'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import {
  Loader2,
  Trophy,
  RotateCcw,
  Home,
  AlertCircle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import type { Role } from '@/lib/roles';
import { saveResult, loadResults, type DimensionScore } from '@/lib/progress';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type Props = {
  role: Role;
  difficulty: string;
  mode: string;
  questionCount: number;
  transcript: Message[];
  durationSec: number;
  onRestart: () => void;
  onHome: () => void;
};

type FeedbackData = {
  feedback: string;
  overallScore: number | null;
  dimensionScores: DimensionScore[];
};

export function Scorecard({
  role,
  difficulty,
  mode,
  questionCount,
  transcript,
  durationSec,
  onRestart,
  onHome,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FeedbackData | null>(null);
  const [prevBest, setPrevBest] = useState<number | null>(null);
  const [isFirstAttempt, setIsFirstAttempt] = useState(false);
  const savedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function loadFeedback() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: role.id, difficulty, transcript }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Request failed: ${res.status}`);
        }
        const fb: FeedbackData = await res.json();
        if (cancelled) return;
        setData(fb);

        // Persist to local progress history (once per scorecard)
        if (!savedRef.current) {
          savedRef.current = true;

          const previous = loadResults().filter((r) => r.roleId === role.id);
          setIsFirstAttempt(previous.length === 0);
          if (previous.length > 0 && fb.overallScore !== null) {
            setPrevBest(Math.max(...previous.map((r) => r.overallScore)));
          }

          if (fb.overallScore !== null) {
            saveResult({
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              roleId: role.id,
              roleTitle: role.title,
              domain: role.domain,
              difficulty,
              mode,
              questionCount,
              overallScore: fb.overallScore,
              dimensionScores: fb.dimensionScores || [],
              durationSec,
              completedAt: new Date().toISOString(),
            });
          }
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role.id, difficulty]);

  const score = data?.overallScore ?? null;
  const scoreOutOf10 = score !== null ? (score / 10).toFixed(1) : null;
  const passStatus =
    score === null
      ? null
      : score >= 70
      ? { label: 'Pass', color: 'text-emerald-600', bg: 'bg-emerald-500/10', ring: 'text-emerald-500' }
      : score >= 50
      ? { label: 'Borderline', color: 'text-amber-600', bg: 'bg-amber-500/10', ring: 'text-amber-500' }
      : { label: 'Needs work', color: 'text-rose-600', bg: 'bg-rose-500/10', ring: 'text-rose-500' };

  const delta =
    score !== null && prevBest !== null ? score - prevBest : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
            <Trophy className="h-7 w-7" />
          </div>
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-slate-900">
            Your Scorecard
          </h1>
          <p className="text-sm text-slate-500">
            {role.title} · {difficulty} · {transcript.filter((m) => m.role === 'user').length} answers
          </p>
        </div>

        {loading && (
          <Card className="border-slate-200 p-12 text-center shadow-sm">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-indigo-600" />
            <h3 className="mb-1 font-semibold text-slate-800">
              Analyzing your interview…
            </h3>
            <p className="text-sm text-slate-500">
              The AI is reviewing every answer. This takes about 30 seconds.
            </p>
          </Card>
        )}

        {error && (
          <Card className="border-rose-200 bg-rose-50/60 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
              <div className="flex-1">
                <p className="font-medium text-rose-700">Failed to generate scorecard</p>
                <p className="mt-1 text-sm text-slate-600">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-rose-200 bg-white"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        )}

        {!loading && !error && data && (
          <>
            {/* Score hero */}
            {score !== null && passStatus && (
              <Card className="mb-6 overflow-hidden border-slate-200 shadow-sm">
                <div className="flex flex-col items-center bg-gradient-to-b from-white to-slate-50/80 p-8">
                  <div className="relative h-44 w-44">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="52"
                        fill="none"
                        strokeWidth="9"
                        className="stroke-slate-100"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="52"
                        fill="none"
                        strokeWidth="9"
                        strokeLinecap="round"
                        className={`${passStatus.ring} transition-all duration-1000 ease-out`}
                        stroke="currentColor"
                        strokeDasharray={`${2 * Math.PI * 52}`}
                        strokeDashoffset={`${2 * Math.PI * 52 * (1 - score / 100)}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-5xl font-bold tabular-nums ${passStatus.color}`}>
                        {scoreOutOf10}
                      </span>
                      <span className="text-sm text-slate-400">out of 10</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`${passStatus.bg} ${passStatus.color} border-0`}
                    >
                      {passStatus.label}
                    </Badge>
                    {delta !== null && (
                      <Badge
                        variant="secondary"
                        className={`border-0 ${
                          delta >= 0 ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-700'
                        }`}
                      >
                        {delta >= 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        )}
                        {delta >= 0 ? '+' : ''}
                        {(delta / 10).toFixed(1)} vs your best
                      </Badge>
                    )}
                    {isFirstAttempt && (
                      <Badge variant="secondary" className="border-0 bg-indigo-500/10 text-indigo-700">
                        First attempt
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    Saved to your progress history
                  </p>
                </div>

                {/* Dimension bars */}
                {data.dimensionScores.length > 0 && (
                  <div className="border-t border-slate-100 bg-white px-6 py-6 md:px-8">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Scores by category
                    </h3>
                    <div className="space-y-3.5">
                      {data.dimensionScores.map((d, idx) => (
                        <div key={d.key}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">{d.label}</span>
                            <span
                              className={`font-semibold tabular-nums ${
                                d.score >= 7
                                  ? 'text-emerald-600'
                                  : d.score >= 5
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {d.score.toFixed(1)}
                              <span className="text-xs font-normal text-slate-400">/10</span>
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${
                                d.score >= 7
                                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                  : d.score >= 5
                                  ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                  : 'bg-gradient-to-r from-rose-400 to-rose-500'
                              }`}
                              style={{
                                width: `${d.score * 10}%`,
                                transitionDelay: `${idx * 90}ms`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Detailed feedback */}
            <Card className="border-slate-200 p-6 shadow-sm md:p-8">
              <div className="prose prose-sm prose-slate max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h2 className="mb-3 mt-6 border-b border-slate-100 pb-2 text-xl font-bold tracking-tight text-slate-900 first:mt-0">
                        {children}
                      </h2>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-3 mt-6 text-lg font-bold tracking-tight text-slate-900">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-2 mt-4 text-base font-semibold text-slate-800">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-3 leading-relaxed text-slate-600">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-3 ml-5 list-disc space-y-1.5 text-slate-600">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-3 ml-5 list-decimal space-y-1.5 text-slate-600">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-slate-900">{children}</strong>
                    ),
                    code: ({ children }: any) => (
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                        {children}
                      </code>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-indigo-300 bg-indigo-50/60 py-2 pl-4 text-slate-600">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {data.feedback}
                </ReactMarkdown>
              </div>
            </Card>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={onHome}
                className="border-slate-200 bg-white"
              >
                <Home className="mr-2 h-4 w-4" />
                Back to home
              </Button>
              <Button onClick={onRestart} className="bg-indigo-600 shadow-sm hover:bg-indigo-700">
                <RotateCcw className="mr-2 h-4 w-4" />
                Practice again
              </Button>
            </div>

            {/* Tip */}
            <Card className="mt-6 border-indigo-200/70 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" />
                <div>
                  <h3 className="mb-1 font-semibold text-slate-800">Pro tip</h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Practice the same role 2–3 times before moving on. Watch the
                    category bars above — when your weakest category crosses 7,
                    you are ready for the real interview. Every attempt is saved
                    on the home screen so you can see yourself improve.
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
