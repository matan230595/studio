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
import { googleAI } from '@genkit-ai/google-genai';

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
  userId: z.string().describe("The user's unique ID for rate limiting."),
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
*   **פורמט פלט:** חובה להחזיר אובייקט JSON בלבד, ללא שום טקסט או הסבר נוסף. האובייקט חייב להתאים למבנה הבא:
  \`\`\`json
  {
    "response": "התשובה המפורטת שלך כאן"
  }
  \`\`\`

עכשיו, נתח את המידע וספק תשובה מקיפה וחכמה בתוך אובייקט ה-JSON.`,
});

// In-memory store for rate limiting. In a production environment, use a persistent store like Redis.
const userRequestTimestamps: Record<string, number> = {};
const RATE_LIMIT_MS = 5000; // 5 seconds between requests per user

/**
 * A wrapper function that adds a retry mechanism with exponential backoff for API calls
 * that fail with a 429 "Too Many Requests" error.
 * @param fn The async function to execute.
 * @param maxRetries The maximum number of retries.
 * @returns The result of the provided function.
 */
async function withRetryOn429<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      const msg = String(err?.message || err);
      const is429 = msg.includes("429") || msg.includes("Too Many Requests");

      if (!is429 || attempt >= maxRetries) {
        // If it's not a 429 error or we've exceeded retries, re-throw the error.
        throw err;
      }

      attempt++;

      // Extract the suggested wait time from the error message, otherwise use exponential backoff.
      const retryAfterMatch = msg.match(/retry in ([0-9.]+)s/i);
      const waitMs = retryAfterMatch
        ? Math.ceil(parseFloat(retryAfterMatch[1]) * 1000)
        : 1000 * 2 ** attempt;
      
      console.log(`Rate limit hit. Retrying in ${waitMs}ms... (Attempt ${attempt})`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }
}

const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    // 1. Per-user rate limiting
    const { userId } = input;
    const now = Date.now();
    const lastRequestTime = userRequestTimestamps[userId];

    if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_MS) {
      return { response: "אתה שולח בקשות מהר מדי. אנא המתן מספר שניות ונסה שוב." };
    }
    userRequestTimestamps[userId] = now;
    
    // 2. Call the LLM with retry logic
    const llmResponse = await withRetryOn429(() => prompt(input));
    const responseText = llmResponse.text;

    try {
      // Find the start and end of the JSON object
      const startIndex = responseText.indexOf('{');
      const endIndex = responseText.lastIndexOf('}');

      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        const jsonString = responseText.substring(startIndex, endIndex + 1);
        const parsed = JSON.parse(jsonString);
        return AssistantOutputSchema.parse(parsed);
      } else {
        // If no JSON object is found, fallback to treating the whole response as a string.
        console.warn("No valid JSON object found in AI response. Using fallback.", "Raw response:", responseText);
        return { response: responseText };
      }
    } catch (e) {
      console.error("Failed to parse AI JSON response:", e, "Raw response:", responseText);
      // If parsing still fails, use the fallback.
      return { response: responseText };
    }
  }
);
