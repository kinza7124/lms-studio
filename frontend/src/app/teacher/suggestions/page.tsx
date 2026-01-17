'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Suggestion, Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">Suggestions</h1>
        <Button onClick={() => setShowForm(!showForm)}>Submit Suggestion</Button>
      </div>

      {showForm && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Submit Suggestion</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="courseId">Course</Label>
                <select
                  id="courseId"
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 text-white"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="suggestionText">Suggestion</Label>
                <Textarea
                  id="suggestionText"
                  value={form.suggestionText}
                  onChange={(e) => setForm({ ...form, suggestionText: e.target.value })}
                  placeholder="Enter your suggestion or proposal..."
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Submit</Button>
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
          <CardTitle className="text-white">My Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.suggestion_id}
                className="rounded-lg border border-white/10 p-4"
              >
                <p className="font-medium text-white">
                  {suggestion.code} - {suggestion.title}
                </p>
                <p className="mt-2 text-white">{suggestion.suggestion_text}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Status: <span className="capitalize">{suggestion.status}</span>
                </p>
                {suggestion.admin_response && (
                  <div className="mt-2 rounded bg-white/5 p-2">
                    <p className="text-sm font-medium text-muted-foreground">Admin Response:</p>
                    <p className="text-white">{suggestion.admin_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

