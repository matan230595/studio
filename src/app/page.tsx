"use client";
import React from 'react';
import { DollarSign, Percent, Hourglass, AlertCircle, Banknote, Landmark } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { transactions as initialTransactions } from '@/lib/data';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [transactions] = React.useState(initialTransactions);

  const totalOwed = transactions.filter(l => l.status !== 'paid').reduce((acc, item) => acc + item.amount, 0);
  const monthlyRepayment = transactions.filter(d => d.status === 'active' && d.paymentType === 'installments').reduce((acc, item) => acc + (item.nextPaymentAmount || 0), 0);
  const lateItems = transactions.filter(l => l.status === 'late').length;
  const activeItems = transactions.filter(l => l.status === 'active').length;

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
              <div className="font-headline text-2xl font-bold">₪{totalOwed.toLocaleString('he-IL')}</div>
              <p className="text-xs text-muted-foreground">+2.5% מהחודש שעבר</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">החזר חודשי צפוי</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">₪{monthlyRepayment.toLocaleString('he-IL')}</div>
              <p className="text-xs text-muted-foreground">+1.2% מהחודש שעבר</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">פריטים בפיגור</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">{lateItems}</div>
              <p className="text-xs text-muted-foreground">
                {lateItems > 0 ? 'יש לטפל בדחיפות' : 'כל ההתחייבויות משולמות בזמן'}
              </p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">התחייבויות פעילות</CardTitle>
              <Hourglass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">+{activeItems}</div>
              <p className="text-xs text-muted-foreground">+1 מהחודש שעבר</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
            <CardHeader>
              <CardTitle className="font-headline">פעולות מהירות</CardTitle>
              <CardDescription>
                נווט לעמודים הרלוונטיים לניהול ההתחייבויות שלך.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/debts">
                    <Banknote className="ms-2" />
                    ניהול חובות
                </Link>
              </Button>
               <Button asChild>
                <Link href="/loans">
                    <Landmark className="ms-2" />
                    ניהול הלוואות
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/reports">מעבר לדוחות</Link>
              </Button>
            </CardContent>
        </Card>

    </div>
  );
}
