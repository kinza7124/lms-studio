'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, Field, PageHeader, Select } from '@/components/ui/page';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function AddLecturePage() {
  useAuthGuard();
  const [courses, setCourses] = useState<Course[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    courseId: '',
    title: '',
    videoUrl: '',
    lectureNumber: '',
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // If teacher, only show courses they're assigned to (with approved status)
        const { data: userData } = await api.get('/auth/profile');
        if (userData.user.role === 'teacher') {
          const { data: coursesData } = await api.get<{ courses: Course[] }>('/teachers/courses');
          // Filter to only show approved assignments
          setCourses(coursesData.courses || []);
        } else if (userData.user.role === 'admin') {
          // Admin can see all courses
          const { data } = await api.get<Course[]>('/courses');
          setCourses(data || []);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        setMessage('Failed to load courses. Please try again.');
      }
    };
    fetchCourses();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const data = new FormData();
      data.append('courseId', form.courseId);
      data.append('title', form.title);
      data.append('videoUrl', form.videoUrl);
      data.append('lectureNumber', form.lectureNumber);
      data.append('content', form.content);
      if (pdfFile) {
        data.append('pdf', pdfFile);
      }

      await api.post('/lectures', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage('Lecture saved successfully.');
      setForm({
        courseId: '',
        title: '',
        videoUrl: '',
        lectureNumber: '',
        content: '',
      });
      setPdfFile(null);
    } catch (error: any) {
      console.error(error);
      setMessage(
        error.response?.data?.message ||
        'Unable to save lecture. Ensure you are assigned to teach this course.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        back
        eyebrow="Teaching"
        title="Add lecture"
        description={
          courses.length === 0
            ? 'You are not assigned to any courses yet. Contact admin to get assigned to a course.'
            : 'Select a course you are assigned to teach and add lecture content.'
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="space-y-5 p-6">
            <Field
              label="Course"
              htmlFor="courseId"
              hint={
                courses.length === 0
                  ? 'You must be assigned to a course by admin before you can add lectures.'
                  : undefined
              }
            >
              <Select
                id="courseId"
                name="courseId"
                value={form.courseId}
                onChange={handleSelectChange}
                required
                disabled={courses.length === 0}
              >
                <option value="">
                  {courses.length === 0
                    ? 'No assigned courses available'
                    : 'Select a course you are assigned to'}
                </option>
                {courses.map((course) => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-5 sm:grid-cols-4">
              <Field label="Lecture title" htmlFor="title" className="sm:col-span-3">
                <Input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </Field>
              <Field label="Number" htmlFor="lectureNumber">
                <Input
                  id="lectureNumber"
                  name="lectureNumber"
                  type="number"
                  value={form.lectureNumber}
                  onChange={handleChange}
                  min={1}
                  className="tabular-nums"
                />
              </Field>
            </div>
            <Field label="Video URL" htmlFor="videoUrl" hint="YouTube embed links work best.">
              <Input
                id="videoUrl"
                name="videoUrl"
                value={form.videoUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/embed/..."
              />
            </Field>
            <Field label="Content / notes" htmlFor="content">
              <Textarea
                id="content"
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Outline, important formulas, or transcript excerpts."
                rows={5}
              />
            </Field>
            <Field label="Lecture PDF" htmlFor="pdf" hint="Optional. PDF files only.">
              <Input
                id="pdf"
                type="file"
                accept="application/pdf"
                onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
                className="h-auto py-2 file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-[13px] file:font-medium file:text-foreground"
              />
            </Field>
          </CardContent>
        </Card>

        {message && (
          <Alert tone={message.includes('successfully') ? 'success' : 'error'}>{message}</Alert>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading || courses.length === 0}
            className="w-full sm:w-auto"
          >
            {loading ? 'Uploading…' : 'Save lecture'}
          </Button>
        </div>
      </form>
    </div>
  );
}
