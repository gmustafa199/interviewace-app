'use client';

import { useState } from 'react';
import { LandingPage } from '@/components/interview/LandingPage';
import { RolePicker } from '@/components/interview/RolePicker';
import { InterviewChat } from '@/components/interview/InterviewChat';
import { Scorecard } from '@/components/interview/Scorecard';
import type { Role } from '@/lib/roles';

type View = 'landing' | 'setup' | 'interview' | 'scorecard';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type InterviewConfig = {
  role: Role;
  difficulty: string;
  mode: string;
  totalQuestions: number;
};

export default function Home() {
  const [view, setView] = useState<View>('landing');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [pendingRoleId, setPendingRoleId] = useState<string | undefined>();

  function handleStartFromLanding() {
    setPendingRoleId(undefined);
    setView('setup');
    window.scrollTo(0, 0);
  }

  function handlePickRole(roleId: string) {
    setPendingRoleId(roleId);
    setView('setup');
    window.scrollTo(0, 0);
  }

  function handleStartInterview(cfg: InterviewConfig) {
    setConfig(cfg);
    setView('interview');
    window.scrollTo(0, 0);
  }

  function handleComplete(messages: Message[]) {
    setTranscript(messages);
    setView('scorecard');
    window.scrollTo(0, 0);
  }

  function handleRestart() {
    if (config) {
      // Same role, fresh interview
      setTranscript([]);
      setView('interview');
    } else {
      setView('setup');
    }
    window.scrollTo(0, 0);
  }

  function handleHome() {
    setView('landing');
    setConfig(null);
    setTranscript([]);
    window.scrollTo(0, 0);
  }

  if (view === 'landing') {
    return (
      <LandingPage
        onStart={handleStartFromLanding}
        onPickRole={handlePickRole}
      />
    );
  }

  if (view === 'setup') {
    return (
      <RolePicker
        initialRoleId={pendingRoleId}
        onBack={handleHome}
        onStart={handleStartInterview}
      />
    );
  }

  if (view === 'interview' && config) {
    return (
      <InterviewChat
        role={config.role}
        difficulty={config.difficulty}
        mode={config.mode}
        totalQuestions={config.totalQuestions}
        onBack={handleHome}
        onComplete={handleComplete}
      />
    );
  }

  if (view === 'scorecard' && config) {
    return (
      <Scorecard
        role={config.role}
        difficulty={config.difficulty}
        transcript={transcript}
        onRestart={handleRestart}
        onHome={handleHome}
      />
    );
  }

  // Fallback
  return (
    <LandingPage
      onStart={handleStartFromLanding}
      onPickRole={handlePickRole}
    />
  );
}
