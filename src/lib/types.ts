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

export interface Question {
  id: string;
  title: string;
  institution: string;
  course: string;
  year: number;
  semester: 'First' | 'Second';
  type: 'Objective' | 'Theory' | 'Mixed';
  status: 'pending' | 'approved' | 'rejected';
  contentPreview: string;
  fullContent: string;
  answer?: string;
  explanation?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  uploaderId?: string;
  lecturerId?: string;
  lecturer?: LecturerSummary;
  createdAt?: string; // ISO string from Supabase
  updatedAt?: string;
}