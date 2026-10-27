/* eslint-disable @next/next/no-img-element */
import { BookOpen, ArrowRight } from 'lucide-react';
import type { Course } from '@/types';

type CourseCardProps = {
  course: Course;
  onView?: (id: number) => void;
  ctaLabel?: string;
};

// Soft, deterministic tints for courses without a thumbnail
const TINTS = [
  { bg: 'bg-[#eaf3ff] dark:bg-[#0a84ff]/[0.14]', fg: 'text-[#0060d1] dark:text-[#64aaff]' },
  { bg: 'bg-[#eaf7ee] dark:bg-[#30d158]/[0.12]', fg: 'text-[#1e7a3c] dark:text-[#5fe07f]' },
  { bg: 'bg-[#fff3e6] dark:bg-[#ff9f0a]/[0.12]', fg: 'text-[#b25b00] dark:text-[#ffb340]' },
  { bg: 'bg-[#f2effc] dark:bg-[#bf5af2]/[0.14]', fg: 'text-[#5b47b8] dark:text-[#d08cf7]' },
  { bg: 'bg-[#eef1f4] dark:bg-white/[0.05]', fg: 'text-[#3c4a5a] dark:text-[#c7ccd1]' },
];

export function CourseCard({ course, onView, ctaLabel = 'View course' }: CourseCardProps) {
  const tint = TINTS[course.course_id % TINTS.length];
  const badgeLabel = course.code ? course.code.toUpperCase() : `Course #${course.course_id}`;
  return (
    <button
      type="button"
      onClick={() => onView?.(course.course_id)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] dark:hover:border-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
    >
      <div className="relative aspect-[2/1] w-full overflow-hidden bg-secondary dark:bg-transparent">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className={`flex h-full w-full flex-col justify-between p-5 ${tint.bg}`}>
            <BookOpen className={`h-5 w-5 ${tint.fg}`} strokeWidth={1.75} />
            <span className={`text-2xl font-semibold tracking-tight ${tint.fg}`}>{course.code || course.title.slice(0, 3)}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {course.thumbnail_url && <span className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground">{badgeLabel}</span>}
        <h3 className="text-[17px] font-semibold leading-snug tracking-tight text-foreground">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {course.description || 'No description yet'}
        </p>
        <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-primary">
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
