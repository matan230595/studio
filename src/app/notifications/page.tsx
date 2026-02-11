"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Bell, Banknote, Landmark, BadgeCheck, AlertTriangle, Clock } from 'lucide-react';
import React from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Transaction } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInDays, formatDistanceToNowStrict } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AppLogo } from '@/components/app-logo';

const activityIcons: Record<string, React.ReactElement> = {
    paid: <BadgeCheck className="h-5 w-5 text-green-500" />,
    late: <AlertTriangle className="h-5 w-5 text-red-500" />,
    debt: <Banknote className="h-5 w-5 text-blue-500" />,
    loan: <Landmark className="h-5 w-5 text-purple-500" />,
    default: <Bell className="h-5 w-5 text-muted-foreground" />,
};

const getActivityInfo = (transaction: Transaction) => {
    switch(transaction.status) {
        case 'paid':
            return {
                description: `התשלום בסך ₪${transaction.amount.toLocaleString()} בוצע עבור ${transaction.creditor.name}`,
                icon: activityIcons.paid,
                color: 'text-green-500'
            };
        case 'late':
            return {
                description: `איחור בתשלום בסך ₪${transaction.amount.toLocaleString()} עבור ${transaction.creditor.name}`,
                icon: activityIcons.late,
                color: 'text-red-500'
            };
        case 'active':
        default:
             return {
                description: `התחייבות חדשה נוצרה מול ${transaction.creditor.name}`,
                icon: activityIcons[transaction.type] || activityIcons.default,
                color: 'text-muted-foreground'
            };
    }
};

export default function NotificationsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const transactionsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'transactions');
    }, [user, firestore]);

    const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

    const { upcomingReminders, sortedActivities } = React.useMemo(() => {
        if (!transactions) return { upcomingReminders: [], sortedActivities: [] };
        
        const now = new Date();
        
        const reminders = transactions
            .filter(t => {
                const dueDate = new Date(t.dueDate);
                return t.status === 'active' && differenceInDays(dueDate, now) >= 0 && differenceInDays(dueDate, now) <= 7;
            })
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        const activities = [...transactions].sort((a, b) => (b.startDate ? new Date(b.startDate).getTime() : 0) - (a.startDate ? new Date(a.startDate).getTime() : 0));
        
        return { upcomingReminders: reminders, sortedActivities: activities };
    }, [transactions]);
  
  if (isLoading) {
      return (
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 animate-in fade-in-50">
              <header>
                  <Skeleton className="h-9 w-40" />
                  <Skeleton className="h-5 w-80 mt-2" />
              </header>
              <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-5 w-72 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-16 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-32" />
                        <Skeleton className="h-5 w-56 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
              </div>
          </main>
      )
  }
  
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 animate-in fade-in-50">
      <header>
        <div className="flex items-center gap-3">
          <AppLogo className="h-10 w-10 text-primary" />
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            התראות ופיד פעילות
          </h1>
        </div>
        <p className="text-muted-foreground">
          כל העדכונים והתזכורות במקום אחד כדי לעזור לך להישאר מעודכן.
        </p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>תזכורות לתשלומים קרובים</CardTitle>
            <CardDescription>
                {upcomingReminders.length > 0 ? `יש לך ${upcomingReminders.length} תשלומים שמתקרבים בשבוע הקרוב.` : 'אין תשלומים דחופים בשבוע הקרוב.'}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
            {upcomingReminders.length > 0 ? upcomingReminders.map((transaction) => {
                const dueDate = new Date(transaction.dueDate);
                const daysUntilDue = formatDistanceToNowStrict(dueDate, { addSuffix: true, locale: he });

                return (
                    <div key={`reminder-${transaction.id}`} className="flex items-center gap-4 rounded-lg border-r-4 border-yellow-400 bg-yellow-400/10 p-4 transition-colors hover:bg-yellow-400/20">
                        <div className="bg-yellow-400/20 rounded-full p-2 hidden sm:block">
                            <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="flex-grow">
                            <p className="font-medium">
                                תשלום עבור {transaction.creditor.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                סכום: ₪{(transaction.nextPaymentAmount || transaction.amount).toLocaleString('he-IL')}
                            </p>
                        </div>
                        <div className="text-sm font-semibold text-yellow-700 text-end shrink-0">
                            {daysUntilDue}
                        </div>
                    </div>
                )
            }) : (
                <div className="text-center text-muted-foreground py-10">
                    <BadgeCheck className="mx-auto h-12 w-12 text-green-500/50" />
                    <p className="mt-4 text-sm">מעולה! אין תשלומים דחופים.</p>
                </div>
            )}
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>פיד פעילות אחרונות</CardTitle>
          <CardDescription>
            {sortedActivities.length > 0 ? `מציג את הפעילויות האחרונות במערכת.` : 'אין פעילויות חדשות.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedActivities.length > 0 ? sortedActivities.map((transaction) => {
                const { description, icon, color } = getActivityInfo(transaction);
                return (
                    <div key={transaction.id} className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent">
                        <div className={cn("mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent", color)}>
                           {icon}
                        </div>
                        <div className="flex-grow">
                            <p className="font-medium">
                                {description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatDistanceToNowStrict(new Date(transaction.startDate || transaction.dueDate), { addSuffix: true, locale: he })}</span>
                                &middot;
                                <div className="flex items-center gap-1">
                                    {transaction.type === 'loan' ? <Landmark className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                                    <span>{transaction.type === 'loan' ? 'הלוואה' : 'חוב'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }) : (
                <div className="text-center text-muted-foreground py-10">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-sm">אין פעילויות להציג כרגע.</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
