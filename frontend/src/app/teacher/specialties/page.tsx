'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Specialty } from '@/types';
import { Button } from '@/components/ui/button';
import { Award, Plus } from 'lucide-react';
import { EmptyState, List, ListItem, LoadingState, PageHeader, Section } from '@/components/ui/page';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function TeacherSpecialtiesPage() {
  const [mySpecialties, setMySpecialties] = useState<Specialty[]>([]);
  const [allSpecialties, setAllSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  useAuthGuard();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mySpecialtiesRes, allSpecialtiesRes] = await Promise.all([
        api.get<Specialty[]>('/specialties/teacher/my-specialties'),
        api.get<Specialty[]>('/specialties'),
      ]);
      setMySpecialties(mySpecialtiesRes.data);
      setAllSpecialties(allSpecialtiesRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpecialty = async (specialtyId: number) => {
    try {
      await api.post('/specialties/teacher/add', { specialtyId });
      loadData();
    } catch (error) {
      console.error(error);
      alert('Failed to add specialty');
    }
  };

  const handleRemoveSpecialty = async (specialtyId: number) => {
    if (!confirm('Remove this specialty?')) return;
    try {
      await api.delete(`/specialties/teacher/remove/${specialtyId}`);
      loadData();
    } catch (error) {
      console.error(error);
      alert('Failed to remove specialty');
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  const availableSpecialties = allSpecialties.filter(
    (s) => !mySpecialties.some((ms) => ms.specialty_id === s.specialty_id),
  );

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Profile"
        title="My skills"
        description="Add your teaching specialties. You'll be eligible to teach courses that require skills you have."
      />

      <Section
        title={`My skills (${mySpecialties.length})`}
        description="Courses requiring these skills will appear in your eligible courses list."
      >
        {mySpecialties.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No skills added yet"
            description="Add skills from the list below to become eligible for courses."
          />
        ) : (
          <List>
            {mySpecialties.map((specialty) => (
              <ListItem key={specialty.specialty_id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-foreground">{specialty.specialty_name}</p>
                  {specialty.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{specialty.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-red-50"
                  onClick={() => handleRemoveSpecialty(specialty.specialty_id)}
                >
                  Remove
                </Button>
              </ListItem>
            ))}
          </List>
        )}
      </Section>

      <Section
        title="Available skills"
        description="Add these skills to your profile to become eligible for courses that require them."
      >
        {availableSpecialties.length === 0 ? (
          <EmptyState icon={Award} title="No additional specialties available" />
        ) : (
          <List>
            {availableSpecialties.map((specialty) => (
              <ListItem key={specialty.specialty_id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-foreground">{specialty.specialty_name}</p>
                  {specialty.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{specialty.description}</p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => handleAddSpecialty(specialty.specialty_id)}>
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
