'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Course, Specialty } from '@/types';
import { CourseCard } from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">Course Catalog</h1>
          <p className="mt-2 text-muted-foreground">
            Browse all available courses and enroll in the ones that interest you
          </p>
        </div>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Search courses..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full rounded border border-white/20 bg-white/5 px-4 py-2 text-white placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <select
              value={filters.specialtyId}
              onChange={(e) => setFilters({ ...filters, specialtyId: e.target.value })}
              className="w-full rounded border border-white/20 bg-white/5 px-4 py-2 text-white"
            >
              <option value="">All Specialties</option>
              {specialties.map((specialty) => (
                <option key={specialty.specialty_id} value={specialty.specialty_id}>
                  {specialty.specialty_name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground">Loading courses...</p>
      ) : courses.length === 0 ? (
        <p className="text-muted-foreground">No courses found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.course_id}
              course={course}
              onView={(id) => router.push(`/course/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

