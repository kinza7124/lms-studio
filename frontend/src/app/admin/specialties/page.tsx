'use client';

import { useEffect, useState } from 'react';
import { Plus, Tags } from 'lucide-react';
import api from '@/lib/api';
import type { Specialty } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, Field, List, ListItem, LoadingState, PageHeader, Section } from '@/components/ui/page';
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
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Skills"
        description="Teaching skills that can be linked to courses as requirements. Teachers add skills to their profile to become eligible."
        actions={
          <Button variant={showForm ? 'outline' : 'default'} onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            Add skill
          </Button>
        }
      />

      {showForm && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-[17px]">New skill</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label="Name" htmlFor="specialtyName" hint="For example Mathematics, Accounting or Business management.">
                <Input
                  id="specialtyName"
                  value={form.specialtyName}
                  onChange={(e) => setForm({ ...form, specialtyName: e.target.value })}
                  placeholder="Skill name"
                  required
                />
              </Field>
              <Field label="Description" htmlFor="description">
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe this skill and its relevance to teaching"
                />
              </Field>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create skill</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Section title="All skills" description={`${specialties.length} skills`}>
        {specialties.length === 0 ? (
          <EmptyState icon={Tags} title="No skills yet" description="Add a skill to start linking it to courses." />
        ) : (
          <List>
            {specialties.map((specialty) => (
              <ListItem key={specialty.specialty_id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-foreground">{specialty.specialty_name}</p>
                  {specialty.description && (
                    <p className="truncate text-xs text-muted-foreground">{specialty.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-red-50"
                  onClick={() => handleDelete(specialty.specialty_id)}
                >
                  Delete
                </Button>
              </ListItem>
            ))}
          </List>
        )}
      </Section>
    </div>
  );
}
