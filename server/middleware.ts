import type { Request, Response, NextFunction } from 'express';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { isUserAdmin } from '../src/lib/supabase-server';
import { normalizeSupabaseUrl } from '../src/lib/supabase-utils';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Extract the bearer token from an Authorization header.
 */
export function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}

/**
 * Create a Supabase client acting as the user identified by their access token.
 */
export function createUserClient(req: Request): SupabaseClient | null {
  const token = getBearerToken(req);
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  return createClient(normalizeSupabaseUrl(SUPABASE_URL), SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/**
 * Resolve the authenticated user from the request, or null.
 */
export async function getUserFromRequest(req: Request): Promise<User | null> {
  const client = createUserClient(req);
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/**
 * Express middleware: require a valid authenticated user.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.locals.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Express middleware: require an authenticated admin user.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const admin = await isUserAdmin(user.id);
    if (!admin) {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }
    res.locals.user = user;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
}
