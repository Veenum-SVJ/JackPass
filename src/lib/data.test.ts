import { describe, it, expect, vi } from 'vitest';
import { getQuestionById } from './data';
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc, Timestamp } from 'firebase/firestore';

// Mock the entire 'firebase/firestore' module
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    doc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    startAfter: vi.fn(),
  };
});

// Mock the db object from firebase-client
vi.mock('@/lib/firebase-client', () => ({
  db: {},
}));

describe('getQuestionById', () => {
  it('should return the question with correct previous and next question IDs', async () => {
    // Arrange: Create mock data
    const mockQuestions = [
      { id: 'q1', data: () => ({ title: 'Question 1', status: 'approved', createdAt: Timestamp.fromMillis(1000) }) },
      { id: 'q2', data: () => ({ title: 'Question 2', status: 'approved', createdAt: Timestamp.fromMillis(2000) }) },
      { id: 'q3', data: () => ({ title: 'Question 3', status: 'approved', createdAt: Timestamp.fromMillis(3000) }) },
    ];

    const currentQuestionDoc = {
      id: 'q2',
      exists: () => true,
      data: () => ({ title: 'Question 2', status: 'approved', createdAt: Timestamp.fromMillis(2000) }),
    };

    const prevQuestionSnapshot = {
      empty: false,
      docs: [{ id: 'q1', data: () => ({ title: 'Question 1', status: 'approved', createdAt: Timestamp.fromMillis(1000) }) }],
    };

    const nextQuestionSnapshot = {
      empty: false,
      docs: [{ id: 'q3', data: () => ({ title: 'Question 3', status: 'approved', createdAt: Timestamp.fromMillis(3000) }) }],
    };

    // Mock Firestore functions
    vi.mocked(getDoc).mockResolvedValue(currentQuestionDoc);

    vi.mocked(getDocs).mockImplementation(async (q) => {
      // This is a simplified mock. A real implementation would inspect the query 'q'.
      // Based on the logic in getQuestionById, we can infer which query is which.
      // The first getDocs call is for the 'next' question, the second is for the 'previous'.
      if (vi.mocked(getDocs).mock.calls.length === 1) {
        return nextQuestionSnapshot;
      }
      return prevQuestionSnapshot;
    });

    // Act: Call the function
    const result = await getQuestionById('q2');

    // Assert: Check the result
    expect(result).not.toBeNull();
    expect(result?.id).toBe('q2');
    expect(result?.title).toBe('Question 2');
    expect(result?.nextQuestionId).toBe('q3');
    expect(result?.prevQuestionId).toBe('q1');
  });
});
