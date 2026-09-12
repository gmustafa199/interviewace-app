/* eslint-disable react-hooks/set-state-in-effect -- reading localStorage after mount */
'use client';

/**
 * AppProgress — native-feeling progress tab.
 * Compact stat cards, score trend sparkline, recent sessions, per-role bests.
 */

import { useEffect, useState } from 'react';
import { Trophy, Flame, Target, CalendarCheck, Trash2, Play, TrendingUp, TrendingDown } from 'lucide-react';
import { loadResults, computeStats, scoreLabel, relativeTime, clearResults, type ProgressStats } from '@/lib/progress';

export function AppProgress({ onStart }: { onStart: () => void }) {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [recent, setRecent] = useState<ReturnType<typeof loadResults>>([]);

  useEffect(() => {
    try {
      const results = loadResults();
      setRecent(results.slice(0, 5));
      setStats(computeStats(results));
    } catch {
      /* storage unavailable */
    }
  }, []);

  if (!stats || stats.total === 0) {
    return (
      <div className="min-h-full bg-slate-50 text-slate-900 flex flex-col items-center justify-center px-8 pb-24 text-center">
        <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
          <Target className="h-8 w-8 text-indigo-400" />
        </div>
        <h2 className="text-lg font-bold mb-1.5 text-slate-900">No sessions yet</h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          Complete your first mock interview and your scores, streak and growth curve will appear here.
        </p>
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white active:scale-[0.97] transition-transform"
        >
          <Play className="h-4 w-4" /> Start first interview
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-28">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200/80 px-4 py-3.5">
        <h1 className="text-[17px] font-bold">Your Progress</h1>
        <p className="text-[11px] text-slate-500">{stats.thisWeek} sessions this week • {stats.totalMinutes} minutes practiced</p>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Stat cards — 2x2 */}
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard icon={<CalendarCheck className="h-4 w-4 text-indigo-400" />} label="Sessions" value={String(stats.total)} />
          <StatCard icon={<Flame className="h-4 w-4 text-orange-400" />} label="Day streak" value={`${stats.streakDays}d`} />
          <StatCard icon={<Target className="h-4 w-4 text-emerald-400" />} label="Average" value={`${stats.avgScore}`} />
          <StatCard icon={<Trophy className="h-4 w-4 text-amber-400" />} label="Best" value={`${stats.bestScore}`} />
        </div>

        {/* Score trend */}
        {stats.last10.length >= 2 && (
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[13px] font-semibold text-slate-700">Score trend</h2>
              <span className="text-[10px] text-slate-400">last {stats.last10.length} • pass = 70</span>
            </div>
            <Sparkline values={stats.last10} />
          </section>
        )}

        {/* Recent sessions */}
        {recent.length > 0 && (
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
            <h2 className="text-[13px] font-semibold text-slate-700 mb-3">Recent sessions</h2>
            <ul className="space-y-2.5">
              {recent.map((r) => {
                const sl = scoreLabel(r.overallScore);
                return (
                  <li key={r.id} className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0 ${
                      r.overallScore >= 70 ? 'bg-emerald-500/10 text-emerald-400'
                        : r.overallScore >= 50 ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {r.overallScore}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-slate-700 truncate">{r.roleTitle}</p>
                      <p className="text-[10.5px] text-slate-400">{relativeTime(r.completedAt)} • {r.questionCount}Q • {r.mode}</p>
                    </div>
                    <span className={`text-[10px] font-semibold ${sl.color}`}>{sl.label}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Per-role bests */}
        {stats.byRole.length > 0 && (
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
            <h2 className="text-[13px] font-semibold text-slate-700 mb-3">By role</h2>
            <ul className="space-y-3">
              {stats.byRole.slice(0, 5).map((rp) => (
                <li key={rp.roleId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-slate-600 truncate pr-2">{rp.roleTitle}</span>
                    <span className="flex items-center gap-1.5 text-[11px] shrink-0">
                      {rp.delta !== undefined && (
                        <span className={`inline-flex items-center ${rp.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {rp.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(rp.delta)}
                        </span>
                      )}
                      <span className="text-slate-400">{rp.latestScore}</span>
                      <span className="text-slate-600">/ {rp.bestScore}</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      style={{ width: `${Math.min(100, rp.latestScore)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Clear data */}
        <button
          onClick={() => {
            if (confirm('Delete all saved interview history on this device?')) {
              clearResults();
              setRecent([]);
              setStats(computeStats([]));
            }
          }}
          className="mx-auto flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-rose-500 transition-colors pt-1"
        >
          <Trash2 className="h-3 w-3" /> Clear history
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const W = 300, H = 72, PAD = 6;
  const max = Math.max(100, ...values);
  const step = (W - PAD * 2) / Math.max(1, values.length - 1);
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  const pts = values.map((v, i) => `${PAD + i * step},${y(v)}`).join(' ');
  const lineY = y(70);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[72px]" role="img" aria-label="Score trend chart">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={PAD} x2={W - PAD} y1={lineY} y2={lineY} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
      <polygon points={`${PAD},${H - PAD} ${pts} ${W - PAD},${H - PAD}`} fill="url(#sparkFill)" />
      <polyline points={pts} fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => (
        <circle key={i} cx={PAD + i * step} cy={y(v)} r="2.5" fill={v >= 70 ? '#34D399' : '#6366F1'} />
      ))}
    </svg>
  );
}
