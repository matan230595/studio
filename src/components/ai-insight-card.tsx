
'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, RefreshCw } from 'lucide-react';
import type { Transaction } from '@/lib/data';
import { askAssistant } from '@/ai/flows/assistant-flow';
import { calculateFinancialSummary, getLateTransactions, getUpcomingPayments } from '@/lib/financial-utils';

interface AiInsightCardProps {
  transactions: Transaction[] | null;
}

export function AiInsightCard({ transactions }: AiInsightCardProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const financialData = useMemo(() => {
    if (!transactions) return null;
    const summary = calculateFinancialSummary(transactions);
    const lateTransactions = getLateTransactions(transactions);
    const upcomingPayments = getUpcomingPayments(transactions);
    return { summary, lateTransactions, upcomingPayments, transactions };
  }, [transactions]);

  const fetchInsight = async () => {
    if (!financialData) {
        setError('לא ניתן להפיק תובנה ללא נתונים פיננסיים.');
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setInsight(null);

    try {
      const response = await askAssistant({
        query: "אני מסתכל על לוח המחוונים שלי עכשיו. נתח את המצב הפיננסי שלי וספק לי תובנה מרכזית אחת או המלצה לפעולה. התמקד בזיהוי דפוסים חשובים, סיכונים עתידיים, או הזדמנויות לשיפור. היה תמציתי ומעשי.",
        history: [],
        ...financialData,
      });
      setInsight(response.response);
    } catch (e) {
      console.error('Failed to fetch AI insight:', e);
      setError('אירעה שגיאה בעת הפקת התובנה.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-lg">תובנת AI</CardTitle>
        </div>
        <Button size="icon" variant="ghost" onClick={fetchInsight} disabled={isLoading || !transactions}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center">
        {isLoading && (
            <div className="space-y-2 w-full">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        )}
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        {insight && <p className="text-sm text-foreground">{insight}</p>}
         {!isLoading && !error && !insight && (
            <p className="text-sm text-muted-foreground text-center">לחץ על כפתור הרענון כדי לקבל תובנה.</p>
        )}
      </CardContent>
    </Card>
  );
}
