'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, Field, PageHeader } from '@/components/ui/page';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function AddCoursePage() {
  const router = useRouter();
  useAuthGuard();
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({
    code: '',
    title: '',
    description: '',
    thumbnailUrl: '',
    credits: '3',
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        setUser(data.user);
        if (data.user.role !== 'admin') {
          router.push('/dashboard');
        }
      } catch (error) {
        router.push('/login');
      }
    };
    checkUser();
  }, [router]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/courses', {
        ...form,
        credits: Number(form.credits) || 3,
      });
      setSuccess('Course created successfully');
      setForm({
        code: '',
        title: '',
        description: '',
        thumbnailUrl: '',
        credits: '3',
        content: '',
      });
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('Failed to create course. Are you logged in as admin?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        back
        eyebrow="Admin"
        title="Add a new course"
        description="Create a course that teachers can be assigned to and students can enroll in."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Course code" htmlFor="code">
                <Input
                  id="code"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="CS-201"
                  required
                />
              </Field>
              <Field label="Title" htmlFor="title" className="sm:col-span-2">
                <Input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Intro to Algorithms"
                  required
                />
              </Field>
            </div>
            <Field label="Description" htmlFor="description">
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What will learners accomplish?"
                rows={4}
              />
            </Field>
            <Field label="Thumbnail URL" htmlFor="thumbnailUrl" hint="Optional. A wide image works best.">
              <Input
                id="thumbnailUrl"
                name="thumbnailUrl"
                value={form.thumbnailUrl}
                onChange={handleChange}
                placeholder="https://images.example.com/course.png"
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Credits" htmlFor="credits">
                <Input
                  id="credits"
                  name="credits"
                  type="number"
                  min={1}
                  value={form.credits}
                  onChange={handleChange}
                  className="tabular-nums"
                />
              </Field>
              <Field label="Syllabus highlights" htmlFor="content" className="sm:col-span-2">
                <Input
                  id="content"
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  placeholder="Weeks, modules, deliverables..."
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Saving…' : 'Create course'}
          </Button>
        </div>
      </form>
    </div>
  );
}
