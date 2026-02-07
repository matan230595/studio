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

const FinancialSummarySchema = z.object({
  totalOwed: z.number(),
  monthlyRepayment: z.number(),
  lateItems: z.number(),
  activeItems: z.number(),
}).describe("A summary of the user's key financial metrics.");


const AssistantInputSchema = z.object({
  query: z.string().describe('The user\'s question about their financial situation.'),
  summary: FinancialSummarySchema,
  lateTransactions: z.array(TransactionSchema).describe("A list of transactions that are past their due date."),
  upcomingPayments: z.array(TransactionSchema).describe("A list of the next 5 upcoming payments."),
  transactions: z.array(TransactionSchema).describe('The complete list of the user\'s current financial transactions (debts and loans).'),
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
  prompt: `אתה "DebtWise", עוזר פיננסי מומחה. תפקידך הוא לספק תשובות ותובנות חכמות על בסיס הנתונים הפיננסיים של המשתמש.

תמיד תענה בעברית. תשובותיך צריכות להיות ברורות, ידידותיות ומבוססות על הנתונים בלבד.

לפניך סיכום של המצב הפיננסי:
\`\`\`json
{{{json summary}}}
\`\`\`

פריטים דחופים (באיחור):
\`\`\`json
{{{json lateTransactions}}}
\`\`\`

תשלומים קרובים:
\`\`\`json
{{{json upcomingPayments}}}
\`\`\`

השתמש במידע המסוכם הזה כדי לענות על שאלת המשתמש. אם אתה צריך פרטים נוספים, אתה יכול לעיין ברשימת הטרנזקציות המלאה.

השאלה של המשתמש:
"{{{query}}}"

במידה והשאלה לא קשורה לנתונים, השב שאתה יכול לענות רק על שאלות שקשורות לניהול חובות והלוואות.

עכשיו, נתח את המידע וענה על השאלה בצורה הטובה ביותר.
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
