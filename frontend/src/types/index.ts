export type Course = {
  course_id: number;
  code: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  credits?: number;
  content?: string;
  created_at?: string;
};

export type Lecture = {
  lecture_id: number;
  course_id: number;
  title: string;
  video_url?: string;
  pdf_url?: string;
  lecture_number?: number;
  content?: string;
  created_at?: string;
};

export type Enrollment = {
  enrollment_id: number;
  course_id: number;
  term: string;
  enrollment_date: string;
  title: string;
  description: string;
  code: string;
};

export type Assignment = {
  assignment_id: number;
  course_id: number;
  title: string;
  description?: string;
  due_date?: string;
  pdf_url?: string;
  total_marks?: number;
  created_at?: string;
  submission_status?: string;
};

export type Specialty = {
  specialty_id: number;
  specialty_name: string;
  description?: string;
  acquired_date?: string;
};

export type TeachingAssignment = {
  assignment_id: number;
  teacher_id: number;
  course_id: number;
  term: string;
  section: string;
  status: 'pending' | 'approved' | 'rejected';
  assigned_date: string;
  code?: string;
  title?: string;
  credits?: number;
  teacher_name?: string;
  teacher_email?: string;
};

export type Suggestion = {
  suggestion_id: number;
  teacher_id: number;
  course_id: number;
  suggestion_text: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
  admin_response?: string;
  code?: string;
  title?: string;
  teacher_name?: string;
  teacher_email?: string;
};

export type Submission = {
  submission_id: number;
  assignment_id: number;
  student_id: number;
  file_url?: string;
  file_urls?: string[];
  submission_text?: string;
  submitted_at: string;
  grade?: string;
  marks_obtained?: number;
  total_marks?: number;
  feedback?: string;
  assignment_title?: string;
  course_title?: string;
  code?: string;
  student_name?: string;
  student_email?: string;
  major?: string;
  plagiarism_score?: number;
  plagiarism_report?: string;
  plagiarism_checked?: boolean;
};

export type User = {
  user_id: number;
  full_name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  created_at?: string;
};

export type StudentProfile = {
  student_id: number;
  user_id: number;
  enrollment_year?: number;
  major?: string;
  enrollments?: Enrollment[];
};

export type TeacherProfile = {
  teacher_id: number;
  user_id: number;
  hire_date?: string;
  resume?: string;
  department?: string;
  specialties?: Specialty[];
  assignments?: TeachingAssignment[];
};

export type Analytics = {
  totals: {
    users: number;
    students: number;
    teachers: number;
    courses: number;
    enrollments: number;
  };
  enrollmentStats: Array<{
    course_id: number;
    code: string;
    title: string;
    enrollment_count: number;
  }>;
  teacherLoad: Array<{
    teacher_id: number;
    full_name: string;
    assignment_count: number;
    specialty_count: number;
    courses_taught: number;
  }>;
  pendingRequests: {
    teachingAssignments: number;
    suggestions: number;
  };
  courseDemand: Array<{
    course_id: number;
    code: string;
    title: string;
    enrollment_count: number;
    terms_offered: number;
  }>;
};

export type GPA = {
  gpa: number;
  totalCredits: number;
  coursesCount: number;
};

export type Announcement = {
  announcement_id: number;
  course_id: number;
  created_by: number;
  title: string;
  content: string;
  attachment_url?: string;
  created_at: string;
  updated_at?: string;
  creator_name?: string;
  creator_email?: string;
  creator_role?: string;
};

export type AnnouncementComment = {
  comment_id: number;
  announcement_id: number;
  created_by: number;
  content: string;
  created_at: string;
  updated_at?: string;
  creator_name?: string;
  creator_email?: string;
  creator_role?: string;
};

export type Quiz = {
  quiz_id: number;
  course_id: number;
  title: string;
  description?: string;
  total_marks: number;
  time_limit?: number;
  due_date?: string;
  pdf_url?: string;
  google_forms_url?: string;
  created_by: number;
  created_at: string;
  updated_at?: string;
  creator_name?: string;
};

export type QuizQuestion = {
  question_id: number;
  quiz_id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  marks: number;
  options?: Record<string, string>; // For multiple choice: {"A": "option1", "B": "option2"}
  correct_answer?: string;
  order_number: number;
  created_at: string;
};

export type QuizSubmission = {
  submission_id: number;
  quiz_id: number;
  student_id: number;
  answers?: Record<string, string>;
  file_urls?: string[];
  score?: number;
  max_score?: number;
  plagiarism_score?: number;
  plagiarism_checked: boolean;
  plagiarism_report?: string;
  submitted_at: string;
  graded_at?: string;
  graded_by?: number;
  feedback?: string;
  student_name?: string;
  student_email?: string;
};

export type Assessment = {
  assessment_id: number;
  course_id: number;
  title: string;
  description?: string;
  assessment_type: 'midterm' | 'final' | 'project' | 'presentation' | 'other';
  total_marks: number;
  weight_percentage: number;
  due_date?: string;
  pdf_url?: string;
  created_by: number;
  created_at: string;
  updated_at?: string;
  creator_name?: string;
};

export type AssessmentSubmission = {
  submission_id: number;
  assessment_id: number;
  student_id: number;
  file_urls?: string[];
  submission_text?: string;
  score?: number;
  max_score?: number;
  plagiarism_score?: number;
  plagiarism_checked: boolean;
  plagiarism_report?: string;
  submitted_at: string;
  graded_at?: string;
  graded_by?: number;
  feedback?: string;
  student_name?: string;
  student_email?: string;
};

export type PlagiarismReport = {
  sources: Array<{
    url: string;
    similarity: number;
    matchedText?: string;
    type?: string;
  }>;
  similarity: number;
  checkedAt: string;
  error?: string;
};

export type Notification = {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'grade' | 'announcement' | 'deadline' | 'assignment' | 'quiz' | 'assessment' | 'system' | 'enrollment';
  related_id?: number;
  related_type?: string;
  read: boolean;
  created_at: string;
};

export type StudentProgress = {
  progress_id: number;
  student_id: number;
  course_id: number;
  course_title?: string;
  course_code?: string;
  assignments_completed: number;
  assignments_total: number;
  quizzes_completed: number;
  quizzes_total: number;
  assessments_completed: number;
  assessments_total: number;
  average_score: number | null;
  last_updated: string;
};

