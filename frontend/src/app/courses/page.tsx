'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Course, Specialty } from '@/types';
import { CourseCard } from '@/components/CourseCard';
import { Input } from '@/components/ui/input';
import { EmptyState, LoadingState, PageHeader, Select } from '@/components/ui/page';
import { BookOpen, Search } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ specialtyId: '', search: '' });
  const router = useRouter();
  useAuthGuard();

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      if (!token) {
        // Guard: no token, redirect handled by useAuthGuard but skip calls to avoid network errors
        setLoading(false);
        router.replace('/login');
        return;
      }

      const [coursesRes, specialtiesRes] = await Promise.all([
        api.get<Course[]>('/courses', { params: filters.specialtyId ? { specialtyId: filters.specialtyId } : {} }),
        api.get<Specialty[]>('/specialties'),
      ]);
      let filteredCourses = coursesRes.data;
      if (filters.search) {
        filteredCourses = filteredCourses.filter(
          (c) =>
            c.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            c.code.toLowerCase().includes(filters.search.toLowerCase()),
        );
      }
      setCourses(filteredCourses);
      setSpecialties(specialtiesRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Course catalog"
        description="Browse all available courses and enroll in the ones that interest you."
        className="mb-0 md:mb-0"
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
          />
          <Input
            type="text"
            placeholder="Search courses"
            aria-label="Search courses"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>
        <Select
          aria-label="Filter by specialty"
          value={filters.specialtyId}
          onChange={(e) => setFilters({ ...filters, specialtyId: e.target.value })}
          className="sm:w-64"
        >
          <option value="">All specialties</option>
          {specialties.map((specialty) => (
            <option key={specialty.specialty_id} value={specialty.specialty_id}>
              {specialty.specialty_name}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <LoadingState label="Loading courses…" />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description="Try a different search term or specialty."
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm tabular-nums text-muted-foreground">
            {courses.length} course{courses.length === 1 ? '' : 's'}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.course_id}
                course={course}
                onView={(id) => router.push(`/course/${id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
