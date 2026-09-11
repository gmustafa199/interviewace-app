'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ROLES,
  IT_ROLES,
  INDIAN_EXAM_ROLES,
  type Role,
  type Domain,
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
  Landmark,
  GraduationCap,
  Clock,
  CheckCircle2,
  Users,
  IndianRupee,
  DollarSign,
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

const DIFFICULTY_LEVELS = [
  {
    id: 'junior',
    title: 'Junior (0–2 yrs)',
    description: 'Foundational questions with more guidance. Perfect for campus placements.',
  },
  {
    id: 'mid',
    title: 'Mid-Level (3–5 yrs)',
    description: 'Standard industry questions at realistic difficulty.',
  },
  {
    id: 'senior',
    title: 'Senior (6+ yrs)',
    description: 'Deep system design, trade-offs, and leadership focus.',
  },
];

const EXAM_DEPTH_LEVELS = [
  {
    id: 'fresher',
    title: 'First Mock',
    description: 'Gentle panel — get used to the format with light follow-ups.',
  },
  {
    id: 'standard',
    title: 'Realistic',
    description: 'Real exam-day intensity with standard follow-ups.',
  },
  {
    id: 'rigorous',
    title: 'Rigorous',
    description: 'Aggressive panel — deep grilling and stress questions.',
  },
];

const INTERVIEW_MODES = [
  {
    id: 'text',
    title: 'Text Chat',
    description: 'Type your answers. AI asks follow-ups. Best for focused practice.',
    icon: 'MessageSquare',
  },
  {
    id: 'voice',
    title: 'Voice Interview',
    description: 'Speak your answers aloud and hear the panel respond. Most realistic.',
    icon: 'Mic',
    pro: true,
  },
];

const LENGTH_OPTIONS = [
  { count: 5, label: 'Quick round', time: '~8 min' },
  { count: 8, label: 'Standard', time: '~15 min' },
  { count: 12, label: 'Full depth', time: '~25 min' },
];

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

function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
        {n}
      </div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
  );
}

export function RolePicker({ initialRoleId, onBack, onStart }: Props) {
  const initialRole = initialRoleId
    ? ROLES.find((r) => r.id === initialRoleId) || null
    : null;
  const [selectedRole, setSelectedRole] = useState<Role | null>(initialRole);
  const [activeDomain, setActiveDomain] = useState<Domain>(
    initialRole?.domain || 'IT'
  );
  const [difficulty, setDifficulty] = useState('mid');
  const [mode, setMode] = useState('text');
  const [questionCount, setQuestionCount] = useState(8);

  const rolesToShow = useMemo(
    () => (activeDomain === 'IT' ? IT_ROLES : INDIAN_EXAM_ROLES),
    [activeDomain]
  );

  const difficultyOptions =
    activeDomain === 'IT' ? DIFFICULTY_LEVELS : EXAM_DEPTH_LEVELS;

  // Keep difficulty valid when switching domains
  function handleSelectRole(role: Role) {
    setSelectedRole(role);
    if (role.domain !== activeDomain) {
      setActiveDomain(role.domain);
      setDifficulty(role.domain === 'IT' ? 'mid' : 'standard');
    }
  }

  const selectedDifficulty = difficultyOptions.find((d) => d.id === difficulty);
  const selectedMode = INTERVIEW_MODES.find((m) => m.id === mode);

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-slate-600 hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Badge variant="outline" className="border-slate-200 bg-white">
            <Clock className="mr-1 h-3 w-3" />
            {selectedRole?.durationMinutes ? `~${selectedRole.durationMinutes} min` : '~15 minutes'}
          </Badge>
        </div>

        <h1 className="mb-1 text-3xl font-bold tracking-tight text-slate-900">
          Set up your mock interview
        </h1>
        <p className="mb-8 text-slate-500">
          Four quick choices, then your interviewer takes over.
        </p>

        {/* Step 1: Role */}
        <div className="mb-10">
          <StepHeader n={1} title="Choose your role" />

          {/* Domain tabs */}
          <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveDomain('IT')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeDomain === 'IT'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Code2 className="h-4 w-4" />
              IT Jobs
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  activeDomain === 'IT' ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                {IT_ROLES.length}
              </span>
            </button>
            <button
              onClick={() => setActiveDomain('IndianExam')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeDomain === 'IndianExam'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Landmark className="h-4 w-4" />
              Indian Exams
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  activeDomain === 'IndianExam' ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                {INDIAN_EXAM_ROLES.length}
              </span>
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rolesToShow.map((role) => {
              const Icon = ICONS[role.icon] || Code2;
              const isSelected = selectedRole?.id === role.id;
              return (
                <Card
                  key={role.id}
                  className={`group cursor-pointer p-4 transition-all duration-200 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md'
                  }`}
                  onClick={() => handleSelectRole(role)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1">
                      {role.domain === 'IndianExam' && (
                        <Badge variant="secondary" className="bg-slate-100 text-xs text-slate-600">
                          <IndianRupee className="mr-0.5 h-2.5 w-2.5" />
                          India
                        </Badge>
                      )}
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{role.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {role.description}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[11px] text-slate-400">
                    {role.panelSize && role.panelSize > 1 && (
                      <span className="flex items-center gap-0.5">
                        <Users className="h-3 w-3" /> {role.panelSize}-member panel
                      </span>
                    )}
                    {role.durationMinutes && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" /> {role.durationMinutes}m
                      </span>
                    )}
                    {role.pricingTier === 'india' ? (
                      <span className="flex items-center gap-0.5">
                        <IndianRupee className="h-3 w-3" /> 299/mo
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <DollarSign className="h-3 w-3" /> 19/mo
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Step 2: Difficulty */}
        <div className="mb-10">
          <StepHeader n={2} title={activeDomain === 'IT' ? 'Experience level' : 'Interview intensity'} />
          <div className="grid gap-3 sm:grid-cols-3">
            {difficultyOptions.map((level) => {
              const isSelected = difficulty === level.id;
              return (
                <Card
                  key={level.id}
                  className={`cursor-pointer p-4 transition-all duration-200 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md'
                  }`}
                  onClick={() => setDifficulty(level.id)}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">{level.title}</h3>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500">{level.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Step 3: Mode */}
        <div className="mb-10">
          <StepHeader n={3} title="Interview mode" />
          <div className="grid gap-3 sm:grid-cols-2">
            {INTERVIEW_MODES.map((m) => {
              const Icon = ICONS[m.icon] || MessageSquare;
              const isSelected = mode === m.id;
              const isPro = (m as any).pro;
              return (
                <Card
                  key={m.id}
                  className={`cursor-pointer p-4 transition-all duration-200 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md'
                  }`}
                  onClick={() => setMode(m.id)}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isSelected ? 'text-indigo-600' : 'text-indigo-500'}`} />
                      <h3 className="text-sm font-semibold text-slate-900">{m.title}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {isPro && (
                        <Badge className="border-0 bg-indigo-600 text-xs text-white">Pro</Badge>
                      )}
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500">{m.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Step 4: Length */}
        <div className="mb-10">
          <StepHeader n={4} title="Interview length" />
          <div className="grid gap-3 sm:grid-cols-3">
            {LENGTH_OPTIONS.map((opt) => {
              const isSelected = questionCount === opt.count;
              return (
                <Card
                  key={opt.count}
                  className={`cursor-pointer p-4 transition-all duration-200 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md'
                  }`}
                  onClick={() => setQuestionCount(opt.count)}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {opt.count} questions
                    </h3>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
                  </div>
                  <p className="text-xs text-slate-500">
                    {opt.label} · {opt.time}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row">
          <div className="text-sm text-slate-500">
            {selectedRole ? (
              <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="font-semibold text-slate-900">{selectedRole.title}</span>
                <span>·</span>
                <span>{selectedDifficulty?.title}</span>
                <span>·</span>
                <span>{selectedMode?.title}</span>
                <span>·</span>
                <span>{questionCount} questions</span>
              </span>
            ) : (
              <span>Select a role above to continue</span>
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
            className="w-full bg-indigo-600 shadow-sm hover:bg-indigo-700 sm:w-auto"
          >
            Start Interview
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
