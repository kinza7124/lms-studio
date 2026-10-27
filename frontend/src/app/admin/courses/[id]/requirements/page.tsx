'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Tags } from 'lucide-react';
import api from '@/lib/api';
import type { Course, Specialty } from '@/types';
import { Button } from '@/components/ui/button';
import { EmptyState, List, ListItem, LoadingState, PageHeader, Section } from '@/components/ui/page';
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
    return <LoadingState />;
  }

  const availableSpecialties = allSpecialties.filter(
    (s) => !requirements.some((r) => r.specialty_id === s.specialty_id),
  );

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Admin"
        title={course ? `${course.code} · ${course.title}` : 'Course requirements'}
        description="Link required skills to this course. Only teachers with all required skills are eligible to teach it."
        back="Courses"
        backHref="/admin/courses"
      />

      <Section
        title="Required skills"
        description={`${requirements.length} required · teachers must have all of these to be eligible.`}
      >
        {requirements.length === 0 ? (
          <EmptyState icon={Tags} title="No requirements set yet" description="Add skills from the list below." />
        ) : (
          <List>
            {requirements.map((requirement) => (
              <ListItem key={requirement.specialty_id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-foreground">{requirement.specialty_name}</p>
                  {requirement.description && (
                    <p className="truncate text-xs text-muted-foreground">{requirement.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-red-50"
                  onClick={() => handleRemoveRequirement(requirement.specialty_id)}
                >
                  Remove
                </Button>
              </ListItem>
            ))}
          </List>
        )}
      </Section>

      <Section title="Available skills">
        {availableSpecialties.length === 0 ? (
          <EmptyState icon={Tags} title="All specialties are already required" />
        ) : (
          <List>
            {availableSpecialties.map((specialty) => (
              <ListItem key={specialty.specialty_id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-foreground">{specialty.specialty_name}</p>
                  {specialty.description && (
                    <p className="truncate text-xs text-muted-foreground">{specialty.description}</p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => handleAddRequirement(specialty.specialty_id)}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </ListItem>
            ))}
          </List>
        )}
      </Section>
    </div>
  );
}
