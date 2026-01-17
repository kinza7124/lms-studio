'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Quiz, QuizQuestion, QuizSubmission } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  if (!quiz) {
    return <div className="p-4 md:p-6 lg:p-8 text-white">Quiz not found</div>;
  }

  const isSubmitted = submission !== null;
  const isPastDue = quiz.due_date ? new Date(quiz.due_date) < new Date() : false;

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">{quiz.title}</h1>
          <p className="mt-2 text-muted-foreground">{quiz.description}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-2 md:gap-3 lg:gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Marks:</span>
              <span className="ml-2 text-white font-semibold">{quiz.total_marks}</span>
            </div>
            {quiz.time_limit && (
              <div>
                <span className="text-muted-foreground">Time Limit:</span>
                <span className="ml-2 text-white font-semibold">{quiz.time_limit} minutes</span>
              </div>
            )}
            {quiz.due_date && (
              <div>
                <span className="text-muted-foreground">Due Date:</span>
                <span className={`ml-2 font-semibold ${isPastDue ? 'text-red-400' : 'text-white'}`}>
                  {new Date(quiz.due_date).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isSubmitted && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-green-400 font-semibold">✓ Submitted</span>
              <span className="text-muted-foreground">
                on {new Date(submission.submitted_at).toLocaleString()}
              </span>
            </div>
            {submission.score !== null && submission.score !== undefined && (
              <div className="mb-4">
                <span className="text-muted-foreground">Score: </span>
                <span className="text-white font-semibold text-lg">
                  {submission.score} / {submission.max_score || quiz.total_marks}
                </span>
              </div>
            )}
            {submission.feedback && (
              <div className="mb-4">
                <span className="text-muted-foreground">Feedback: </span>
                <p className="text-white mt-1">{submission.feedback}</p>
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
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 lg:space-y-6">
          {quiz.questions && quiz.questions.length > 0 ? (
            <div className="space-y-3 md:space-y-4 lg:space-y-6">
              {quiz.questions.map((question, index) => (
                <Card key={question.question_id} className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">
                      Question {index + 1} ({question.marks} marks)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-white">{question.question_text}</p>

                    {question.question_type === 'multiple_choice' && question.options && (
                      <div className="space-y-2">
                        {Object.entries(question.options).map(([key, value]) => (
                          <label key={key} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`question_${question.question_id}`}
                              value={key}
                              checked={answers[question.question_id] === key}
                              onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                              className="w-4 h-4"
                            />
                            <span className="text-white">{key}: {value}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.question_type === 'true_false' && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`question_${question.question_id}`}
                            value="true"
                            checked={answers[question.question_id] === 'true'}
                            onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-white">True</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`question_${question.question_id}`}
                            value="false"
                            checked={answers[question.question_id] === 'false'}
                            onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-white">False</span>
                        </label>
                      </div>
                    )}

                    {(question.question_type === 'short_answer' || question.question_type === 'essay') && (
                      <Textarea
                        value={answers[question.question_id] || ''}
                        onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                        placeholder="Enter your answer..."
                        rows={question.question_type === 'essay' ? 6 : 3}
                        className="bg-background text-white"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4 md:p-6 lg:p-8 text-center text-muted-foreground">
                No questions added to this quiz yet.
              </CardContent>
            </Card>
          )}

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Additional Files (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="file"
                multiple
                onChange={handleFileChange}
                className="text-white"
              />
              {files.length > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {files.length} file(s) selected
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2 md:gap-3 lg:gap-4">
            <Button type="submit" disabled={submitting || isPastDue}>
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
            {isPastDue && (
              <span className="text-red-400 text-sm self-center">
                This quiz is past due date
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

