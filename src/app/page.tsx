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
import { debts as initialDebts } from '@/lib/data';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [debts] = React.useState(initialDebts);

  const totalDebt = debts.filter(l => l.status !== 'paid').reduce((acc, debt) => acc + debt.amount, 0);
  const monthlyRepayment = debts.filter(l => l.status === 'active').reduce((acc, debt) => acc + debt.nextPaymentAmount, 0);
  const lateDebts = debts.filter(l => l.status === 'late').length;

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        <header>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            סקירת חובות
          </h1>
          <p className="text-muted-foreground">
            ברוך הבא! הנה סיכום מצב החובות שלך.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">חוב פתוח</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">₪{totalDebt.toLocaleString('he-IL')}</div>
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
              <CardTitle className="text-sm font-medium">חובות בפיגור</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">{lateDebts}</div>
              <p className="text-xs text-muted-foreground">
                {lateDebts > 0 ? 'יש לטפל בדחיפות' : 'כל החובות משולמים בזמן'}
              </p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">חובות פעילים</CardTitle>
              <Hourglass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-headline text-2xl font-bold">+{debts.filter(l => l.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground">+1 מהחודש שעבר</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
            <CardHeader>
              <CardTitle className="font-headline">פעולות מהירות</CardTitle>
              <CardDescription>
                נווט לעמודים הרלוונטיים לניהול החובות שלך.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button asChild>
                <Link href="/debts">ניהול חובות</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/reports">מעבר לדוחות</Link>
              </Button>
            </CardContent>
        </Card>

    </div>
  );
}
