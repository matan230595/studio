'use client';

import React from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Transaction } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLogo } from '@/components/app-logo';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, Zap } from 'lucide-react'; // Zap for avalanche (high power), ArrowDown for snowball

const StrategyDebtItem = ({ transaction }: { transaction: Transaction }) => (
    <div className="flex justify-between items-center p-3 rounded-md border bg-background hover:bg-accent">
        <div className="text-right">
            <p className="font-medium">{transaction.creditor.name}</p>
            <p className="text-sm text-muted-foreground">{transaction.category || 'ללא קטגוריה'}</p>
        </div>
        <div className="text-left">
            <p className="font-semibold">₪{transaction.amount.toLocaleString('he-IL')}</p>
            {transaction.interestRate != null && (
                <Badge variant="secondary">ריבית: {transaction.interestRate}%</Badge>
            )}
        </div>
    </div>
);


export default function StrategiesPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const transactionsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'transactions');
    }, [user, firestore]);

    const { data: allTransactions, isLoading } = useCollection<Transaction>(transactionsQuery);

    const { snowball, avalanche } = React.useMemo(() => {
        if (!allTransactions) return { snowball: [], avalanche: [] };

        const activeDebts = allTransactions.filter(t => t.status === 'active' && (t.type === 'debt' || (t.type === 'loan' && t.paymentType === 'single')));

        // Snowball: Sort by amount, ascending
        const snowballOrder = [...activeDebts].sort((a, b) => a.amount - b.amount);

        // Avalanche: Sort by interest rate, descending. Null/0 rates go last.
        const avalancheOrder = [...activeDebts].sort((a, b) => {
            const rateA = a.interestRate ?? -1;
            const rateB = b.interestRate ?? -1;
            return rateB - rateA;
        });

        return { snowball: snowballOrder, avalanche: avalancheOrder };
    }, [allTransactions]);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8 animate-in fade-in-50">
                <header><Skeleton className="h-9 w-64" /><Skeleton className="h-5 w-80 mt-2" /></header>
                <div className="grid gap-8 md:grid-cols-2">
                    <Card><CardHeader><Skeleton className="h-7 w-48" /></CardHeader><CardContent><div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-7 w-48" /></CardHeader><CardContent><div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div></CardContent></Card>
                </div>
            </div>
        );
    }
    
    const hasDebts = snowball.length > 0;

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 animate-in fade-in-50">
            <header>
                <div className="flex items-center gap-3">
                    <AppLogo className="h-10 w-10 text-primary" />
                    <h1 className="font-headline text-3xl font-bold tracking-tight">אסטרטגיות פירעון חובות</h1>
                </div>
                <p className="text-muted-foreground">
                    בחר את הדרך הנכונה עבורך לסגירת ההתחייבויות שלך, מהקטנה לגדולה או מהיקרה לזולה.
                </p>
            </header>

            {!hasDebts ? (
                 <Card>
                    <CardContent className="text-center py-20">
                        <h2 className="text-2xl font-bold">כל הכבוד!</h2>
                        <p className="text-muted-foreground mt-2">לא נמצאו התחייבויות פעילות שניתן לשלב באסטרטגיה.</p>
                        <p className="text-xs text-muted-foreground mt-1">(האסטרטגיות מתמקדות בחובות חד-פעמיים או הלוואות חד-פעמיות)</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
                    <Card className="flex flex-col">
                        <CardHeader>
                             <div className="flex items-center gap-2">
                                <ArrowDown className="h-6 w-6 text-blue-500" />
                                <CardTitle>שיטת כדור השלג (Snowball)</CardTitle>
                            </div>
                            <CardDescription>
                                התמקד בסגירת החוב הקטן ביותר קודם כדי לצבור ניצחונות מהירים ומוטיבציה. לאחר שחוב נסגר, הפנה את כל הסכום שהתפנה לחוב הבא בתור.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-3">
                            <h4 className="font-semibold text-center mb-2">סדר פירעון מומלץ:</h4>
                            {snowball.map(debt => <StrategyDebtItem key={debt.id} transaction={debt} />)}
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Zap className="h-6 w-6 text-red-500" />
                                <CardTitle>שיטת המפולת (Avalanche)</CardTitle>
                            </div>
                            <CardDescription>
                                התמקד בסגירת החוב עם הריבית הגבוהה ביותר קודם כדי לחסוך הכי הרבה כסף לאורך זמן. לאחר שחוב נסגר, הפנה את הסכום שהתפנה לחוב הבא.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-3">
                             <h4 className="font-semibold text-center mb-2">סדר פירעון מומלץ:</h4>
                            {avalanche.map(debt => <StrategyDebtItem key={debt.id} transaction={debt} />)}
                        </CardContent>
                    </Card>
                </div>
            )}
        </main>
    );
}
