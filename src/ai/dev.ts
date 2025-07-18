import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-case-documents.ts';
import '@/ai/flows/chatbot.ts';
import '@/ai/flows/estimate-case-cost.ts';
