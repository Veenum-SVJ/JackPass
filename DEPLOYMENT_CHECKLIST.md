## Post-Code Configuration Checklist (Manual Steps Required)

These steps CANNOT be done via code - they require manual action in Supabase Dashboard and your local environment.

### 1. Apply RLS Policies in Supabase SQL Editor
**Location**: Supabase Dashboard → SQL Editor → New Query

Copy and paste the ENTIRE contents of `supabase/schema.sql` and run it.

**What this does:**
- Creates all tables (user_profiles, questions, question_uploads)
- Enables Row Level Security
- Creates policies for public read (approved questions only)
- Creates policies for service role (full access for API routes)

### 2. Create Storage Bucket in Supabase Dashboard
**Location**: Supabase Dashboard → Storage → New Bucket

**Settings:**
- **Name**: `question-files`
- **Public bucket**: ✅ YES (or private with signed URLs)
- **File size limit**: 10 MB (or your preferred limit)
- **Allowed MIME types**: `application/pdf`, `image/jpeg`, `image/png`

### 3. Add Required Environment Variables to `.env.local`

Edit `.env.local` and add/replace with REAL values:

```env
# Supabase (REQUIRED - get from Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google AI (REQUIRED for AI extraction - get from https://aistudio.google.com/apikey)
GOOGLE_AI_API_KEY=AIzaSy...

# Hugging Face (OPTIONAL - for real OCR, fallback to mock if not set)
# Get from https://huggingface.co/settings/tokens
HF_TOKEN=hf_...

# Paystack (REQUIRED for payments - get from https://dashboard.paystack.com/#/settings/developer)
PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Verify the Complete Pipeline

After completing steps 1-3:

```bash
# 1. Start the dev server
npm run dev

# 2. Test the pipeline:
# a) Go to http://localhost:9002/signup - create an account
# b) Go to http://localhost:9002 - you should see the home page
# c) Upload a test PDF/image via the upload UI (or API):
#    POST http://localhost:9002/api/upload with file + metadata
# d) Check Supabase Dashboard:
#    - Storage → question-files → should have your uploaded file
#    - Table Editor → question_uploads → should have record with status "processing" → "processed"
#    - Table Editor → questions → should have a new "pending" question after AI extraction
# e) Admin approval:
#    - Go to /admin (need admin user setup)
#    - Approve the question
# f) Search:
#    - Go to home page, the approved question should appear in search results
```

---

## Verification Commands

```bash
# Test environment validation
npm run validate:env
# Should output: ✅ All required environment variables are set!

# Test API endpoints
curl http://localhost:9002/api/questions
# Should return [] (empty array) or list of approved questions

# Test typecheck and lint
npm run typecheck && npm run lint
# Both should pass
```

---

## Optional: Set up Admin User

To access `/admin` routes, you need to:
1. Create a user via signup
2. In Supabase Dashboard → Table Editor → user_profiles → edit the user → add `is_admin: true` (or create an admin role system)
3. Or run SQL: `UPDATE auth.users SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{is_admin}', 'true') WHERE email = 'your-email@example.com';`

---

## Production Deployment Checklist (Future)

When ready to deploy to Vercel/Netlify:
- [ ] Add all env vars to Vercel/Netlify dashboard
- [ ] Update `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Configure Supabase Auth redirect URLs for production
- [ ] Set up Paystack webhook URL for production
- [ ] Enable Supabase Realtime for live features (if needed)
- [ ] Configure custom domain
- [ ] Set up monitoring (Vercel Analytics, Sentry, etc.)

---

## Git Commit for Configuration Documentation
```bash
git add supabase/schema.sql .env.local.template
git commit -m "docs: add Supabase schema and configuration checklist"
```