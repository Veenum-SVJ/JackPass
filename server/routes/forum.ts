import { Router } from 'express';
import { createServerSupabase } from '../../src/lib/supabase-server';
import { getBearerToken, getUserFromRequest, requireAuth } from '../middleware';
import { writeLimiter, voteLimiter } from '../rate-limit';

export const forumRouter = Router();

interface ForumPostRow {
  id: string;
  user_id: string | null;
  title: string;
  description: string;
  category: string;
  university: string | null;
  course: string | null;
  created_at: string;
}

interface VoteRow {
  post_id: string;
  user_id: string;
}

interface ReplyRow {
  id: string;
  post_id: string;
  user_id: string | null;
  body: string;
  created_at: string;
}

const CATEGORIES = [
  'General Discussions',
  'Course Help',
  'Past Questions Requests',
  'Study Tips',
  'Faculty Groups',
  'University-Specific Threads',
];

function isValidCategory(cat: string): boolean {
  return CATEGORIES.includes(cat);
}

/** GET /api/forum — recent posts with vote/reply counts (public). */
forumRouter.get('/', async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { university, course, category } = req.query;

    let query = supabase
      .from('forum_posts')
      .select('id, user_id, title, description, category, university, course, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (typeof university === 'string' && university) query = query.eq('university', university);
    if (typeof course === 'string' && course) query = query.eq('course', course);
    if (typeof category === 'string' && category && isValidCategory(category)) query = query.eq('category', category);

    const { data: rows, error } = await query;
    if (error) throw error;
    const posts = (rows ?? []) as ForumPostRow[];
    if (posts.length === 0) {
      res.json({ posts: [] });
      return;
    }

    const ids = posts.map((p) => p.id);
    const [votesRes, repliesRes] = await Promise.all([
      supabase.from('forum_votes').select('post_id, user_id').in('post_id', ids),
      supabase.from('forum_replies').select('post_id').in('post_id', ids),
    ]);
    if (votesRes.error) throw votesRes.error;
    if (repliesRes.error) throw repliesRes.error;

    const voteCounts = new Map<string, number>();
    for (const v of (votesRes.data ?? []) as VoteRow[]) {
      voteCounts.set(v.post_id, (voteCounts.get(v.post_id) ?? 0) + 1);
    }
    const replyCounts = new Map<string, number>();
    for (const r of (repliesRes.data ?? []) as Array<{ post_id: string }>) {
      replyCounts.set(r.post_id, (replyCounts.get(r.post_id) ?? 0) + 1);
    }

    // Author display names from user_profiles
    const authorIds = [...new Set(posts.map((p) => p.user_id).filter(Boolean) as string[])];
    const names = new Map<string, string>();
    if (authorIds.length) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name')
        .in('id', authorIds);
      for (const prof of (profiles ?? []) as Array<{ id: string; name: string | null }>) {
        if (prof.name) names.set(prof.id, prof.name);
      }
    }

    // Which posts did the current user vote on?
    const myVoted = new Set<string>();
    if (getBearerToken(req)) {
      const user = await getUserFromRequest(req);
      if (user) {
        const { data: mine } = await supabase
          .from('forum_votes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', ids);
        for (const m of (mine ?? []) as Array<{ post_id: string }>) myVoted.add(m.post_id);
      }
    }

    res.json({
      posts: posts.map((p) => ({
        ...p,
        author: p.user_id ? (names.get(p.user_id) ?? 'Student') : 'Anonymous',
        votes: voteCounts.get(p.id) ?? 0,
        replies: replyCounts.get(p.id) ?? 0,
        myVote: myVoted.has(p.id),
      })),
    });
  } catch (error: any) {
    console.error('Error listing forum posts:', error);
    res.status(500).json({ error: 'Failed to load forum posts' });
  }
});

/** POST /api/forum — create a post (authenticated). */
forumRouter.post('/', requireAuth, writeLimiter, async (req, res) => {
  try {
    const { title, description, category, university, course } = req.body ?? {};
    const user = res.locals.user as { id: string };

    if (!title || typeof title !== 'string' || title.trim().length < 5 || title.length > 200) {
      res.status(400).json({ error: 'Title must be between 5 and 200 characters' });
      return;
    }
    const bodyText = typeof description === 'string' ? description.trim() : '';
    if (bodyText.length > 5000) {
      res.status(400).json({ error: 'Description must be at most 5000 characters' });
      return;
    }
    const cat = typeof category === 'string' && isValidCategory(category) ? category : 'General Discussions';

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('forum_posts')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: bodyText,
        category: cat,
        university: typeof university === 'string' && university.trim() ? university.trim().slice(0, 120) : null,
        course: typeof course === 'string' && course.trim() ? course.trim().slice(0, 120) : null,
      })
      .select('id, user_id, title, description, category, university, course, created_at')
      .single();
    if (error) throw error;

    res.status(201).json({ post: { ...(data as ForumPostRow), author: 'Student', votes: 0, replies: 0, myVote: false } });
  } catch (error: any) {
    console.error('Error creating forum post:', error);
    res.status(500).json({ error: 'Failed to create forum post' });
  }
});

/** POST /api/forum/:id/vote — toggle the current user's vote (authenticated). */
forumRouter.post('/:id/vote', requireAuth, voteLimiter, async (req, res) => {
  try {
    const id = String(req.params.id);
    const user = res.locals.user as { id: string };
    const supabase = createServerSupabase();

    const { data: existing } = await supabase
      .from('forum_votes')
      .select('post_id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    let voted: boolean;
    if (existing) {
      await supabase.from('forum_votes').delete().eq('post_id', id).eq('user_id', user.id);
      voted = false;
    } else {
      await supabase.from('forum_votes').insert({ post_id: id, user_id: user.id });
      voted = true;
    }

    const { count } = await supabase
      .from('forum_votes')
      .select('post_id', { count: 'exact', head: true })
      .eq('post_id', id);

    res.json({ voted, votes: count ?? 0 });
  } catch (error: any) {
    console.error('Error toggling forum vote:', error);
    res.status(500).json({ error: 'Failed to update vote' });
  }
});

/** GET /api/forum/:id/replies — thread for a post (public). */
forumRouter.get('/:id/replies', async (req, res) => {
  try {
    const id = String(req.params.id);
    const supabase = createServerSupabase();
    const { data: rows, error } = await supabase
      .from('forum_replies')
      .select('id, post_id, user_id, body, created_at')
      .eq('post_id', id)
      .order('created_at', { ascending: true })
      .limit(200);
    if (error) throw error;
    const replies = (rows ?? []) as ReplyRow[];

    const authorIds = [...new Set(replies.map((r) => r.user_id).filter(Boolean) as string[])];
    const names = new Map<string, string>();
    if (authorIds.length) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name')
        .in('id', authorIds);
      for (const prof of (profiles ?? []) as Array<{ id: string; name: string | null }>) {
        if (prof.name) names.set(prof.id, prof.name);
      }
    }

    res.json({
      replies: replies.map((r) => ({
        ...r,
        author: r.user_id ? (names.get(r.user_id) ?? 'Student') : 'Anonymous',
      })),
    });
  } catch (error: any) {
    console.error('Error listing forum replies:', error);
    res.status(500).json({ error: 'Failed to load replies' });
  }
});

/** POST /api/forum/:id/replies — add a reply (authenticated). */
forumRouter.post('/:id/replies', requireAuth, writeLimiter, async (req, res) => {
  try {
    const id = String(req.params.id);
    const { body } = req.body ?? {};
    const user = res.locals.user as { id: string };

    if (!body || typeof body !== 'string' || body.trim().length < 1 || body.length > 2000) {
      res.status(400).json({ error: 'Reply must be between 1 and 2000 characters' });
      return;
    }

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('forum_replies')
      .insert({ post_id: id, user_id: user.id, body: body.trim() })
      .select('id, post_id, user_id, body, created_at')
      .single();
    if (error) throw error;

    res.status(201).json({ reply: { ...(data as ReplyRow), author: 'Student' } });
  } catch (error: any) {
    console.error('Error creating forum reply:', error);
    res.status(500).json({ error: 'Failed to create reply' });
  }
});
