// Summarizes case documents using AI to extract key information.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeCaseDocumentsInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A case document (PDF, image, etc.), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SummarizeCaseDocumentsInput = z.infer<typeof SummarizeCaseDocumentsInputSchema>;

const SummarizeCaseDocumentsOutputSchema = z.object({
  summary: z.string().describe('A summary of the key information in the case document.'),
});
export type SummarizeCaseDocumentsOutput = z.infer<typeof SummarizeCaseDocumentsOutputSchema>;

export async function summarizeCaseDocuments(
  input: SummarizeCaseDocumentsInput
): Promise<SummarizeCaseDocumentsOutput> {
  return summarizeCaseDocumentsFlow(input);
}

const summarizeCaseDocumentsPrompt = ai.definePrompt({
  name: 'summarizeCaseDocumentsPrompt',
  input: {schema: SummarizeCaseDocumentsInputSchema},
  output: {schema: SummarizeCaseDocumentsOutputSchema},
  prompt: `You are a lawyer specializing in quickly understanding case documents.

You will be provided with a case document. Extract and summarize the key textual information within it. 
If the document is an image, describe the relevant information. 
If the document format is not suitable for text extraction (like a spreadsheet or binary file), state clearly that the format is unsupported for analysis.

Document: {{media url=documentDataUri}}`,
});

const summarizeCaseDocumentsFlow = ai.defineFlow(
  {
    name: 'summarizeCaseDocumentsFlow',
    inputSchema: SummarizeCaseDocumentsInputSchema,
    outputSchema: SummarizeCaseDocumentsOutputSchema,
  },
  async input => {
    const {output} = await summarizeCaseDocumentsPrompt(input);
    return output!;
  }
);
