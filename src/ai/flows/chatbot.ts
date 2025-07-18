// Provides a preliminary legal chatbot for basic guidance and FAQs.
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ChatbotInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe("The conversation history."),
  question: z.string().describe("The user's latest question."),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

const ChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot\'s response to the question.'),
});
export type ChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

export async function askChatbot(input: ChatbotInput): Promise<ChatbotOutput> {
  return chatbotFlow(input);
}

const chatbotPrompt = ai.definePrompt({
  name: 'chatbotPrompt',
  input: {schema: ChatbotInputSchema},
  output: {schema: ChatbotOutputSchema},
  prompt: `You are a helpful and reassuring preliminary legal chatbot for the AvocatConnect platform. Your goal is to provide basic legal information and answer frequently asked questions.

IMPORTANT: You must never give legal advice. Always remind the user that you are a bot and that they should consult with their lawyer for any legal advice.

Here is the conversation history:
{{#each history}}
{{role}}: {{{content}}}
{{/each}}

Here is the user's new question:
{{question}}

Please provide a helpful, general response and remember to include a disclaimer.`,
});

const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async input => {
    const {output} = await chatbotPrompt(input);
    return output!;
  }
);
