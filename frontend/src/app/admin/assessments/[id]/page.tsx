'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowUpRight, Inbox, Paperclip } from 'lucide-react';
import api from '@/lib/api';
import type { Assessment } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, Avatar, Badge, EmptyState, Field, List, ListItem, LoadingState, PageHeader } from '@/components/ui/page';
import { PlagiarismReportDisplay } from '@/components/PlagiarismReport';
import { useAuthGuard } from '@/hooks/useAuthGuard';

interface Submission {
  submission_id: number;
  assessment_id: number;
  student_id: number;
  student_name?: string;
  submission_text?: string;
  file_urls?: string[];
  score?: number | null;
  feedback?: string;
  submitted_at: string;
  graded_at?: string;
  graded_by?: number;
  plagiarism_score?: number | null;
  plagiarism_checked?: boolean;
  plagiarism_report?: string;
}

export default function AssessmentSubmissionsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    score: '',
    feedback: '',
  });

  useAuthGuard();

  useEffect(() => {
    if (params.id) {
      loadData();
    }
  }, [params.id]);

  const loadData = async () => {
    try {
      const [assessmentRes, submissionsRes] = await Promise.all([
        api.get<Assessment>(`/assessments/${params.id}`),
        api.get<Submission[]>(`/assessments/${params.id}/submissions`),
      ]);

      setAssessment(assessmentRes.data);
      setSubmissions(submissionsRes.data);
      if (submissionsRes.data.length > 0) {
        setSelectedSubmission(submissionsRes.data[0]);
        setGradeForm({
          score: submissionsRes.data[0].score?.toString() || '',
          feedback: submissionsRes.data[0].feedback || '',
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeForm({
      score: submission.score?.toString() || '',
      feedback: submission.feedback || '',
    });
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setGrading(true);
    try {
      const score = gradeForm.score ? parseFloat(gradeForm.score) : null;
      const response = await api.put(`/assessments/submissions/${selectedSubmission.submission_id}/grade`, {
        score,
        feedback: gradeForm.feedback,
      });

      setSelectedSubmission(response.data);
      setSubmissions(
        submissions.map((s) => (s.submission_id === selectedSubmission.submission_id ? response.data : s))
      );
      alert('Assessment graded successfully');
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to grade assessment');
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!assessment) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Admin" title="Assessment" back />
        <Alert tone="error">Assessment not found</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title={assessment.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <Badge className="capitalize">{assessment.assessment_type}</Badge>
            <span className="tabular-nums">{assessment.total_marks} marks</span>
          </span>
        }
        back
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="space-y-3 lg:sticky lg:top-4">
            <p className="text-sm font-medium text-foreground">
              Submissions <span className="tabular-nums text-muted-foreground">{submissions.length}</span>
            </p>
            {submissions.length === 0 ? (
              <EmptyState icon={Inbox} title="No submissions yet" />
            ) : (
              <List className="max-h-[28rem] overflow-y-auto">
                {submissions.map((submission) => (
                  <ListItem
                    key={submission.submission_id}
                    active={selectedSubmission?.submission_id === submission.submission_id}
                    onClick={() => handleSelectSubmission(submission)}
                  >
                    <Avatar name={submission.student_name || 'Unknown Student'} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {submission.student_name || 'Unknown Student'}
                      </p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    {submission.score !== null && submission.score !== undefined && (
                      <Badge tone={submission.score >= 50 ? 'success' : 'danger'} className="tabular-nums">
                        {submission.score}/{assessment.total_marks}
                      </Badge>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {selectedSubmission ? (
            <>
              {assessment.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[17px]">About this assessment</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{assessment.description}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-[17px]">Submission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-0">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Student</p>
                      <p className="mt-1 text-sm text-foreground">{selectedSubmission.student_name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Submitted</p>
                      <p className="mt-1 text-sm tabular-nums text-foreground">{new Date(selectedSubmission.submitted_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {selectedSubmission.submission_text && (
                    <div>
                      <p className="text-xs text-muted-foreground">Response</p>
                      <div className="mt-2 max-h-64 overflow-y-auto rounded-xl bg-secondary/60 p-4">
                        <p className="whitespace-pre-wrap text-sm text-foreground">{selectedSubmission.submission_text}</p>
                      </div>
                    </div>
                  )}

                  {selectedSubmission.file_urls && selectedSubmission.file_urls.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Files</p>
                      <div className="mt-2 space-y-2">
                        {selectedSubmission.file_urls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-xl bg-secondary/60 px-4 py-3 transition-colors hover:bg-secondary"
                          >
                            <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                            <span className="min-w-0 truncate text-sm text-foreground">{url.split('/').pop() || `File ${idx + 1}`}</span>
                            <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSubmission.plagiarism_checked && (
                    <div>
                      <PlagiarismReportDisplay
                        plagiarismScore={selectedSubmission.plagiarism_score || 0}
                        plagiarismReport={selectedSubmission.plagiarism_report}
                        plagiarismChecked={selectedSubmission.plagiarism_checked}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[17px]">Grade</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <form onSubmit={handleGradeSubmit} className="space-y-5">
                    <Field label="Score" htmlFor="score" hint={`Out of ${assessment.total_marks}`}>
                      <Input
                        id="score"
                        type="number"
                        min="0"
                        max={assessment.total_marks}
                        step="0.5"
                        value={gradeForm.score}
                        onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                        className="max-w-[12rem]"
                        placeholder="Enter score"
                      />
                    </Field>

                    <Field label="Feedback" htmlFor="feedback" hint="Optional">
                      <Textarea
                        id="feedback"
                        value={gradeForm.feedback}
                        onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                        className="min-h-[120px]"
                        placeholder="Enter feedback for the student"
                      />
                    </Field>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={grading}>
                        {grading ? 'Saving…' : 'Save grade'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          ) : (
            <EmptyState icon={Inbox} title="Select a submission" description="Choose a submission to view and grade it." />
          )}
        </div>
      </div>
    </div>
  );
}
