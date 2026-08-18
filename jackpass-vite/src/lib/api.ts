import { getSessionToken } from './supabase';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Fetch wrapper for the JackPass API.
 * Automatically attaches the user's Supabase session token as a Bearer header.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
  { auth = true }: { auth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(init.headers);

  if (auth) {
    const token = await getSessionToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(path, { ...init, headers });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body && typeof body.error === 'string') {
        message = body.error;
      }
    } catch {
      // Non-JSON error body; keep the default message
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}
