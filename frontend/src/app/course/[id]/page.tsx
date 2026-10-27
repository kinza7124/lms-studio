'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Course, Announcement, Specialty, Quiz, Assessment, Assignment, AnnouncementComment, Lecture } from '@/types';
import { Button } from '@/components/ui/button';
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
  Select,
  Tabs,
  statusTone,
} from '@/components/ui/page';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  GraduationCap,
  HelpCircle,
  Megaphone,
  Paperclip,
  Play,
  PlayCircle,
  Plus,
  Rss,
  Users,
} from 'lucide-react';

const fileInputClass = 'file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-[13px] file:font-medium file:text-foreground';

// Helper function to convert relative URLs to absolute URLs
const buildAssetUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const origin = apiBase.endsWith('/api') ? apiBase.replace(/\/api$/, '') : apiBase;
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
};

type StreamItem = {
  stream_id: number;
  course_id: number;
  created_by: number;
  stream_type: string;
  title?: string;
  content?: string;
  reference_id?: number;
  created_at: string;
  creator_name?: string;
  creator_email?: string;
};

type ActivityLog = {
  log_id: number;
  user_id?: number;
  course_id?: number;
  activity_type: string;
  activity_description: string;
  metadata?: any;
  created_at: string;
  user_name?: string;
  user_email?: string;
  course_code?: string;
  course_title?: string;
};

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementComments, setAnnouncementComments] = useState<Record<number, AnnouncementComment[]>>({});
  const [stream, setStream] = useState<StreamItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<number | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', attachmentUrl: '' });
  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', dueDate: '', totalMarks: '100' });
  const [assignmentPdf, setAssignmentPdf] = useState<File | null>(null);
  const [quizForm, setQuizForm] = useState({ title: '', description: '', totalMarks: '100', timeLimit: '', dueDate: '', googleFormsUrl: '' });
  const [quizPdf, setQuizPdf] = useState<File | null>(null);
  const [assessmentForm, setAssessmentForm] = useState({ title: '', description: '', assessmentType: 'midterm', totalMarks: '100', weightPercentage: '0', dueDate: '' });
  const [assessmentPdf, setAssessmentPdf] = useState<File | null>(null);
  const [commentForms, setCommentForms] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<'stream' | 'announcements' | 'activity' | 'lectures' | 'assignments' | 'quizzes' | 'assessments' | 'participants'>('stream');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  useAuthGuard();

  const loadData = async () => {
    try {
      const [courseRes, announcementsRes, streamRes, activityRes, quizzesRes, assessmentsRes, participantsRes, assignmentsRes, lecturesRes, enrollmentsRes] = await Promise.all([
        api.get<Course>(`/courses/${params.id}`),
        api.get<Announcement[]>(`/announcements/course/${params.id}`),
        api.get<StreamItem[]>(`/course-stream/course/${params.id}`),
        api.get<ActivityLog[]>(`/activity-logs/course/${params.id}`),
        api.get<Quiz[]>(`/quizzes/course/${params.id}`).catch(() => ({ data: [] })),
        api.get<Assessment[]>(`/assessments/course/${params.id}`).catch(() => ({ data: [] })),
        api.get<any[]>(`/courses/${params.id}/enrollments`).catch(() => ({ data: [] })),
        api.get<{ assignments: Assignment[] }>(`/assignments/course/${params.id}`).catch(() => ({ data: { assignments: [] } })),
        api.get<Lecture[]>(`/lectures/course/${params.id}`).catch((error) => {
          // If enrollment check fails, show empty array but log the error
          if (error.response?.status === 403) {
            console.warn('Access denied to lectures:', error.response.data?.message);
          }
          return { data: [] };
        }),
        api.get<any[]>('/courses/user/me/enrollments').catch(() => ({ data: [] })),
      ]);
      setCourse(courseRes.data);
      setAnnouncements(announcementsRes.data);
      setStream(streamRes.data);
      setActivityLogs(activityRes.data);
      setQuizzes(quizzesRes.data || []);
      setAssessments(assessmentsRes.data || []);
      setParticipants(participantsRes.data || []);
      setAssignments(assignmentsRes.data?.assignments || []);
      setLectures(lecturesRes.data || []);

      // Check if user is already enrolled
      const userEnrollments = enrollmentsRes.data || [];
      const enrolled = userEnrollments.some((e: any) => e.course_id === parseInt(params.id));
      setIsEnrolled(enrolled);

      // Load comments for all announcements
      const commentsMap: Record<number, AnnouncementComment[]> = {};
      const commentPromises = announcementsRes.data.map(async (announcement) => {
        try {
          const commentsRes = await api.get<AnnouncementComment[]>(`/announcements/${announcement.announcement_id}/comments`);
          commentsMap[announcement.announcement_id] = commentsRes.data;
        } catch (error) {
          commentsMap[announcement.announcement_id] = [];
        }
      });
      await Promise.all(commentPromises);
      setAnnouncementComments(commentsMap);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUserAndData = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        setUser(data.user);
      } catch (error) {
        console.error(error);
      }
      // Load data after user is loaded (or even if user load fails)
      if (params.id) {
        await loadData();
      }
    };
    loadUserAndData();
  }, [params.id]);

  const handleEnroll = async () => {
    if (!user) {
      alert('Please login to enroll');
      return;
    }
    
    setEnrolling(true);
    try {
      await api.post(`/courses/${params.id}/enroll`);
      setIsEnrolled(true);
      alert('Successfully enrolled in the course!');
      loadData();
    } catch (error: any) {
      console.error('Enroll error:', error);
      alert(error.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/announcements', {
        courseId: params.id,
        ...announcementForm,
      });
      alert('Announcement created successfully');
      setAnnouncementForm({ title: '', content: '', attachmentUrl: '' });
      setShowAnnouncementForm(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to create announcement');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('courseId', params.id);
      formData.append('title', assignmentForm.title);
      formData.append('description', assignmentForm.description || '');
      formData.append('totalMarks', assignmentForm.totalMarks || '100');
      if (assignmentForm.dueDate) {
        formData.append('dueDate', assignmentForm.dueDate);
      }
      if (assignmentPdf) {
        formData.append('pdf', assignmentPdf);
      }

      await api.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Assignment created successfully');
      setAssignmentForm({ title: '', description: '', dueDate: '', totalMarks: '100' });
      setAssignmentPdf(null);
      setShowAssignmentForm(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to create assignment');
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('courseId', params.id);
      formData.append('title', quizForm.title);
      formData.append('description', quizForm.description || '');
      formData.append('totalMarks', quizForm.totalMarks);
      if (quizForm.timeLimit) {
        formData.append('timeLimit', quizForm.timeLimit);
      }
      if (quizForm.dueDate) {
        formData.append('dueDate', quizForm.dueDate);
      }
      if (quizForm.googleFormsUrl) {
        formData.append('googleFormsUrl', quizForm.googleFormsUrl);
      }
      if (quizPdf) {
        formData.append('pdf', quizPdf);
      }

      await api.post('/quizzes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Quiz created successfully');
      setQuizForm({ title: '', description: '', totalMarks: '100', timeLimit: '', dueDate: '', googleFormsUrl: '' });
      setQuizPdf(null);
      setShowQuizForm(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to create quiz');
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('courseId', params.id);
      formData.append('title', assessmentForm.title);
      formData.append('description', assessmentForm.description || '');
      formData.append('assessmentType', assessmentForm.assessmentType);
      formData.append('totalMarks', assessmentForm.totalMarks);
      formData.append('weightPercentage', assessmentForm.weightPercentage);
      if (assessmentForm.dueDate) {
        formData.append('dueDate', assessmentForm.dueDate);
      }
      if (assessmentPdf) {
        formData.append('pdf', assessmentPdf);
      }

      await api.post('/assessments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Assessment created successfully');
      setAssessmentForm({ title: '', description: '', assessmentType: 'midterm', totalMarks: '100', weightPercentage: '0', dueDate: '' });
      setAssessmentPdf(null);
      setShowAssessmentForm(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to create assessment');
    }
  };

  const isTeacherOrAdmin = user && (user.role === 'teacher' || user.role === 'admin');

  const canDeleteAnnouncement = (announcement: Announcement) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (announcement.created_by === user.user_id) return true;
    if (user.role === 'teacher' && isTeacherOrAdmin) return true; // Teacher can delete in their courses
    return false;
  };

  const canEditAnnouncement = (announcement: Announcement) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (announcement.created_by === user.user_id) return true;
    if (user.role === 'teacher' && isTeacherOrAdmin) return true; // Teacher can edit in their courses
    return false;
  };

  const handleDeleteAnnouncement = async (announcementId: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${announcementId}`);
      alert('Announcement deleted successfully');
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to delete announcement');
    }
  };

  const handleUpdateAnnouncement = async (announcementId: number, title: string, content: string, attachmentUrl: string) => {
    try {
      await api.put(`/announcements/${announcementId}`, { title, content, attachmentUrl });
      alert('Announcement updated successfully');
      setEditingAnnouncement(null);
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to update announcement');
    }
  };

  const handleAddComment = async (announcementId: number) => {
    const content = commentForms[announcementId];
    if (!content || !content.trim()) {
      alert('Please enter a comment');
      return;
    }
    try {
      await api.post(`/announcements/${announcementId}/comments`, { announcementId, content });
      setCommentForms({ ...commentForms, [announcementId]: '' });
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: number, announcementId: number) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await api.delete(`/announcements/comments/${commentId}`);
      loadData();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!course) {
    return <Alert tone="error" title="Course not found">This course may have been removed or you may not have access.</Alert>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        back
        eyebrow={course.code}
        title={course.title}
        description={course.description}
        actions={
          <>
            {user?.role === 'student' && !isEnrolled && (
              <Button onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? 'Enrolling…' : 'Enroll in course'}
              </Button>
            )}
            {isEnrolled && user?.role === 'student' && (
              <Badge tone="success" className="px-3 py-1 text-[13px]">
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                Enrolled
              </Badge>
            )}
          </>
        }
        className="mb-0 md:mb-0"
      />

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { value: 'stream', label: 'Stream' },
          { value: 'announcements', label: 'Announcements', count: announcements.length },
          { value: 'lectures', label: 'Lectures', count: lectures.length },
          { value: 'activity', label: 'Activity log' },
          { value: 'assignments', label: 'Assignments', count: assignments.length },
          { value: 'quizzes', label: 'Quizzes', count: quizzes.length },
          { value: 'assessments', label: 'Assessments', count: assessments.length },
          { value: 'participants', label: 'Participants', count: participants.length },
        ]}
      />

      {activeTab === 'stream' && (
        <div className="space-y-4">
          {stream.length === 0 ? (
            <EmptyState icon={Rss} title="No activity yet" description="Updates from this course will appear here." />
          ) : (
            stream.map((item) => (
              <Card key={item.stream_id}>
                <CardContent className="space-y-3 p-5 md:p-6">
                  <div className="flex items-start gap-3">
                    <Avatar name={item.creator_name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.creator_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
                    </div>
                    <Badge className="capitalize">{item.stream_type}</Badge>
                  </div>
                  <p className="text-[17px] font-semibold text-foreground">{item.title || 'Update'}</p>
                  {item.content && (
                    <p className="break-words whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{item.content}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'announcements' && (
        <Section
          title="Announcements"
          actions={
            <Button
              variant={showAnnouncementForm ? 'outline' : 'default'}
              onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
            >
              {showAnnouncementForm ? 'Cancel' : (
                <>
                  <Plus className="h-4 w-4" />
                  New announcement
                </>
              )}
            </Button>
          }
        >
          {showAnnouncementForm && (
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleCreateAnnouncement} className="space-y-5">
                  <p className="text-[17px] font-semibold text-foreground">Create announcement</p>
                  <Field label="Title" htmlFor="title">
                    <Input
                      id="title"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Content" htmlFor="content">
                    <Textarea
                      id="content"
                      value={announcementForm.content}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                      required
                      rows={5}
                    />
                  </Field>
                  <Field label="Attachment URL" htmlFor="attachmentUrl" hint="Optional">
                    <Input
                      id="attachmentUrl"
                      value={announcementForm.attachmentUrl}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, attachmentUrl: e.target.value })}
                    />
                  </Field>
                  <div className="flex justify-end">
                    <Button type="submit">Post announcement</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {announcements.length === 0 ? (
            <EmptyState icon={Megaphone} title="No announcements yet" description="Announcements posted to this course will show up here." />
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.announcement_id}>
                <CardContent className="p-5 md:p-6">
                  {editingAnnouncement === announcement.announcement_id ? (
                    <div className="space-y-4">
                      <Field label="Title">
                        <Input
                          value={announcementForm.title}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                          placeholder="Title"
                        />
                      </Field>
                      <Field label="Content">
                        <Textarea
                          value={announcementForm.content}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                          placeholder="Content"
                          rows={4}
                        />
                      </Field>
                      <Field label="Attachment URL" hint="Optional">
                        <Input
                          value={announcementForm.attachmentUrl}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, attachmentUrl: e.target.value })}
                          placeholder="Attachment URL (optional)"
                        />
                      </Field>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingAnnouncement(null);
                            setAnnouncementForm({ title: '', content: '', attachmentUrl: '' });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateAnnouncement(
                            announcement.announcement_id,
                            announcementForm.title,
                            announcementForm.content,
                            announcementForm.attachmentUrl
                          )}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <Avatar name={announcement.creator_name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{announcement.creator_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {announcement.creator_email} · {formatDate(announcement.created_at)}
                        </p>
                      </div>
                      {!editingAnnouncement && (
                        <div className="flex shrink-0 gap-1">
                          {canEditAnnouncement(announcement) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingAnnouncement(announcement.announcement_id);
                                setAnnouncementForm({
                                  title: announcement.title,
                                  content: announcement.content,
                                  attachmentUrl: announcement.attachment_url || '',
                                });
                              }}
                            >
                              Edit
                            </Button>
                          )}
                          {canDeleteAnnouncement(announcement) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-red-50"
                              onClick={() => handleDeleteAnnouncement(announcement.announcement_id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {!editingAnnouncement && (
                    <>
                      <h3 className="mt-4 text-[17px] font-semibold text-foreground">{announcement.title}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{announcement.content}</p>
                      {announcement.attachment_url && (
                        <a
                          href={announcement.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-4"
                        >
                          <Paperclip className="h-4 w-4" strokeWidth={1.75} />
                          View attachment
                        </a>
                      )}

                      <div className="mt-5 border-t border-border/70 pt-4">
                        <p className="mb-3 text-xs font-medium text-muted-foreground">
                          Comments
                          {(announcementComments[announcement.announcement_id] || []).length > 0 && (
                            <span className="ml-1 tabular-nums">· {(announcementComments[announcement.announcement_id] || []).length}</span>
                          )}
                        </p>

                        {(announcementComments[announcement.announcement_id] || []).length > 0 && (
                          <ul className="mb-4 space-y-3 pl-1 sm:pl-4">
                            {(announcementComments[announcement.announcement_id] || []).map((comment) => (
                              <li key={comment.comment_id} className="flex items-start gap-3">
                                <Avatar name={comment.creator_name} className="h-7 w-7 text-[10px]" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">{comment.creator_name}</span>
                                    {comment.creator_email && <span className="hidden sm:inline"> ({comment.creator_email})</span>}
                                    {' · '}
                                    {formatDate(comment.created_at)}
                                  </p>
                                  <p className="mt-0.5 break-words text-sm text-foreground">{comment.content}</p>
                                </div>
                                {(comment.created_by === user?.user_id || user?.role === 'admin') && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2.5 text-xs text-destructive hover:bg-red-50"
                                    onClick={() => handleDeleteComment(comment.comment_id, announcement.announcement_id)}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="flex items-center gap-2">
                          <Input
                            value={commentForms[announcement.announcement_id] || ''}
                            onChange={(e) => setCommentForms({ ...commentForms, [announcement.announcement_id]: e.target.value })}
                            placeholder="Add a comment…"
                            className="h-9 flex-1 text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(announcement.announcement_id)}
                          >
                            Post
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </Section>
      )}

      {activeTab === 'activity' && (
        <Section title="Activity log">
          {activityLogs.length === 0 ? (
            <EmptyState icon={Activity} title="No activity logged yet" />
          ) : (
            <List>
              {activityLogs.map((log) => (
                <ListItem key={log.log_id} className="items-start">
                  <Avatar name={log.user_name || 'System'} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{log.activity_description}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {log.user_name || 'System'} · {formatDate(log.created_at)}
                    </p>
                  </div>
                  <Badge className="shrink-0">{log.activity_type}</Badge>
                </ListItem>
              ))}
            </List>
          )}
        </Section>
      )}

      {activeTab === 'lectures' && (
        <Section title="Lectures">
          {lectures.length === 0 ? (
            <EmptyState
              icon={PlayCircle}
              title="No lectures yet"
              description={user?.role === 'student'
                ? 'No lectures available yet, or you may need to enroll in this course to view lectures.'
                : 'No lectures available yet.'}
            />
          ) : (
            <div className="space-y-4">
              {lectures
                .sort((a, b) => (a.lecture_number || 0) - (b.lecture_number || 0))
                .map((lecture) => (
                  <Card key={lecture.lecture_id}>
                    <CardContent className="space-y-4 p-5 md:p-6">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                          <PlayCircle className="h-4 w-4" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[17px] font-semibold text-foreground">{lecture.title}</p>
                          {lecture.created_at && (
                            <p className="mt-0.5 text-xs text-muted-foreground">Added {formatDate(lecture.created_at)}</p>
                          )}
                        </div>
                        {lecture.lecture_number && (
                          <Badge className="shrink-0 tabular-nums">Lecture {lecture.lecture_number}</Badge>
                        )}
                      </div>

                      {lecture.content && (
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{lecture.content}</p>
                      )}

                      {lecture.video_url && (
                        <a
                          href={lecture.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-black text-white"
                        >
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black transition-opacity group-hover:opacity-90">
                            <Play className="ml-0.5 h-6 w-6" fill="currentColor" strokeWidth={1.75} />
                          </span>
                          <span className="text-sm font-medium">Watch video</span>
                        </a>
                      )}

                      {lecture.pdf_url && (
                        <div className="flex items-center gap-3 overflow-hidden rounded-2xl bg-secondary/60 p-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-muted-foreground">
                            <FileText className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">Lecture notes</p>
                            <p className="text-xs text-muted-foreground">PDF document</p>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <a href={buildAssetUrl(lecture.pdf_url)} target="_blank" rel="noopener noreferrer">
                              View PDF
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </Section>
      )}

      {activeTab === 'assignments' && (
        <Section
          title="Assignments"
          actions={isTeacherOrAdmin && (
            <Button
              variant={showAssignmentForm ? 'outline' : 'default'}
              onClick={() => setShowAssignmentForm(!showAssignmentForm)}
            >
              {showAssignmentForm ? 'Cancel' : (
                <>
                  <Plus className="h-4 w-4" />
                  New assignment
                </>
              )}
            </Button>
          )}
        >
          {isTeacherOrAdmin && showAssignmentForm && (
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleCreateAssignment} className="space-y-5">
                  <p className="text-[17px] font-semibold text-foreground">Create assignment</p>
                  <Field label="Title" htmlFor="assignmentTitle">
                    <Input
                      id="assignmentTitle"
                      value={assignmentForm.title}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Description" htmlFor="assignmentDescription">
                    <Textarea
                      id="assignmentDescription"
                      value={assignmentForm.description}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                      rows={4}
                    />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Total marks" htmlFor="assignmentTotalMarks">
                      <Input
                        id="assignmentTotalMarks"
                        type="number"
                        value={assignmentForm.totalMarks}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, totalMarks: e.target.value })}
                        required
                        min="0"
                        step="0.01"
                        placeholder="100"
                      />
                    </Field>
                    <Field label="Due date" htmlFor="assignmentDueDate">
                      <Input
                        id="assignmentDueDate"
                        type="datetime-local"
                        value={assignmentForm.dueDate}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                      />
                    </Field>
                  </div>
                  <Field label="PDF" htmlFor="assignmentPdf" hint="Optional">
                    <Input
                      id="assignmentPdf"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setAssignmentPdf(e.target.files?.[0] || null)}
                      className={fileInputClass}
                    />
                  </Field>
                  <div className="flex justify-end">
                    <Button type="submit">Create assignment</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {assignments.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No assignments yet" description="Assignments for this course will appear here." />
          ) : (
            <List>
              {assignments.map((assignment) => (
                <div
                  key={assignment.assignment_id}
                  className="flex w-full cursor-pointer items-center gap-4 px-4 py-3.5 transition-colors hover:bg-secondary/60 md:px-5"
                  onClick={() => {
                    if (user?.role === 'student') {
                      router.push(`/student/assignments/${assignment.assignment_id}`);
                    } else if (user?.role === 'teacher' || user?.role === 'admin') {
                      router.push(`/teacher/assignments/${assignment.assignment_id}`);
                    }
                  }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <ClipboardList className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-foreground">{assignment.title}</p>
                    {assignment.description && (
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{assignment.description}</p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {assignment.due_date && <span>Due {formatDate(assignment.due_date)}</span>}
                      {assignment.total_marks && <span className="tabular-nums">{assignment.total_marks} points</span>}
                      {assignment.pdf_url && (
                        <a
                          href={assignment.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-primary hover:underline underline-offset-4"
                        >
                          <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                  {user?.role === 'student' && assignment.submission_status && (
                    <Badge tone={statusTone(assignment.submission_status)} className="hidden capitalize sm:inline-flex">
                      {assignment.submission_status}
                    </Badge>
                  )}
                  {user?.role === 'student' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/student/assignments/${assignment.assignment_id}`);
                      }}
                      className="shrink-0"
                    >
                      {assignment.submission_status === 'submitted' ? 'View' : 'Open'}
                    </Button>
                  )}
                  {(user?.role === 'teacher' || user?.role === 'admin') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/teacher/assignments/${assignment.assignment_id}`);
                      }}
                      className="shrink-0"
                    >
                      Grade
                    </Button>
                  )}
                </div>
              ))}
            </List>
          )}
        </Section>
      )}

      {activeTab === 'quizzes' && (
        <Section
          title="Quizzes"
          actions={isTeacherOrAdmin && (
            <Button
              variant={showQuizForm ? 'outline' : 'default'}
              onClick={() => setShowQuizForm(!showQuizForm)}
            >
              {showQuizForm ? 'Cancel' : (
                <>
                  <Plus className="h-4 w-4" />
                  New quiz
                </>
              )}
            </Button>
          )}
        >
          {isTeacherOrAdmin && showQuizForm && (
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleCreateQuiz} className="space-y-5">
                  <p className="text-[17px] font-semibold text-foreground">Create quiz</p>
                  <Field label="Title" htmlFor="quizTitle">
                    <Input
                      id="quizTitle"
                      value={quizForm.title}
                      onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Description" htmlFor="quizDescription">
                    <Textarea
                      id="quizDescription"
                      value={quizForm.description}
                      onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                      rows={3}
                    />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Total marks" htmlFor="quizTotalMarks">
                      <Input
                        id="quizTotalMarks"
                        type="number"
                        value={quizForm.totalMarks}
                        onChange={(e) => setQuizForm({ ...quizForm, totalMarks: e.target.value })}
                        required
                      />
                    </Field>
                    <Field label="Time limit (minutes)" htmlFor="quizTimeLimit" hint="Optional">
                      <Input
                        id="quizTimeLimit"
                        type="number"
                        value={quizForm.timeLimit}
                        onChange={(e) => setQuizForm({ ...quizForm, timeLimit: e.target.value })}
                      />
                    </Field>
                  </div>
                  <Field label="Due date" htmlFor="quizDueDate">
                    <Input
                      id="quizDueDate"
                      type="datetime-local"
                      value={quizForm.dueDate}
                      onChange={(e) => setQuizForm({ ...quizForm, dueDate: e.target.value })}
                    />
                  </Field>
                  <Field label="PDF" htmlFor="quizPdf" hint="Optional">
                    <Input
                      id="quizPdf"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setQuizPdf(e.target.files?.[0] || null)}
                      className={fileInputClass}
                    />
                  </Field>
                  <Field label="Google Forms URL" htmlFor="googleFormsUrl" hint="Optional. Paste your Google Forms URL here to embed the quiz.">
                    <Input
                      id="googleFormsUrl"
                      type="url"
                      value={quizForm.googleFormsUrl}
                      onChange={(e) => setQuizForm({ ...quizForm, googleFormsUrl: e.target.value })}
                      placeholder="https://docs.google.com/forms/..."
                    />
                  </Field>
                  <div className="flex justify-end">
                    <Button type="submit">Create quiz</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {quizzes.length === 0 ? (
            <EmptyState icon={HelpCircle} title="No quizzes yet" description="Quizzes for this course will appear here." />
          ) : (
            <List>
              {quizzes.map((quiz) => (
                <div key={quiz.quiz_id}>
                  <ListItem className="items-start sm:items-center">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                      <HelpCircle className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-foreground">{quiz.title}</p>
                      {quiz.description && (
                        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{quiz.description}</p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="tabular-nums">{quiz.total_marks} marks</span>
                        {quiz.time_limit && <span className="tabular-nums">{quiz.time_limit} min</span>}
                        {quiz.due_date && <span>Due {new Date(quiz.due_date).toLocaleDateString()}</span>}
                        {quiz.pdf_url && (
                          <a
                            href={quiz.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline underline-offset-4"
                          >
                            <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Quiz PDF
                          </a>
                        )}
                        {quiz.google_forms_url && (
                          <a
                            href={quiz.google_forms_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline underline-offset-4"
                          >
                            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Open Google Forms
                          </a>
                        )}
                      </div>
                    </div>
                    {quiz.time_limit && (
                      <Badge className="hidden sm:inline-flex">Timed</Badge>
                    )}
                    {user?.role === 'student' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => router.push(`/student/quizzes/${quiz.quiz_id}`)}
                      >
                        Take quiz
                      </Button>
                    )}
                    {isTeacherOrAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => router.push(`/admin/quizzes/${quiz.quiz_id}/questions`)}
                      >
                        Manage
                      </Button>
                    )}
                  </ListItem>
                  {quiz.google_forms_url && (
                    <div className="px-4 pb-4 md:px-5 md:pb-5">
                      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                        <iframe
                          src={quiz.google_forms_url.replace('/viewform', '/viewform?embedded=true')}
                          width="100%"
                          height="600"
                          frameBorder="0"
                          marginHeight={0}
                          marginWidth={0}
                          className="block"
                        >
                          Loading…
                        </iframe>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </List>
          )}
        </Section>
      )}

      {activeTab === 'assessments' && (
        <Section
          title="Assessments"
          actions={isTeacherOrAdmin && (
            <Button
              variant={showAssessmentForm ? 'outline' : 'default'}
              onClick={() => setShowAssessmentForm(!showAssessmentForm)}
            >
              {showAssessmentForm ? 'Cancel' : (
                <>
                  <Plus className="h-4 w-4" />
                  New assessment
                </>
              )}
            </Button>
          )}
        >
          {isTeacherOrAdmin && showAssessmentForm && (
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleCreateAssessment} className="space-y-5">
                  <p className="text-[17px] font-semibold text-foreground">Create assessment</p>
                  <Field label="Title" htmlFor="assessmentTitle">
                    <Input
                      id="assessmentTitle"
                      value={assessmentForm.title}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Description" htmlFor="assessmentDescription">
                    <Textarea
                      id="assessmentDescription"
                      value={assessmentForm.description}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, description: e.target.value })}
                      rows={3}
                    />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Assessment type" htmlFor="assessmentType">
                      <Select
                        id="assessmentType"
                        value={assessmentForm.assessmentType}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, assessmentType: e.target.value })}
                        required
                      >
                        <option value="midterm">Midterm</option>
                        <option value="final">Final exam</option>
                        <option value="project">Project</option>
                        <option value="presentation">Presentation</option>
                        <option value="other">Other</option>
                      </Select>
                    </Field>
                    <Field label="Weight (%)" htmlFor="assessmentWeight">
                      <Input
                        id="assessmentWeight"
                        type="number"
                        step="0.01"
                        value={assessmentForm.weightPercentage}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, weightPercentage: e.target.value })}
                        required
                      />
                    </Field>
                    <Field label="Total marks" htmlFor="assessmentTotalMarks">
                      <Input
                        id="assessmentTotalMarks"
                        type="number"
                        value={assessmentForm.totalMarks}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, totalMarks: e.target.value })}
                        required
                      />
                    </Field>
                    <Field label="Due date" htmlFor="assessmentDueDate">
                      <Input
                        id="assessmentDueDate"
                        type="datetime-local"
                        value={assessmentForm.dueDate}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, dueDate: e.target.value })}
                      />
                    </Field>
                  </div>
                  <Field label="PDF" htmlFor="assessmentPdf" hint="Optional">
                    <Input
                      id="assessmentPdf"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setAssessmentPdf(e.target.files?.[0] || null)}
                      className={fileInputClass}
                    />
                  </Field>
                  <div className="flex justify-end">
                    <Button type="submit">Create assessment</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {assessments.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No assessments yet" description="Assessments for this course will appear here." />
          ) : (
            <List>
              {assessments.map((assessment) => (
                <ListItem key={assessment.assessment_id} className="items-start sm:items-center">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <GraduationCap className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-foreground">{assessment.title}</p>
                    {assessment.description && (
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{assessment.description}</p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="tabular-nums">{assessment.total_marks} marks</span>
                      <span className="tabular-nums">{assessment.weight_percentage}% weight</span>
                      {assessment.due_date && <span>Due {new Date(assessment.due_date).toLocaleDateString()}</span>}
                      {assessment.pdf_url && (
                        <a
                          href={assessment.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline underline-offset-4"
                        >
                          <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                          Assessment PDF
                        </a>
                      )}
                    </div>
                  </div>
                  <Badge className="hidden capitalize sm:inline-flex">{assessment.assessment_type}</Badge>
                  {user?.role === 'student' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => router.push(`/student/assessments/${assessment.assessment_id}`)}
                    >
                      Submit
                    </Button>
                  )}
                  {isTeacherOrAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => router.push(`/admin/assessments/${assessment.assessment_id}/submissions`)}
                    >
                      View submissions
                    </Button>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Section>
      )}

      {activeTab === 'participants' && (
        <Section title="Participants">
          {participants.length === 0 ? (
            <EmptyState icon={Users} title="No participants yet" description="Students enrolled in this course will appear here." />
          ) : (
            <Card className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Major</th>
                    <th>Enrollment year</th>
                    <th>Term</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant) => (
                    <tr key={participant.enrollment_id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={participant.student_name} className="h-8 w-8" />
                          <span className="whitespace-nowrap font-medium text-foreground">{participant.student_name || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <a
                          href={`mailto:${participant.student_email}`}
                          className="text-primary hover:underline underline-offset-4"
                        >
                          {participant.student_email || 'N/A'}
                        </a>
                      </td>
                      <td className="text-muted-foreground">{participant.major || 'N/A'}</td>
                      <td className="tabular-nums text-muted-foreground">{participant.enrollment_year || 'N/A'}</td>
                      <td className="text-muted-foreground">{participant.term || 'N/A'}</td>
                      <td>
                        {participant.grade ? (
                          <Badge tone="primary">{participant.grade}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </Section>
      )}
    </div>
  );
}
