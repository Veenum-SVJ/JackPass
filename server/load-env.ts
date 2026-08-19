import { config } from 'dotenv';

// Load environment variables from .env.local (Vite convention) or .env.
// This module MUST be imported first so server modules see env vars at load time.
config({ path: ['.env.local', '.env'] });
