import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useQuestions } from './useQuestions';
import type { Question } from '@/lib/types';

const mockQuestion: Question = {
  id: 'q1',
  title: 'Calculus I',
  institution: 'University of Lagos',
  course: 'MTH 101',
  year: '2023/2024',
  semester: 'First',
  type: 'Objective',
  status: 'approved',
  contentPreview: 'Find the derivative of x^2.',
  fullContent: 'Find the derivative of x^2.',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useQuestions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and returns the approved questions list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockQuestion],
      })
    );

    const { result } = renderHook(() => useQuestions(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([mockQuestion]);
    expect(fetch).toHaveBeenCalledWith('/api/questions', expect.objectContaining({ headers: expect.any(Headers) }));
  });

  it('throws on a failed request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to fetch questions' }),
      })
    );

    const { result } = renderHook(() => useQuestions(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
