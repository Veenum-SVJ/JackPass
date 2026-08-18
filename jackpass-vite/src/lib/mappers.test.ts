import { describe, expect, it } from 'vitest';
import { mapQuestionRow, type QuestionRow } from './mappers';

describe('mapQuestionRow', () => {
  it('maps snake_case columns to the Question type', () => {
    const row: QuestionRow = {
      id: 'abc-123',
      title: 'Binary Search Tree Operations',
      institution: 'University of Lagos',
      course: 'CSC 301 - Data Structures',
      year: 2023,
      semester: 'First',
      type: 'Theory',
      status: 'approved',
      content_preview: 'Define a binary search tree...',
      full_content: 'Define a binary search tree and describe its operations.',
      answer: 'A BST is a node-based tree...',
      explanation: 'In-order traversal yields sorted order.',
      file_url: 'https://example.com/file.pdf',
      file_name: 'csc301.pdf',
      file_type: 'pdf',
      uploader_id: 'user-1',
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-02T00:00:00.000Z',
    };

    const question = mapQuestionRow(row);

    expect(question.id).toBe('abc-123');
    expect(question.contentPreview).toBe('Define a binary search tree...');
    expect(question.fullContent).toBe('Define a binary search tree and describe its operations.');
    expect(question.fileUrl).toBe('https://example.com/file.pdf');
    expect(question.uploaderId).toBe('user-1');
    expect(question.createdAt).toBe('2023-01-01T00:00:00.000Z');
    expect(question.semester).toBe('First');
    expect(question.type).toBe('Theory');
  });

  it('handles null optional columns', () => {
    const question = mapQuestionRow({
      id: 'x',
      title: 'T',
      institution: 'I',
      course: 'C',
      year: 2024,
      semester: 'Second',
      type: 'Objective',
      status: 'pending',
      content_preview: null,
      full_content: null,
      answer: null,
      explanation: null,
      file_url: null,
      uploader_id: null,
      created_at: null,
      updated_at: null,
    });

    expect(question.contentPreview).toBe('');
    expect(question.fullContent).toBe('');
    expect(question.answer).toBeUndefined();
    expect(question.fileUrl).toBeUndefined();
  });
});
