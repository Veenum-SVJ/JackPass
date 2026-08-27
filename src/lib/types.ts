export interface Course {
  name: string;
}

export interface Institution {
  name: string;
  courses: Course[];
}

export interface LecturerSummary {
  id: string;
  name: string;
  institution: string;
  department?: string;
  ratingAvg: number;
  reviewCount: number;
  photoUrl?: string;
}

export interface MarksPart {
  label: string;
  marks: number;
  text?: string;
}

export interface MarksQuestion {
  question: string;
  totalMarks: number;
  parts?: MarksPart[];
}

export interface Question {
  id: string;
  title: string;
  institution: string;
  course: string;
  courseCode?: string;
  year: string; // Academic year range, e.g. '2025/2026'
  semester: 'First' | 'Second';
  type: 'Objective' | 'Theory' | 'Mixed';
  status: 'pending' | 'approved' | 'rejected';
  contentPreview: string;
  fullContent: string;
  answer?: string;
  explanation?: string;
  marksScheme?: MarksQuestion[];
  answerGenerated?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  uploaderId?: string;
  lecturerId?: string;
  lecturer?: LecturerSummary;
  createdAt?: string; // ISO string from Supabase
  updatedAt?: string;
}
