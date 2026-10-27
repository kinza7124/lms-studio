'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { FileText, ClipboardList, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, Badge, EmptyState, LoadingState, PageHeader, Section, type BadgeTone } from '@/components/ui/page';

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

  const gradeTone = (grade?: string): BadgeTone => {
    if (!grade) return 'neutral';
    if (grade === 'A') return 'success';
    if (grade === 'B') return 'primary';
    if (grade === 'C' || grade === 'D') return 'warning';
    if (grade === 'F') return 'danger';
    return 'neutral';
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
    return <LoadingState />;
  }

  if (!grades) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Alert tone="error">Failed to load grades. Please try again.</Alert>
        <Button variant="outline" onClick={() => router.push('/grades')}>
          Back to grades
        </Button>
      </div>
    );
  }

  const { course, assignments, quizzes, assessments } = grades;

  const notSubmitted = <Badge>Not submitted</Badge>;
  const noMarks = <Badge tone="warning">Graded · no marks yet</Badge>;

  const ItemCell = ({ title, description, feedback, extra }: { title: string; description?: string; feedback?: string; extra?: React.ReactNode }) => (
    <td className="min-w-[220px]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-foreground">{title}</span>
        {extra}
      </div>
      {description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{description}</p>}
      {feedback && <p className="mt-1 text-xs italic text-muted-foreground">Feedback: {feedback}</p>}
    </td>
  );

  const TableHead = () => (
    <thead>
      <tr>
        <th>Item</th>
        <th>Due</th>
        <th className="text-right">Score</th>
        <th className="text-right">Status</th>
      </tr>
    </thead>
  );

  return (
    <div className="space-y-10">
      <PageHeader
        back="Grades"
        backHref="/grades"
        eyebrow={course.code}
        title={course.title}
        description={course.description}
        className="mb-0 md:mb-0"
      />

      <Section
        title="Assignments"
        description={`${assignments.length} assignment${assignments.length !== 1 ? 's' : ''}`}
      >
        {assignments.length === 0 ? (
          <EmptyState icon={FileText} title="No assignments found" />
        ) : (
          <Card className="overflow-x-auto">
            <table className="data-table">
              <TableHead />
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.assignment_id}>
                    <ItemCell
                      title={assignment.title}
                      description={assignment.description}
                      feedback={assignment.submission_id ? assignment.feedback : undefined}
                    />
                    <td className="whitespace-nowrap tabular-nums text-muted-foreground">
                      {assignment.due_date ? formatDate(assignment.due_date) : '—'}
                    </td>
                    <td className="whitespace-nowrap text-right tabular-nums">
                      {assignment.submission_id && assignment.marks_obtained !== null && assignment.marks_obtained !== undefined ? (
                        <span className="font-medium text-foreground">
                          {assignment.marks_obtained}
                          {assignment.total_marks && <span className="text-muted-foreground">{` / ${assignment.total_marks}`}</span>}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {assignment.total_marks ? `— / ${assignment.total_marks}` : '—'}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-right">
                      {assignment.submission_id ? (
                        assignment.marks_obtained !== null && assignment.marks_obtained !== undefined ? (
                          assignment.grade ? (
                            <Badge tone={gradeTone(assignment.grade)}>{assignment.grade}</Badge>
                          ) : (
                            <Badge tone="success">Graded</Badge>
                          )
                        ) : (
                          noMarks
                        )
                      ) : (
                        notSubmitted
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </Section>

      <Section
        title="Quizzes"
        description={`${quizzes.length} quiz${quizzes.length !== 1 ? 'zes' : ''}`}
      >
        {quizzes.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No quizzes found" />
        ) : (
          <Card className="overflow-x-auto">
            <table className="data-table">
              <TableHead />
              <tbody>
                {quizzes.map((quiz) => (
                  <tr key={quiz.quiz_id}>
                    <ItemCell
                      title={quiz.title}
                      description={quiz.description}
                      feedback={quiz.submission_id ? quiz.feedback : undefined}
                    />
                    <td className="whitespace-nowrap tabular-nums text-muted-foreground">
                      {quiz.due_date ? formatDate(quiz.due_date) : '—'}
                    </td>
                    <td className="whitespace-nowrap text-right tabular-nums">
                      {quiz.submission_id && quiz.marks_obtained !== null && quiz.marks_obtained !== undefined ? (
                        <span className="font-medium text-foreground">
                          {quiz.marks_obtained}
                          {quiz.total_marks && <span className="text-muted-foreground">{` / ${quiz.total_marks}`}</span>}
                        </span>
                      ) : quiz.submission_id && quiz.score !== null && quiz.score !== undefined ? (
                        <span className="font-medium text-foreground">{quiz.score}%</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {quiz.total_marks ? `— / ${quiz.total_marks}` : '—'}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-right">
                      {quiz.submission_id ? (
                        (quiz.marks_obtained !== null && quiz.marks_obtained !== undefined) ||
                        (quiz.score !== null && quiz.score !== undefined) ? (
                          <Badge tone="success">Graded</Badge>
                        ) : (
                          noMarks
                        )
                      ) : (
                        notSubmitted
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </Section>

      <Section
        title="Assessments"
        description={`${assessments.length} assessment${assessments.length !== 1 ? 's' : ''}`}
      >
        {assessments.length === 0 ? (
          <EmptyState icon={BookOpen} title="No assessments found" />
        ) : (
          <Card className="overflow-x-auto">
            <table className="data-table">
              <TableHead />
              <tbody>
                {assessments.map((assessment) => (
                  <tr key={assessment.assessment_id}>
                    <ItemCell
                      title={assessment.title}
                      description={assessment.description}
                      feedback={assessment.submission_id ? assessment.feedback : undefined}
                      extra={
                        <>
                          {assessment.assessment_type && (
                            <Badge className="capitalize">{assessment.assessment_type}</Badge>
                          )}
                          {assessment.weight_percentage && (
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {assessment.weight_percentage}% weight
                            </span>
                          )}
                        </>
                      }
                    />
                    <td className="whitespace-nowrap tabular-nums text-muted-foreground">
                      {assessment.due_date ? formatDate(assessment.due_date) : '—'}
                    </td>
                    <td className="whitespace-nowrap text-right tabular-nums">
                      {assessment.submission_id && assessment.marks_obtained !== null && assessment.marks_obtained !== undefined ? (
                        <span className="font-medium text-foreground">
                          {assessment.marks_obtained}
                          {assessment.total_marks && <span className="text-muted-foreground">{` / ${assessment.total_marks}`}</span>}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {assessment.total_marks ? `— / ${assessment.total_marks}` : '—'}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-right">
                      {assessment.submission_id ? (
                        assessment.marks_obtained !== null && assessment.marks_obtained !== undefined ? (
                          assessment.grade ? (
                            <Badge tone={gradeTone(assessment.grade)}>{assessment.grade}</Badge>
                          ) : (
                            <Badge tone="success">Graded</Badge>
                          )
                        ) : (
                          noMarks
                        )
                      ) : (
                        notSubmitted
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </Section>
    </div>
  );
}
