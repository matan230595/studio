"use client";
import React from 'react';
import { DollarSign, Percent, Hourglass, AlertCircle, TrendingUp, TrendingDown, Clock, CheckCircle2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Transaction } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { isSameMonth, parseISO, isAfter, format } from 'date-fns';
import { he } from 'date-fns/locale';

const statusMap: { [key: string]: { text: string; variant: 'default' | 'secondary' | 'destructive' } } = {
  active: { text: 'פעיל', variant: 'default' },
  paid: { text: 'שולם', variant: 'secondary' },
  late: { text: 'בפיגור', variant: 'destructive' },
};

export default function Dashboard() {
  const { user } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'transactions');
  }, [user, firestore]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  const { stats, upcomingPaymentsChartData, lateTransactions, upcomingTransactions } = React.useMemo(() => {
    if (!transactions) return { stats: { totalOwed: 0, monthlyRepayment: 0, lateItems: 0, activeItems: 0, totalLoans: 0, totalDebts: 0 }, upcomingPaymentsChartData: [], lateTransactions: [], upcomingTransactions: [] };
    
    const now = new Date();
    const activeTransactions = transactions.filter(t => t.status !== 'paid');

    const totalOwed = activeTransactions.reduce((acc, item) => acc + item.amount, 0);
    const monthlyRepayment = transactions.filter(d => d.status === 'active' && d.paymentType === 'installments').reduce((acc, item) => acc + (item.nextPaymentAmount || 0), 0);
    const lateItems = transactions.filter(l => l.status === 'late').length;
    const activeItems = activeTransactions.length;
    const totalLoans = activeTransactions.filter(t => t.type === 'loan').reduce((acc, t) => acc + t.amount, 0);
    const totalDebts = activeTransactions.filter(t => t.type === 'debt').reduce((acc, t) => acc + t.amount, 0);

    const stats = { totalOwed, monthlyRepayment, lateItems, activeItems, totalLoans, totalDebts };

    const upcomingThisMonth = transactions
        .filter(t => t.status === 'active' && isSameMonth(parseISO(t.dueDate), now) && isAfter(parseISO(t.dueDate), now))
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const chartData = upcomingThisMonth.map(t => ({
      date: format(parseISO(t.dueDate), 'dd/MM'),
      name: t.creditor.name,
      סכום: t.nextPaymentAmount || t.amount
    }));
    
    const late = transactions?.filter(t => t.status === 'late').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) || [];
    
    const upcoming = transactions
      ?.filter(t => t.status === 'active' && new Date(t.dueDate) >= new Date())
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5) || [];

    return { stats, upcomingPaymentsChartData: chartData, lateTransactions: late, upcomingTransactions: upcoming };
  }, [transactions]);


  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:gap-8 md:p-8">
        <header>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-80 mt-2" />
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /><Skeleton className="h-4 w-40 mt-2" /></CardContent></Card>)}
        </div>
        <div className="grid gap-6 md:grid-cols-5">
          <Card className="md:col-span-3"><CardHeader><Skeleton className="h-7 w-48" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
          <Card className="md:col-span-2"><CardHeader><Skeleton className="h-7 w-32" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:gap-8 md:p-8 animate-in fade-in-50">
        <header>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            ברוך הבא, {user?.displayName || 'משתמש'}!
          </h1>
          <p className="text-muted-foreground">
            הנה סיכום מצב ההתחייבויות שלך.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סך התחייבויות</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">₪{stats.totalOwed.toLocaleString('he-IL')}</div>
              <p className="text-xs text-muted-foreground">כולל חובות והלוואות פעילים.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">החזר חודשי צפוי</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">₪{stats.monthlyRepayment.toLocaleString('he-IL')}</div>
              <p className="text-xs text-muted-foreground">מתוך הלוואות בתשלומים.</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">הלוואות פעילות</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">₪{stats.totalLoans.toLocaleString('he-IL')}</div>
              <p className="text-xs text-muted-foreground">סך יתרת ההלוואות הפתוחות.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">חובות פעילים</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">₪{stats.totalDebts.toLocaleString('he-IL')}</div>
              <p className="text-xs text-muted-foreground">סך יתרת החובות הפתוחים.</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
                <CardTitle>תשלומים קרובים החודש</CardTitle>
                <CardDescription>תצוגה ויזואלית של תשלומים שיש לבצע החודש.</CardDescription>
            </CardHeader>
            <CardContent>
                {upcomingPaymentsChartData.length > 0 ? (
                  <ChartContainer config={{ סכום: { label: 'סכום', color: "hsl(var(--primary))" } }} className="h-[250px] w-full">
                    <BarChart data={upcomingPaymentsChartData} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `₪${value/1000}k`} />
                      <Tooltip 
                        cursor={true}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Bar dataKey="סכום" fill="var(--color-סכום)" radius={8} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[250px] flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                    <p>מעולה! אין תשלומים קרובים החודש.</p>
                  </div>
                )}
            </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      פריטים דחופים (באיחור)
                  </CardTitle>
                  <CardDescription>התחייבויות שמועד פירעונן עבר ויש לטפל בהן.</CardDescription>
              </CardHeader>
              <CardContent>
                  {lateTransactions.length > 0 ? (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>שם</TableHead>
                              <TableHead>סכום</TableHead>
                              <TableHead>סוג</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                      {lateTransactions.map((item) => (
                          <TableRow key={item.id} className="text-destructive hover:bg-destructive/10">
                              <TableCell className="font-medium">{item.creditor.name}</TableCell>
                              <TableCell>₪{item.amount.toLocaleString('he-IL')}</TableCell>
                              <TableCell>
                                  <Link href={item.type === 'loan' ? '/loans' : '/debts'}>
                                      <Badge variant="destructive">{item.type === 'loan' ? 'הלוואה' : 'חוב'}</Badge>
                                  </Link>
                              </TableCell>
                          </TableRow>
                      ))}
                      </TableBody>
                  </Table>
                  ) : (
                  <div className="h-[250px] flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
                       <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                      <p>אין פריטים בפיגור. כל הכבוד!</p>
                      <p className='text-xs mt-2'>כל ההתחייבויות משולמות בזמן.</p>
                  </div>
                  )}
              </CardContent>
            </Card>
        </div>
    </div>
  );
}
