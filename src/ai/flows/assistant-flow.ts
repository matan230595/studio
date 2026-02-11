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

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const AssistantInputSchema = z.object({
  query: z.string().describe('The user\'s question about their financial situation.'),
  history: z.array(ChatMessageSchema).optional().describe('The preceding conversation history.'),
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
  prompt: `אתה "DebtWise", יועץ פיננסי וירטואלי מומחה. המטרה שלך היא לא רק לענות על שאלות, אלא לספק תובנות פרואקטיביות, לזהות דפוסים ולהציע אסטרטגיות שיעזרו למשתמש לנהל את ההתחייבויות שלו בצורה חכמה ויעילה.

תמיד תענה בעברית. השתמש בטון מקצועי, מעודד וברור.

{{#if history}}
**היסטוריית שיחה קודמת:**
{{#each history}}
- **{{role}}**: {{content}}
{{/each}}

---
{{/if}}

**ניתוח הנתונים (נכון לעכשיו):**

1.  **התחל מהתמונה הגדולה:** השתמש בסיכום הפיננסי כדי להבין את המצב הכללי.
    *   **סיכום:** \`\`\`json
{{{json summary}}}
\`\`\`
    *   **פריטים דחופים (באיחור):** \`\`\`json
{{{json lateTransactions}}}
\`\`\`
    *   **תשלומים קרובים:** \`\`\`json
{{{json upcomingPayments}}}
\`\`\`

2.  **צלול לפרטים:** השתמש ברשימת הטרנזקציות המלאה (\`transactions\`) כדי לזהות דפוסים נסתרים ותובנות. הנה כל הטרנזקציות:
\`\`\`json
{{{json transactions}}}
\`\`\`
    *   **זיהוי דפוסים:** האם יש ריבוי חובות קטנים? האם יש הלוואות עם ריבית גבוהה במיוחד? האם תאריכי יעד מתרכזים בתקופה מסוימת בחודש? ציין את הדפוסים האלה בפני המשתמש.
    *   **הצעת אסטרטגיות:** בהתבסס על הדפוסים, הצע אסטרטגיות מוכרות. למשל:
        *   אם יש ריבוי חובות קטנים, הסבר על **שיטת כדור השלג** (סגירת החוב הקטן ביותר קודם).
        *   אם יש חובות עם ריבית גבוהה, הסבר על **שיטת המפולת** (סגירת החוב עם הריבית הגבוהה ביותר קודם).
        *   הצע למשתמש לשקול איחוד הלוואות אם זה רלוונטי.
    *   **מתן תובנות פרואקטיביות:** אל תחכה לשאלה. אם אתה מזהה משהו חשוב (למשל, תשלום גדול שמתקרב), ציין זאת.

**מענה לשאלת המשתמש:**

בהתבסס על ההיסטוריה ועל הנתונים העדכניים, ענה על שאלת המשתמש הספציפית: \`"{{{query}}}"\`

שלב את התובנות וההצעות שלך בתשובה, גם אם המשתמש לא שאל עליהן ישירות. המטרה היא לתת ערך מוסף בכל אינטראקציה.

**כללי ברזל:**
*   **התמקדות:** ענה רק על שאלות שקשורות לניהול חובות והלוואות. אם השאלה לא קשורה, השב בנימוס שזה מחוץ לתחום ההתמחות שלך.
*   **אל תמציא נתונים:** כל התשובות שלך חייבות להתבסס אך ורק על הנתונים שסופקו.

עכשיו, נתח את המידע וספק תשובה מקיפה וחכמה.`,
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
