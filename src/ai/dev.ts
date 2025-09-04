import { config } from 'dotenv';
config();

import '@/ai/flows/extract-question-metadata.ts';
import '@/ai/flows/process-question-document.ts';
