'use client';
import React from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  PlusCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection } from 'firebase/firestore';
import type { Transaction } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TransactionForm } from '@/components/transaction-form';
import { useToast } from '@/hooks/use-toast';
import {
  calculateFinancialSummary,
  getUpcomingPayments,
  getUrgentItem,
} from '@/lib/financial-utils';
import { DaysToDueBadge } from '@/components/days-to-due-badge';
import { AppLogo } from '@/components/app-logo';
import { AiInsightCard } from '@/components/ai-insight-card';

export default function Dashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formType, setFormType] = React.useState<'debt' | 'loan'>('debt');

  const transactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'transactions');
  }, [user, firestore]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  const entityName = formType === 'debt' ? 'חוב' : 'הלוואה';

  const handleFormFinished = (newTransaction: Transaction) => {
    if (!user || !firestore) return;
    const { id, ...dataToSave } = newTransaction;
    const transactionWithUser = { ...dataToSave, userId: user.uid };

    const collectionRef = collection(firestore, 'users', user.uid, 'transactions');
    addDocumentNonBlocking(collectionRef, transactionWithUser);
    toast({
      title: `${entityName} חדש נוסף`,
      description: `${entityName} חדש עבור ${newTransaction.creditor.name} נוסף למערכת.`,
    });

    setIsFormOpen(false);
  };

  const { stats, upcomingPaymentsChartData, urgentItem } = React.useMemo(() => {
    if (!transactions)
      return {
        stats: { totalOwed: 0, monthlyRepayment: 0, totalLoans: 0, totalDebts: 0, lateItems: 0, activeItems: 0 },
        upcomingPaymentsChartData: [],
        urgentItem: null,
      };

    const stats = calculateFinancialSummary(transactions);

    const upcomingForChart = getUpcomingPayments(transactions, 7);
    const chartData = upcomingForChart.map(t => ({
      date: format(new Date(t.dueDate), 'dd/MM'),
      name: t.creditor.name,
      סכום: t.nextPaymentAmount || t.amount,
    }));

    const urgent = getUrgentItem(transactions);

    return { stats, upcomingPaymentsChartData: chartData, urgentItem: urgent };
  }, [transactions]);

  if (isLoading) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <header>
          <div className="flex items-center gap-3">
             <AppLogo className="h-10 w-10 text-primary" />
            <Skeleton className="h-9 w-64" />
          </div>
          <Skeleton className="h-5 w-80 mt-2" />
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-40 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 animate-in fade-in-50">
      <div className="flex items-center justify-between">
        <header className="text-right">
          <div className="flex items-center gap-3">
            <AppLogo className="h-12 w-12 text-primary" />
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              ברוך הבא, {user?.displayName || 'משתמש'}!
            </h1>
          </div>
          <p className="text-muted-foreground">הנה סיכום מצב ההתחייבויות שלך.</p>
        </header>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setFormType('debt');
              setIsFormOpen(true);
            }}
          >
            <PlusCircle className="ms-2 h-4 w-4" />
            <span>הוספת חוב</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setFormType('loan');
              setIsFormOpen(true);
            }}
          >
            <PlusCircle className="ms-2 h-4 w-4" />
            <span>הוספת הלוואה</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-right">
            <CardTitle className="text-sm font-medium">סך התחייבויות</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-right">
            <div className="font-headline text-2xl font-bold">
              ₪{stats.totalOwed.toLocaleString('he-IL')}
            </div>
            <p className="text-xs text-muted-foreground">כולל חובות והלוואות פעילים.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-right">
            <CardTitle className="text-sm font-medium">החזר חודשי צפוי</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-right">
            <div className="font-headline text-2xl font-bold">
              ₪{stats.monthlyRepayment.toLocaleString('he-IL')}
            </div>
            <p className="text-xs text-muted-foreground">מתוך הלוואות בתשלומים.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-right">
            <CardTitle className="text-sm font-medium">סך הלוואות</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="text-right">
            <div className="font-headline text-2xl font-bold">
              ₪{stats.totalLoans.toLocaleString('he-IL')}
            </div>
            <p className="text-xs text-muted-foreground">סך יתרת ההלוואות הפתוחות.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-right">
            <CardTitle className="text-sm font-medium">סך חובות</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="text-right">
            <div className="font-headline text-2xl font-bold">
              ₪{stats.totalDebts.toLocaleString('he-IL')}
            </div>
            <p className="text-xs text-muted-foreground">סך יתרת החובות הפתוחים.</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="grid gap-6 lg:col-span-3">
             <AiInsightCard transactions={transactions} />
            <Card>
                <CardHeader className="text-right">
                    <CardTitle>7 התשלומים הקרובים</CardTitle>
                    <CardDescription>תצוגה ויזואלית של התשלומים הבאים שלך.</CardDescription>
                </CardHeader>
                <CardContent>
                    {upcomingPaymentsChartData.length > 0 ? (
                    <ChartContainer
                        config={{ סכום: { label: 'סכום', color: 'hsl(var(--primary))' } }}
                        className="h-[250px] w-full"
                    >
                        <BarChart
                        data={upcomingPaymentsChartData}
                        margin={{ top: 20, right: 0, bottom: 0, left: 0 }}
                        >
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={value => `₪${value / 1000}k`}
                        />
                        <Tooltip cursor={true} content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey="סכום" fill="var(--color-סכום)" radius={8} />
                        </BarChart>
                    </ChartContainer>
                    ) : (
                    <div className="h-[250px] flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
                        <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                        <p>מעולה! אין תשלומים קרובים באופק.</p>
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>
        <Card className="lg:col-span-2">
            <CardHeader className="text-right">
                <CardTitle className="flex items-center gap-2 justify-end">
                פריט דחוף לטיפול
                {urgentItem?.status === 'late' ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                ) : urgentItem ? (
                    <Clock className="h-5 w-5 text-yellow-500" />
                ) : null}
                </CardTitle>
                <CardDescription>
                {urgentItem?.status === 'late'
                    ? 'ההתחייבות הבאה עברה את מועד הפירעון.'
                    : urgentItem ? 'התשלום הבא שלך מתקרב.' : 'כל ההתחייבויות שלך מסודרות.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {urgentItem ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                    <span className="font-medium">{urgentItem.creditor.name}</span>
                    <Badge variant={urgentItem.type === 'loan' ? 'default' : 'secondary'}>
                        {urgentItem.type === 'loan' ? 'הלוואה' : 'חוב'}
                    </Badge>
                    </div>
                    <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">סכום:</span>
                    <span className="font-bold text-lg">
                        ₪{(urgentItem.nextPaymentAmount || urgentItem.amount).toLocaleString('he-IL')}
                    </span>
                    </div>
                    <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">תאריך יעד:</span>
                    <DaysToDueBadge dueDate={urgentItem.dueDate} status={urgentItem.status} />
                    </div>
                    <Button asChild className="w-full">
                    <Link href={urgentItem.type === 'loan' ? '/loans' : '/debts'}>
                        צפה בפרטים
                    </Link>
                    </Button>
                </div>
                ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                    <p>אין פריטים דחופים. כל הכבוד!</p>
                    <p className="text-xs mt-2">כל ההתחייבויות משולמות בזמן.</p>
                </div>
                )}
            </CardContent>
        </Card>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent dir="rtl" className="sm:max-w-[425px] max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">{`הוספת ${entityName} חדש`}</DialogTitle>
            <DialogDescription>{`מלא את הפרטים כדי להוסיף ${entityName} חדש למערכת.`}</DialogDescription>
          </DialogHeader>
          <TransactionForm onFinished={handleFormFinished} transaction={null} fixedType={formType} />
        </DialogContent>
      </Dialog>
    </main>
  );
}
