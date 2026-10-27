'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, FileText, BarChart3, Users, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const router = useRouter();

  const stats = [
    { label: 'Active learners', value: '2.4k+' },
    { label: 'Hours of content', value: '380+' },
    { label: 'Avg. satisfaction', value: '4.9/5' },
  ];

  const features = [
    { icon: BookOpen, title: 'Course builder', body: 'Structure courses and lectures with video and PDF resources in minutes.' },
    { icon: ClipboardCheck, title: 'Assignments & quizzes', body: 'Collect submissions, grade with rubrics, and run timed assessments.' },
    { icon: BarChart3, title: 'Progress tracking', body: 'See where every learner stands with clear, per-course progress.' },
    { icon: Users, title: 'Roles that fit', body: 'Purpose-built views for admins, teachers, and students.' },
    { icon: FileText, title: 'Secure documents', body: 'Deliver PDFs with instant in-browser previews.' },
    { icon: ShieldCheck, title: 'Integrity built in', body: 'Plagiarism checks on submissions, surfaced right where you grade.' },
  ];

  return (
    <div className="pb-16">
      <section className="mx-auto max-w-3xl pt-10 text-center md:pt-20">
        <p className="text-sm font-medium text-primary">LMS Studio</p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Teaching, beautifully organized.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Courses, lectures, assignments and grades in one calm, focused workspace for your whole institution.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => router.push('/signup')}>
            Get started
          </Button>
          <Button variant="outline" size="lg" onClick={() => router.push('/login')}>
            Sign in
          </Button>
        </div>
      </section>

      <section className="mx-auto mt-20 grid max-w-3xl grid-cols-3 divide-x divide-border rounded-2xl border border-border/70 bg-card md:mt-24">
        {stats.map((stat) => (
          <div key={stat.label} className="px-4 py-6 text-center md:py-8">
            <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-24 md:mt-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Everything a course needs.</h2>
          <p className="mt-4 text-muted-foreground md:text-lg">Nothing it doesn&apos;t.</p>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-card p-7">
              <Icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
              <h3 className="mt-5 text-[17px] font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
