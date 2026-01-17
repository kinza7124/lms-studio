'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Assessment, AssessmentSubmission } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  if (!assessment) {
    return <div className="p-4 md:p-6 lg:p-8 text-white">Assessment not found</div>;
  }

  const isSubmitted = submission !== null;
  const isPastDue = assessment.due_date ? new Date(assessment.due_date) < new Date() : false;

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">{assessment.title}</h1>
          <p className="mt-2 text-muted-foreground">{assessment.description}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-2 md:gap-3 lg:gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <span className="ml-2 text-white font-semibold capitalize">{assessment.assessment_type}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Marks:</span>
              <span className="ml-2 text-white font-semibold">{assessment.total_marks}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Weight:</span>
              <span className="ml-2 text-white font-semibold">{assessment.weight_percentage}%</span>
            </div>
            {assessment.due_date && (
              <div>
                <span className="text-muted-foreground">Due Date:</span>
                <span className={`ml-2 font-semibold ${isPastDue ? 'text-red-400' : 'text-white'}`}>
                  {new Date(assessment.due_date).toLocaleString()}
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
                  {submission.score} / {submission.max_score || assessment.total_marks}
                </span>
              </div>
            )}
            {submission.feedback && (
              <div className="mb-4">
                <span className="text-muted-foreground">Feedback: </span>
                <p className="text-white mt-1">{submission.feedback}</p>
              </div>
            )}
            {submission.submission_text && (
              <div className="mb-4">
                <Label className="text-muted-foreground">Your Submission:</Label>
                <p className="text-white mt-1 whitespace-pre-wrap">{submission.submission_text}</p>
              </div>
            )}
            {submission.file_urls && submission.file_urls.length > 0 && (
              <div className="mb-4">
                <Label className="text-muted-foreground">Uploaded Files:</Label>
                <div className="mt-2 space-y-1">
                  {submission.file_urls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-purple-400 hover:text-purple-300"
                    >
                      File {index + 1} →
                    </a>
                  ))}
                </div>
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
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Text Submission</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Enter your submission text here..."
                rows={10}
                className="bg-background text-white"
              />
              <p className="text-xs text-muted-foreground mt-2">
                You can provide a text submission, file uploads, or both.
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">File Uploads</CardTitle>
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
              <p className="text-xs text-muted-foreground mt-2">
                You can upload multiple files (PDFs, documents, images, etc.)
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-2 md:gap-3 lg:gap-4">
            <Button type="submit" disabled={submitting || isPastDue}>
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </Button>
            {isPastDue && (
              <span className="text-red-400 text-sm self-center">
                This assessment is past due date
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

