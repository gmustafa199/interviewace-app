'use client';

/**
 * AppShell — native-feeling container used when the app runs inside the
 * Android (Capacitor) shell or as an installed PWA/TWA.
 *
 * Three bottom tabs (Home / Progress / Pro) and fullscreen interview flow
 * views that hide the tab bar for focus. Reuses the same flow components as
 * the web landing experience (RolePicker, InterviewChat, Scorecard).
 */

import { useState } from 'react';
import { Home, BarChart3, Crown } from 'lucide-react';
import { AppHome } from './AppHome';
import { AppProgress } from './AppProgress';
import { AppPro } from './AppPro';
import { RolePicker } from '@/components/interview/RolePicker';
import { InterviewChat } from '@/components/interview/InterviewChat';
import { Scorecard } from '@/components/interview/Scorecard';
import type { Role } from '@/lib/roles';

type Tab = 'home' | 'progress' | 'pro';
type Flow = 'setup' | 'interview' | 'scorecard';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

type InterviewConfig = {
  role: Role;
  difficulty: string;
  mode: string;
  totalQuestions: number;
};

export function AppShell() {
  const [tab, setTab] = useState<Tab>('home');
  const [flow, setFlow] = useState<Flow | null>(null);
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [durationSec, setDurationSec] = useState(0);

  /* ------------ interview flow handlers ------------ */

  function startSetup(roleId?: string) {
    setTab('home');
    setConfig(null);
    setFlow('setup');
    // pass role via pending state below
    setPendingRoleId(roleId);
  }

  const [pendingRoleId, setPendingRoleId] = useState<string | undefined>();

  function startInterview(cfg: InterviewConfig) {
    setConfig(cfg);
    setFlow('interview');
    window.scrollTo(0, 0);
  }

  function completeInterview(messages: Message[], secs: number) {
    setTranscript(messages);
    setDurationSec(secs);
    setFlow('scorecard');
    window.scrollTo(0, 0);
  }

  function restartInterview() {
    if (config) {
      setTranscript([]);
      setFlow('interview');
    } else {
      setFlow('setup');
    }
    window.scrollTo(0, 0);
  }

  function goHome() {
    setFlow(null);
    setConfig(null);
    setTranscript([]);
    setTab('home');
    window.scrollTo(0, 0);
  }

  /* ------------ render ------------ */

  const inFlow = flow !== null;

  return (
    <div className="min-h-screen bg-slate-50">
      {inFlow ? (
        <div className="min-h-screen">
          {flow === 'setup' && (
            <RolePicker
              initialRoleId={pendingRoleId}
              onBack={goHome}
              onStart={startInterview}
            />
          )}
          {flow === 'interview' && config && (
            <InterviewChat
              role={config.role}
              difficulty={config.difficulty}
              mode={config.mode}
              totalQuestions={config.totalQuestions}
              onBack={goHome}
              onComplete={completeInterview}
            />
          )}
          {flow === 'scorecard' && config && (
            <Scorecard
              role={config.role}
              difficulty={config.difficulty}
              mode={config.mode}
              questionCount={config.totalQuestions}
              transcript={transcript}
              durationSec={durationSec}
              onRestart={restartInterview}
              onHome={goHome}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col min-h-screen">
          <div className="flex-1">
            {tab === 'home' && <AppHome onStart={(roleId) => startSetup(roleId)} />}
            {tab === 'progress' && <AppProgress onStart={() => startSetup(undefined)} />}
            {tab === 'pro' && <AppPro />}
          </div>

          {/* Bottom tab bar — native app pattern */}
          <nav
            className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 6px)' }}
            aria-label="Main navigation"
          >
            <div className="grid grid-cols-3 max-w-md mx-auto">
              <TabButton
                active={tab === 'home'}
                onClick={() => setTab('home')}
                icon={<Home className="h-5 w-5" />}
                label="Home"
              />
              <TabButton
                active={tab === 'progress'}
                onClick={() => setTab('progress')}
                icon={<BarChart3 className="h-5 w-5" />}
                label="Progress"
              />
              <TabButton
                active={tab === 'pro'}
                onClick={() => setTab('pro')}
                icon={<Crown className="h-5 w-5" />}
                label="Pro"
              />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-col items-center gap-0.5 pt-2.5 pb-1.5 text-[10px] font-semibold transition-colors ${
        active ? 'text-indigo-600' : 'text-slate-400'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
