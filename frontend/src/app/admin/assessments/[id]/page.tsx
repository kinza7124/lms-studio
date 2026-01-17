'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Assessment } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-900/10 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-900/10 to-slate-950 p-4 md:p-6 lg:p-8">
        <div className="text-center text-white">Assessment not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-900/10 to-slate-950 p-4 md:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-white"
          onClick={() => router.back()}
        >
          ← Back
        </Button>

        <div className="grid md:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          {/* Submissions List */}
          <div className="md:col-span-1">
            <Card className="border-white/10 bg-white/5 sticky top-4">
              <CardHeader>
                <CardTitle className="text-white">Submissions ({submissions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {submissions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No submissions yet</p>
                  ) : (
                    submissions.map((submission) => (
                      <Button
                        key={submission.submission_id}
                        variant={selectedSubmission?.submission_id === submission.submission_id ? 'default' : 'outline'}
                        className="w-full justify-start text-left h-auto py-3 px-3"
                        onClick={() => handleSelectSubmission(submission)}
                      >
                        <div className="flex flex-col gap-1 w-full">
                          <span className="font-semibold text-sm">{submission.student_name || 'Unknown Student'}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(submission.submitted_at).toLocaleDateString()}
                          </span>
                          {submission.score !== null && submission.score !== undefined && (
                            <span className={`text-xs font-semibold ${submission.score >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                              Score: {submission.score}/{assessment.total_marks}
                            </span>
                          )}
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submission Details */}
          <div className="md:col-span-2 space-y-3 md:space-y-4 lg:space-y-6">
            {selectedSubmission ? (
              <>
                {/* Assessment Info */}
                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-white">{assessment.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Type</Label>
                      <p className="text-white capitalize">{assessment.assessment_type}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Total Marks</Label>
                      <p className="text-white">{assessment.total_marks}</p>
                    </div>
                    {assessment.description && (
                      <div>
                        <Label className="text-muted-foreground">Description</Label>
                        <p className="text-white whitespace-pre-wrap text-sm">{assessment.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Submission Content */}
                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-white">Submission Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Student</Label>
                      <p className="text-white">{selectedSubmission.student_name || 'Unknown'}</p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Submitted At</Label>
                      <p className="text-white">{new Date(selectedSubmission.submitted_at).toLocaleString()}</p>
                    </div>

                    {selectedSubmission.submission_text && (
                      <div>
                        <Label className="text-muted-foreground">Submission Text</Label>
                        <div className="bg-black/30 rounded-lg p-4 mt-2 max-h-64 overflow-y-auto">
                          <p className="text-white whitespace-pre-wrap text-sm">{selectedSubmission.submission_text}</p>
                        </div>
                      </div>
                    )}

                    {selectedSubmission.file_urls && selectedSubmission.file_urls.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Uploaded Files</Label>
                        <div className="space-y-2 mt-2">
                          {selectedSubmission.file_urls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-black/30 rounded-lg hover:bg-black/50 transition-colors"
                            >
                              <span className="text-purple-400">📎</span>
                              <span className="text-white text-sm truncate">{url.split('/').pop() || `File ${idx + 1}`}</span>
                              <span className="text-muted-foreground text-xs ml-auto">↗</span>
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

                {/* Grading Form */}
                <Card className="border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-white">Grade Submission</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleGradeSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="score" className="text-muted-foreground">
                          Score (out of {assessment.total_marks})
                        </Label>
                        <Input
                          id="score"
                          type="number"
                          min="0"
                          max={assessment.total_marks}
                          step="0.5"
                          value={gradeForm.score}
                          onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                          className="mt-2 bg-white/10 border-white/20 text-white"
                          placeholder="Enter score"
                        />
                      </div>

                      <div>
                        <Label htmlFor="feedback" className="text-muted-foreground">
                          Feedback (optional)
                        </Label>
                        <Textarea
                          id="feedback"
                          value={gradeForm.feedback}
                          onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                          className="mt-2 bg-white/10 border-white/20 text-white min-h-[120px]"
                          placeholder="Enter feedback for the student"
                        />
                      </div>

                      <Button type="submit" disabled={grading} className="w-full">
                        {grading ? 'Grading...' : 'Save Grade'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-white/10 bg-white/5">
                <CardContent className="py-12 text-center text-muted-foreground">
                  Select a submission to view and grade
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
