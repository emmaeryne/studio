'use server'

import { summarizeCaseDocuments } from '@/ai/flows/summarize-case-documents';
import type { SummarizeCaseDocumentsInput } from '@/ai/flows/summarize-case-documents';

export async function getSummary(input: SummarizeCaseDocumentsInput) {
  try {
    const result = await summarizeCaseDocuments(input);
    return { success: true, summary: result.summary };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'La génération du résumé a échoué.' };
  }
}
