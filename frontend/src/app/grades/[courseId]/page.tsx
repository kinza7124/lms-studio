'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { ArrowLeft, FileText, ClipboardList, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AssignmentGrade = {
  assignment_id: number;
  title: string;
  description?: string;
  due_date?: string;
  total_marks?: number;
  submission_id?: number;
  marks_obtained?: number;
  grade?: string;
  feedback?: string;
  submitted_at?: string;
};

type QuizGrade = {
  quiz_id: number;
  title: string;
  description?: string;
  due_date?: string;
  total_marks?: number;
  submission_id?: number;
  marks_obtained?: number;
  score?: number;
  feedback?: string;
  submitted_at?: string;
};

type AssessmentGrade = {
  assessment_id: number;
  title: string;
  description?: string;
  due_date?: string;
  total_marks?: number;
  assessment_type?: string;
  weight_percentage?: number;
  submission_id?: number;
  marks_obtained?: number;
  grade?: string;
  feedback?: string;
  submitted_at?: string;
};

type CourseGrades = {
  course: {
    course_id: number;
    code: string;
    title: string;
    description?: string;
  };
  assignments: AssignmentGrade[];
  quizzes: QuizGrade[];
  assessments: AssessmentGrade[];
};

export default function CourseGradesPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const [grades, setGrades] = useState<CourseGrades | null>(null);
  const [loading, setLoading] = useState(true);
  useAuthGuard();

  useEffect(() => {
    if (params.courseId) {
      loadGrades();
    }
  }, [params.courseId]);

  const loadGrades = async () => {
    try {
      const { data } = await api.get<CourseGrades>(`/students/courses/${params.courseId}/grades`);
      setGrades(data);
    } catch (error: any) {
      console.error('Error loading grades:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      alert(`Failed to load grades: ${error.response?.data?.error || error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade?: string) => {
    if (!grade) return 'text-muted-foreground';
    if (grade === 'A') return 'text-green-400';
    if (grade === 'B') return 'text-blue-400';
    if (grade === 'C') return 'text-yellow-400';
    if (grade === 'D') return 'text-orange-400';
    if (grade === 'F') return 'text-red-400';
    return 'text-muted-foreground';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  if (!grades) {
    return (
      <div className="p-4 md:p-6 lg:p-8 text-white">
        <p>Failed to load grades. Please try again.</p>
        <Button onClick={() => router.push('/grades')} className="mt-4">
          Back to Grades
        </Button>
      </div>
    );
  }

  const { course, assignments, quizzes, assessments } = grades;

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/grades')}
          className="text-white hover:text-white/80"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Grades
        </Button>
      </div>

      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">{course.code} - {course.title}</h1>
        <p className="text-muted-foreground mt-2">{course.description}</p>
      </div>

      {/* Assignments Section */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white">Assignments</CardTitle>
          </div>
          <CardDescription>
            {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No assignments found</p>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.assignment_id}
                  className="rounded-lg border border-white/10 p-4 bg-white/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{assignment.title}</h3>
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                      )}
                      <div className="flex items-center gap-2 md:gap-3 lg:gap-4 mt-2 text-xs text-muted-foreground">
                        {assignment.due_date && (
                          <span>Due: {formatDate(assignment.due_date)}</span>
                        )}
                        {assignment.total_marks && (
                          <span>Total: {assignment.total_marks} marks</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      {assignment.submission_id ? (
                        <>
                          {assignment.marks_obtained !== null && assignment.marks_obtained !== undefined ? (
                            <>
                              <p className="text-lg font-bold text-white">
                                {assignment.marks_obtained}
                                {assignment.total_marks && ` / ${assignment.total_marks}`}
                              </p>
                              {assignment.grade && (
                                <p className={`text-sm font-semibold ${getGradeColor(assignment.grade)}`}>
                                  {assignment.grade}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-yellow-400">Graded - No marks yet</p>
                          )}
                          {assignment.feedback && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                              {assignment.feedback}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not submitted</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quizzes Section */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-white">Quizzes</CardTitle>
          </div>
          <CardDescription>
            {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quizzes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No quizzes found</p>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.quiz_id}
                  className="rounded-lg border border-white/10 p-4 bg-white/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{quiz.title}</h3>
                      {quiz.description && (
                        <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
                      )}
                      <div className="flex items-center gap-2 md:gap-3 lg:gap-4 mt-2 text-xs text-muted-foreground">
                        {quiz.due_date && (
                          <span>Due: {formatDate(quiz.due_date)}</span>
                        )}
                        {quiz.total_marks && (
                          <span>Total: {quiz.total_marks} marks</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      {quiz.submission_id ? (
                        <>
                          {quiz.marks_obtained !== null && quiz.marks_obtained !== undefined ? (
                            <p className="text-lg font-bold text-white">
                              {quiz.marks_obtained}
                              {quiz.total_marks && ` / ${quiz.total_marks}`}
                            </p>
                          ) : quiz.score !== null && quiz.score !== undefined ? (
                            <p className="text-lg font-bold text-white">
                              {quiz.score}%
                            </p>
                          ) : (
                            <p className="text-sm text-yellow-400">Graded - No marks yet</p>
                          )}
                          {quiz.feedback && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                              {quiz.feedback}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not submitted</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessments Section */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-400" />
            <CardTitle className="text-white">Assessments</CardTitle>
          </div>
          <CardDescription>
            {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No assessments found</p>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <div
                  key={assessment.assessment_id}
                  className="rounded-lg border border-white/10 p-4 bg-white/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">{assessment.title}</h3>
                        {assessment.assessment_type && (
                          <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300">
                            {assessment.assessment_type}
                          </span>
                        )}
                        {assessment.weight_percentage && (
                          <span className="text-xs text-muted-foreground">
                            ({assessment.weight_percentage}% weight)
                          </span>
                        )}
                      </div>
                      {assessment.description && (
                        <p className="text-sm text-muted-foreground mt-1">{assessment.description}</p>
                      )}
                      <div className="flex items-center gap-2 md:gap-3 lg:gap-4 mt-2 text-xs text-muted-foreground">
                        {assessment.due_date && (
                          <span>Due: {formatDate(assessment.due_date)}</span>
                        )}
                        {assessment.total_marks && (
                          <span>Total: {assessment.total_marks} marks</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      {assessment.submission_id ? (
                        <>
                          {assessment.marks_obtained !== null && assessment.marks_obtained !== undefined ? (
                            <>
                              <p className="text-lg font-bold text-white">
                                {assessment.marks_obtained}
                                {assessment.total_marks && ` / ${assessment.total_marks}`}
                              </p>
                              {assessment.grade && (
                                <p className={`text-sm font-semibold ${getGradeColor(assessment.grade)}`}>
                                  {assessment.grade}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-yellow-400">Graded - No marks yet</p>
                          )}
                          {assessment.feedback && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                              {assessment.feedback}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not submitted</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

