'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Quiz, QuizQuestion, QuizSubmission } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge, EmptyState, Field, LoadingState, PageHeader } from '@/components/ui/page';
import { CheckCircle, FileQuestion } from 'lucide-react';
import { PlagiarismReportDisplay } from '@/components/PlagiarismReport';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function QuizSubmissionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz & { questions?: QuizQuestion[] } | null>(null);
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  useAuthGuard();

  useEffect(() => {
    if (params.id) {
      loadData();
    }
  }, [params.id]);

  const loadData = async () => {
    try {
      const [quizRes, submissionRes] = await Promise.all([
        api.get<Quiz & { questions?: QuizQuestion[] }>(`/quizzes/${params.id}`),
        api.get<QuizSubmission | null>(`/quizzes/${params.id}/my-submission`).catch(() => null),
      ]);
      setQuiz(quizRes.data);
      if (submissionRes?.data) {
        setSubmission(submissionRes.data);
        if (submissionRes.data.answers) {
          try {
            const parsedAnswers = typeof submissionRes.data.answers === 'string' 
              ? JSON.parse(submissionRes.data.answers) 
              : submissionRes.data.answers;
            setAnswers(parsedAnswers);
          } catch (e) {
            console.error('Failed to parse answers:', e);
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('quizId', params.id);
      formData.append('answers', JSON.stringify(answers));
      files.forEach((file) => {
        formData.append('files', file);
      });

      const result = await api.post<QuizSubmission>(`/quizzes/${params.id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmission(result.data);
      alert('Quiz submitted successfully!');
      router.push(`/course/${quiz.course_id}`);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!quiz) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState icon={FileQuestion} title="Quiz not found" />
      </div>
    );
  }

  const isSubmitted = submission !== null;
  const isPastDue = quiz.due_date ? new Date(quiz.due_date) < new Date() : false;

  const radioClass = 'h-4 w-4 accent-primary';
  const optionClass =
    'flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 px-4 py-3 text-[15px] text-foreground transition-colors hover:bg-secondary/60 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/[0.04]';

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        back
        eyebrow="Quiz"
        title={quiz.title}
        description={quiz.description}
        actions={
          isSubmitted ? (
            <Badge tone="success">Submitted</Badge>
          ) : isPastDue ? (
            <Badge tone="danger">Past due</Badge>
          ) : undefined
        }
        className="mb-0 md:mb-0"
      />

      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-secondary/60 p-4">
          <dt className="text-xs text-muted-foreground">Total marks</dt>
          <dd className="mt-1 text-sm font-medium tabular-nums text-foreground">{quiz.total_marks}</dd>
        </div>
        {quiz.time_limit && (
          <div className="rounded-xl bg-secondary/60 p-4">
            <dt className="text-xs text-muted-foreground">Time limit</dt>
            <dd className="mt-1 text-sm font-medium tabular-nums text-foreground">{quiz.time_limit} minutes</dd>
          </div>
        )}
        {quiz.due_date && (
          <div className="rounded-xl bg-secondary/60 p-4">
            <dt className="text-xs text-muted-foreground">Due date</dt>
            <dd className={`mt-1 text-sm font-medium tabular-nums ${isPastDue ? 'text-red-600' : 'text-foreground'}`}>
              {new Date(quiz.due_date).toLocaleString()}
            </dd>
          </div>
        )}
      </dl>

      {isSubmitted && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="success">
                <CheckCircle className="h-3.5 w-3.5" />
                Submitted
              </Badge>
              <span className="text-sm text-muted-foreground">
                on {new Date(submission.submitted_at).toLocaleString()}
              </span>
            </div>
            {submission.score !== null && submission.score !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
                  {submission.score}
                  <span className="text-lg font-normal text-muted-foreground"> / {submission.max_score || quiz.total_marks}</span>
                </p>
              </div>
            )}
            {submission.feedback && (
              <div className="rounded-xl bg-secondary/60 p-4">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Feedback</p>
                <p className="text-sm text-foreground">{submission.feedback}</p>
              </div>
            )}
            {submission.plagiarism_checked && (
              <PlagiarismReportDisplay
                plagiarismScore={submission.plagiarism_score}
                plagiarismReport={submission.plagiarism_report}
                plagiarismChecked={submission.plagiarism_checked}
              />
            )}
          </CardContent>
        </Card>
      )}

      {!isSubmitted && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {quiz.questions && quiz.questions.length > 0 ? (
            <div className="space-y-4">
              {quiz.questions.map((question, index) => (
                <Card key={question.question_id}>
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-muted-foreground">Question {index + 1}</p>
                      <Badge className="tabular-nums">{question.marks} marks</Badge>
                    </div>
                    <p className="text-[15px] font-medium leading-relaxed text-foreground">{question.question_text}</p>

                    {question.question_type === 'multiple_choice' && question.options && (
                      <div className="space-y-2">
                        {Object.entries(question.options).map(([key, value]) => (
                          <label key={key} className={optionClass}>
                            <input
                              type="radio"
                              name={`question_${question.question_id}`}
                              value={key}
                              checked={answers[question.question_id] === key}
                              onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                              className={radioClass}
                            />
                            <span>{key}: {value}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.question_type === 'true_false' && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className={optionClass}>
                          <input
                            type="radio"
                            name={`question_${question.question_id}`}
                            value="true"
                            checked={answers[question.question_id] === 'true'}
                            onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                            className={radioClass}
                          />
                          <span>True</span>
                        </label>
                        <label className={optionClass}>
                          <input
                            type="radio"
                            name={`question_${question.question_id}`}
                            value="false"
                            checked={answers[question.question_id] === 'false'}
                            onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                            className={radioClass}
                          />
                          <span>False</span>
                        </label>
                      </div>
                    )}

                    {(question.question_type === 'short_answer' || question.question_type === 'essay') && (
                      <Textarea
                        value={answers[question.question_id] || ''}
                        onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                        placeholder="Enter your answer…"
                        rows={question.question_type === 'essay' ? 6 : 3}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon={FileQuestion} title="No questions added to this quiz yet" />
          )}

          <Card>
            <CardContent className="p-6">
              <Field
                label="Additional files (optional)"
                hint={files.length > 0 ? `${files.length} file(s) selected` : undefined}
              >
                <Input type="file" multiple onChange={handleFileChange} />
              </Field>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {isPastDue && <span className="text-sm text-red-600">This quiz is past due date</span>}
            <Button type="submit" disabled={submitting || isPastDue}>
              {submitting ? 'Submitting…' : 'Submit quiz'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
