'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Course, Specialty } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function CourseRequirementsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [requirements, setRequirements] = useState<Specialty[]>([]);
  const [allSpecialties, setAllSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  useAuthGuard();

  useEffect(() => {
    if (params.id) {
      loadData();
    }
  }, [params.id]);

  const loadData = async () => {
    try {
      const [courseRes, requirementsRes, specialtiesRes] = await Promise.all([
        api.get<Course>(`/courses/${params.id}`),
        api.get<Specialty[]>(`/specialties/course/${params.id}/requirements`),
        api.get<Specialty[]>('/specialties'),
      ]);
      setCourse(courseRes.data);
      setRequirements(requirementsRes.data);
      setAllSpecialties(specialtiesRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRequirement = async (specialtyId: number) => {
    try {
      await api.post(`/specialties/course/${params.id}/requirements`, { specialtyId });
      loadData();
    } catch (error) {
      console.error(error);
      alert('Failed to add requirement');
    }
  };

  const handleRemoveRequirement = async (specialtyId: number) => {
    try {
      await api.delete(`/specialties/course/${params.id}/requirements/${specialtyId}`);
      loadData();
    } catch (error) {
      console.error(error);
      alert('Failed to remove requirement');
    }
  };

  if (loading) {
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  const availableSpecialties = allSpecialties.filter(
    (s) => !requirements.some((r) => r.specialty_id === s.specialty_id),
  );

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">
            Course Requirements: {course?.code} - {course?.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Link required skills/specialties to this course. Only teachers with all required skills will be eligible to teach this course.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/courses')}>
          Back to Courses
        </Button>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Required Skills ({requirements.length})</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Teachers must have all of these skills to be eligible to teach this course.
          </p>
        </CardHeader>
        <CardContent>
          {requirements.length === 0 ? (
            <p className="text-muted-foreground">No requirements set yet.</p>
          ) : (
            <div className="space-y-2">
              {requirements.map((requirement) => (
                <div
                  key={requirement.specialty_id}
                  className="flex items-center justify-between rounded-lg border border-white/10 p-4"
                >
                  <div>
                    <p className="font-medium text-white">{requirement.specialty_name}</p>
                    {requirement.description && (
                      <p className="text-sm text-muted-foreground">{requirement.description}</p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveRequirement(requirement.specialty_id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Available Skills to Add</CardTitle>
        </CardHeader>
        <CardContent>
          {availableSpecialties.length === 0 ? (
            <p className="text-muted-foreground">All specialties are already required.</p>
          ) : (
            <div className="space-y-2">
              {availableSpecialties.map((specialty) => (
                <div
                  key={specialty.specialty_id}
                  className="flex items-center justify-between rounded-lg border border-white/10 p-4"
                >
                  <div>
                    <p className="font-medium text-white">{specialty.specialty_name}</p>
                    {specialty.description && (
                      <p className="text-sm text-muted-foreground">{specialty.description}</p>
                    )}
                  </div>
                  <Button size="sm" onClick={() => handleAddRequirement(specialty.specialty_id)}>
                    Add Requirement
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

