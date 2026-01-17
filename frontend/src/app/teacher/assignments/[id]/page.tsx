'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Submission, Assignment } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [students, setStudents] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeForm, setGradeForm] = useState<{ [key: number]: { grade: string; feedback: string; marksObtained: string } }>({});
  const [plagiarismResults, setPlagiarismResults] = useState<any[]>([]);
  const [comparingPlagiarism, setComparingPlagiarism] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<{ student1?: number; student2?: number }>({});
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
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white">
            {assignment?.title || 'Assignment Submissions'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Grade all enrolled students for this assignment (Total Marks: {assignment?.total_marks || 100})
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      {assignment && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Assignment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white">{assignment.description}</p>
            {assignment.due_date && (
              <p className="text-sm text-muted-foreground mt-2">
                Due: {new Date(assignment.due_date).toLocaleString()}
              </p>
            )}
            <p className="text-sm text-purple-300 mt-2">
              Total Marks: {assignment.total_marks || 100}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-white">
              All Enrolled Students ({students.length})
            </CardTitle>
            <Button
              variant="outline"
              onClick={handleCheckAllPlagiarism}
              disabled={comparingPlagiarism || students.filter(s => s.submission_id).length < 2}
            >
              {comparingPlagiarism ? 'Checking...' : 'Check All Plagiarism'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {students.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No students enrolled in this course.</p>
            ) : (
              students.map((student) => {
                const key = student.submission_id || student.student_id;
                const hasSubmitted = !!student.submission_id;
                return (
                  <div
                    key={key}
                    className={`rounded-lg border p-4 ${hasSubmitted ? 'border-white/10' : 'border-yellow-500/30 bg-yellow-500/5'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
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
                            className="w-4 h-4"
                          />
                          <p className="font-medium text-white">{student.student_name}</p>
                          {!hasSubmitted && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                              Not Submitted
                            </span>
                          )}
                          {hasSubmitted && student.plagiarism_score !== undefined && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              student.plagiarism_score > 50 
                                ? 'bg-red-500/20 text-red-300' 
                                : student.plagiarism_score > 20 
                                ? 'bg-yellow-500/20 text-yellow-300' 
                                : 'bg-green-500/20 text-green-300'
                            }`}>
                              Plagiarism: {student.plagiarism_score}%
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{student.student_email}</p>
                        {student.major && (
                          <p className="text-xs text-muted-foreground">Major: {student.major}</p>
                        )}
                        {hasSubmitted && student.submitted_at && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Submitted: {new Date(student.submitted_at).toLocaleString()}
                          </p>
                        )}
                        {hasSubmitted && student.file_urls && student.file_urls.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {student.file_urls.map((url, idx) => {
                              const absoluteUrl = buildAssetUrl(url);
                              return (
                                <a
                                  key={idx}
                                  href={absoluteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-purple-400 hover:text-purple-300 block underline"
                                >
                                  📄 View File {idx + 1} →
                                </a>
                              );
                            })}
                          </div>
                        )}
                        {hasSubmitted && student.submission_text && (
                          <p className="text-sm text-white mt-2 bg-white/5 p-2 rounded">
                            {student.submission_text}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label>Marks Obtained</Label>
                          <Input
                            type="number"
                            value={gradeForm[key]?.marksObtained || ''}
                            onChange={(e) =>
                              setGradeForm({
                                ...gradeForm,
                                [key]: {
                                  ...gradeForm[key],
                                  marksObtained: e.target.value,
                                },
                              })
                            }
                            className="w-full"
                            placeholder="0"
                            min="0"
                            max={assignment?.total_marks || 100}
                            step="0.01"
                            disabled={!hasSubmitted}
                          />
                          {assignment?.total_marks && (
                            <p className="text-xs text-muted-foreground mt-1">
                              / {assignment.total_marks}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label>Grade (A-F)</Label>
                          <Input
                            type="text"
                            value={gradeForm[key]?.grade || ''}
                            onChange={(e) =>
                              setGradeForm({
                                ...gradeForm,
                                [key]: {
                                  ...gradeForm[key],
                                  grade: e.target.value.toUpperCase(),
                                },
                              })
                            }
                            className="w-full"
                            maxLength={2}
                            placeholder="A-F"
                            disabled={!hasSubmitted}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            size="sm"
                            onClick={() => handleGrade(student.student_id, student.submission_id)}
                            disabled={!hasSubmitted}
                            className="w-full"
                          >
                            {hasSubmitted ? 'Save Grade' : 'Not Submitted'}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Feedback</Label>
                        <Textarea
                          value={gradeForm[key]?.feedback || ''}
                          onChange={(e) =>
                            setGradeForm({
                              ...gradeForm,
                              [key]: {
                                ...gradeForm[key],
                                feedback: e.target.value,
                              },
                            })
                          }
                          placeholder="Provide feedback..."
                          rows={3}
                          disabled={!hasSubmitted}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plagiarism Comparison Section */}
      {(selectedStudents.student1 && selectedStudents.student2) && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Compare Selected Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
              <p className="text-white">
                Compare: {students.find(s => (s.submission_id || s.student_id) === selectedStudents.student1)?.student_name} 
                vs {students.find(s => (s.submission_id || s.student_id) === selectedStudents.student2)?.student_name}
              </p>
              <Button
                onClick={handleCompareTwoStudents}
                disabled={comparingPlagiarism}
              >
                {comparingPlagiarism ? 'Comparing...' : 'Compare'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedStudents({})}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plagiarism Results */}
      {plagiarismResults.length > 0 && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Plagiarism Detection Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plagiarismResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-4 ${
                    result.similarity > 50
                      ? 'border-red-500/30 bg-red-500/5'
                      : result.similarity > 20
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">
                        {result.submission1Student} vs {result.submission2Student}
                      </p>
                      <p className={`text-2xl font-bold mt-2 ${
                        result.similarity > 50
                          ? 'text-red-400'
                          : result.similarity > 20
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}>
                        {result.similarity}% Similarity
                      </p>
                    </div>
                  </div>
                  {result.matches && result.matches.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground">Matching Phrases: {result.matches[0]?.count || 0}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
