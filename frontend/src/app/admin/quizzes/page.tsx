'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Quiz, Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">Quizzes</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create Quiz'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Create New Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="courseId">Course</Label>
                <select
                  id="courseId"
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white"
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
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                <div>
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="timeLimit">Time Limit (minutes, optional)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              <Button type="submit">Create Quiz</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div>
        <Label htmlFor="filterCourse">Filter by Course</Label>
        <select
          id="filterCourse"
          onChange={(e) => handleCourseChange(e.target.value)}
          className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm text-white mt-2"
        >
          <option value="">All Courses</option>
          {courses.map((course) => (
            <option key={course.course_id} value={course.course_id}>
              {course.code} - {course.title}
            </option>
          ))}
        </select>
      </div>

      {quizzes.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4 md:p-6 lg:p-8 text-center text-muted-foreground">
            {selectedCourse ? 'No quizzes found for this course.' : 'Select a course to view quizzes or create a new one.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 md:gap-3 lg:gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.quiz_id} className="border-white/10 bg-white/5">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="text-white">{quiz.title}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/quizzes/${quiz.quiz_id}`)}
                  >
                    Manage
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">{quiz.description}</p>
                <div className="flex gap-2 md:gap-3 lg:gap-4 text-sm text-muted-foreground">
                  <span>Marks: {quiz.total_marks}</span>
                  {quiz.time_limit && <span>Time: {quiz.time_limit} min</span>}
                  {quiz.due_date && (
                    <span>Due: {new Date(quiz.due_date).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/quizzes/${quiz.quiz_id}/questions`)}
                  >
                    Add Questions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/quizzes/${quiz.quiz_id}/submissions`)}
                  >
                    View Submissions
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(quiz.quiz_id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

