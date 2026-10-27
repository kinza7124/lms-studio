'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import type { Submission, Assignment } from '@/types';
import { Button } from '@/components/ui/button';
import { FileText, ShieldCheck, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Alert,
  Avatar,
  Badge,
  EmptyState,
  Field,
  List,
  ListItem,
  LoadingState,
  PageHeader,
  Section,
  StatGrid,
} from '@/components/ui/page';
import { useAuthGuard } from '@/hooks/useAuthGuard';

// Helper function to convert relative URLs to absolute URLs
const buildAssetUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const origin = apiBase.endsWith('/api') ? apiBase.replace(/\/api$/, '') : apiBase;
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
};

export default function AssignmentSubmissionsPage() {
  const params = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [students, setStudents] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeForm, setGradeForm] = useState<{ [key: number]: { grade: string; feedback: string; marksObtained: string } }>({});
  const [plagiarismResults, setPlagiarismResults] = useState<any[]>([]);
  const [comparingPlagiarism, setComparingPlagiarism] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<{ student1?: number; student2?: number }>({});
  const [activeKey, setActiveKey] = useState<number | null>(null);
  useAuthGuard();

  useEffect(() => {
    if (params.id) {
      loadData();
    }
  }, [params.id]);

  const loadData = async () => {
    try {
      const [submissionsRes] = await Promise.all([
        api.get<Submission[]>(`/submissions/assignment/${params.id}`),
      ]);
      
      setStudents(submissionsRes.data);
      
      if (submissionsRes.data.length > 0) {
        const firstStudent = submissionsRes.data[0];
        setAssignment({
          assignment_id: parseInt(params.id),
          course_id: 0, // Will be updated when we have the actual course_id
          title: firstStudent.assignment_title || 'Assignment',
          description: '',
          due_date: '',
          total_marks: firstStudent.total_marks || 100,
        });
      }

      const formData: { [key: number]: { grade: string; feedback: string; marksObtained: string } } = {};
      submissionsRes.data.forEach((student) => {
        const key = student.submission_id || student.student_id;
        formData[key] = {
          grade: student.grade || '',
          feedback: student.feedback || '',
          marksObtained: student.marks_obtained?.toString() || '',
        };
      });
      setGradeForm(formData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (studentId: number, submissionId?: number) => {
    const key = submissionId || studentId;
    const form = gradeForm[key];
    if (!form || (!form.grade && !form.marksObtained)) {
      alert('Please enter a grade or marks obtained');
      return;
    }

    try {
      if (submissionId) {
        // Update existing submission
        await api.put(`/submissions/${submissionId}/grade`, {
          grade: form.grade,
          feedback: form.feedback,
          marksObtained: form.marksObtained ? parseFloat(form.marksObtained) : undefined,
        });
        alert('Grade updated successfully');
        loadData();
      } else {
        alert('Student must submit first before grading. Please ask the student to submit their assignment.');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to update grade');
    }
  };

  const handleCheckAllPlagiarism = async () => {
    try {
      setComparingPlagiarism(true);
      const { data } = await api.get(`/submissions/assignment/${params.id}/plagiarism`);
      setPlagiarismResults(data.comparisons || []);
      if (data.comparisons.length === 0) {
        alert('No plagiarism detected between submissions.');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to check plagiarism');
    } finally {
      setComparingPlagiarism(false);
    }
  };

  const handleCompareTwoStudents = async () => {
    if (!selectedStudents.student1 || !selectedStudents.student2) {
      alert('Please select two students to compare');
      return;
    }

    if (selectedStudents.student1 === selectedStudents.student2) {
      alert('Please select two different students');
      return;
    }

    const student1 = students.find(s => (s.submission_id || s.student_id) === selectedStudents.student1);
    const student2 = students.find(s => (s.submission_id || s.student_id) === selectedStudents.student2);

    if (!student1?.submission_id || !student2?.submission_id) {
      alert('Both students must have submitted their assignments');
      return;
    }

    try {
      setComparingPlagiarism(true);
      const { data } = await api.post('/submissions/compare-plagiarism', {
        submissionId1: student1.submission_id,
        submissionId2: student2.submission_id,
      });
      alert(`Similarity: ${data.similarity}%\n${data.matches?.length || 0} matching phrases found`);
      setSelectedStudents({});
    } catch (error) {
      console.error(error);
      alert('Failed to compare submissions');
    } finally {
      setComparingPlagiarism(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  const submittedCount = students.filter((s) => s.submission_id).length;
  const activeStudent =
    students.find((s) => (s.submission_id || s.student_id) === activeKey) || students[0];
  const activeFormKey = activeStudent ? activeStudent.submission_id || activeStudent.student_id : 0;
  const activeHasSubmitted = !!activeStudent?.submission_id;
  const plagiarismTone = (score: number) => (score > 50 ? 'danger' : score > 20 ? 'warning' : 'success');

  return (
    <div className="space-y-8">
      <PageHeader
        back
        eyebrow="Submissions"
        title={assignment?.title || 'Assignment submissions'}
        description="Grade all enrolled students for this assignment."
        actions={
          <Button
            variant="outline"
            onClick={handleCheckAllPlagiarism}
            disabled={comparingPlagiarism || students.filter(s => s.submission_id).length < 2}
          >
            <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
            {comparingPlagiarism ? 'Checking…' : 'Check all plagiarism'}
          </Button>
        }
      />

      {assignment && (
        <div className="space-y-4">
          <StatGrid
            items={[
              { label: 'Students', value: students.length },
              { label: 'Submitted', value: submittedCount },
              { label: 'Total marks', value: assignment.total_marks || 100 },
            ]}
          />
          {(assignment.description || assignment.due_date) && (
            <Card>
              <CardContent className="space-y-2 p-6">
                {assignment.description && <p className="text-[15px] text-foreground">{assignment.description}</p>}
                {assignment.due_date && (
                  <p className="text-xs text-muted-foreground">
                    Due {new Date(assignment.due_date).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students enrolled"
          description="No students are enrolled in this course yet."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="min-w-0 space-y-3 lg:col-span-2">
            <p className="eyebrow">All enrolled students · {students.length}</p>
            <List>
              {students.map((student) => {
                const key = student.submission_id || student.student_id;
                const hasSubmitted = !!student.submission_id;
                const isGraded = !!student.grade || student.marks_obtained != null;
                return (
                  <ListItem key={key} active={key === activeFormKey} className="gap-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${student.student_name} for comparison`}
                      checked={selectedStudents.student1 === key || selectedStudents.student2 === key}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (!selectedStudents.student1) {
                            setSelectedStudents({ ...selectedStudents, student1: key });
                          } else if (!selectedStudents.student2) {
                            setSelectedStudents({ ...selectedStudents, student2: key });
                          } else {
                            alert('Please deselect a student first');
                            e.target.checked = false;
                          }
                        } else {
                          if (selectedStudents.student1 === key) {
                            setSelectedStudents({ ...selectedStudents, student1: undefined });
                          } else if (selectedStudents.student2 === key) {
                            setSelectedStudents({ ...selectedStudents, student2: undefined });
                          }
                        }
                      }}
                      disabled={!hasSubmitted}
                      className="h-4 w-4 shrink-0 accent-primary disabled:opacity-40"
                    />
                    <button
                      type="button"
                      onClick={() => setActiveKey(key)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <Avatar name={student.student_name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-foreground">{student.student_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{student.student_email}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge tone={hasSubmitted ? (isGraded ? 'success' : 'primary') : 'warning'}>
                          {hasSubmitted ? (isGraded ? 'Graded' : 'Submitted') : 'Not submitted'}
                        </Badge>
                        {hasSubmitted && student.plagiarism_score !== undefined && (
                          <Badge tone={plagiarismTone(student.plagiarism_score)} className="tabular-nums">
                            {student.plagiarism_score}% similar
                          </Badge>
                        )}
                      </div>
                    </button>
                  </ListItem>
                );
              })}
            </List>
          </div>

          {activeStudent && (
            <div className="min-w-0 lg:col-span-3">
              <Card className="lg:sticky lg:top-24">
                <CardContent className="space-y-6 p-6">
                  <div className="flex items-start gap-3">
                    <Avatar name={activeStudent.student_name} className="h-11 w-11 text-sm" />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-[17px] font-semibold text-foreground">{activeStudent.student_name}</h2>
                      <p className="truncate text-xs text-muted-foreground">
                        {activeStudent.student_email}
                        {activeStudent.major && ` · ${activeStudent.major}`}
                      </p>
                      {activeHasSubmitted && activeStudent.submitted_at && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Submitted {new Date(activeStudent.submitted_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {!activeHasSubmitted && (
                    <Alert tone="warning">This student has not submitted yet. Grading is available after submission.</Alert>
                  )}

                  {activeHasSubmitted && (activeStudent.submission_text || (activeStudent.file_urls && activeStudent.file_urls.length > 0)) && (
                    <div className="space-y-3 rounded-xl bg-secondary/60 p-4">
                      {activeStudent.submission_text && (
                        <p className="whitespace-pre-wrap text-sm text-foreground">{activeStudent.submission_text}</p>
                      )}
                      {activeStudent.file_urls && activeStudent.file_urls.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {activeStudent.file_urls.map((url, idx) => {
                            const absoluteUrl = buildAssetUrl(url);
                            return (
                              <a
                                key={idx}
                                href={absoluteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-primary hover:bg-secondary"
                              >
                                <FileText className="h-4 w-4" strokeWidth={1.75} />
                                View file {idx + 1}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Marks obtained"
                      hint={assignment?.total_marks ? `Out of ${assignment.total_marks}` : undefined}
                    >
                      <Input
                        type="number"
                        value={gradeForm[activeFormKey]?.marksObtained || ''}
                        onChange={(e) =>
                          setGradeForm({
                            ...gradeForm,
                            [activeFormKey]: {
                              ...gradeForm[activeFormKey],
                              marksObtained: e.target.value,
                            },
                          })
                        }
                        className="tabular-nums"
                        placeholder="0"
                        min="0"
                        max={assignment?.total_marks || 100}
                        step="0.01"
                        disabled={!activeHasSubmitted}
                      />
                    </Field>
                    <Field label="Grade" hint="A–F">
                      <Input
                        type="text"
                        value={gradeForm[activeFormKey]?.grade || ''}
                        onChange={(e) =>
                          setGradeForm({
                            ...gradeForm,
                            [activeFormKey]: {
                              ...gradeForm[activeFormKey],
                              grade: e.target.value.toUpperCase(),
                            },
                          })
                        }
                        maxLength={2}
                        placeholder="A-F"
                        disabled={!activeHasSubmitted}
                      />
                    </Field>
                  </div>
                  <Field label="Feedback">
                    <Textarea
                      value={gradeForm[activeFormKey]?.feedback || ''}
                      onChange={(e) =>
                        setGradeForm({
                          ...gradeForm,
                          [activeFormKey]: {
                            ...gradeForm[activeFormKey],
                            feedback: e.target.value,
                          },
                        })
                      }
                      placeholder="Provide feedback..."
                      rows={4}
                      disabled={!activeHasSubmitted}
                    />
                  </Field>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleGrade(activeStudent.student_id, activeStudent.submission_id)}
                      disabled={!activeHasSubmitted}
                    >
                      {activeHasSubmitted ? 'Save grade' : 'Not submitted'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {(selectedStudents.student1 && selectedStudents.student2) && (
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-[17px] font-semibold text-foreground">Compare selected students</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {students.find(s => (s.submission_id || s.student_id) === selectedStudents.student1)?.student_name}
                {' vs '}
                {students.find(s => (s.submission_id || s.student_id) === selectedStudents.student2)?.student_name}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="ghost" onClick={() => setSelectedStudents({})}>
                Clear selection
              </Button>
              <Button onClick={handleCompareTwoStudents} disabled={comparingPlagiarism}>
                {comparingPlagiarism ? 'Comparing…' : 'Compare'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {plagiarismResults.length > 0 && (
        <Section title="Plagiarism detection results">
          <List>
            {plagiarismResults.map((result, idx) => (
              <ListItem key={idx}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-foreground">
                    {result.submission1Student} vs {result.submission2Student}
                  </p>
                  {result.matches && result.matches.length > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      Matching phrases: {result.matches[0]?.count || 0}
                    </p>
                  )}
                </div>
                <Badge tone={plagiarismTone(result.similarity)} className="tabular-nums">
                  {result.similarity}% similarity
                </Badge>
              </ListItem>
            ))}
          </List>
        </Section>
      )}
    </div>
  );
}
