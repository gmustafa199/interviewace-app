'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROLES, ROLE_CATEGORIES } from '@/lib/roles';
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
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Trophy,
  Brain,
  Users,
  Zap,
  Star,
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
  onStart: () => void;
  onPickRole: (roleId: string) => void;
};

export function LandingPage({ onStart, onPickRole }: Props) {
  return (
    <div className="bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, hsl(var(--primary)/0.15), transparent 50%), radial-gradient(circle at 80% 80%, hsl(var(--primary)/0.1), transparent 50%)',
          }}
        />
        <div className="container relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="mr-1 h-3 w-3" />
              AI-Powered Mock Interviews
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
              Land your next <span className="text-primary">tech job</span> with
              AI mock interviews that feel real.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl">
              Practice with an AI interviewer that asks real questions, follows
              up like a human, and gives you a brutal, honest scorecard after
              every session.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto" onClick={onStart}>
                Start Free Mock Interview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() =>
                  document
                    .getElementById('roles')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Browse Roles
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No sign-up required to try · Free tier · 8 IT roles supported
            </p>
          </div>

          {/* Trust stats */}
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'IT Roles', value: '8', icon: Users },
              { label: 'Avg. Interview', value: '15 min', icon: Zap },
              { label: 'Feedback in', value: '30 sec', icon: Brain },
              { label: 'Free Tier', value: 'Yes', icon: Star },
            ].map((stat) => (
              <Card key={stat.label} className="p-4 text-center">
                <stat.icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Three steps. Fifteen minutes. Real feedback.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Pick your role',
                description:
                  'Choose from 8 IT roles — SWE, Frontend, Backend, Data Scientist, DevOps, PM, Cloud, ML Engineer.',
                icon: Target,
              },
              {
                step: '02',
                title: 'Do the interview',
                description:
                  'The AI asks you questions one at a time, just like a real interviewer. Type your answers.',
                icon: MessageSquare,
              },
              {
                step: '03',
                title: 'Get your scorecard',
                description:
                  'Honest scores across 5 categories, sample better answers, and a 7-day practice plan.',
                icon: Trophy,
              },
            ].map((item) => (
              <Card key={item.step} className="relative p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-3xl font-bold text-primary">
                    {item.step}
                  </span>
                  <item.icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="border-b py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">
              8 Roles · All IT
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Pick your role. Start practicing.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Click any role below to jump straight into a mock interview.
            </p>
          </div>

          {ROLE_CATEGORIES.map((category) => (
            <div key={category} className="mb-8">
              <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {category}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ROLES.filter((r) => r.category === category).map((role) => {
                  const Icon = ICONS[role.icon] || Code2;
                  return (
                    <Card
                      key={role.id}
                      className="group cursor-pointer p-5 transition-all hover:border-primary hover:shadow-md"
                      onClick={() => onPickRole(role.id)}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge
                          variant={
                            role.demand === 'very-high'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {role.demand === 'very-high'
                            ? '🔥 Hot'
                            : role.demand}
                        </Badge>
                      </div>
                      <h4 className="mb-1 font-semibold">{role.title}</h4>
                      <p className="mb-3 text-sm text-muted-foreground">
                        {role.description}
                      </p>
                      <div className="mb-3 flex flex-wrap gap-1">
                        {role.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t pt-3 text-xs">
                        <span className="text-muted-foreground">
                          Salary: {role.avgSalary}
                        </span>
                        <span className="flex items-center font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
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
      <section className="border-b py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Why InterviewAce works
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Not another question bank. A real interview simulation.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Adaptive follow-ups',
                description:
                  'The AI listens to your answer and asks a smart follow-up — just like a real interviewer would.',
                icon: Brain,
              },
              {
                title: 'Role-specific questions',
                description:
                  'Each role has its own question style. A PM interview feels different from a DevOps interview.',
                icon: Target,
              },
              {
                title: 'Honest scorecard',
                description:
                  'No sugarcoating. Real scores across communication, technical depth, problem-solving, and more.',
                icon: Trophy,
              },
              {
                title: 'Sample better answers',
                description:
                  "For your weakest answers, the AI writes a model answer you can study and learn from.",
                icon: CheckCircle2,
              },
              {
                title: '7-day practice plan',
                description:
                  "After every interview, get a personalized plan telling you exactly what to study next.",
                icon: Zap,
              },
              {
                title: 'Practice anytime',
                description:
                  "No scheduling. No embarrassment. Just open the app and start a 15-minute interview.",
                icon: Sparkles,
              },
            ].map((feature) => (
              <Card key={feature.title} className="p-6">
                <feature.icon className="mb-3 h-6 w-6 text-primary" />
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b py-16 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">
              Simple Pricing
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Start free. Upgrade when you're ready.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              No credit card required to start. Cancel anytime.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-8">
              <h3 className="mb-1 text-lg font-semibold">Free</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Try it out. No card required.
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="mb-6 space-y-3 text-sm">
                <li className="flex items-start">
                  <CheckCircle2 className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
                  3 mock interviews per month
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
                  All 8 roles
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
                  Text mode
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
                  Basic scorecard
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full"
                onClick={onStart}
              >
                Start Free
              </Button>
            </Card>

            <Card className="relative p-8 border-primary shadow-lg">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
              <h3 className="mb-1 text-lg font-semibold">Pro</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                For serious job seekers.
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$19</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="mb-6 space-y-3 text-sm">
                <li className="flex items-start">
                  <CheckCircle2 className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
                  Unlimited mock interviews
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
                  Voice mode (coming soon)
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
                  Detailed scorecard with sample answers
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
                  Personalized 7-day practice plan
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
                  Progress tracking & history
                </li>
              </ul>
              <Button className="w-full" onClick={onStart}>
                Get Pro
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <Card className="overflow-hidden border-primary">
            <div className="bg-primary/5 p-8 text-center md:p-12">
              <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
                Ready to nail your next interview?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
                Start a free mock interview now. No sign-up. No credit card.
                Just real practice.
              </p>
              <Button size="lg" onClick={onStart} className="px-8">
                Start Free Mock Interview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
