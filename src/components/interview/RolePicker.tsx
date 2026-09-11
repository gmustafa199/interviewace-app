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
  LANGUAGES,
  UI_STRINGS,
  DIFFICULTY_LEVELS_I18N,
  EXAM_DEPTH_LEVELS_I18N,
  INTERVIEW_MODES_I18N,
  LENGTH_OPTIONS_I18N,
  roleTitleHi,
  type Language,
} from '@/lib/i18n';
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

type Props = {
  initialRoleId?: string;
  onBack: () => void;
  onStart: (config: {
    role: Role;
    difficulty: string;
    mode: string;
    totalQuestions: number;
    language: Language;
  }) => void;
};

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
  const [language, setLanguage] = useState<Language>('en');

  const strings = UI_STRINGS[language];

  const rolesToShow = useMemo(
    () => (activeDomain === 'IT' ? IT_ROLES : INDIAN_EXAM_ROLES),
    [activeDomain]
  );

  const difficultyOptions =
    activeDomain === 'IT' ? DIFFICULTY_LEVELS_I18N[language] : EXAM_DEPTH_LEVELS_I18N[language];
  const modeOptions = INTERVIEW_MODES_I18N[language];
  const lengthOptions = LENGTH_OPTIONS_I18N[language];

  function roleTitle(role: Role): string {
    return language === 'hi' ? roleTitleHi(role.id) : role.title;
  }

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    // If user picks a role from the other domain, switch the active tab
    if (role.domain !== activeDomain) {
      setActiveDomain(role.domain);
      // Reset difficulty to the default of the new domain
      setDifficulty(role.domain === 'IT' ? 'mid' : 'standard');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {strings.backToHome}
          </Button>
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            {selectedRole?.durationMinutes
              ? `~${selectedRole.durationMinutes} min`
              : '~15 minutes'}
          </Badge>
        </div>

        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          {strings.setupTitle}
        </h1>
        <p className="mb-8 text-muted-foreground">
          {strings.setupSubtitle}
        </p>

        {/* Step 1: Domain tabs + Role grid */}
        <div className="mb-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </div>
              <h2 className="text-xl font-semibold">{strings.step1}</h2>
            </div>

            {/* Language selector */}
            <div className="inline-flex rounded-lg border bg-muted p-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLanguage(l.id)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    language === l.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {l.nativeLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Domain tabs */}
          <div className="mb-4 inline-flex rounded-lg border bg-muted p-1">
            <button
              onClick={() => setActiveDomain('IT')}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                activeDomain === 'IT'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Code2 className="h-4 w-4" />
              {strings.itJobs}
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                {IT_ROLES.length}
              </span>
            </button>
            <button
              onClick={() => setActiveDomain('IndianExam')}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                activeDomain === 'IndianExam'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Landmark className="h-4 w-4" />
              {strings.indianExams}
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
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
                  className={`cursor-pointer p-4 transition-all ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleSelectRole(role)}
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
                    <div className="flex items-center gap-1">
                      {role.domain === 'IndianExam' && (
                        <Badge variant="secondary" className="text-xs">
                          <IndianRupee className="mr-0.5 h-2.5 w-2.5" />
                          India
                        </Badge>
                      )}
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold">{roleTitle(role)}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {role.description}
                  </p>
                  {/* Meta row */}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                    {role.panelSize && (
                      <span className="flex items-center gap-0.5">
                        <Users className="h-3 w-3" /> {role.panelSize} panel
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

        {/* Step 2: Difficulty / Depth */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </div>
            <h2 className="text-xl font-semibold">
              {activeDomain === 'IT' ? strings.step2IT : strings.step2Exam}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {difficultyOptions.map((level) => {
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
            <h2 className="text-xl font-semibold">{strings.step3}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {modeOptions.map((m) => {
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
            <h2 className="text-xl font-semibold">{strings.interviewLength}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {lengthOptions.map((opt) => {
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
                      {opt.count} {strings.questions}
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
                {strings.readyToPractice}{' '}
                <span className="font-medium text-foreground">
                  {roleTitle(selectedRole)}
                </span>{' '}
                · {difficulty} · {questionCount} {strings.questions}
              </span>
            ) : (
              <span>{strings.pickRoleToContinue}</span>
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
                language,
              })
            }
          >
            {strings.startInterview}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
