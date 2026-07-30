'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ROLES,
  DIFFICULTY_LEVELS,
  INTERVIEW_MODES,
  type Role,
} from '@/lib/roles';
import {
  ArrowLeft,
  ArrowRight,
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
  Clock,
  CheckCircle2,
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
};

type Props = {
  initialRoleId?: string;
  onBack: () => void;
  onStart: (config: {
    role: Role;
    difficulty: string;
    mode: string;
    totalQuestions: number;
  }) => void;
};

export function RolePicker({ initialRoleId, onBack, onStart }: Props) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(
    ROLES.find((r) => r.id === initialRoleId) || null
  );
  const [difficulty, setDifficulty] = useState('mid');
  const [mode, setMode] = useState('text');
  const [questionCount, setQuestionCount] = useState(8);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            ~15 minutes
          </Badge>
        </div>

        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Set up your mock interview
        </h1>
        <p className="mb-8 text-muted-foreground">
          Pick a role, choose difficulty, and start. The AI will handle the rest.
        </p>

        {/* Step 1: Role */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </div>
            <h2 className="text-xl font-semibold">Choose your role</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((role) => {
              const Icon = ICONS[role.icon] || Code2;
              const isSelected = selectedRole?.id === role.id;
              return (
                <Card
                  key={role.id}
                  className={`cursor-pointer p-4 transition-all ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <h3 className="text-sm font-semibold">{role.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {role.tags.join(' · ')}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Step 2: Difficulty */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </div>
            <h2 className="text-xl font-semibold">Pick difficulty</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {DIFFICULTY_LEVELS.map((level) => {
              const isSelected = difficulty === level.id;
              return (
                <Card
                  key={level.id}
                  className={`cursor-pointer p-4 transition-all ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setDifficulty(level.id)}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-semibold">{level.title}</h3>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {level.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Step 3: Mode */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </div>
            <h2 className="text-xl font-semibold">Pick mode</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {INTERVIEW_MODES.map((m) => {
              const Icon = ICONS[m.icon] || MessageSquare;
              const isSelected = mode === m.id;
              const isPro = (m as any).pro;
              return (
                <Card
                  key={m.id}
                  className={`cursor-pointer p-4 transition-all ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setMode(m.id)}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{m.title}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {isPro && (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                          Pro
                        </Badge>
                      )}
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {m.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Step 4: Question count */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              4
            </div>
            <h2 className="text-xl font-semibold">Interview length</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { count: 5, label: 'Quick', time: '~8 min' },
              { count: 8, label: 'Standard', time: '~15 min' },
              { count: 12, label: 'Deep', time: '~25 min' },
            ].map((opt) => {
              const isSelected = questionCount === opt.count;
              return (
                <Card
                  key={opt.count}
                  className={`cursor-pointer p-4 transition-all ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setQuestionCount(opt.count)}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-semibold">
                      {opt.count} questions
                    </h3>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {opt.label} · {opt.time}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <div className="text-sm text-muted-foreground">
            {selectedRole ? (
              <span>
                Ready to practice:{' '}
                <span className="font-medium text-foreground">
                  {selectedRole.title}
                </span>{' '}
                · {difficulty} level · {questionCount} questions
              </span>
            ) : (
              <span>Please pick a role to continue</span>
            )}
          </div>
          <Button
            size="lg"
            disabled={!selectedRole}
            onClick={() =>
              selectedRole &&
              onStart({
                role: selectedRole,
                difficulty,
                mode,
                totalQuestions: questionCount,
              })
            }
          >
            Start Interview
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
