'use server';
/**
 * @fileOverview A financial assistant AI agent.
 *
 * - askAssistant - A function that handles the financial analysis process.
 * - AssistantInput - The input type for the askAssistant function.
 * - AssistantOutput - The return type for the askAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['debt', 'loan']),
  creditor: z.object({
    name: z.string(),
    avatar: z.string(),
  }),
  amount: z.number(),
  interestRate: z.number().optional().nullable(),
  status: z.enum(['active', 'paid', 'late']),
  dueDate: z.string(),
  paymentType: z.enum(['single', 'installments']),
  nextPaymentAmount: z.number().optional().nullable(),
  userId: z.string().optional(),
});

const AssistantInputSchema = z.object({
  query: z.string().describe('The user\'s question about their financial situation.'),
  transactions: z.array(TransactionSchema).describe('A list of the user\'s current financial transactions (debts and loans).'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
  response: z.string().describe('The AI\'s answer to the user\'s query.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

export async function askAssistant(input: AssistantInput): Promise<AssistantOutput> {
  return assistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assistantPrompt',
  input: { schema: AssistantInputSchema },
  output: { schema: AssistantOutputSchema },
  prompt: `אתה עוזר פיננסי אישי בשם DebtWise. המטרה שלך היא לענות על שאלות של משתמשים לגבי המצב הפיננסי שלהם, בהתבסס על רשימת ההתחייבויות (חובות והלוואות) המסופקת לך בפורמט JSON.

התשובות שלך חייבות להיות:
- בעברית.
- ברורות, תמציתיות וידידותיות.
- מבוססות אך ורק על הנתונים שקיבלת. אל תמציא מידע.
- אם השאלה לא קשורה לנתונים הפיננסיים, השב שאתה יכול לענות רק על שאלות שקשורות לניהול חובות והלוואות.

הנתונים שברשותך (transactions):
\`\`\`json
{{{json transactions}}}
\`\`\`

השאלה של המשתמש (query):
"{{{query}}}"

שים לב לנתונים כמו: סכום (amount), סטטוס (status), תאריך יעד (dueDate), וסוג (type: debt/loan).
עכשיו, ענה על שאלת המשתמש.
`,
});

const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
