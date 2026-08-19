import { config } from 'dotenv';
config({ path: ['.env.local', '.env'] });

import '@/ai/flows/extract-question-metadata.ts';
import '@/ai/flows/process-question-document.ts';
