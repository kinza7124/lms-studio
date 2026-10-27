'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Assessment, AssessmentSubmission } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge, EmptyState, Field, List, ListItem, LoadingState, PageHeader } from '@/components/ui/page';
import { CheckCircle, ClipboardList, FileText } from 'lucide-react';
import { PlagiarismReportDisplay } from '@/components/PlagiarismReport';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function AssessmentSubmissionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [submissionText, setSubmissionText] = useState('');
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
      const [assessmentRes, submissionRes] = await Promise.all([
        api.get<Assessment>(`/assessments/${params.id}`),
        api.get<AssessmentSubmission | null>(`/assessments/${params.id}/my-submission`).catch(() => null),
      ]);
      setAssessment(assessmentRes.data);
      if (submissionRes?.data) {
        setSubmission(submissionRes.data);
        setSubmissionText(submissionRes.data.submission_text || '');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment) return;

    if (!submissionText && files.length === 0) {
      alert('Please provide either text submission or file uploads');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('assessmentId', params.id);
      if (submissionText) {
        formData.append('submissionText', submissionText);
      }
      files.forEach((file) => {
        formData.append('files', file);
      });

      const result = await api.post<AssessmentSubmission>(`/assessments/${params.id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmission(result.data);
      alert('Assessment submitted successfully!');
      router.push(`/course/${assessment.course_id}`);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!assessment) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState icon={ClipboardList} title="Assessment not found" />
      </div>
    );
  }

  const isSubmitted = submission !== null;
  const isPastDue = assessment.due_date ? new Date(assessment.due_date) < new Date() : false;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        back
        eyebrow="Assessment"
        title={assessment.title}
        description={assessment.description}
        actions={
          isSubmitted ? (
            <Badge tone="success">Submitted</Badge>
          ) : isPastDue ? (
            <Badge tone="danger">Past due</Badge>
          ) : undefined
        }
        className="mb-0 md:mb-0"
      />

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl bg-secondary/60 p-4">
          <dt className="text-xs text-muted-foreground">Type</dt>
          <dd className="mt-1 text-sm font-medium capitalize text-foreground">{assessment.assessment_type}</dd>
        </div>
        <div className="rounded-xl bg-secondary/60 p-4">
          <dt className="text-xs text-muted-foreground">Total marks</dt>
          <dd className="mt-1 text-sm font-medium tabular-nums text-foreground">{assessment.total_marks}</dd>
        </div>
        <div className="rounded-xl bg-secondary/60 p-4">
          <dt className="text-xs text-muted-foreground">Weight</dt>
          <dd className="mt-1 text-sm font-medium tabular-nums text-foreground">{assessment.weight_percentage}%</dd>
        </div>
        {assessment.due_date && (
          <div className="rounded-xl bg-secondary/60 p-4">
            <dt className="text-xs text-muted-foreground">Due date</dt>
            <dd className={`mt-1 text-sm font-medium tabular-nums ${isPastDue ? 'text-red-600' : 'text-foreground'}`}>
              {new Date(assessment.due_date).toLocaleString()}
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
                  <span className="text-lg font-normal text-muted-foreground"> / {submission.max_score || assessment.total_marks}</span>
                </p>
              </div>
            )}
            {submission.feedback && (
              <div className="rounded-xl bg-secondary/60 p-4">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Feedback</p>
                <p className="text-sm text-foreground">{submission.feedback}</p>
              </div>
            )}
            {submission.submission_text && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Your submission</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{submission.submission_text}</p>
              </div>
            )}
            {submission.file_urls && submission.file_urls.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Uploaded files</p>
                <List>
                  {submission.file_urls.map((url, index) => (
                    <ListItem key={index} className="py-2.5">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-w-0 flex-1 items-center gap-2 text-sm text-primary hover:underline underline-offset-4"
                      >
                        <FileText className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        File {index + 1}
                      </a>
                    </ListItem>
                  ))}
                </List>
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
          <Card>
            <CardContent className="space-y-5 p-6">
              <Field
                label="Text submission"
                htmlFor="submissionText"
                hint="You can provide a text submission, file uploads, or both."
              >
                <Textarea
                  id="submissionText"
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Enter your submission text here…"
                  rows={10}
                />
              </Field>
              <Field
                label="File uploads"
                htmlFor="files"
                hint={
                  files.length > 0
                    ? `${files.length} file(s) selected`
                    : 'You can upload multiple files (PDFs, documents, images, etc.)'
                }
              >
                <Input id="files" type="file" multiple onChange={handleFileChange} />
              </Field>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {isPastDue && <span className="text-sm text-red-600">This assessment is past due date</span>}
            <Button type="submit" disabled={submitting || isPastDue}>
              {submitting ? 'Submitting…' : 'Submit assessment'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
