'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROLES } from '@/lib/roles';
import { useGeoPricing } from '@/hooks/use-geo-pricing';
import {
  loadResults,
  computeStats,
  clearResults,
  relativeTime,
  type InterviewResult,
  type ProgressStats,
} from '@/lib/progress';
import {
  Code2,
  Layout,
  Server,
  BarChart3,
  GitBranch,
  Target,
  Cloud,
  BrainCircuit,
  Mic,
  MessageSquare,
  Landmark,
  GraduationCap,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Trophy,
  Brain,
  Users,
  Zap,
  Star,
  Flame,
  CalendarDays,
  Activity,
  Clock,
  Trash2,
  TrendingUp,
  TrendingDown,
  Award,
} from 'lucide-react';

const ICONS: Record<string, any> = {
  Code2,
  Layout,
  Server,
  BarChart3,
  GitBranch,
  Target,
  Cloud,
  BrainCircuit,
  Mic,
  MessageSquare,
  Landmark,
  GraduationCap,
};

type Props = {
  onStart: () => void;
  onPickRole: (roleId: string) => void;
};

/* ------------------------------------------------------------------ */
/* Score trend sparkline (pure SVG, no chart lib needed)              */
/* ------------------------------------------------------------------ */

function ScoreSparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const w = 560;
  const h = 120;
  const pad = 8;
  const step = (w - pad * 2) / (scores.length - 1);
  const y = (v: number) => h - pad - (v / 100) * (h - pad * 2);

  const points = scores.map((v, i) => `${pad + i * step},${y(v)}`).join(' ');
  const area = `${pad},${h - pad} ${points} ${pad + (scores.length - 1) * step},${h - pad}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-28 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 70% pass line */}
      <line
        x1={pad}
        y1={y(70)}
        x2={w - pad}
        y2={y(70)}
        stroke="#10b981"
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.5"
      />
      <polygon points={area} fill="url(#sparkFill)" />
      <polyline
        points={points}
        fill="none"
        stroke="#6366f1"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {scores.map((v, i) => (
        <circle
          key={i}
          cx={pad + i * step}
          cy={y(v)}
          r="3.5"
          fill={v >= 70 ? '#10b981' : v >= 50 ? '#f59e0b' : '#f43f5e'}
          stroke="white"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Progress dashboard section                                         */
/* ------------------------------------------------------------------ */

function ProgressDashboard({ onStart }: { onStart: () => void }) {
  const [results, setResults] = useState<InterviewResult[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const r = loadResults();
    setResults(r);
    setStats(computeStats(r));
    setLoaded(true);
  }, []);

  // Refresh when returning to this view after finishing an interview
  useEffect(() => {
    const onFocus = () => {
      const r = loadResults();
      setResults(r);
      setStats(computeStats(r));
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (!loaded) return null;

  function handleClear() {
    if (window.confirm('Delete all your interview history? This cannot be undone.')) {
      clearResults();
      setResults([]);
      setStats(null);
    }
  }

  const recent = results.slice(0, 5);

  return (
    <section id="progress" className="border-b border-slate-200 bg-white py-16 md:py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge variant="outline" className="mb-3 border-indigo-200 text-indigo-700">
              <Activity className="mr-1 h-3 w-3" />
              Your Progress
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Every session makes you better
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-500">
              Your scores, streaks, and weak areas — tracked automatically on
              this device after every mock interview.
            </p>
          </div>
          {results.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-slate-400 hover:text-rose-600"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Clear history
            </Button>
          )}
        </div>

        {results.length === 0 ? (
          /* Empty state */
          <Card className="border-dashed border-slate-300 bg-slate-50/50 p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
              <Trophy className="h-7 w-7 text-indigo-500" />
            </div>
            <h3 className="mb-1 font-semibold text-slate-800">No interviews yet</h3>
            <p className="mx-auto mb-5 max-w-md text-sm text-slate-500">
              Complete your first mock interview and your score history, trend
              chart, and practice streak will appear here.
            </p>
            <Button onClick={onStart} className="bg-indigo-600 hover:bg-indigo-700">
              Start your first interview
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        ) : (
          <>
            {/* Stat cards */}
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                {
                  label: 'Sessions',
                  value: String(stats!.total),
                  icon: Target,
                  sub: `${stats!.thisWeek} this week`,
                },
                {
                  label: 'Avg Score',
                  value: `${Math.round(stats!.avgScore / 10)}/10`,
                  icon: Activity,
                  sub: `${stats!.avgScore}%`,
                },
                {
                  label: 'Best Score',
                  value: `${Math.round(stats!.bestScore / 10)}/10`,
                  icon: Award,
                  sub: 'personal record',
                },
                {
                  label: 'Day Streak',
                  value: String(stats!.streakDays),
                  icon: Flame,
                  sub: stats!.streakDays > 0 ? 'keep it going!' : 'start today',
                },
                {
                  label: 'Practice Time',
                  value: stats!.totalMinutes >= 60
                    ? `${Math.floor(stats!.totalMinutes / 60)}h ${stats!.totalMinutes % 60}m`
                    : `${stats!.totalMinutes}m`,
                  icon: Clock,
                  sub: 'total',
                },
              ].map((stat) => (
                <Card key={stat.label} className="border-slate-200 p-4 shadow-sm">
                  <stat.icon className="mb-2 h-4 w-4 text-indigo-500" />
                  <div className="text-2xl font-bold tabular-nums text-slate-900">
                    {stat.value}
                  </div>
                  <div className="text-xs font-medium text-slate-600">{stat.label}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">{stat.sub}</div>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              {/* Trend chart */}
              <Card className="border-slate-200 p-6 shadow-sm lg:col-span-3">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Score trend
                  </h3>
                  <span className="text-xs text-slate-400">last {stats!.last10.length} sessions</span>
                </div>
                {stats!.last10.length >= 2 ? (
                  <>
                    <ScoreSparkline scores={stats!.last10} />
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-0.5 w-4 border-t border-dashed border-emerald-500" />
                        pass line (7/10)
                      </span>
                      <span>oldest → latest</span>
                    </div>
                  </>
                ) : (
                  <p className="py-8 text-center text-sm text-slate-400">
                    Complete one more session to see your trend
                  </p>
                )}
              </Card>

              {/* Recent sessions */}
              <Card className="border-slate-200 p-6 shadow-sm lg:col-span-2">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Recent sessions
                </h3>
                <div className="space-y-2.5">
                  {recent.map((r) => {
                    const color =
                      r.overallScore >= 70
                        ? 'bg-emerald-500/10 text-emerald-700'
                        : r.overallScore >= 50
                        ? 'bg-amber-500/10 text-amber-700'
                        : 'bg-rose-500/10 text-rose-700';
                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {r.roleTitle}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {r.difficulty} · {r.questionCount} questions · {relativeTime(r.completedAt)}
                          </p>
                        </div>
                        <span
                          className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${color}`}
                        >
                          {(r.overallScore / 10).toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Per-role breakdown */}
            {stats!.byRole.length > 0 && (
              <Card className="mt-6 border-slate-200 p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Progress by role
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {stats!.byRole.map((r) => (
                    <div
                      key={r.roleId}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-tight text-slate-800">
                          {r.roleTitle}
                        </p>
                        {r.delta !== undefined && r.delta !== 0 && (
                          <span
                            className={`flex flex-shrink-0 items-center text-[11px] font-semibold ${
                              r.delta > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {r.delta > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {r.delta > 0 ? '+' : ''}
                            {(r.delta / 10).toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {r.attempts} {r.attempts === 1 ? 'attempt' : 'attempts'}
                        </span>
                        <span className="font-semibold tabular-nums text-slate-700">
                          latest {(r.latestScore / 10).toFixed(1)} · best{' '}
                          {(r.bestScore / 10).toFixed(1)}
                        </span>
                      </div>
                      {/* mini progress bar to pass line */}
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${
                            r.bestScore >= 70
                              ? 'bg-emerald-500'
                              : r.bestScore >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, r.bestScore)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Landing page                                                       */
/* ------------------------------------------------------------------ */

export function LandingPage({ onStart, onPickRole }: Props) {
  const { pricing, isIndia, country, isLoading: isGeoLoading } = useGeoPricing();

  return (
    <div className="bg-white text-slate-900">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">InterviewAce</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#roles" className="transition hover:text-slate-900">Roles</a>
            <a href="#progress" className="transition hover:text-slate-900">Progress</a>
            <a href="#pricing" className="transition hover:text-slate-900">Pricing</a>
          </nav>
          <Button
            onClick={onStart}
            className="bg-indigo-600 shadow-sm hover:bg-indigo-700"
          >
            Start practicing
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 60% 50% at 20% 10%, rgba(99,102,241,0.10), transparent), radial-gradient(ellipse 50% 40% at 85% 80%, rgba(139,92,246,0.08), transparent)',
          }}
        />
        <div className="container relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="outline"
              className="mb-5 border-indigo-200 bg-indigo-50/60 px-3 py-1 text-indigo-700"
            >
              <Sparkles className="mr-1.5 h-3 w-3" />
              Realistic AI mock interviews — voice & text
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
              Walk into your interview{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                already rehearsed.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-slate-600 md:text-xl">
              A natural-sounding AI interviewer asks real questions, follows up
              like a human, and scores you honestly after every session. 8 IT
              roles + 5 top Indian competitive exams.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 w-full bg-indigo-600 px-7 text-base shadow-md hover:bg-indigo-700 sm:w-auto"
                onClick={onStart}
              >
                Start Free Mock Interview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full border-slate-300 px-7 text-base sm:w-auto"
                onClick={() =>
                  document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Browse Roles
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              No sign-up required · Free tier · Works in your browser
            </p>
          </div>

          {/* Trust stats */}
          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: 'Interview roles', value: '13', icon: Users },
              { label: 'IT + Indian Exams', value: '2 domains', icon: Target },
              { label: 'Avg. session', value: '15 min', icon: Zap },
              { label: 'Voice + text mode', value: 'Both', icon: Mic },
            ].map((stat) => (
              <Card key={stat.label} className="border-slate-200 p-4 text-center shadow-sm">
                <stat.icon className="mx-auto mb-2 h-4 w-4 text-indigo-500" />
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Your Progress */}
      <ProgressDashboard onStart={onStart} />

      {/* How it works */}
      <section className="border-b border-slate-200 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-500">
              Three steps. Fifteen minutes. Honest feedback.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Pick your role',
                description:
                  '8 IT roles (SWE, Frontend, Backend, Data Scientist, DevOps, PM, Cloud, ML) + 5 Indian exams (UPSC, IBPS PO, SBI PO, CAT/IIM MBA, RBI Grade B).',
                icon: Target,
              },
              {
                step: '02',
                title: 'Do the interview',
                description:
                  'The AI interviewer asks one question at a time and follows up on your answers — by voice or text, exactly like a real panel.',
                icon: Mic,
              },
              {
                step: '03',
                title: 'Get your scorecard',
                description:
                  'Category-wise scores, model answers for your weakest responses, and a 7-day practice plan. Every score is saved to your progress.',
                icon: Trophy,
              },
            ].map((item) => (
              <Card
                key={item.step}
                className="relative border-slate-200 p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-3xl font-bold text-indigo-100">{item.step}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                    <item.icon className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="border-b border-slate-200 bg-slate-50/70 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3 border-slate-300">
              13 Roles · IT + Indian Exams
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Pick your role. Start practicing.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-500">
              Click any role to jump straight into a mock interview.
            </p>
          </div>

          {['IT', 'IndianExam'].map((domain) => (
            <div key={domain} className="mb-12 last:mb-0">
              <div className="mb-4 flex items-center gap-2">
                {domain === 'IT' ? (
                  <Code2 className="h-4 w-4 text-indigo-600" />
                ) : (
                  <Landmark className="h-4 w-4 text-indigo-600" />
                )}
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  {domain === 'IT' ? 'IT Jobs' : 'Indian Competitive Exams'}
                </h3>
                <Badge variant="outline" className="border-slate-300 text-xs">
                  {ROLES.filter((r) => r.domain === domain).length} roles
                </Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ROLES.filter((r) => r.domain === domain).map((role) => {
                  const Icon = ICONS[role.icon] || Code2;
                  return (
                    <Card
                      key={role.id}
                      className="group cursor-pointer border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
                      onClick={() => onPickRole(role.id)}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                          <Icon className="h-5 w-5" />
                        </div>
                        {role.demand === 'very-high' && (
                          <Badge className="border-0 bg-orange-100 text-xs text-orange-700">
                            In demand
                          </Badge>
                        )}
                      </div>
                      <h4 className="mb-1 font-semibold text-slate-900">{role.title}</h4>
                      <p className="mb-3 text-sm leading-relaxed text-slate-500">
                        {role.description}
                      </p>
                      <div className="mb-3 flex flex-wrap gap-1">
                        {role.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                        <span className="text-slate-400">{role.avgSalary}</span>
                        <span className="flex items-center font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                          Start <ArrowRight className="ml-1 h-3 w-3" />
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-slate-200 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Why InterviewAce works
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-500">
              Not another question bank. A real interview simulation.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Natural voice interviews',
                description:
                  'The panel speaks with human-like voices — different voice per board member, natural pauses, and measured pace. You answer out loud.',
                icon: Mic,
              },
              {
                title: 'Adaptive follow-ups',
                description:
                  'The AI listens to your answer and probes deeper, exactly like a real interviewer testing how you think.',
                icon: Brain,
              },
              {
                title: 'Role-specific panels',
                description:
                  'A UPSC board grills you differently than a Google engineering interview. Each role has its own panel style and scoring rubric.',
                icon: Target,
              },
              {
                title: 'Honest scorecards',
                description:
                  'No sugarcoating. Category-wise scores across communication, technical depth, problem-solving, and more.',
                icon: Trophy,
              },
              {
                title: 'Progress tracking',
                description:
                  'Scores, streaks, and per-role trends saved automatically. Watch your weakest category cross the pass line.',
                icon: TrendingUp,
              },
              {
                title: '7-day practice plan',
                description:
                  'After every session, get a personalized plan telling you exactly what to study next.',
                icon: CalendarDays,
              },
            ].map((feature) => (
              <Card
                key={feature.title}
                className="border-slate-200 p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                  <feature.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-slate-200 bg-slate-50/70 py-16 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3 border-slate-300">
              {isIndia ? 'India Pricing' : 'Simple Pricing'}
              {!isGeoLoading && country && (
                <span className="ml-1 opacity-60">· {country}</span>
              )}
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Start free. Upgrade when you're ready.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-500">
              No credit card required to start. Cancel anytime.
              {isIndia && ' · GST invoice on annual plan'}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Free</h3>
              <p className="mb-6 text-sm text-slate-500">Try it out. No card required.</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">{pricing.symbol}0</span>
                <span className="text-slate-400">/month</span>
              </div>
              <ul className="mb-6 space-y-3 text-sm">
                {[
                  `${pricing.freeInterviewsPerMonth} mock interviews per month`,
                  'All 13 roles (8 IT + 5 Indian exams)',
                  'Text mode',
                  'Basic scorecard',
                ].map((f) => (
                  <li key={f} className="flex items-start text-slate-600">
                    <CheckCircle2 className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full border-slate-300" onClick={onStart}>
                Start Free
              </Button>
            </Card>

            <Card className="relative border-indigo-500 bg-white p-8 shadow-lg ring-1 ring-indigo-500/20">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-0 bg-indigo-600">
                Most Popular
              </Badge>
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Pro</h3>
              <p className="mb-6 text-sm text-slate-500">For serious job seekers.</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">{pricing.monthlyLabel}</span>
                <span className="text-slate-400">/month</span>
                <span className="ml-2 text-xs text-slate-400">
                  or {pricing.yearlyLabel}/year (save 30%)
                </span>
              </div>
              <ul className="mb-6 space-y-3 text-sm">
                {[
                  'Unlimited mock interviews',
                  'Voice mode — hear the panel, answer out loud',
                  'Detailed scorecard with model answers',
                  'Personalized 7-day practice plan',
                  'Full progress tracking, streaks & trends',
                ].map((f) => (
                  <li key={f} className="flex items-start text-slate-600">
                    <CheckCircle2 className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-indigo-600 shadow-sm hover:bg-indigo-700" onClick={onStart}>
                Get Pro
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <Card className="overflow-hidden border-indigo-200 shadow-md">
            <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-8 text-center md:p-12">
              <h2 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Ready to nail your next interview?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-slate-600">
                Start a free mock interview now. No sign-up. No credit card.
                Just real practice with real feedback.
              </p>
              <Button
                size="lg"
                onClick={onStart}
                className="h-12 bg-indigo-600 px-8 text-base shadow-md hover:bg-indigo-700"
              >
                Start Free Mock Interview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10">
        <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-400 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <MessageSquare className="h-3 w-3" />
            </div>
            <span className="font-semibold text-slate-600">InterviewAce</span>
            <span>· Practice. Get scored. Improve.</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="transition hover:text-slate-600">
              Privacy Policy
            </a>
            <span>© {new Date().getFullYear()} InterviewAce</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
