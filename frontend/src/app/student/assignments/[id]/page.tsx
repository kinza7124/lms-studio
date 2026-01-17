'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Assignment, Submission } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  if (!assignment) {
    return (
      <div className="p-4 md:p-6 lg:p-8 text-red-400">Assignment not found or you don't have access to it.</div>
    );
  }

  const isPastDue = assignment.due_date && new Date(assignment.due_date) < new Date();
  const hasSubmission = submission !== null;

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6 max-w-4xl mx-auto p-6">
      {/* Header with Course Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-white"
            >
              ← Back to Course
            </Button>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">Assignment</span>
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">{assignment.title}</h1>
          {assignment.description && (
            <p className="mt-2 text-muted-foreground">{assignment.description}</p>
          )}
        </div>
      </div>

      {/* Assignment Details - Google Classroom Style */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-white text-xl">Instructions</CardTitle>
            {hasSubmission && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">Turned in</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Assignment Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 lg:gap-4 pb-4 border-b border-white/10">
            {assignment.due_date && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Due</Label>
                <p className={`mt-1 text-sm font-medium ${isPastDue ? 'text-red-400' : 'text-white'}`}>
                  {new Date(assignment.due_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {isPastDue && !hasSubmission && (
                    <span className="ml-2 text-xs text-red-400">(Past due)</span>
                  )}
                </p>
              </div>
            )}
            {assignment.total_marks && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Points</Label>
                <p className="mt-1 text-sm font-medium text-white">{assignment.total_marks}</p>
              </div>
            )}
            {hasSubmission && submission?.submitted_at && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Submitted</Label>
                <p className="mt-1 text-sm font-medium text-green-400">
                  {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Assignment PDF */}
          {assignment.pdf_url && (
            <div className="pt-2">
              <a
                href={buildAssetUrl(assignment.pdf_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                <FileText className="h-5 w-5" />
                <span className="font-medium">View Assignment PDF</span>
              </a>
            </div>
          )}

          {/* Grade Display */}
          {hasSubmission && submission?.grade && (
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Your Grade</Label>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-white">
                      {submission.grade}
                    </p>
                    {submission.marks_obtained !== undefined && submission.marks_obtained !== null && (
                      <p className="text-lg text-muted-foreground">
                        {submission.marks_obtained}/{assignment.total_marks || 100}
                      </p>
                    )}
                  </div>
                  {submission.feedback && (
                    <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Teacher Feedback</Label>
                      <p className="text-sm text-white whitespace-pre-wrap">{submission.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Form - Google Classroom Style */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white text-xl">
            Your Work
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {hasSubmission ? 'Update your submission below' : 'Add your work below and click Turn in'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 lg:space-y-6">
            {/* Text Submission */}
            <div>
              <Label htmlFor="submissionText" className="text-base font-medium text-white mb-2 block">
                Add Text
              </Label>
              <Textarea
                id="submissionText"
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Enter your assignment text here..."
                rows={12}
                className="mt-2 bg-background/50 border-white/20 focus:border-purple-500/50"
              />
              <p className="text-xs text-muted-foreground mt-2">
                You can submit text, PDF files, or both
              </p>
            </div>

            {/* File Upload */}
            <div>
              <Label htmlFor="files" className="text-base font-medium text-white mb-2 block">
                Add Files
              </Label>
              <div className="mt-2 border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors">
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
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-purple-400" />
                  <span className="text-sm text-white font-medium">
                    {files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload PDF files'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF files only • Multiple files allowed
                  </span>
                </label>
              </div>
            </div>

            {/* Selected Files Preview */}
            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files</Label>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-white">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(2)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Files (if updating) */}
            {existingFileUrls.length > 0 && (
              <div className="space-y-2">
                <Label>Current Submission Files</Label>
                <div className="space-y-2">
                  {existingFileUrls.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
                      >
                        <FileText className="h-4 w-4" />
                        File {index + 1}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExistingFile(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons - Google Classroom Style */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={submitting}
                className="text-muted-foreground hover:text-white"
              >
                Cancel
              </Button>
              <div className="flex gap-3">
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
                    Save Draft
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={submitting || (files.length === 0 && !submissionText.trim() && existingFileUrls.length === 0)}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                >
                  <CheckCircle className="h-4 w-4" />
                  {submitting ? 'Turning in...' : hasSubmission ? 'Update & Turn in' : 'Turn in'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

