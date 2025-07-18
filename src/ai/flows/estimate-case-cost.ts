'use server';
/**
 * @fileOverview Estimates the cost of a legal case.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { Case } from '@/lib/data';

const EstimateCaseCostInputSchema = z.object({
  caseType: z.enum(['Litige civil', 'Droit pénal', 'Droit de la famille', 'Droit des sociétés', 'Autre']),
  description: z.string().describe('A detailed description of the legal case.'),
});
export type EstimateCaseCostInput = z.infer<typeof EstimateCaseCostInputSchema>;

const EstimateCaseCostOutputSchema = z.object({
    estimatedCost: z.string().describe("The estimated cost for the case, formatted as a currency string (e.g., '1,500€ - 3,000€')."),
    justification: z.string().describe('A brief justification for the estimated cost, explaining the factors considered.')
});
export type EstimateCaseCostOutput = z.infer<typeof EstimateCaseCostOutputSchema>;


export async function estimateCaseCost(input: EstimateCaseCostInput): Promise<EstimateCaseCostOutput> {
  return estimateCaseCostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateCaseCostPrompt',
  input: {schema: EstimateCaseCostInputSchema},
  output: {schema: EstimateCaseCostOutputSchema},
  prompt: `You are an experienced lawyer providing a preliminary cost estimate for a potential new case.
  
Based on the case type and description provided, give a rough estimate of the legal fees. The estimate should be a price range.
Also provide a short justification explaining the main factors for this cost (e.g., complexity, expected duration, standard procedures).

Do not give legal advice. This is strictly for cost estimation.

Case Type: {{{caseType}}}
Description: {{{description}}}
`,
});

const estimateCaseCostFlow = ai.defineFlow(
  {
    name: 'estimateCaseCostFlow',
    inputSchema: EstimateCaseCostInputSchema,
    outputSchema: EstimateCaseCostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
