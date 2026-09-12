'use client';

/**
 * AppPro — native-feeling premium tab.
 * Shows geo-priced subscription (₹299 India / $19 global) with feature list.
 * Billing activates through Google Play Billing after launch.
 */

import { Check, Crown, ShieldCheck, Sparkles } from 'lucide-react';
import { useGeoPricing } from '@/hooks/use-geo-pricing';

const FEATURES = [
  'Unlimited AI mock interviews',
  'All 13 roles — IT jobs & govt exams',
  'Voice interviews with AI panel',
  'Detailed scorecards + growth tracking',
  'Priority AI during peak hours',
  'New roles & exam packs included',
];

export function AppPro() {
  const { pricing, isIndia, isLoading } = useGeoPricing();

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-28">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200/80 px-4 py-3.5">
        <h1 className="text-[17px] font-bold flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-400" /> InterviewAce Pro
        </h1>
      </header>

      <div className="px-4 pt-6">
        {/* Price hero */}
        <div className="rounded-3xl bg-gradient-to-b from-indigo-600/20 to-violet-600/5 border border-indigo-500/30 p-6 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-4">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          {isLoading ? (
            <div className="h-12 flex items-center justify-center">
              <div className="h-5 w-28 rounded-full bg-slate-200 animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-4xl font-extrabold tracking-tight text-slate-900">
                {pricing.monthlyLabel}
                <span className="text-base font-medium text-slate-500">/month</span>
              </p>
              <p className="text-[12px] text-slate-500 mt-1.5">
                or {pricing.yearlyLabel}/year • {pricing.freeInterviewsPerMonth} free interviews every month
              </p>
            </>
          )}
          <div className="mt-5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 px-4 py-3 text-[12px] text-indigo-200 leading-relaxed">
            Google Play subscription activates when the app launches on the Play Store.
            You&apos;ll subscribe and manage it entirely through your Google account.
          </div>
        </div>

        {/* Features */}
        <ul className="mt-6 space-y-3">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <span className="mt-0.5 h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-emerald-400" />
              </span>
              <span className="text-[13.5px] text-slate-600 leading-snug">{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          {isIndia ? 'Prices include applicable taxes. Cancel anytime via Google Play.' : 'Cancel anytime via Google Play.'}
        </div>
      </div>
    </div>
  );
}
