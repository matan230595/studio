"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAiHint, getAvatarUrl } from '@/lib/utils';
import { Bell, Banknote, Landmark, BadgeCheck, AlertTriangle } from 'lucide-react';
import React from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Transaction } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

const activityIcons = {
    paid: <BadgeCheck className="h-5 w-5 text-green-500" />,
    late: <AlertTriangle className="h-5 w-5 text-red-500" />,
    active: <Banknote className="h-5 w-5 text-blue-500" />,
    default: <Bell className="h-5 w-5 text-muted-foreground" />,
};

const getActivityInfo = (transaction: Transaction) => {
    switch(transaction.status) {
        case 'paid':
            return {
                description: `התשלום בוצע עבור ${transaction.creditor.name}`,
                icon: activityIcons.paid
            };
        case 'late':
            return {
                description: `איחור בתשלום עבור ${transaction.creditor.name}`,
                icon: activityIcons.late
            };
        case 'active':
        default:
             return {
                description: `התחייבות חדשה נוצרה מול ${transaction.creditor.name}`,
                icon: activityIcons.active
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

    const sortedActivities = React.useMemo(() => {
        if (!transactions) return [];
        return [...transactions].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    }, [transactions]);
  
  if (isLoading) {
      return (
          <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
              <header>
                  <Skeleton className="h-9 w-40" />
                  <Skeleton className="h-5 w-80 mt-2" />
              </header>
              <Card>
                  <CardHeader>
                      <Skeleton className="h-7 w-32" />
                      <Skeleton className="h-5 w-56 mt-2" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                  </CardContent>
              </Card>
          </div>
      )
  }
  
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          התראות
        </h1>
        <p className="text-muted-foreground">
          כל העדכונים והפעילויות האחרונות במערכת.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>פיד פעילות</CardTitle>
          <CardDescription>
            {sortedActivities.length > 0 ? `מציג את ${sortedActivities.length} הפעילויות האחרונות.` : 'אין פעילויות חדשות.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedActivities.length > 0 ? sortedActivities.map((transaction) => {
                const { description, icon } = getActivityInfo(transaction);
                return (
                    <div key={transaction.id} className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={getAvatarUrl(transaction.creditor.avatar)} alt={transaction.creditor.name} data-ai-hint={getAiHint(transaction.creditor.avatar)} />
                            <AvatarFallback>{transaction.creditor.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <p className="font-medium">
                                {description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{transaction.dueDate}</span>
                                &middot;
                                <div className="flex items-center gap-1">
                                    {transaction.type === 'loan' ? <Landmark className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                                    <span>{transaction.type === 'loan' ? 'הלוואה' : 'חוב'}</span>
                                </div>
                            </div>
                        </div>
                         <div className="bg-muted rounded-full p-2 hidden sm:block">
                           {icon}
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
    </div>
  );
}
