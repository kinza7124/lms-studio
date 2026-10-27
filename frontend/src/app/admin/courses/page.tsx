'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus } from 'lucide-react';
import api from '@/lib/api';
import type { Course, Specialty } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge, EmptyState, Field, LoadingState, PageHeader } from '@/components/ui/page';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [form, setForm] = useState({
    code: '',
    title: '',
    description: '',
    thumbnailUrl: '',
    credits: '3',
    content: '',
    selectedSpecialties: [] as number[],
  });
  const router = useRouter();
  useAuthGuard();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, specialtiesRes] = await Promise.all([
        api.get<Course[]>('/courses'),
        api.get<Specialty[]>('/specialties'),
      ]);
      setCourses(coursesRes.data);
      setSpecialties(specialtiesRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCourse) {
        await api.put(`/courses/${selectedCourse}`, {
          ...form,
          credits: Number(form.credits) || 3,
        });
        alert('Course updated successfully');
      } else {
        await api.post('/courses', {
          code: form.code,
          title: form.title,
          description: form.description,
          thumbnailUrl: form.thumbnailUrl,
          credits: Number(form.credits) || 3,
          content: form.content,
          specialtyIds: form.selectedSpecialties,
        });
        alert('Course created successfully');
      }
      setForm({
        code: '',
        title: '',
        description: '',
        thumbnailUrl: '',
        credits: '3',
        content: '',
        selectedSpecialties: [],
      });
      setShowForm(false);
      setSelectedCourse(null);
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to save course');
    }
  };

  const handleDelete = async (courseId: number) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/courses/${courseId}`);
      loadData();
    } catch (error) {
      console.error(error);
      alert('Failed to delete course');
    }
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course.course_id);
    setForm({
      code: course.code,
      title: course.title,
      description: course.description || '',
      thumbnailUrl: course.thumbnail_url || '',
      credits: course.credits?.toString() || '3',
      content: course.content || '',
      selectedSpecialties: [], // Will be loaded separately if needed
    });
    setShowForm(true);
  };

  const handleManageRequirements = (courseId: number) => {
    router.push(`/admin/courses/${courseId}/requirements`);
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Courses"
        description="Create and edit courses, set credits, and define the skills required to teach them."
        actions={
          <Button onClick={() => {
            setShowForm(true);
            setSelectedCourse(null);
            setForm({
              code: '',
              title: '',
              description: '',
              thumbnailUrl: '',
              credits: '3',
              content: '',
              selectedSpecialties: [],
            });
          }}>
            <Plus className="h-4 w-4" />
            Add course
          </Button>
        }
      />

      {showForm && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="text-[17px]">
              {selectedCourse ? 'Edit course' : 'Create course'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Course code" htmlFor="code">
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Credits" htmlFor="credits">
                  <Input
                    id="credits"
                    type="number"
                    value={form.credits}
                    onChange={(e) => setForm({ ...form, credits: e.target.value })}
                    required
                  />
                </Field>
              </div>
              <Field label="Title" htmlFor="title">
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </Field>
              <Field label="Description" htmlFor="description">
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>
              <Field label="Thumbnail URL" htmlFor="thumbnailUrl">
                <Input
                  id="thumbnailUrl"
                  value={form.thumbnailUrl}
                  onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                />
              </Field>
              <Field label="Content / syllabus" htmlFor="content">
                <Textarea
                  id="content"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </Field>
              <Field
                label="Required skills"
                hint="Teachers must have all selected skills to be eligible to teach this course."
              >
                <div className="max-h-56 overflow-y-auto rounded-xl bg-secondary/60 p-2">
                  {specialties.length === 0 ? (
                    <p className="p-2 text-sm text-muted-foreground">No specialties available. Create some first.</p>
                  ) : (
                    specialties.map((specialty) => (
                      <label
                        key={specialty.specialty_id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-card"
                      >
                        <input
                          type="checkbox"
                          checked={form.selectedSpecialties.includes(specialty.specialty_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({
                                ...form,
                                selectedSpecialties: [...form.selectedSpecialties, specialty.specialty_id],
                              });
                            } else {
                              setForm({
                                ...form,
                                selectedSpecialties: form.selectedSpecialties.filter(
                                  (id) => id !== specialty.specialty_id,
                                ),
                              });
                            }
                          }}
                          className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                        />
                        <span className="min-w-0 text-sm text-foreground">
                          {specialty.specialty_name}
                          {specialty.description && (
                            <span className="block text-xs text-muted-foreground">{specialty.description}</span>
                          )}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {form.selectedSpecialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {form.selectedSpecialties.map((specialtyId) => {
                      const specialty = specialties.find((s) => s.specialty_id === specialtyId);
                      return specialty ? (
                        <Badge key={specialtyId} tone="primary">
                          {specialty.specialty_name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </Field>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setSelectedCourse(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit">{selectedCourse ? 'Save changes' : 'Create course'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses yet" description="Add your first course to get started." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Course</th>
                <th className="hidden md:table-cell">Credits</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.course_id}>
                  <td className="max-w-md">
                    <p className="text-xs text-muted-foreground">{course.code}</p>
                    <p className="font-medium text-foreground">{course.title}</p>
                    {course.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{course.description}</p>
                    )}
                  </td>
                  <td className="hidden tabular-nums text-muted-foreground md:table-cell">{course.credits}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(course)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleManageRequirements(course.course_id)}
                      >
                        Requirements
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-red-50"
                        onClick={() => handleDelete(course.course_id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
