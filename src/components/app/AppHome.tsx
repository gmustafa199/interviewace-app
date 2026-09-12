/* eslint-disable react-hooks/set-state-in-effect -- reading localStorage after mount */
'use client';

/**
 * AppHome — native-feeling home tab.
 * Compact header, filter chips, and a 2-column grid of interview tiles so all
 * 13 roles are reachable with at most ~1.5 screens of scrolling.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Code2, Layout, Server, BarChart3, GitBranch, Target, Cloud,
  BrainCircuit, Landmark, GraduationCap, Flame, Search, Users, Timer,
} from 'lucide-react';
import { ROLES, type Role, type Domain } from '@/lib/roles';
import { loadResults, computeStats } from '@/lib/progress';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2, Layout, Server, BarChart3, GitBranch, Target, Cloud, BrainCircuit, Landmark, GraduationCap,
};

type Filter = 'all' | Domain;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'IT', label: 'IT Jobs' },
  { id: 'IndianExam', label: 'Govt Exams' },
];

export function AppHome({ onStart }: { onStart: (roleId: string) => void }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    try {
      const stats = computeStats(loadResults());
      setStreak(stats.streakDays);
      setTotal(stats.total);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const roles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ROLES.filter(
      (r) =>
        (filter === 'all' || r.domain === filter) &&
        (q === '' || r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q))
    );
  }, [filter, query]);

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      {/* Compact header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200/80">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[17px] font-bold leading-tight">InterviewAce</h1>
            <p className="text-[11px] text-slate-500 leading-tight">
              {total > 0 ? `${total} session${total === 1 ? '' : 's'} practiced` : 'Real interviewers. Real pressure.'}
            </p>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-1">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs font-semibold text-orange-300">{streak}d</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-4 pb-2.5">
            <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search roles…"
              className="w-full rounded-xl bg-slate-100 border border-slate-200 pl-9 pr-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 px-4 pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* Role grid — 2 columns */}
      <main className="px-4 pt-3 pb-28">
        <div className="grid grid-cols-2 gap-2.5">
          {roles.map((role) => (
            <RoleTile key={role.id} role={role} onClick={() => onStart(role.id)} />
          ))}
        </div>
        {roles.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">No roles match your search.</p>
        )}
      </main>
    </div>
  );
}

function RoleTile({ role, onClick }: { role: Role; onClick: () => void }) {
  const Icon = ICONS[role.icon] || Code2;
  const isExam = role.domain === 'IndianExam';
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl bg-white border border-slate-200 shadow-sm p-3.5 active:scale-[0.97] active:bg-indigo-50/40 transition-all hover:border-indigo-400/60 hover:shadow-md min-h-[112px] flex flex-col"
    >
      <div
        className={`h-9 w-9 rounded-lg flex items-center justify-center mb-2.5 ${
          isExam ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'
        }`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <h3 className="text-[13.5px] font-semibold leading-snug text-slate-800 line-clamp-2">
        {role.title}
      </h3>
      <div className="mt-auto pt-2 flex items-center gap-2.5 text-[10.5px] text-slate-500">
        {(role.panelSize ?? 1) > 1 && (
          <span className="inline-flex items-center gap-0.5">
            <Users className="h-3 w-3" />
            {role.panelSize}
          </span>
        )}
        <span className="inline-flex items-center gap-0.5">
          <Timer className="h-3 w-3" />
          {role.durationMinutes ?? 20}m
        </span>
        {isExam && <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-amber-500/80">Exam</span>}
      </div>
    </button>
  );
}
