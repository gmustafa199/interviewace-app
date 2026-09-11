/**
 * InterviewAce — Local Progress Store
 *
 * Persists interview results in localStorage (no account needed).
 * Powers the "Your Progress" dashboard: sessions, average score,
 * best score, practice streak, score trend, per-role breakdown.
 */

export type DimensionScore = {
  key: string;
  label: string;
  /** 0–10 */
  score: number;
};

export type InterviewResult = {
  id: string;
  roleId: string;
  roleTitle: string;
  domain: 'IT' | 'IndianExam';
  difficulty: string;
  mode: string;
  questionCount: number;
  /** 0–100 */
  overallScore: number;
  dimensionScores: DimensionScore[];
  durationSec: number;
  /** ISO date string */
  completedAt: string;
};

export type RoleProgress = {
  roleId: string;
  roleTitle: string;
  attempts: number;
  latestScore: number;
  bestScore: number;
  /** latest minus previous attempt (undefined if only 1 attempt) */
  delta: number | undefined;
  lastCompletedAt: string;
};

export type ProgressStats = {
  total: number;
  avgScore: number;
  bestScore: number;
  streakDays: number;
  totalMinutes: number;
  /** overall scores of the last 10 sessions, oldest → newest */
  last10: number[];
  byRole: RoleProgress[];
  thisWeek: number;
};

const STORAGE_KEY = 'interviewace_results_v1';
const MAX_RESULTS = 200;

const isBrowser = () => typeof window !== 'undefined';

export function loadResults(): InterviewResult[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r) => r && typeof r.roleId === 'string' && typeof r.overallScore === 'number')
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  } catch {
    return [];
  }
}

export function saveResult(result: InterviewResult): void {
  if (!isBrowser()) return;
  try {
    const results = loadResults();
    results.unshift(result);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(results.slice(0, MAX_RESULTS))
    );
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

export function clearResults(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Count consecutive calendar days (ending today or yesterday) with ≥1 session. */
function computeStreak(results: InterviewResult[]): number {
  if (results.length === 0) return 0;

  const dayKeys = new Set(
    results.map((r) => new Date(r.completedAt).toDateString())
  );

  const today = new Date();
  const start = new Date(today);
  // Streak must include today or yesterday to be "current"
  if (!dayKeys.has(start.toDateString())) {
    start.setDate(start.getDate() - 1);
    if (!dayKeys.has(start.toDateString())) return 0;
  }

  let streak = 0;
  const cursor = new Date(start);
  while (dayKeys.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeStats(results: InterviewResult[]): ProgressStats {
  const total = results.length;

  const avgScore =
    total === 0
      ? 0
      : Math.round(results.reduce((s, r) => s + r.overallScore, 0) / total);

  const bestScore = total === 0 ? 0 : Math.max(...results.map((r) => r.overallScore));

  const totalMinutes = Math.round(
    results.reduce((s, r) => s + (r.durationSec || 0), 0) / 60
  );

  const last10 = [...results]
    .slice(0, 10)
    .map((r) => r.overallScore)
    .reverse();

  // Per-role progress.
  // `results` is sorted newest-first, so the first older attempt we meet for
  // a role (when attempts === 1) is exactly the attempt preceding the latest.
  const roleMap = new Map<string, RoleProgress>();
  for (const r of results) {
    const existing = roleMap.get(r.roleId);
    if (!existing) {
      roleMap.set(r.roleId, {
        roleId: r.roleId,
        roleTitle: r.roleTitle,
        attempts: 1,
        latestScore: r.overallScore,
        bestScore: r.overallScore,
        delta: undefined,
        lastCompletedAt: r.completedAt,
      });
    } else {
      if (existing.attempts === 1) {
        existing.delta = existing.latestScore - r.overallScore;
      }
      existing.attempts += 1;
      existing.bestScore = Math.max(existing.bestScore, r.overallScore);
    }
  }
  const byRole = [...roleMap.values()]
    .sort((a, b) => new Date(b.lastCompletedAt).getTime() - new Date(a.lastCompletedAt).getTime())
    .slice(0, 8);

  // Sessions in the last 7 days
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = results.filter(
    (r) => new Date(r.completedAt).getTime() >= weekAgo
  ).length;

  return { total, avgScore, bestScore, streakDays: computeStreak(results), totalMinutes, last10, byRole, thisWeek };
}

export function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'Pass', color: 'text-emerald-600' };
  if (score >= 50) return { label: 'Borderline', color: 'text-amber-600' };
  return { label: 'Needs work', color: 'text-rose-600' };
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
