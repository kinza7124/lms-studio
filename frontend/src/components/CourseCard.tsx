/* eslint-disable @next/next/no-img-element */
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Course } from '@/types';

type CourseCardProps = {
  course: Course;
  onView?: (id: number) => void;
  ctaLabel?: string;
};

export function CourseCard({ course, onView, ctaLabel = 'View Course' }: CourseCardProps) {
  const badgeLabel = course.code ? course.code.toUpperCase() : `Course #${course.course_id}`;
  return (
    <Card className="group relative flex flex-col overflow-hidden border-white/10 bg-white/5 shadow-lg shadow-black/20 transition-all duration-300 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-indigo-500/0 to-cyan-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/0 via-indigo-500/0 to-cyan-500/0 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-20" />
      
      <CardHeader className="relative z-10 space-y-3">
        <div className="inline-flex w-fit items-center rounded-full border border-purple-400/30 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 px-3 py-1 text-xs uppercase tracking-widest text-purple-200/90 backdrop-blur-sm transition-all duration-300 group-hover:border-purple-400/50 group-hover:from-purple-500/30 group-hover:to-indigo-500/30">
          {badgeLabel}
        </div>
        <CardTitle className="text-xl text-white transition-colors duration-300 group-hover:text-purple-200">
          {course.title}
        </CardTitle>
        <CardDescription className="text-sm text-white/70">
          {course.description ? `${course.description.slice(0, 120)}${course.description.length > 120 ? '…' : ''}` : 'No description yet'}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 flex-1">
        {course.thumbnail_url ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/10">
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-dashed border-white/15 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 text-sm text-white/50 backdrop-blur-sm transition-all duration-300 group-hover:border-purple-400/30 group-hover:from-purple-500/20 group-hover:to-indigo-500/20">
            <div className="text-center">
              <div className="mb-2 text-2xl">📚</div>
              <div>No thumbnail</div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="relative z-10">
        <Button
          className="w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 bg-size-200 text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/50"
          onClick={() => onView?.(course.course_id)}
        >
          <span className="relative z-10">{ctaLabel}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

