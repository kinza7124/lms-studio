'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Suggestion, Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Lightbulb, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge, EmptyState, Field, List, LoadingState, PageHeader, Section, Select, statusTone } from '@/components/ui/page';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function TeacherSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ courseId: '', suggestionText: '' });
  useAuthGuard();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [suggestionsRes, coursesRes] = await Promise.all([
        api.get<Suggestion[]>('/suggestions/my-suggestions'),
        api.get<Course[]>('/courses'),
      ]);
      setSuggestions(suggestionsRes.data);
      setCourses(coursesRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/suggestions', form);
      setForm({ courseId: '', suggestionText: '' });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error(error);
      alert('Failed to submit suggestion');
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Teaching"
        title="Suggestions"
        description="Propose improvements to courses and track the admin response."
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            Submit suggestion
          </Button>
        }
      />

      {showForm && (
        <Card className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 p-6">
              <h2 className="text-[17px] font-semibold text-foreground">New suggestion</h2>
              <Field label="Course" htmlFor="courseId">
                <Select
                  id="courseId"
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Suggestion" htmlFor="suggestionText">
                <Textarea
                  id="suggestionText"
                  value={form.suggestionText}
                  onChange={(e) => setForm({ ...form, suggestionText: e.target.value })}
                  placeholder="Enter your suggestion or proposal..."
                  rows={5}
                  required
                />
              </Field>
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit</Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      <Section title="My suggestions">
        {suggestions.length === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title="No suggestions yet"
            description="Suggestions you submit will appear here."
          />
        ) : (
          <List>
            {suggestions.map((suggestion) => (
              <div key={suggestion.suggestion_id} className="space-y-3 px-4 py-4 md:px-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-[15px] font-medium text-foreground">
                    {suggestion.code} - {suggestion.title}
                  </p>
                  <Badge tone={statusTone(suggestion.status)} className="capitalize">
                    {suggestion.status}
                  </Badge>
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground">{suggestion.suggestion_text}</p>
                {suggestion.admin_response && (
                  <div className="rounded-xl bg-secondary/60 p-4">
                    <p className="text-xs text-muted-foreground">Admin response</p>
                    <p className="mt-1 text-sm text-foreground">{suggestion.admin_response}</p>
                  </div>
                )}
              </div>
            ))}
          </List>
        )}
      </Section>
    </div>
  );
}
