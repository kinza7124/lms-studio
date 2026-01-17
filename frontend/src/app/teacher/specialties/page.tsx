'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Specialty } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  const availableSpecialties = allSpecialties.filter(
    (s) => !mySpecialties.some((ms) => ms.specialty_id === s.specialty_id),
  );

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">My Skills (Specialties)</h1>
        <p className="mt-2 text-muted-foreground">
          Add your teaching skills/specialties to your profile. Courses require specific skills,
          and you'll be eligible to teach courses that match your skills.
        </p>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">My Skills ({mySpecialties.length})</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            These are the skills you've added to your profile. Courses requiring these skills will appear in your eligible courses list.
          </p>
        </CardHeader>
        <CardContent>
          {mySpecialties.length === 0 ? (
            <p className="text-muted-foreground">You don't have any specialties assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {mySpecialties.map((specialty) => (
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
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveSpecialty(specialty.specialty_id)}
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
          <p className="text-sm text-muted-foreground mt-1">
            Add these skills to your profile to become eligible for courses that require them.
          </p>
        </CardHeader>
        <CardContent>
          {availableSpecialties.length === 0 ? (
            <p className="text-muted-foreground">No additional specialties available.</p>
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
                  <Button size="sm" onClick={() => handleAddSpecialty(specialty.specialty_id)}>
                    Add
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

