'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ClipboardList, Clock, Plus } from 'lucide-react';
import api from '@/lib/api';
import type { Quiz, Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, Field, List, ListItem, LoadingState, PageHeader, Select } from '@/components/ui/page';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    totalMarks: '100',
    timeLimit: '',
    dueDate: '',
  });
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  useAuthGuard();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes] = await Promise.all([
        api.get<Course[]>('/courses'),
      ]);
      setCourses(coursesRes.data);
      
      // Load quizzes for selected course if any
      if (selectedCourse) {
        const quizzesRes = await api.get<Quiz[]>(`/quizzes/course/${selectedCourse}`);
        setQuizzes(quizzesRes.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = async (courseId: string) => {
    if (!courseId) {
      setQuizzes([]);
      setSelectedCourse(null);
      return;
    }
    setSelectedCourse(parseInt(courseId));
    try {
      const quizzesRes = await api.get<Quiz[]>(`/quizzes/course/${courseId}`);
      setQuizzes(quizzesRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/quizzes', {
        courseId: parseInt(formData.courseId),
        title: formData.title,
        description: formData.description,
        totalMarks: parseFloat(formData.totalMarks),
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
        dueDate: formData.dueDate || null,
      });
      alert('Quiz created successfully');
      setFormData({
        courseId: '',
        title: '',
        description: '',
        totalMarks: '100',
        timeLimit: '',
        dueDate: '',
      });
      setShowForm(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to create quiz');
    }
  };

  const handleDelete = async (quizId: number) => {
    if (!confirm('Delete this quiz?')) return;
    try {
      await api.delete(`/quizzes/${quizId}`);
      alert('Quiz deleted successfully');
      loadData();
    } catch (error) {
      console.error(error);
      alert('Failed to delete quiz');
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Quizzes"
        description="Create quizzes for any course, manage questions and review submissions."
        actions={
          <Button variant={showForm ? 'outline' : 'default'} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : (
              <>
                <Plus className="h-4 w-4" />
                Create quiz
              </>
            )}
          </Button>
        }
      />

      {showForm && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="text-[17px]">New quiz</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label="Course" htmlFor="courseId">
                <Select
                  id="courseId"
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
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
              <Field label="Title" htmlFor="title">
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Field>
              <Field label="Description" htmlFor="description">
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="Total marks" htmlFor="totalMarks">
                  <Input
                    id="totalMarks"
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Time limit" htmlFor="timeLimit" hint="Minutes, optional">
                  <Input
                    id="timeLimit"
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                  />
                </Field>
                <Field label="Due date" htmlFor="dueDate">
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </Field>
              </div>
              <div className="flex justify-end pt-1">
                <Button type="submit">Create quiz</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Field label="Filter by course" htmlFor="filterCourse" className="max-w-xs">
        <Select
          id="filterCourse"
          onChange={(e) => handleCourseChange(e.target.value)}
        >
          <option value="">All courses</option>
          {courses.map((course) => (
            <option key={course.course_id} value={course.course_id}>
              {course.code} - {course.title}
            </option>
          ))}
        </Select>
      </Field>

      {quizzes.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={selectedCourse ? 'No quizzes for this course' : 'Select a course'}
          description={selectedCourse ? 'Create a quiz to get started.' : 'Choose a course to view its quizzes, or create a new one.'}
        />
      ) : (
        <List>
          {quizzes.map((quiz) => (
            <ListItem key={quiz.quiz_id} className="flex-col items-stretch gap-3 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-foreground">{quiz.title}</p>
                {quiz.description && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{quiz.description}</p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="tabular-nums">{quiz.total_marks} marks</span>
                  {quiz.time_limit && (
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {quiz.time_limit} min
                    </span>
                  )}
                  {quiz.due_date && (
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Due {new Date(quiz.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/quizzes/${quiz.quiz_id}`)}
                >
                  Manage
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/quizzes/${quiz.quiz_id}/questions`)}
                >
                  Questions
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/quizzes/${quiz.quiz_id}/submissions`)}
                >
                  Submissions
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-red-50"
                  onClick={() => handleDelete(quiz.quiz_id)}
                >
                  Delete
                </Button>
              </div>
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
}
