export type HomeworkExamType = "IELTS" | "PTE" | "General";

export type HomeworkStudent = {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: string | null;
  isMyStudent: boolean | null;
};

export type HomeworkAssignment = {
  id: string;
  studentId: string;
  teacherId: string | null;
  examType: HomeworkExamType;
  content: string;
  status: string;
  emailSentAt: string | null;
  emailError: string | null;
  createdAt: string;
};

export type HomeworkAssignmentHistoryItem = Omit<HomeworkAssignment, "content"> & {
  content?: string;
};

export type StudentNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  homeworkId: string | null;
  isRead: boolean;
  createdAt: string;
};
