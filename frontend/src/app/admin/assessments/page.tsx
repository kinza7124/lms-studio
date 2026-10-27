'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, FileCheck, Plus } from 'lucide-react';
import api from '@/lib/api';
import type { Assessment, Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge, EmptyState, Field, List, ListItem, LoadingState, PageHeader, Select } from '@/components/ui/page';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function AssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    assessmentType: 'midterm',
    totalMarks: '100',
    weightPercentage: '0',
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
      
      if (selectedCourse) {
        const assessmentsRes = await api.get<Assessment[]>(`/assessments/course/${selectedCourse}`);
        setAssessments(assessmentsRes.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = async (courseId: string) => {
    if (!courseId) {
      setAssessments([]);
      setSelectedCourse(null);
      return;
    }
    setSelectedCourse(parseInt(courseId));
    try {
      const assessmentsRes = await api.get<Assessment[]>(`/assessments/course/${courseId}`);
      setAssessments(assessmentsRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/assessments', {
        courseId: parseInt(formData.courseId),
        title: formData.title,
        description: formData.description,
        assessmentType: formData.assessmentType,
        totalMarks: parseFloat(formData.totalMarks),
        weightPercentage: parseFloat(formData.weightPercentage),
        dueDate: formData.dueDate || null,
      });
      alert('Assessment created successfully');
      setFormData({
        courseId: '',
        title: '',
        description: '',
        assessmentType: 'midterm',
        totalMarks: '100',
        weightPercentage: '0',
        dueDate: '',
      });
      setShowForm(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to create assessment');
    }
  };

  const handleDelete = async (assessmentId: number) => {
    if (!confirm('Delete this assessment?')) return;
    try {
      await api.delete(`/assessments/${assessmentId}`);
      alert('Assessment deleted successfully');
      loadData();
    } catch (error) {
      console.error(error);
      alert('Failed to delete assessment');
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Assessments"
        description="Midterms, finals, projects and presentations across all courses."
        actions={
          <Button variant={showForm ? 'outline' : 'default'} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : (
              <>
                <Plus className="h-4 w-4" />
                Create assessment
              </>
            )}
          </Button>
        }
      />

      {showForm && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="text-[17px]">New assessment</CardTitle>
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
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Type" htmlFor="assessmentType">
                  <Select
                    id="assessmentType"
                    value={formData.assessmentType}
                    onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value })}
                    required
                  >
                    <option value="midterm">Midterm</option>
                    <option value="final">Final exam</option>
                    <option value="project">Project</option>
                    <option value="presentation">Presentation</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
                <Field label="Weight (%)" htmlFor="weightPercentage">
                  <Input
                    id="weightPercentage"
                    type="number"
                    step="0.01"
                    value={formData.weightPercentage}
                    onChange={(e) => setFormData({ ...formData, weightPercentage: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Total marks" htmlFor="totalMarks">
                  <Input
                    id="totalMarks"
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                    required
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
                <Button type="submit">Create assessment</Button>
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

      {assessments.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title={selectedCourse ? 'No assessments for this course' : 'Select a course'}
          description={selectedCourse ? 'Create an assessment to get started.' : 'Choose a course to view its assessments, or create a new one.'}
        />
      ) : (
        <List>
          {assessments.map((assessment) => (
            <ListItem key={assessment.assessment_id} className="flex-col items-stretch gap-3 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-[15px] font-medium text-foreground">{assessment.title}</p>
                  <Badge className="capitalize">{assessment.assessment_type}</Badge>
                </div>
                {assessment.description && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{assessment.description}</p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="tabular-nums">{assessment.total_marks} marks</span>
                  <span className="tabular-nums">{assessment.weight_percentage}% weight</span>
                  {assessment.due_date && (
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Due {new Date(assessment.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/assessments/${assessment.assessment_id}`)}
                >
                  Manage
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/assessments/${assessment.assessment_id}`)}
                >
                  Submissions
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-red-50"
                  onClick={() => handleDelete(assessment.assessment_id)}
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
