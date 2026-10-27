'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  PlayCircle,
  ShieldCheck,
  Presentation,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Apple system colours, light/dark pairs
const TONES = {
  blue: 'bg-[#0071e3]/10 text-[#0071e3] dark:bg-[#0a84ff]/20 dark:text-[#64aaff]',
  green: 'bg-[#28a745]/10 text-[#1e8e3e] dark:bg-[#30d158]/20 dark:text-[#5fe07f]',
  orange: 'bg-[#ff9500]/[0.12] text-[#c96a00] dark:bg-[#ff9f0a]/20 dark:text-[#ffb340]',
  purple: 'bg-[#af52de]/10 text-[#8e3cc2] dark:bg-[#bf5af2]/20 dark:text-[#d08cf7]',
  pink: 'bg-[#ff2d55]/10 text-[#d70f3c] dark:bg-[#ff375f]/20 dark:text-[#ff6f8c]',
  teal: 'bg-[#30b0c7]/[0.12] text-[#0f8aa0] dark:bg-[#40c8e0]/20 dark:text-[#70d7ea]',
} as const;

type Tone = keyof typeof TONES;

function IconTile({ icon: Icon, tone, className }: { icon: typeof BookOpen; tone: Tone; className?: string }) {
  return (
    <span className={cn('inline-flex h-11 w-11 items-center justify-center rounded-xl', TONES[tone], className)}>
      <Icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
    </span>
  );
}

export default function HomePage() {
  const router = useRouter();

  const stats = [
    { label: 'Active learners', value: '2.4k+' },
    { label: 'Hours of content', value: '380+' },
    { label: 'Avg. satisfaction', value: '4.9/5' },
  ];

  const features: { icon: typeof BookOpen; tone: Tone; title: string; body: string }[] = [
    { icon: BookOpen, tone: 'blue', title: 'Course builder', body: 'Structure courses and lectures with video and PDF resources in minutes.' },
    { icon: ClipboardCheck, tone: 'green', title: 'Assignments & quizzes', body: 'Collect submissions, grade with rubrics, and run timed assessments.' },
    { icon: BarChart3, tone: 'orange', title: 'Progress tracking', body: 'See where every learner stands with clear, per-course progress.' },
    { icon: Users, tone: 'purple', title: 'Roles that fit', body: 'Purpose-built views for admins, teachers, and students.' },
    { icon: FileText, tone: 'teal', title: 'Secure documents', body: 'Deliver PDFs with instant in-browser previews.' },
    { icon: ShieldCheck, tone: 'pink', title: 'Integrity built in', body: 'Plagiarism checks on submissions, surfaced right where you grade.' },
  ];

  const roles: { icon: typeof BookOpen; tone: Tone; title: string; points: string[] }[] = [
    { icon: GraduationCap, tone: 'blue', title: 'For students', points: ['All your courses in one place', 'Submit work and track grades', 'See progress at a glance'] },
    { icon: Presentation, tone: 'green', title: 'For teachers', points: ['Publish lectures and announcements', 'Grade with plagiarism insights', 'Request courses that match your skills'] },
    { icon: ShieldCheck, tone: 'purple', title: 'For admins', points: ['Manage users and enrollments', 'Approve teaching requests', 'Institution-wide analytics'] },
  ];

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative isolate mx-auto max-w-3xl pt-10 text-center md:pt-20">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 -z-10 flex justify-center">
          <div className="h-[420px] w-[720px] max-w-[100vw] rounded-full bg-[radial-gradient(closest-side,rgba(0,113,227,0.18),transparent),radial-gradient(closest-side,rgba(175,82,222,0.14),transparent)] bg-[length:60%_100%,60%_100%] bg-[position:15%_0,85%_40%] bg-no-repeat blur-2xl dark:opacity-80" />
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-[13px] text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-[#30d158]" />
          Now with plagiarism insights
        </span>
        <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Teaching,{' '}
          <span className="bg-gradient-to-r from-[#ff7a00] via-[#ff2d55] to-[#af52de] bg-clip-text text-transparent dark:from-[#ff9f0a] dark:via-[#ff375f] dark:to-[#bf5af2]">
            beautifully
          </span>{' '}
          organized.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Courses, lectures, assignments and grades in one calm, focused workspace for your whole institution.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => router.push('/signup')}>
            Get started
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => router.push('/login')}>
            Sign in
          </Button>
        </div>
      </section>

      {/* Product preview */}
      <section className="mx-auto mt-16 max-w-4xl md:mt-20">
        <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card p-2 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.18)] dark:shadow-none">
          <div className="rounded-[1.4rem] bg-secondary/50 p-5 md:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">CS101</p>
                <p className="mt-0.5 text-[17px] font-semibold tracking-tight">Introduction to Computer Science</p>
              </div>
              <span className="hidden rounded-full bg-[#30d158]/15 px-2.5 py-0.5 text-xs font-medium text-[#1e8e3e] dark:text-[#5fe07f] sm:inline-flex">
                Enrolled
              </span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                { icon: PlayCircle, tone: 'blue' as Tone, title: 'Control flow', meta: 'Lecture 3 · 24 min' },
                { icon: ClipboardCheck, tone: 'orange' as Tone, title: 'Problem set 2', meta: 'Due Friday · 30 pts' },
                { icon: BarChart3, tone: 'green' as Tone, title: 'Course progress', meta: '68% complete' },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3 rounded-2xl bg-card p-3.5">
                  <IconTile icon={item.icon} tone={item.tone} className="h-10 w-10" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.meta}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-card p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Weekly progress</span>
                <span className="tabular-nums">68%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-[#0071e3] to-[#7d4fd6] dark:from-[#0a84ff] dark:to-[#bf5af2]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto mt-16 grid max-w-3xl grid-cols-3 divide-x divide-border rounded-2xl border border-border/70 bg-card md:mt-20">
        {stats.map((stat) => (
          <div key={stat.label} className="px-4 py-6 text-center md:py-8">
            <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="mt-24 md:mt-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Everything a course needs.</h2>
          <p className="mt-4 text-muted-foreground md:text-lg">Nothing it doesn&apos;t.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon, tone, title, body }) => (
            <div key={title} className="rounded-2xl border border-border/70 bg-card p-7 transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
              <IconTile icon={icon} tone={tone} />
              <h3 className="mt-5 text-[17px] font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="mt-24 md:mt-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Made for everyone in the classroom.</h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {roles.map(({ icon, tone, title, points }) => (
            <div key={title} className="rounded-2xl border border-border/70 bg-card p-7">
              <IconTile icon={icon} tone={tone} />
              <h3 className="mt-5 text-[17px] font-semibold tracking-tight">{title}</h3>
              <ul className="mt-4 space-y-2.5">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate mt-24 overflow-hidden rounded-[1.75rem] bg-[#1d1d1f] px-6 py-14 text-center md:mt-32 md:py-20 dark:border dark:border-border/70 dark:bg-card">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_20%_0%,rgba(10,132,255,0.35),transparent),radial-gradient(50%_70%_at_90%_100%,rgba(191,90,242,0.3),transparent)]" />
        <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Start teaching in minutes.</h2>
        <p className="mx-auto mt-4 max-w-md text-white/70">Create your account and set up your first course today.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="bg-white text-[#1d1d1f] hover:bg-white/90" onClick={() => router.push('/signup')}>
            Create free account
          </Button>
          <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" onClick={() => router.push('/courses')}>
            Browse courses
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
