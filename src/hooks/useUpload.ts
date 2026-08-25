import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface UploadQuestionInput {
  institution: string;
  course: string;
  courseCode?: string;
  year: string;
  semester: 'First' | 'Second';
  files?: File[];
  fileUrl?: string;
}

export interface UploadQuestionResult {
  success: boolean;
  uploadId: string;
  fileUrl: string;
  message: string;
}

export interface ProcessDocumentInput {
  fileUrl: string;
}

export interface ProcessDocumentResult {
  institutionName: string;
  courseName: string;
  courseCode?: string;
  academicSession: string;
  semester: 'First' | 'Second';
  fullContent: string;
}

/**
 * Upload a question file (or Google Drive link) for processing.
 */
export function useUploadQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadQuestionInput): Promise<UploadQuestionResult> => {
      const formData = new FormData();
      formData.append('institution', input.institution);
      formData.append('course', input.course);
      if (input.courseCode) formData.append('courseCode', input.courseCode);
      formData.append('year', input.year);
      formData.append('semester', input.semester);

      if (input.files && input.files.length > 0) {
        input.files.forEach((file) => formData.append('questionFiles', file));
      } else if (input.fileUrl) {
        formData.append('fileUrl', input.fileUrl);
      }

      return apiFetch<UploadQuestionResult>('/api/upload', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['user-uploads'] });
    },
  });
}

/**
 * Run the AI image-scanning flow server-side (reads image content to extract structured fields).
 */
export function useProcessDocument() {
  return useMutation({
    mutationFn: async (input: ProcessDocumentInput): Promise<ProcessDocumentResult> => {
      return apiFetch<ProcessDocumentResult>('/api/ai/process-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
    },
  });
}
