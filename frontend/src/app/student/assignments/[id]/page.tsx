'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Assignment, Submission } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, Badge, Field, List, ListItem, LoadingState, PageHeader } from '@/components/ui/page';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';

// Helper function to convert relative URLs to absolute URLs
const buildAssetUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const origin = apiBase.endsWith('/api') ? apiBase.replace(/\/api$/, '') : apiBase;
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
};

export default function StudentAssignmentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [submissionText, setSubmissionText] = useState('');
  const [existingFileUrls, setExistingFileUrls] = useState<string[]>([]);
  useAuthGuard();

  useEffect(() => {
    if (params.id) {
      loadData();
    }
  }, [params.id]);

  const loadData = async () => {
    try {
      const [assignmentRes, submissionRes] = await Promise.all([
        api.get<Assignment>(`/assignments/${params.id}`).catch(() => null),
        api.get<Submission>(`/submissions/assignment/${params.id}/my-submission`).catch(() => null),
      ]);

      if (assignmentRes && assignmentRes.data) {
        setAssignment(assignmentRes.data);
      } else {
        // If assignment not found, try to get it from submission
        if (submissionRes && submissionRes.data) {
          // We can't get assignment from submission alone, so show error
          setLoading(false);
          return;
        }
      }

      if (submissionRes && submissionRes.data) {
        setSubmission(submissionRes.data);
        setSubmissionText(submissionRes.data.submission_text || '');
        setExistingFileUrls(submissionRes.data.file_urls || []);
      }
    } catch (error) {
      console.error('Failed to load assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0 && !submissionText.trim() && existingFileUrls.length === 0) {
      alert('Please provide either text submission or upload at least one file');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('assignmentId', params.id);
      formData.append('submissionText', submissionText || '');
      
      // Only append existingFileUrls if there are any
      if (existingFileUrls.length > 0) {
        formData.append('existingFileUrls', JSON.stringify(existingFileUrls));
      }

      // Append all files
      files.forEach((file) => {
        formData.append('files', file);
      });

      // Don't set Content-Type header - let browser set it with boundary for FormData
      await api.post('/submissions', formData);

      alert('Assignment turned in successfully!');
      // Reload data to show updated submission status
      await loadData();
      setFiles([]); // Clear selected files
    } catch (error: any) {
      console.error('Failed to submit assignment:', error);
      alert(error.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const removeExistingFile = (index: number) => {
    setExistingFileUrls(existingFileUrls.filter((_, i) => i !== index));
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!assignment) {
    return (
      <div className="mx-auto max-w-3xl">
        <Alert tone="error">Assignment not found or you don&apos;t have access to it.</Alert>
      </div>
    );
  }

  const isPastDue = assignment.due_date && new Date(assignment.due_date) < new Date();
  const hasSubmission = submission !== null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        back="Back to course"
        eyebrow="Assignment"
        title={assignment.title}
        description={assignment.description}
        actions={
          hasSubmission ? (
            <Badge tone="success">
              <CheckCircle className="h-3.5 w-3.5" />
              Turned in
            </Badge>
          ) : isPastDue ? (
            <Badge tone="danger">Past due</Badge>
          ) : undefined
        }
        className="mb-0 md:mb-0"
      />

      <Card>
        <CardContent className="space-y-6 p-6">
          <h2 className="text-[17px] font-semibold tracking-tight text-foreground">Instructions</h2>

          {(assignment.due_date || assignment.total_marks || (hasSubmission && submission?.submitted_at)) && (
            <dl className="grid gap-4 sm:grid-cols-3">
              {assignment.due_date && (
                <div className="rounded-xl bg-secondary/60 p-4">
                  <dt className="text-xs text-muted-foreground">Due</dt>
                  <dd className={`mt-1 text-sm font-medium tabular-nums ${isPastDue ? 'text-red-600' : 'text-foreground'}`}>
                    {new Date(assignment.due_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {isPastDue && !hasSubmission && (
                      <span className="ml-2 text-xs text-red-600">(Past due)</span>
                    )}
                  </dd>
                </div>
              )}
              {assignment.total_marks && (
                <div className="rounded-xl bg-secondary/60 p-4">
                  <dt className="text-xs text-muted-foreground">Points</dt>
                  <dd className="mt-1 text-sm font-medium tabular-nums text-foreground">{assignment.total_marks}</dd>
                </div>
              )}
              {hasSubmission && submission?.submitted_at && (
                <div className="rounded-xl bg-secondary/60 p-4">
                  <dt className="text-xs text-muted-foreground">Submitted</dt>
                  <dd className="mt-1 text-sm font-medium tabular-nums text-foreground">
                    {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </dd>
                </div>
              )}
            </dl>
          )}

          {assignment.pdf_url && (
            <Button variant="outline" asChild>
              <a href={buildAssetUrl(assignment.pdf_url)} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" />
                View assignment PDF
              </a>
            </Button>
          )}

          {hasSubmission && submission?.grade && (
            <div className="space-y-3 border-t border-border/70 pt-6">
              <p className="text-xs text-muted-foreground">Your grade</p>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">{submission.grade}</p>
                {submission.marks_obtained !== undefined && submission.marks_obtained !== null && (
                  <p className="text-[15px] tabular-nums text-muted-foreground">
                    {submission.marks_obtained}/{assignment.total_marks || 100}
                  </p>
                )}
              </div>
              {submission.feedback && (
                <div className="rounded-xl bg-secondary/60 p-4">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Teacher feedback</p>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{submission.feedback}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 p-6">
            <div>
              <h2 className="text-[17px] font-semibold tracking-tight text-foreground">Your work</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasSubmission ? 'Update your submission below.' : 'Add your work below and select Turn in.'}
              </p>
            </div>

            <Field label="Text" htmlFor="submissionText" hint="You can submit text, PDF files, or both.">
              <Textarea
                id="submissionText"
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Enter your assignment text here…"
                rows={12}
              />
            </Field>

            <Field label="Files">
              <Input
                id="files"
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="files"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-8 text-center transition-colors hover:border-primary/40 hover:bg-secondary/40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <Upload className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-medium text-foreground">
                  {files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload PDF files'}
                </span>
                <span className="text-xs text-muted-foreground">PDF files only · Multiple files allowed</span>
              </label>
            </Field>

            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-foreground">Selected files</p>
                <List>
                  {files.map((file, index) => (
                    <ListItem key={index} className="py-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{file.name}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-destructive hover:bg-red-50"
                        aria-label="Remove file"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </div>
            )}

            {existingFileUrls.length > 0 && (
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-foreground">Current submission files</p>
                <List>
                  {existingFileUrls.map((url, index) => (
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExistingFile(index)}
                        className="text-destructive hover:bg-red-50"
                        aria-label="Remove file"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <div className="flex flex-col gap-3 sm:flex-row">
                {hasSubmission && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async (e) => {
                      e.preventDefault();
                      // Save draft functionality (same as submit but without turning in)
                      if (files.length === 0 && !submissionText.trim() && existingFileUrls.length === 0) {
                        alert('Please add some content before saving');
                        return;
                      }
                      try {
                        setSubmitting(true);
                        const formData = new FormData();
                        formData.append('assignmentId', params.id);
                        formData.append('submissionText', submissionText);
                        if (existingFileUrls.length > 0) {
                          formData.append('existingFileUrls', JSON.stringify(existingFileUrls));
                        }
                        files.forEach((file) => {
                          formData.append('files', file);
                        });
                        await api.post('/submissions', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        alert('Draft saved successfully!');
                        loadData();
                      } catch (error: any) {
                        alert(error.response?.data?.message || 'Failed to save draft');
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    disabled={submitting}
                  >
                    Save draft
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={submitting || (files.length === 0 && !submissionText.trim() && existingFileUrls.length === 0)}
                >
                  <CheckCircle className="h-4 w-4" />
                  {submitting ? 'Turning in…' : hasSubmission ? 'Update and turn in' : 'Turn in'}
                </Button>
              </div>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
