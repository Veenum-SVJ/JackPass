## Task 1.7: Database Schema Updates - Add uploader_id to question_uploads
Goal: Add `uploader_id` column to `question_uploads` table to track who uploaded each file (required for AI flow and audit trail).

### Issue Identified
The `processOcrAsync` function in `src/lib/upload.ts` tries to select `uploader_id` from `question_uploads`, but this column doesn't exist in the current schema.

### Files to Modify
- Modify: `supabase/schema.sql` — Add `uploader_id` column to `question_uploads` table
- Modify: `src/lib/upload.ts` — Ensure `uploaderId` is saved when creating upload record

### Exact Code to Write

```sql
-- supabase/schema.sql (update the question_uploads table definition)
-- Uploads table for tracking file uploads
create table public.question_uploads (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references public.questions on delete set null,
  uploader_id uuid references auth.users,  -- ADD THIS LINE
  file_name text not null,
  file_url text not null,
  file_type text not null,
  file_size bigint,
  upload_status text check (upload_status in ('uploading', 'processed', 'failed')) default 'uploading',
  ocr_text text,
  ocr_confidence jsonb,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone
);

-- Add index for uploader_id queries
create index idx_question_uploads_uploader on public.question_uploads(uploader_id);
```

```typescript
// src/lib/upload.ts (update the uploadRecord in processQuestionUpload)
  // 2. Create initial upload record with "uploading" status
  // OCR will be processed asynchronously after this returns
  const uploadRecord = {
    id: uuidv4(),
    uploader_id: uploaderId,  // ADD THIS LINE
    file_name: file.name,
    file_url: fileUrl,
    file_type: file.type,
    file_size: file.size,
    upload_status: 'uploading' as const,
    ocr_text: null,
    ocr_confidence: null,
    uploaded_at: new Date().toISOString(),
    processed_at: null
  };
```

### Commands to Run
```bash
# 1. Apply updated schema in Supabase SQL Editor (run the ALTER TABLE)
# ALTER TABLE public.question_uploads ADD COLUMN uploader_id uuid REFERENCES auth.users;
# CREATE INDEX idx_question_uploads_uploader ON public.question_uploads(uploader_id);

# 2. Run typecheck and lint
npm run typecheck
npm run lint

# 3. Test upload flow
npm run dev
```

### Acceptance Criteria
- [ ] `uploader_id` column exists in `question_uploads` table
- [ ] Index created on `uploader_id`
- [ ] Upload record saves `uploader_id` correctly
- [ ] `processOcrAsync` can successfully query `uploader_id`
- [ ] TypeScript check passes
- [ ] Lint passes

### Git Commit Message
feat: add uploader_id to question_uploads for audit trail and AI flow