"use client";
import React from 'react';
import { DollarSign, Percent, Hourglass, AlertCircle } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Transaction } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

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

  const stats = React.useMemo(() => {
    if (!transactions) return { totalOwed: 0, monthlyRepayment: 0, lateItems: 0, activeItems: 0 };
    const totalOwed = transactions.filter(l => l.status !== 'paid').reduce((acc, item) => acc + item.amount, 0);
    const monthlyRepayment = transactions.filter(d => d.status === 'active' && d.paymentType === 'installments').reduce((acc, item) => acc + (item.nextPaymentAmount || 0), 0);
    const lateItems = transactions.filter(l => l.status === 'late').length;
    const activeItems = transactions.filter(l => l.status === 'active').length;
    return { totalOwed, monthlyRepayment, lateItems, activeItems };
  }, [transactions]);

  const lateTransactions = React.useMemo(() => 
    transactions?.filter(t => t.status === 'late').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) || [], 
  [transactions]);

  const upcomingTransactions = React.useMemo(() =>
    transactions
    ?.filter(t => t.status === 'active' && new Date(t.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5) || [],
  [transactions]);


  if (isLoading) {
    return (
        <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
            <header>
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-80 mt-2" />
            </header>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /><Skeleton className="h-4 w-40 mt-2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /><Skeleton className="h-4 w-40 mt-2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /><Skeleton className="h-4 w-40 mt-2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /><Skeleton className="h-4 w-40 mt-2" /></CardContent></Card>
            </div>
             <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                <Card><CardHeader><CardTitle>פריטים דחופים (באיחור)</CardTitle></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                <Card><CardHeader><CardTitle>5 התשלומים הקרובים</CardTitle></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
             </div>
        </div>
    );
  }


  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        <header>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            סקירת התחייבויות
          </h1>
          <p className="text-muted-foreground">
            ברוך הבא! הנה סיכום מצב ההתחייבויות שלך.
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
              <CardTitle className="text-sm font-medium">פריטים בפיגור</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">{stats.lateItems}</div>
              <p className="text-xs text-muted-foreground">
                {stats.lateItems > 0 ? 'יש לטפל בדחיפות' : 'כל ההתחייבויות משולמות בזמן'}
              </p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">התחייבויות פעילות</CardTitle>
              <Hourglass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">{stats.activeItems}</div>
              <p className="text-xs text-muted-foreground">מסך כלל ההתחייבויות.</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
                <CardTitle>פריטים דחופים (באיחור)</CardTitle>
                <CardDescription>התחייבויות שמועד פירעונן עבר ויש לטפל בהן.</CardDescription>
            </CardHeader>
            <CardContent>
                {lateTransactions.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>שם</TableHead>
                            <TableHead>סכום</TableHead>
                            <TableHead>ת. יעד</TableHead>
                            <TableHead>סוג</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {lateTransactions.map((item) => (
                        <TableRow key={item.id} className="text-destructive hover:bg-destructive/10">
                            <TableCell className="font-medium">{item.creditor.name}</TableCell>
                            <TableCell>₪{item.amount.toLocaleString('he-IL')}</TableCell>
                            <TableCell>{item.dueDate}</TableCell>
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
                <div className="text-center text-sm text-muted-foreground py-8">
                    <p>אין פריטים בפיגור. כל הכבוד!</p>
                    <p className='text-xs mt-2'>תוכלו להוסיף חובות והלוואות חדשים בעמודים הרלוונטיים.</p>
                </div>
                )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle>5 התשלומים הקרובים</CardTitle>
                <CardDescription>התחייבויות שיש לשלם בקרוב. מומלץ להיערך מראש.</CardDescription>
            </CardHeader>
            <CardContent>
                {upcomingTransactions.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>שם</TableHead>
                            <TableHead>סכום</TableHead>
                            <TableHead>ת. יעד</TableHead>
                            <TableHead>סוג</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {upcomingTransactions.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.creditor.name}</TableCell>
                                <TableCell>₪{(item.nextPaymentAmount || item.amount).toLocaleString('he-IL')}</TableCell>
                                <TableCell>{item.dueDate}</TableCell>
                                <TableCell>
                                    <Link href={item.type === 'loan' ? '/loans' : '/debts'}>
                                      <Badge variant="outline">{item.type === 'loan' ? 'הלוואה' : 'חוב'}</Badge>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                    <p>אין תשלומים קרובים במערכת.</p>
                </div>
                )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
