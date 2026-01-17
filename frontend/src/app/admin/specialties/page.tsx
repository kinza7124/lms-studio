'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Specialty } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function AdminSpecialtiesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ specialtyName: '', description: '' });
  useAuthGuard();

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      const { data } = await api.get<Specialty[]>('/specialties');
      setSpecialties(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/specialties', form);
      setForm({ specialtyName: '', description: '' });
      setShowForm(false);
      loadSpecialties();
    } catch (error) {
      console.error(error);
      alert('Failed to create specialty');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this specialty?')) return;
    try {
      await api.delete(`/specialties/${id}`);
      loadSpecialties();
    } catch (error) {
      console.error(error);
      alert('Failed to delete specialty');
    }
  };

  if (loading) {
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">Skill Management (Specialties)</h1>
          <p className="mt-2 text-muted-foreground">
            Manage teaching skills/specialties. Link skills to courses as requirements, and teachers can add skills to their profile.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>Add Skill</Button>
      </div>

      {showForm && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Create New Skill/Specialty</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="specialtyName">Skill Name (e.g., Mathematics, Accounting, Business)</Label>
                <Input
                  id="specialtyName"
                  value={form.specialtyName}
                  onChange={(e) => setForm({ ...form, specialtyName: e.target.value })}
                  placeholder="e.g., Mathematics, Accounting, Business Management"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe this skill and its relevance to teaching"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">All Skills/Specialties ({specialties.length})</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            These skills can be linked to courses as requirements. Teachers with matching skills become eligible to teach those courses.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {specialties.map((specialty) => (
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
                <Button variant="destructive" size="sm" onClick={() => handleDelete(specialty.specialty_id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

