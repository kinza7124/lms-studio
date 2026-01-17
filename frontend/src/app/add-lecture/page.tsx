'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    <div className="p-4 md:p-6 lg:p-8">
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="p-4 md:p-6 lg:p-8">
          <CardTitle className="text-2xl md:text-3xl text-white">Add Lecture</CardTitle>
          <p className="text-xs md:text-sm text-muted-foreground mt-2">
            {courses.length === 0
              ? 'You are not assigned to any courses yet. Contact admin to get assigned to a course.'
              : 'Select a course you are assigned to teach and add lecture content.'}
          </p>
        </CardHeader>
        <CardContent className="p-4 md:p-6 lg:p-8">
          <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
            <Label htmlFor="courseId">Course</Label>
                <select
                  id="courseId"
                  name="courseId"
                  value={form.courseId}
                  onChange={handleSelectChange}
                  className="h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 text-sm text-white"
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
            </select>
            {courses.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                You must be assigned to a course by admin before you can add lectures.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Lecture Title</Label>
            <Input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input
              id="videoUrl"
              name="videoUrl"
              value={form.videoUrl}
              onChange={handleChange}
              placeholder="https://www.youtube.com/embed/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lectureNumber">Lecture Number</Label>
            <Input
              id="lectureNumber"
              name="lectureNumber"
              type="number"
              value={form.lectureNumber}
              onChange={handleChange}
              min={1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content / Notes</Label>
            <Textarea
              id="content"
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Outline, important formulas, or transcript excerpts."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pdf">Lecture PDF</Label>
            <Input
              id="pdf"
              type="file"
              accept="application/pdf"
              onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
            />
          </div>
          {message && (
            <p
              className={`text-sm ${
                message.includes('successfully')
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}
            >
              {message}
            </p>
          )}
          <Button
            type="submit"
            disabled={loading || courses.length === 0}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
          >
            {loading ? 'Uploading...' : 'Save Lecture'}
          </Button>
        </form>
      </CardContent>
    </Card>
      </div>
  );
}

