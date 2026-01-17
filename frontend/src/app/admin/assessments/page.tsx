'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Assessment, Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">Assessments</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create Assessment'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Create New Assessment</CardTitle>
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
                  <Label htmlFor="assessmentType">Assessment Type</Label>
                  <select
                    id="assessmentType"
                    value={formData.assessmentType}
                    onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white"
                    required
                  >
                    <option value="midterm">Midterm</option>
                    <option value="final">Final Exam</option>
                    <option value="project">Project</option>
                    <option value="presentation">Presentation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="weightPercentage">Weight Percentage (%)</Label>
                  <Input
                    id="weightPercentage"
                    type="number"
                    step="0.01"
                    value={formData.weightPercentage}
                    onChange={(e) => setFormData({ ...formData, weightPercentage: e.target.value })}
                    required
                  />
                </div>
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
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit">Create Assessment</Button>
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

      {assessments.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4 md:p-6 lg:p-8 text-center text-muted-foreground">
            {selectedCourse ? 'No assessments found for this course.' : 'Select a course to view assessments or create a new one.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 md:gap-3 lg:gap-4">
          {assessments.map((assessment) => (
            <Card key={assessment.assessment_id} className="border-white/10 bg-white/5">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="text-white">{assessment.title}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/assessments/${assessment.assessment_id}`)}
                  >
                    Manage
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">{assessment.description}</p>
                <div className="flex gap-2 md:gap-3 lg:gap-4 text-sm text-muted-foreground">
                  <span>Type: {assessment.assessment_type}</span>
                  <span>Marks: {assessment.total_marks}</span>
                  <span>Weight: {assessment.weight_percentage}%</span>
                  {assessment.due_date && (
                    <span>Due: {new Date(assessment.due_date).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/assessments/${assessment.assessment_id}`)}
                  >
                    View Submissions
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(assessment.assessment_id)}
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

