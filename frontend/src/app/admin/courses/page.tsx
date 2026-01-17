'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Course, Specialty } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">Course Management</h1>
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
          Add Course
        </Button>
      </div>

      {showForm && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">
              {selectedCourse ? 'Edit Course' : 'Create Course'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="code">Course Code</Label>
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="credits">Credits</Label>
                  <Input
                    id="credits"
                    type="number"
                    value={form.credits}
                    onChange={(e) => setForm({ ...form, credits: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  value={form.thumbnailUrl}
                  onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="content">Content/Syllabus</Label>
                <Textarea
                  id="content"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="specialties">Required Skills/Specialties (Tags)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Select the skills required to teach this course. Teachers must have all selected skills to be eligible.
                </p>
                <div className="max-h-48 overflow-y-auto border border-white/10 rounded-lg p-3 space-y-2">
                  {specialties.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No specialties available. Create some first.</p>
                  ) : (
                    specialties.map((specialty) => (
                      <label
                        key={specialty.specialty_id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-white/5 p-2 rounded"
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
                          className="rounded border-white/20"
                        />
                        <span className="text-sm text-white">
                          {specialty.specialty_name}
                          {specialty.description && (
                            <span className="text-muted-foreground ml-2">- {specialty.description}</span>
                          )}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {form.selectedSpecialties.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.selectedSpecialties.map((specialtyId) => {
                      const specialty = specialties.find((s) => s.specialty_id === specialtyId);
                      return specialty ? (
                        <span
                          key={specialtyId}
                          className="px-2 py-1 bg-purple-500/20 text-purple-200 rounded-full text-xs border border-purple-400/30"
                        >
                          {specialty.specialty_name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit">{selectedCourse ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setSelectedCourse(null);
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Courses ({courses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.course_id}
                className="flex items-center justify-between rounded-lg border border-white/10 p-4"
              >
                <div className="flex-1">
                  <p className="font-medium text-white">
                    {course.code} - {course.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {course.credits} credits
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(course)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleManageRequirements(course.course_id)}
                  >
                    Requirements
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(course.course_id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

