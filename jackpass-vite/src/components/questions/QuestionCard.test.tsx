import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuestionCard from './QuestionCard';
import type { Question } from '@/lib/types';

const question: Question = {
  id: 'q1',
  title: 'Binary Search Trees',
  institution: 'University of Lagos',
  course: 'CSC 301',
  year: 2023,
  semester: 'First',
  type: 'Theory',
  status: 'approved',
  contentPreview: 'Describe the operations of a binary search tree.',
  fullContent: 'Describe the operations of a binary search tree.',
};

describe('QuestionCard', () => {
  it('renders question details and links to the detail page', () => {
    render(
      <MemoryRouter>
        <QuestionCard question={question} />
      </MemoryRouter>
    );

    expect(screen.getByText('Binary Search Trees')).toBeInTheDocument();
    expect(screen.getByText('University of Lagos')).toBeInTheDocument();
    expect(screen.getByText('2023 - First')).toBeInTheDocument();
    expect(screen.getByText('Theory')).toBeInTheDocument();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/questions/q1');
  });
});
