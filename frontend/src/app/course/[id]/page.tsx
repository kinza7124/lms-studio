'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Course, Announcement, Specialty, Quiz, Assessment, Assignment, AnnouncementComment, Lecture } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { FileText } from 'lucide-react';

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
    return <div className="p-4 md:p-6 lg:p-8 text-white">Loading...</div>;
  }

  if (!course) {
    return <div className="p-4 md:p-6 lg:p-8 text-white">Course not found</div>;
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-white">{course.code} - {course.title}</h1>
          <p className="mt-2 text-muted-foreground">{course.description}</p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'student' && !isEnrolled && (
            <Button 
              onClick={handleEnroll} 
              disabled={enrolling}
              className="bg-green-600 hover:bg-green-700"
            >
              {enrolling ? 'Enrolling...' : 'Enroll in Course'}
            </Button>
          )}
          {isEnrolled && user?.role === 'student' && (
            <Button variant="outline" disabled className="text-green-400 border-green-400">
              ✓ Enrolled
            </Button>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 md:gap-2 border-b border-white/10 overflow-x-auto pb-0 scrollbar-hide">
        <button
          onClick={() => setActiveTab('stream')}
          className={`px-2 sm:px-3 md:px-4 py-2 font-medium transition-colors text-xs sm:text-sm md:text-base whitespace-nowrap flex-shrink-0 ${
            activeTab === 'stream'
              ? 'text-white border-b-2 border-purple-400'
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          Stream
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-2 sm:px-3 md:px-4 py-2 font-medium transition-colors text-xs sm:text-sm md:text-base whitespace-nowrap flex-shrink-0 ${
            activeTab === 'announcements'
              ? 'text-white border-b-2 border-purple-400'
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          Announcements ({announcements.length})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-2 sm:px-3 md:px-4 py-2 font-medium transition-colors text-xs sm:text-sm md:text-base whitespace-nowrap flex-shrink-0 ${
            activeTab === 'activity'
              ? 'text-white border-b-2 border-purple-400'
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          Activity Log
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-2 sm:px-3 md:px-4 py-2 font-medium transition-colors text-xs sm:text-sm md:text-base whitespace-nowrap flex-shrink-0 ${
            activeTab === 'assignments'
              ? 'text-white border-b-2 border-purple-400'
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          Assignments ({assignments.length})
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-2 sm:px-3 md:px-4 py-2 font-medium transition-colors text-xs sm:text-sm md:text-base whitespace-nowrap flex-shrink-0 ${
            activeTab === 'quizzes'
              ? 'text-white border-b-2 border-purple-400'
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          Quizzes ({quizzes.length})
        </button>
        <button
          onClick={() => setActiveTab('assessments')}
          className={`px-2 sm:px-3 md:px-4 py-2 font-medium transition-colors text-xs sm:text-sm md:text-base whitespace-nowrap flex-shrink-0 ${
            activeTab === 'assessments'
              ? 'text-white border-b-2 border-purple-400'
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          Assessments ({assessments.length})
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`px-2 sm:px-3 md:px-4 py-2 font-medium transition-colors text-xs sm:text-sm md:text-base whitespace-nowrap flex-shrink-0 ${
            activeTab === 'participants'
              ? 'text-white border-b-2 border-purple-400'
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          Participants ({participants.length})
        </button>
      </div>

      {/* Stream Tab */}
      {activeTab === 'stream' && (
        <div className="space-y-4">
          {stream.length === 0 ? (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4 md:p-6 lg:p-8 text-center text-muted-foreground">
                No activity in the stream yet.
              </CardContent>
            </Card>
          ) : (
            stream.map((item) => (
              <Card key={item.stream_id} className="border-white/10 bg-white/5">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm md:text-base">{item.title || 'Update'}</p>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        {item.creator_name} • {formatDate(item.created_at)}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-200 rounded-full text-xs border border-purple-400/30 self-start whitespace-nowrap">
                      {item.stream_type}
                    </span>
                  </div>
                  {item.content && <p className="text-white mt-2 text-sm md:text-base break-words">{item.content}</p>}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white">Announcements</h2>
            <Button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}>
              {showAnnouncementForm ? 'Cancel' : 'New Announcement'}
            </Button>
          </div>

          {showAnnouncementForm && (
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">Create Announcement</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={announcementForm.content}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                      required
                      rows={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="attachmentUrl">Attachment URL (optional)</Label>
                    <Input
                      id="attachmentUrl"
                      value={announcementForm.attachmentUrl}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, attachmentUrl: e.target.value })}
                    />
                  </div>
                  <Button type="submit">Post Announcement</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {announcements.length === 0 ? (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4 md:p-6 lg:p-8 text-center text-muted-foreground">
                No announcements yet.
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.announcement_id} className="border-white/10 bg-white/5">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {editingAnnouncement === announcement.announcement_id ? (
                        <div className="space-y-3">
                          <Input
                            value={announcementForm.title}
                            onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                            placeholder="Title"
                            className="bg-background"
                          />
                          <Textarea
                            value={announcementForm.content}
                            onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                            placeholder="Content"
                            rows={4}
                            className="bg-background"
                          />
                          <Input
                            value={announcementForm.attachmentUrl}
                            onChange={(e) => setAnnouncementForm({ ...announcementForm, attachmentUrl: e.target.value })}
                            placeholder="Attachment URL (optional)"
                            className="bg-background"
                          />
                          <div className="flex gap-2">
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
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-semibold text-white text-lg">{announcement.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {announcement.creator_name} ({announcement.creator_email}) • {formatDate(announcement.created_at)}
                          </p>
                        </>
                      )}
                    </div>
                    {!editingAnnouncement && (
                      <div className="flex gap-2">
                        {canEditAnnouncement(announcement) && (
                          <Button
                            size="sm"
                            variant="outline"
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
                            variant="destructive"
                            onClick={() => handleDeleteAnnouncement(announcement.announcement_id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {!editingAnnouncement && (
                    <>
                      <p className="text-white mt-3 whitespace-pre-wrap">{announcement.content}</p>
                      {announcement.attachment_url && (
                        <a
                          href={announcement.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-block text-purple-400 hover:text-purple-300"
                        >
                          View Attachment →
                        </a>
                      )}

                      {/* Comments Section */}
                      <div className="mt-6 pt-4 border-t border-white/10">
                        <h4 className="text-white font-semibold mb-3">Comments</h4>
                        
                        {/* Existing Comments */}
                        <div className="space-y-3 mb-4">
                          {(announcementComments[announcement.announcement_id] || []).map((comment) => (
                            <div key={comment.comment_id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-white">
                                    {comment.creator_name} ({comment.creator_email})
                                  </p>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {formatDate(comment.created_at)}
                                  </p>
                                  <p className="text-white text-sm">{comment.content}</p>
                                </div>
                                {(comment.created_by === user?.user_id || user?.role === 'admin') && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-400 hover:text-red-300"
                                    onClick={() => handleDeleteComment(comment.comment_id, announcement.announcement_id)}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Comment Form */}
                        <div className="flex gap-2">
                          <Textarea
                            value={commentForms[announcement.announcement_id] || ''}
                            onChange={(e) => setCommentForms({ ...commentForms, [announcement.announcement_id]: e.target.value })}
                            placeholder="Add a comment..."
                            rows={2}
                            className="flex-1 bg-background text-white"
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
        </div>
      )}

      {/* Activity Log Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Activity Log</h2>
          {activityLogs.length === 0 ? (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4 md:p-6 lg:p-8 text-center text-muted-foreground">
                No activity logged yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {activityLogs.map((log) => (
                <Card key={log.log_id} className="border-white/10 bg-white/5">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-white">{log.activity_description}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {log.user_name || 'System'} • {formatDate(log.created_at)}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-200 rounded-full text-xs border border-blue-400/30">
                        {log.activity_type}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lectures Tab */}
      {activeTab === 'lectures' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Course Lectures</h2>
          {lectures.length === 0 ? (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4 md:p-6 lg:p-8 text-center text-muted-foreground">
                {user?.role === 'student' 
                  ? 'No lectures available yet, or you may need to enroll in this course to view lectures.'
                  : 'No lectures available yet.'}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {lectures
                .sort((a, b) => (a.lecture_number || 0) - (b.lecture_number || 0))
                .map((lecture) => (
                  <Card key={lecture.lecture_id} className="border-white/10 bg-white/5">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {lecture.lecture_number && (
                              <span className="px-3 py-1 bg-purple-500/20 text-purple-200 rounded-full text-sm font-semibold border border-purple-400/30">
                                Lecture {lecture.lecture_number}
                              </span>
                            )}
                            <h3 className="font-semibold text-white text-lg">{lecture.title}</h3>
                          </div>
                          {lecture.created_at && (
                            <p className="text-sm text-muted-foreground">
                              Added {formatDate(lecture.created_at)}
                            </p>
                          )}
                        </div>
                      </div>

                      {lecture.content && (
                        <div className="mb-4">
                          <p className="text-white whitespace-pre-wrap">{lecture.content}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 mt-4">
                        {lecture.video_url && (
                          <a
                            href={lecture.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-200 rounded-lg hover:bg-red-500/30 transition-colors border border-red-400/30"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                            Watch Video
                          </a>
                        )}
                        {lecture.pdf_url && (
                          <a
                            href={buildAssetUrl(lecture.pdf_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-200 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-400/30"
                          >
                            <FileText className="w-5 h-5" />
                            View PDF
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white">Assignments</h2>
            {isTeacherOrAdmin && (
              <Button onClick={() => setShowAssignmentForm(!showAssignmentForm)}>
                {showAssignmentForm ? 'Cancel' : 'New Assignment'}
              </Button>
            )}
          </div>

          {isTeacherOrAdmin && showAssignmentForm && (
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">Create Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div>
                    <Label htmlFor="assignmentTitle">Title</Label>
                    <Input
                      id="assignmentTitle"
                      value={assignmentForm.title}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="assignmentDescription">Description</Label>
                    <Textarea
                      id="assignmentDescription"
                      value={assignmentForm.description}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="assignmentTotalMarks">Total Marks</Label>
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
                  </div>
                  <div>
                    <Label htmlFor="assignmentPdf">Upload PDF (optional)</Label>
                    <Input
                      id="assignmentPdf"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setAssignmentPdf(e.target.files?.[0] || null)}
                      className="text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="assignmentDueDate">Due Date</Label>
                    <Input
                      id="assignmentDueDate"
                      type="datetime-local"
                      value={assignmentForm.dueDate}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                    />
                  </div>
                  <Button type="submit">Create Assignment</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {assignments.length === 0 ? (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4 md:p-6 lg:p-8 text-center text-muted-foreground">
                No assignments available yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2 md:gap-3 lg:gap-4">
              {assignments.map((assignment) => (
                <Card 
                  key={assignment.assignment_id} 
                  className="border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer hover:border-purple-500/30"
                  onClick={() => {
                    if (user?.role === 'student') {
                      router.push(`/student/assignments/${assignment.assignment_id}`);
                    } else if (user?.role === 'teacher' || user?.role === 'admin') {
                      router.push(`/teacher/assignments/${assignment.assignment_id}`);
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-2 md:gap-3 lg:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white text-lg hover:text-purple-300 transition-colors">
                            {assignment.title}
                          </h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                            Assignment
                          </span>
                        </div>
                        {assignment.description && (
                          <p className="text-muted-foreground mt-1 line-clamp-2">{assignment.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 lg:gap-4 mt-3 text-sm">
                          {assignment.pdf_url && (
                            <a
                              href={assignment.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300"
                            >
                              <FileText className="h-4 w-4" />
                              PDF
                            </a>
                          )}
                          {assignment.due_date && (
                            <span className="text-purple-300">
                              Due: {formatDate(assignment.due_date)}
                            </span>
                          )}
                          {assignment.total_marks && (
                            <span className="text-muted-foreground">
                              {assignment.total_marks} points
                            </span>
                          )}
                        </div>
                      </div>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quizzes Tab */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white">Quizzes</h2>
            {isTeacherOrAdmin && (
              <Button onClick={() => setShowQuizForm(!showQuizForm)}>
                {showQuizForm ? 'Cancel' : 'New Quiz'}
              </Button>
            )}
          </div>

          {isTeacherOrAdmin && showQuizForm && (
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">Create Quiz</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateQuiz} className="space-y-4">
                  <div>
                    <Label htmlFor="quizTitle">Title</Label>
                    <Input
                      id="quizTitle"
                      value={quizForm.title}
                      onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="quizDescription">Description</Label>
                    <Textarea
                      id="quizDescription"
                      value={quizForm.description}
                      onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                    <div>
                      <Label htmlFor="quizTotalMarks">Total Marks</Label>
                      <Input
                        id="quizTotalMarks"
                        type="number"
                        value={quizForm.totalMarks}
                        onChange={(e) => setQuizForm({ ...quizForm, totalMarks: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="quizTimeLimit">Time Limit (minutes, optional)</Label>
                      <Input
                        id="quizTimeLimit"
                        type="number"
                        value={quizForm.timeLimit}
                        onChange={(e) => setQuizForm({ ...quizForm, timeLimit: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="quizDueDate">Due Date</Label>
                    <Input
                      id="quizDueDate"
                      type="datetime-local"
                      value={quizForm.dueDate}
                      onChange={(e) => setQuizForm({ ...quizForm, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quizPdf">Upload PDF (optional)</Label>
                    <Input
                      id="quizPdf"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setQuizPdf(e.target.files?.[0] || null)}
                      className="text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="googleFormsUrl">Google Forms URL (optional)</Label>
                    <Input
                      id="googleFormsUrl"
                      type="url"
                      value={quizForm.googleFormsUrl}
                      onChange={(e) => setQuizForm({ ...quizForm, googleFormsUrl: e.target.value })}
                      placeholder="https://docs.google.com/forms/..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste your Google Forms URL here to embed the quiz
                    </p>
                  </div>
                  <Button type="submit">Create Quiz</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {quizzes.length === 0 ? (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4 md:p-6 lg:p-8 text-center text-muted-foreground">
                No quizzes available yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2 md:gap-3 lg:gap-4">
              {quizzes.map((quiz) => (
                <Card key={quiz.quiz_id} className="border-white/10 bg-white/5">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg">{quiz.title}</h3>
                        <p className="text-muted-foreground mt-1">{quiz.description}</p>
                        {quiz.pdf_url && (
                          <a
                            href={quiz.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-purple-400 hover:text-purple-300 text-sm"
                          >
                            📄 View Quiz PDF →
                          </a>
                        )}
                        {quiz.google_forms_url && (
                          <div className="mt-3">
                            <a
                              href={quiz.google_forms_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-purple-400 hover:text-purple-300 text-sm mb-2"
                            >
                              📝 Open Google Forms Quiz →
                            </a>
                            <iframe
                              src={quiz.google_forms_url.replace('/viewform', '/viewform?embedded=true')}
                              width="100%"
                              height="600"
                              frameBorder="0"
                              marginHeight={0}
                              marginWidth={0}
                              className="mt-2 rounded-lg"
                            >
                              Loading…
                            </iframe>
                          </div>
                        )}
                        <div className="flex gap-2 md:gap-3 lg:gap-4 mt-3 text-sm text-muted-foreground">
                          <span>Marks: {quiz.total_marks}</span>
                          {quiz.time_limit && <span>Time: {quiz.time_limit} min</span>}
                          {quiz.due_date && (
                            <span>Due: {new Date(quiz.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      {user?.role === 'student' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/student/quizzes/${quiz.quiz_id}`)}
                        >
                          Take Quiz
                        </Button>
                      )}
                      {isTeacherOrAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/quizzes/${quiz.quiz_id}/questions`)}
                        >
                          Manage
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assessments Tab */}
      {activeTab === 'assessments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white">Assessments</h2>
            {isTeacherOrAdmin && (
              <Button onClick={() => setShowAssessmentForm(!showAssessmentForm)}>
                {showAssessmentForm ? 'Cancel' : 'New Assessment'}
              </Button>
            )}
          </div>

          {isTeacherOrAdmin && showAssessmentForm && (
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">Create Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAssessment} className="space-y-4">
                  <div>
                    <Label htmlFor="assessmentTitle">Title</Label>
                    <Input
                      id="assessmentTitle"
                      value={assessmentForm.title}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="assessmentDescription">Description</Label>
                    <Textarea
                      id="assessmentDescription"
                      value={assessmentForm.description}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                    <div>
                      <Label htmlFor="assessmentType">Assessment Type</Label>
                      <select
                        id="assessmentType"
                        value={assessmentForm.assessmentType}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, assessmentType: e.target.value })}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-white"
                        required
                      >
                        <option value="midterm">Midterm</option>
                        <option value="final">Final Exam</option>
                        <option value="project">Project</option>
                        <option value="presentation">Presentation</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="assessmentWeight">Weight Percentage (%)</Label>
                      <Input
                        id="assessmentWeight"
                        type="number"
                        step="0.01"
                        value={assessmentForm.weightPercentage}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, weightPercentage: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                    <div>
                      <Label htmlFor="assessmentTotalMarks">Total Marks</Label>
                      <Input
                        id="assessmentTotalMarks"
                        type="number"
                        value={assessmentForm.totalMarks}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, totalMarks: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="assessmentDueDate">Due Date</Label>
                      <Input
                        id="assessmentDueDate"
                        type="datetime-local"
                        value={assessmentForm.dueDate}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="assessmentPdf">Upload PDF (optional)</Label>
                    <Input
                      id="assessmentPdf"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setAssessmentPdf(e.target.files?.[0] || null)}
                      className="text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>
                  <Button type="submit">Create Assessment</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {assessments.length === 0 ? (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4 md:p-6 lg:p-8 text-center text-muted-foreground">
                No assessments available yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2 md:gap-3 lg:gap-4">
              {assessments.map((assessment) => (
                <Card key={assessment.assessment_id} className="border-white/10 bg-white/5">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg">{assessment.title}</h3>
                        <p className="text-muted-foreground mt-1">{assessment.description}</p>
                        {assessment.pdf_url && (
                          <a
                            href={assessment.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-purple-400 hover:text-purple-300 text-sm"
                          >
                            📄 View Assessment PDF →
                          </a>
                        )}
                        <div className="flex gap-2 md:gap-3 lg:gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="capitalize">Type: {assessment.assessment_type}</span>
                          <span>Marks: {assessment.total_marks}</span>
                          <span>Weight: {assessment.weight_percentage}%</span>
                          {assessment.due_date && (
                            <span>Due: {new Date(assessment.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      {user?.role === 'student' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/student/assessments/${assessment.assessment_id}`)}
                        >
                          Submit
                        </Button>
                      )}
                      {isTeacherOrAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/assessments/${assessment.assessment_id}/submissions`)}
                        >
                          View Submissions
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Participants Tab */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Course Participants</h2>
          {participants.length === 0 ? (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-4 md:p-6 lg:p-8 text-center text-muted-foreground">
                No participants enrolled yet.
              </CardContent>
            </Card>
          ) : (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-white font-semibold">Name</th>
                        <th className="text-left p-4 text-white font-semibold">Email</th>
                        <th className="text-left p-4 text-white font-semibold">Major</th>
                        <th className="text-left p-4 text-white font-semibold">Enrollment Year</th>
                        <th className="text-left p-4 text-white font-semibold">Term</th>
                        <th className="text-left p-4 text-white font-semibold">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((participant) => (
                        <tr key={participant.enrollment_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 text-white">{participant.student_name || 'N/A'}</td>
                          <td className="p-4">
                            <a
                              href={`mailto:${participant.student_email}`}
                              className="text-purple-400 hover:text-purple-300 underline"
                            >
                              {participant.student_email || 'N/A'}
                            </a>
                          </td>
                          <td className="p-4 text-muted-foreground">{participant.major || 'N/A'}</td>
                          <td className="p-4 text-muted-foreground">{participant.enrollment_year || 'N/A'}</td>
                          <td className="p-4 text-muted-foreground">{participant.term || 'N/A'}</td>
                          <td className="p-4">
                            {participant.grade ? (
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-200 rounded-full text-sm border border-purple-400/30">
                                {participant.grade}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
