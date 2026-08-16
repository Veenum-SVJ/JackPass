## Task 1.3: Migrate question storage to Supabase (PostgreSQL) for GET endpoint
Goal: Replace file-based question storage in src/app/api/questions/route.ts with Supabase queries using a server-side Supabase client.

Files to Create/Modify:
- Create: src/lib/supabase-server.ts — Supabase client for server-side (API routes) using anon key
- Modify: src/app/api/questions/route.ts — use Supabase to fetch approved questions
- Modify: supabase/schema.sql — ensure RLS policies are set up for questions table (we'll add them)
- Create: supabase/migration.sql — optional, but we can add RLS policies here

Exact Code to Write:

```typescript
// src/lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js';

export const createServerSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Note: using service role key for server-side to bypass RLS during migration; we will adjust later
);
```

```typescript
// src/app/api/questions/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import type { Question } from '@/lib/types';

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map Supabase question to our Question type (if needed, adjust field names)
    const questions: Question[] = data.map((q: any) => ({
      id: q.id,
      title: q.title,
      institution: q.institution,
      course: q.course,
      year: q.year,
      semester: q.semester as 'First' | 'Second',
      type: q.type as 'Objective' | 'Theory' | 'Mixed',
      status: q.status as 'pending' | 'approved' | 'rejected',
      contentPreview: q.content_preview,
      fullContent: q.full_content,
      answer: q.answer,
      explanation: q.explanation,
      fileUrl: q.file_url,
      uploaderId: q.uploader_id,
      createdAt: q.created_at,
      updatedAt: q.updated_at,
    }));

    return NextResponse.json(questions);
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
```

```sql
-- supabase/schema.sql (add RLS policies)
-- Enable row level security on questions table
alter table public.questions enable row level security;

-- Policy: Allow public to read only approved questions
create policy "Public can read approved questions"
on public.questions for select
using (status = 'approved');

-- Policy: Allow authenticated users (service role) to do everything
-- Note: Service role bypasses RLS by default, but we can also create a policy for completeness
create policy "Service role has full access"
on public.questions
for all
using (true)
with check (true);
```

Commands to Run & Expected Output:
```bash
# Apply the RLS policies to your Supabase database (you can run this in the Supabase SQL editor)
# Then test the API endpoint
npm run dev
# Expected: app starts without errors
# Then manually test: curl http://localhost:9002/api/questions
# Expected: JSON array of questions (possibly empty if no data yet)
```

Acceptance Criteria:
- [ ] src/lib/supabase-server.ts exists and exports a server Supabase client
- [ ] src/app/api/questions/route.ts uses Supabase to fetch questions
- [ ] No more file-based storage (data/questions.json) is used for the API
- [ ] RLS policies are added to schema.sql (to be applied to Supabase DB)
- [ ] The API endpoint returns JSON without server errors
- [ ] TypeScript check passes
- [ ] Lint passes

Error Handling:
- If Supabase connection fails: check that SUPABASE_SERVICE_ROLE_KEY is set in .env.local
- If query returns error: check table name and column names match schema
- Do NOT claim done until you have verified the API endpoint returns a JSON response (even if empty array)

Git Commit Message: feat: migrate question GET endpoint to Supabase and add RLS policies